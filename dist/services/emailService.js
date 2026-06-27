"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySmtpConnection = exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = __importDefault(require("../config/env"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Creates nodemailer transporter. Returns null if SMTP configuration is incomplete.
 */
const getTransporter = () => {
    if (!env_1.default.SMTP_USER || !env_1.default.SMTP_PASS) {
        return null;
    }
    return nodemailer_1.default.createTransport({
        host: env_1.default.SMTP_HOST,
        port: env_1.default.SMTP_PORT,
        secure: env_1.default.SMTP_PORT === 465, // True for 465, false for other ports
        auth: {
            user: env_1.default.SMTP_USER,
            pass: env_1.default.SMTP_PASS,
        },
    });
};
/**
 * Sends an email using Nodemailer. Falls back to terminal simulation when SMTP is unconfigured.
 */
const sendEmail = async (options) => {
    const transporter = getTransporter();
    if (!transporter) {
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
        throw error;
    }
};
exports.sendEmail = sendEmail;
/**
 * Verifies if the SMTP credentials are correct and connection is active.
 */
const verifySmtpConnection = async () => {
    const transporter = getTransporter();
    if (!transporter) {
        logger_1.default.info('[SMTP] Connection Status: Offline (No credentials configured, using email simulation fallback)');
        return;
    }
    try {
        await transporter.verify();
        logger_1.default.info('[SMTP] Connection Status: Online (Connection is working and ready to send emails)');
    }
    catch (error) {
        logger_1.default.error(`[SMTP] Connection Status: Failed (SMTP connection error: ${error.message || error})`);
    }
};
exports.verifySmtpConnection = verifySmtpConnection;
exports.default = {
    sendEmail: exports.sendEmail,
    verifySmtpConnection: exports.verifySmtpConnection,
};
