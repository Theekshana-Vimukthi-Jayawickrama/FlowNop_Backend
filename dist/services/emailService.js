"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSmtpStatus = exports.sendEmail = exports.initializeEmailService = void 0;
const env_1 = __importDefault(require("../config/env"));
const logger_1 = __importDefault(require("../utils/logger"));
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
let emailStatus = 'simulated';
let lastError = null;
let lastChecked = null;
/**
 * Initializes the Brevo email service.
 * Validates that the API key is configured; if not, falls back to simulation mode.
 */
const initializeEmailService = async () => {
    if (!env_1.default.BREVO_API_KEY) {
        emailStatus = 'simulated';
        logger_1.default.info('[Email] Email service initialized in SIMULATION mode (BREVO_API_KEY not configured).');
        return;
    }
    // Validate API key by making a lightweight call to Brevo's account endpoint
    try {
        const response = await fetch('https://api.brevo.com/v3/account', {
            method: 'GET',
            headers: {
                'api-key': env_1.default.BREVO_API_KEY,
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
            lastError = `Brevo API returned ${response.status}: ${errorData}`;
            lastChecked = new Date();
            logger_1.default.error(`[Email] Brevo API key validation failed (${response.status}). Falling back to SIMULATION mode.`);
        }
    }
    catch (error) {
        emailStatus = 'simulated';
        lastError = error.message || String(error);
        lastChecked = new Date();
        logger_1.default.error('[Email] Failed to validate Brevo API key. Falling back to SIMULATION mode:', error.message);
    }
};
exports.initializeEmailService = initializeEmailService;
/**
 * Sends an email using the Brevo Transactional Email API.
 * Falls back to console simulation when the API key is not configured.
 */
const sendEmail = async (options) => {
    if (emailStatus === 'simulated' || !env_1.default.BREVO_API_KEY) {
        logger_1.default.info('--- MAIL SIMULATION (Brevo API key not configured) ---');
        logger_1.default.info(`To: ${options.to}`);
        logger_1.default.info(`Subject: ${options.subject}`);
        logger_1.default.info(`Text Body:\n${options.text}`);
        if (options.html) {
            logger_1.default.info(`HTML Body:\n${options.html}`);
        }
        logger_1.default.info('----------------------------------------------------');
        return;
    }
    // Parse the "from" field: "Name <email>" or just "email"
    const fromMatch = env_1.default.BREVO_SENDER_EMAIL.match(/^"?(.+?)"?\s*<(.+?)>$/);
    const senderName = fromMatch ? fromMatch[1] : 'FlowNop';
    const senderEmail = fromMatch ? fromMatch[2] : env_1.default.BREVO_SENDER_EMAIL;
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
                'api-key': env_1.default.BREVO_API_KEY,
                'Content-Type': 'application/json',
                'accept': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        if (response.ok) {
            const data = await response.json();
            logger_1.default.info(`[Email] Email successfully sent to: ${options.to} (messageId: ${data.messageId || 'N/A'})`);
        }
        else {
            const errorData = await response.text();
            logger_1.default.error(`[Email] Brevo API error (${response.status}) sending to ${options.to}: ${errorData}`);
            throw new Error(`Brevo API error (${response.status}): ${errorData}`);
        }
    }
    catch (error) {
        if (error.message?.startsWith('Brevo API error')) {
            throw error; // Re-throw API errors
        }
        logger_1.default.error(`[Email] Network error sending email to ${options.to}:`, error);
        throw new Error(`Failed to send email: ${error.message}`);
    }
};
exports.sendEmail = sendEmail;
/**
 * Returns current email service status and monitoring information.
 */
const getSmtpStatus = () => {
    return {
        status: emailStatus,
        provider: 'Brevo API',
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
