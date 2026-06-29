"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSmtpStatus = exports.sendEmail = exports.initializeEmailService = void 0;
const env_1 = __importDefault(require("../config/env"));
const logger_1 = __importDefault(require("../utils/logger"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
let emailMode = 'simulated';
let emailStatus = 'simulated';
let lastError = null;
let lastChecked = null;
let transporter = null;
let retryCount = 0;
let retryTimeout = null;
const MAX_RETRIES = 3;
// Parse the "from" field: "Name <email>" or just "email"
const getSenderDetails = () => {
    const fromMatch = env_1.default.BREVO_SENDER_EMAIL.match(/^"?(.+?)"?\s*<(.+?)>$/);
    const senderName = fromMatch ? fromMatch[1] : 'FlowNop';
    const senderEmail = fromMatch ? fromMatch[2] : env_1.default.BREVO_SENDER_EMAIL;
    return { name: senderName, email: senderEmail };
};
/**
 * Attempts connection and verification with the SMTP server.
 */
const attemptSmtpConnection = async () => {
    if (!transporter) {
        emailStatus = 'disconnected';
        lastError = 'Transporter not initialized';
        return;
    }
    emailStatus = 'connecting';
    lastChecked = new Date();
    logger_1.default.info('[Email] Verifying connection to Brevo SMTP server...');
    try {
        await transporter.verify();
        emailStatus = 'ready';
        lastError = null;
        retryCount = 0; // Reset retries on successful connection
        logger_1.default.info('[Email] Brevo SMTP Connection Status: Online (Connection is working and ready to send emails)');
    }
    catch (error) {
        emailStatus = 'disconnected';
        lastError = error.message || String(error);
        logger_1.default.error(`[Email] Brevo SMTP Connection Status: Failed. Error: ${lastError}`);
        scheduleSmtpRetry();
    }
};
/**
 * Schedules background SMTP reconnection retry with exponential backoff.
 */
const scheduleSmtpRetry = () => {
    if (retryTimeout) {
        clearTimeout(retryTimeout);
    }
    if (retryCount >= MAX_RETRIES) {
        logger_1.default.warn(`[Email] SMTP Max retries (${MAX_RETRIES}) reached. Falling back to SIMULATION mode. Emails will be logged to console instead of being sent.`);
        emailStatus = 'simulated';
        emailMode = 'simulated';
        transporter = null;
        lastError = `SMTP unavailable after ${MAX_RETRIES} retries — running in simulation mode`;
        return;
    }
    const delay = Math.min(5000 * Math.pow(2, retryCount), 60000);
    retryCount++;
    logger_1.default.warn(`[Email] Scheduling SMTP retry #${retryCount}/${MAX_RETRIES} in ${delay / 1000} seconds...`);
    retryTimeout = setTimeout(async () => {
        logger_1.default.info(`[Email] Retrying Brevo SMTP connection (attempt #${retryCount}/${MAX_RETRIES})...`);
        await attemptSmtpConnection();
    }, delay);
};
/**
 * Initializes the Brevo email service.
 * Automatically chooses between REST API and SMTP depending on the format of the key.
 */
const initializeEmailService = async () => {
    // Clear any existing timeouts/transporters in case of re-init
    if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
    }
    transporter = null;
    retryCount = 0;
    if (!env_1.default.BREVO_API_KEY) {
        emailMode = 'simulated';
        emailStatus = 'simulated';
        logger_1.default.info('[Email] Email service initialized in SIMULATION mode (BREVO_API_KEY not configured).');
        return;
    }
    const apiKey = env_1.default.BREVO_API_KEY.trim();
    // If the key starts with 'xsmtpsib-', it is an SMTP key
    if (apiKey.startsWith('xsmtpsib-')) {
        emailMode = 'smtp';
        const { email: senderEmail } = getSenderDetails();
        const smtpUser = env_1.default.BREVO_SMTP_USER || senderEmail;
        logger_1.default.info(`[Email] Detected Brevo SMTP key. Initializing SMTP relay with user: ${smtpUser}`);
        transporter = nodemailer_1.default.createTransport({
            host: 'smtp-relay.brevo.com',
            port: 587,
            auth: {
                user: smtpUser,
                pass: apiKey,
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000,
        });
        // Non-blocking: attempt connection in background
        attemptSmtpConnection().catch((err) => {
            logger_1.default.error('[Email] Background SMTP connection attempt failed:', err);
        });
        return;
    }
    // Otherwise, assume it is a REST API key (usually starts with 'xkeysib-')
    emailMode = 'api';
    try {
        const response = await fetch('https://api.brevo.com/v3/account', {
            method: 'GET',
            headers: {
                'api-key': apiKey,
                'accept': 'application/json',
            },
        });
        if (response.ok) {
            emailStatus = 'ready';
            lastError = null;
            lastChecked = new Date();
            const data = await response.json();
            logger_1.default.info(`[Email] Brevo API connected successfully. Account: ${data.email || 'unknown'}`);
        }
        else {
            const errorData = await response.text();
            emailStatus = 'simulated';
            emailMode = 'simulated';
            lastError = `Brevo API returned ${response.status}: ${errorData}`;
            lastChecked = new Date();
            logger_1.default.error(`[Email] Brevo API key validation failed (${response.status}). Falling back to SIMULATION mode.`);
        }
    }
    catch (error) {
        emailStatus = 'simulated';
        emailMode = 'simulated';
        lastError = error.message || String(error);
        lastChecked = new Date();
        logger_1.default.error('[Email] Failed to validate Brevo API key. Falling back to SIMULATION mode:', error.message);
    }
};
exports.initializeEmailService = initializeEmailService;
/**
 * Sends an email using either Brevo REST API or Nodemailer SMTP, depending on current mode.
 */
const sendEmail = async (options) => {
    if (emailStatus === 'simulated' || emailMode === 'simulated' || !env_1.default.BREVO_API_KEY) {
        logger_1.default.info('--- MAIL SIMULATION (Brevo API key not configured or fallback active) ---');
        logger_1.default.info(`To: ${options.to}`);
        logger_1.default.info(`Subject: ${options.subject}`);
        logger_1.default.info(`Text Body:\n${options.text}`);
        if (options.html) {
            logger_1.default.info(`HTML Body:\n${options.html}`);
        }
        logger_1.default.info('----------------------------------------------------');
        return;
    }
    const { name: senderName, email: senderEmail } = getSenderDetails();
    if (emailMode === 'smtp') {
        if (emailStatus !== 'ready' || !transporter) {
            logger_1.default.warn(`[Email] Attempted to send email but SMTP connection status is: ${emailStatus}. Retrying connection.`);
            if (emailStatus === 'disconnected') {
                attemptSmtpConnection().catch(() => { });
            }
            throw new Error(`Email service is temporarily offline (status: ${emailStatus}). Please try again later.`);
        }
        const mailOptions = {
            from: `"${senderName}" <${senderEmail}>`,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
        };
        try {
            await transporter.sendMail(mailOptions);
            logger_1.default.info(`[Email] Email successfully sent via SMTP to: ${options.to}`);
        }
        catch (error) {
            logger_1.default.error(`[Email] Error sending email via SMTP to ${options.to}:`, error);
            emailStatus = 'disconnected';
            lastError = error.message || String(error);
            scheduleSmtpRetry();
            throw error;
        }
        return;
    }
    // REST API Mode
    const payload = {
        sender: {
            name: senderName,
            email: senderEmail,
        },
        to: [
            {
                email: options.to,
            },
        ],
        subject: options.subject,
        textContent: options.text,
        htmlContent: options.html || undefined,
    };
    try {
        const response = await fetch(BREVO_API_URL, {
            method: 'POST',
            headers: {
                'api-key': env_1.default.BREVO_API_KEY.trim(),
                'Content-Type': 'application/json',
                'accept': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        if (response.ok) {
            const data = await response.json();
            logger_1.default.info(`[Email] Email successfully sent via API to: ${options.to} (messageId: ${data.messageId || 'N/A'})`);
        }
        else {
            const errorData = await response.text();
            logger_1.default.error(`[Email] Brevo API error (${response.status}) sending to ${options.to}: ${errorData}`);
            throw new Error(`Brevo API error (${response.status}): ${errorData}`);
        }
    }
    catch (error) {
        if (error.message?.startsWith('Brevo API error')) {
            throw error;
        }
        logger_1.default.error(`[Email] Network error sending email via API to ${options.to}:`, error);
        throw new Error(`Failed to send email: ${error.message}`);
    }
};
exports.sendEmail = sendEmail;
/**
 * Returns current email service status and monitoring information.
 */
const getSmtpStatus = () => {
    const keyPrefix = env_1.default.BREVO_API_KEY
        ? `${env_1.default.BREVO_API_KEY.trim().substring(0, 8)}...`
        : 'not_configured';
    return {
        status: emailStatus,
        provider: emailMode === 'api' ? 'Brevo REST API' : emailMode === 'smtp' ? 'Brevo SMTP Relay' : 'Simulation',
        keyPrefix: keyPrefix,
        lastChecked: lastChecked ? lastChecked.toISOString() : null,
        error: lastError,
    };
};
exports.getSmtpStatus = getSmtpStatus;
exports.default = {
    initializeEmailService: exports.initializeEmailService,
    sendEmail: exports.sendEmail,
    getSmtpStatus: exports.getSmtpStatus,
};
