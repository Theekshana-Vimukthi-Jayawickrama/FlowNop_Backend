"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSmtpStatus = exports.sendEmail = exports.initializeEmailService = void 0;
const dns_1 = __importDefault(require("dns"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = __importDefault(require("../config/env"));
const logger_1 = __importDefault(require("../utils/logger"));
// Module-level state variables
let transporter = null;
let smtpStatus = 'disconnected';
let lastError = null;
let lastChecked = null;
let retryCount = 0;
let retryTimeout = null;
/**
 * Custom DNS lookup prioritizing IPv4, falling back to default resolution on failure.
 * This resolves issues on environments like Render where IPv6 might be preferred but unreachable.
 */
const customLookup = (hostname, options, callback) => {
    // Pass through local address requests
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
        return dns_1.default.lookup(hostname, options, callback);
    }
    const dnsOptions = typeof options === 'object' ? { ...options } : {};
    // Try IPv4 lookup first
    dns_1.default.lookup(hostname, { ...dnsOptions, family: 4 }, (err, address, family) => {
        if (!err) {
            callback(null, address, family);
        }
        else {
            logger_1.default.warn(`[SMTP] IPv4 lookup failed for ${hostname}, falling back to default lookup order. Error: ${err.message}`);
            dns_1.default.lookup(hostname, options, callback);
        }
    });
};
/**
 * Creates nodemailer transporter. Returns null if SMTP configuration is incomplete.
 */
const createTransporter = () => {
    if (!env_1.default.SMTP_USER || !env_1.default.SMTP_PASS) {
        return null;
    }
    logger_1.default.info(`[SMTP] Creating transporter for ${env_1.default.SMTP_HOST}:${env_1.default.SMTP_PORT} with user ${env_1.default.SMTP_USER}`);
    return nodemailer_1.default.createTransport({
        host: env_1.default.SMTP_HOST,
        port: env_1.default.SMTP_PORT,
        secure: env_1.default.SMTP_PORT === 465, // True for 465, false for other ports
        auth: {
            user: env_1.default.SMTP_USER,
            pass: env_1.default.SMTP_PASS,
        },
        lookup: customLookup,
        connectionTimeout: 10000, // 10 seconds connection timeout
        greetingTimeout: 10000,
        socketTimeout: 10000,
    });
};
/**
 * Attempts connection and verification with the SMTP server.
 */
const attemptConnection = async () => {
    if (!transporter) {
        smtpStatus = 'disconnected';
        lastError = 'Transporter not initialized';
        return;
    }
    smtpStatus = 'connecting';
    lastChecked = new Date();
    logger_1.default.info('[SMTP] Verifying connection to SMTP server...');
    try {
        await transporter.verify();
        smtpStatus = 'connected';
        lastError = null;
        retryCount = 0; // Reset retries on successful connection
        logger_1.default.info('[SMTP] Connection Status: Online (Connection is working and ready to send emails)');
    }
    catch (error) {
        smtpStatus = 'disconnected';
        lastError = error.message || String(error);
        logger_1.default.error(`[SMTP] Connection Status: Failed. Error: ${lastError}`);
        scheduleRetry();
    }
};
/**
 * Schedules background reconnection retry with exponential backoff.
 */
const scheduleRetry = () => {
    if (retryTimeout) {
        clearTimeout(retryTimeout);
    }
    // Calculate exponential backoff delay (5s, 10s, 20s, 40s, 60s, 60s...)
    const delay = Math.min(5000 * Math.pow(2, retryCount), 60000);
    retryCount++;
    logger_1.default.warn(`[SMTP] Scheduling retry #${retryCount} in ${delay / 1000} seconds...`);
    retryTimeout = setTimeout(async () => {
        logger_1.default.info(`[SMTP] Retrying connection (attempt #${retryCount})...`);
        await attemptConnection();
    }, delay);
};
/**
 * Initializes SMTP connection on application startup.
 * Runs asynchronously and does not block the application if it fails.
 */
const initializeEmailService = async () => {
    if (!env_1.default.SMTP_USER || !env_1.default.SMTP_PASS) {
        smtpStatus = 'simulated';
        logger_1.default.info('[SMTP] Email service initialized in SIMULATION mode (SMTP credentials not configured).');
        return;
    }
    try {
        transporter = createTransporter();
        if (transporter) {
            await attemptConnection();
        }
        else {
            smtpStatus = 'disconnected';
            lastError = 'Failed to create transporter';
            logger_1.default.error('[SMTP] Transporter creation returned null despite credentials being present.');
        }
    }
    catch (error) {
        smtpStatus = 'disconnected';
        lastError = error.message || String(error);
        logger_1.default.error('[SMTP] Unexpected error during initialization:', error);
        scheduleRetry();
    }
};
exports.initializeEmailService = initializeEmailService;
/**
 * Sends an email using Nodemailer. Falls back to terminal simulation when SMTP is unconfigured.
 */
const sendEmail = async (options) => {
    if (smtpStatus === 'simulated' || !transporter) {
        logger_1.default.info('--- MAIL SIMULATION (No credentials configured) ---');
        logger_1.default.info(`To: ${options.to}`);
        logger_1.default.info(`Subject: ${options.subject}`);
        logger_1.default.info(`Text Body:\n${options.text}`);
        if (options.html) {
            logger_1.default.info(`HTML Body:\n${options.html}`);
        }
        logger_1.default.info('----------------------------------------------------');
        return;
    }
    if (smtpStatus !== 'connected') {
        logger_1.default.warn(`[SMTP] Attempted to send email but connection status is: ${smtpStatus}. Retrying connection and throwing error.`);
        // Trigger reconnection check in case it recovers
        if (smtpStatus === 'disconnected') {
            attemptConnection();
        }
        throw new Error(`Email service is temporarily unavailable (status: ${smtpStatus}). Please try again later.`);
    }
    const mailOptions = {
        from: env_1.default.SMTP_FROM,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
    };
    try {
        await transporter.sendMail(mailOptions);
        logger_1.default.info(`Password reset email successfully sent to: ${options.to}`);
    }
    catch (error) {
        logger_1.default.error(`Error sending email to ${options.to}:`, error);
        // If we hit a connection issue, transition state and trigger retry
        smtpStatus = 'disconnected';
        lastError = error.message || String(error);
        scheduleRetry();
        throw error;
    }
};
exports.sendEmail = sendEmail;
/**
 * Returns current SMTP connection state and monitoring information.
 */
const getSmtpStatus = () => {
    return {
        status: smtpStatus,
        host: env_1.default.SMTP_HOST,
        port: env_1.default.SMTP_PORT,
        lastChecked: lastChecked ? lastChecked.toISOString() : null,
        error: lastError,
        retryCount: retryCount,
    };
};
exports.getSmtpStatus = getSmtpStatus;
exports.default = {
    initializeEmailService: exports.initializeEmailService,
    sendEmail: exports.sendEmail,
    getSmtpStatus: exports.getSmtpStatus,
};
