import nodemailer from 'nodemailer';
import env from '../config/env';
import logger from '../utils/logger';

// Module-level state variables
let transporter: nodemailer.Transporter | null = null;
let smtpStatus: 'disconnected' | 'connecting' | 'connected' | 'simulated' = 'disconnected';
let lastError: string | null = null;
let lastChecked: Date | null = null;
let retryCount = 0;
let retryTimeout: NodeJS.Timeout | null = null;

/**
 * Creates nodemailer transporter. Returns null if SMTP configuration is incomplete.
 */
const createTransporter = (): nodemailer.Transporter | null => {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    return null;
  }

  logger.info(`[SMTP] Creating transporter for ${env.SMTP_HOST}:${env.SMTP_PORT} with user ${env.SMTP_USER}`);

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465, // True for 465, false for other ports
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    connectionTimeout: 10000, // 10 seconds connection timeout
    greetingTimeout: 10000,
    socketTimeout: 10000,
  } as any);
};

/**
 * Attempts connection and verification with the SMTP server.
 */
const attemptConnection = async (): Promise<void> => {
  if (!transporter) {
    smtpStatus = 'disconnected';
    lastError = 'Transporter not initialized';
    return;
  }

  smtpStatus = 'connecting';
  lastChecked = new Date();
  logger.info('[SMTP] Verifying connection to SMTP server...');

  try {
    await transporter.verify();
    smtpStatus = 'connected';
    lastError = null;
    retryCount = 0; // Reset retries on successful connection
    logger.info('[SMTP] Connection Status: Online (Connection is working and ready to send emails)');
  } catch (error: any) {
    smtpStatus = 'disconnected';
    lastError = error.message || String(error);
    logger.error(`[SMTP] Connection Status: Failed. Error: ${lastError}`);
    scheduleRetry();
  }
};

/**
 * Schedules background reconnection retry with exponential backoff.
 */
const scheduleRetry = (): void => {
  if (retryTimeout) {
    clearTimeout(retryTimeout);
  }

  // Calculate exponential backoff delay (5s, 10s, 20s, 40s, 60s, 60s...)
  const delay = Math.min(5000 * Math.pow(2, retryCount), 60000);
  retryCount++;

  logger.warn(`[SMTP] Scheduling retry #${retryCount} in ${delay / 1000} seconds...`);

  retryTimeout = setTimeout(async () => {
    logger.info(`[SMTP] Retrying connection (attempt #${retryCount})...`);
    await attemptConnection();
  }, delay);
};

/**
 * Initializes SMTP connection on application startup.
 * Runs asynchronously and does not block the application if it fails.
 */
export const initializeEmailService = async (): Promise<void> => {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    smtpStatus = 'simulated';
    logger.info('[SMTP] Email service initialized in SIMULATION mode (SMTP credentials not configured).');
    return;
  }

  try {
    transporter = createTransporter();
    if (transporter) {
      await attemptConnection();
    } else {
      smtpStatus = 'disconnected';
      lastError = 'Failed to create transporter';
      logger.error('[SMTP] Transporter creation returned null despite credentials being present.');
    }
  } catch (error: any) {
    smtpStatus = 'disconnected';
    lastError = error.message || String(error);
    logger.error('[SMTP] Unexpected error during initialization:', error);
    scheduleRetry();
  }
};

interface ISendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Sends an email using Nodemailer. Falls back to terminal simulation when SMTP is unconfigured.
 */
export const sendEmail = async (options: ISendEmailOptions): Promise<void> => {
  if (smtpStatus === 'simulated' || !transporter) {
    logger.info('--- MAIL SIMULATION (No credentials configured) ---');
    logger.info(`To: ${options.to}`);
    logger.info(`Subject: ${options.subject}`);
    logger.info(`Text Body:\n${options.text}`);
    if (options.html) {
      logger.info(`HTML Body:\n${options.html}`);
    }
    logger.info('----------------------------------------------------');
    return;
  }

  if (smtpStatus !== 'connected') {
    logger.warn(`[SMTP] Attempted to send email but connection status is: ${smtpStatus}. Retrying connection and throwing error.`);
    // Trigger reconnection check in case it recovers
    if (smtpStatus === 'disconnected') {
      attemptConnection();
    }
    throw new Error(`Email service is temporarily unavailable (status: ${smtpStatus}). Please try again later.`);
  }

  const mailOptions = {
    from: env.SMTP_FROM,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Password reset email successfully sent to: ${options.to}`);
  } catch (error: any) {
    logger.error(`Error sending email to ${options.to}:`, error);
    // If we hit a connection issue, transition state and trigger retry
    smtpStatus = 'disconnected';
    lastError = error.message || String(error);
    scheduleRetry();
    throw error;
  }
};

/**
 * Returns current SMTP connection state and monitoring information.
 */
export const getSmtpStatus = () => {
  return {
    status: smtpStatus,
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    lastChecked: lastChecked ? lastChecked.toISOString() : null,
    error: lastError,
    retryCount: retryCount,
  };
};

export default {
  initializeEmailService,
  sendEmail,
  getSmtpStatus,
};

