import nodemailer from 'nodemailer';
import env from '../config/env';
import logger from '../utils/logger';

/**
 * Creates nodemailer transporter. Returns null if SMTP configuration is incomplete.
 */
const getTransporter = () => {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465, // True for 465, false for other ports
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
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
  const transporter = getTransporter();

  if (!transporter) {
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
  } catch (error) {
    logger.error(`Error sending email to ${options.to}:`, error);
    throw error;
  }
};

/**
 * Verifies if the SMTP credentials are correct and connection is active.
 */
export const verifySmtpConnection = async (): Promise<void> => {
  const transporter = getTransporter();

  if (!transporter) {
    logger.info('[SMTP] Connection Status: Offline (No credentials configured, using email simulation fallback)');
    return;
  }

  try {
    await transporter.verify();
    logger.info('[SMTP] Connection Status: Online (Connection is working and ready to send emails)');
  } catch (error: any) {
    logger.error(`[SMTP] Connection Status: Failed (SMTP connection error: ${error.message || error})`);
  }
};

export default {
  sendEmail,
  verifySmtpConnection,
};
