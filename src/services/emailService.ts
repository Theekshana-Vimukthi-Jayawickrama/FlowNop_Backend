import env from '../config/env';
import logger from '../utils/logger';
import nodemailer from 'nodemailer';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const DEFAULT_SMTP_HOST = 'smtp-relay.brevo.com';
const DEFAULT_SMTP_PORT = 2525;

type EmailMode = 'api' | 'smtp' | 'simulated';
type EmailStatus = 'ready' | 'connecting' | 'disconnected' | 'simulated';

let emailMode: EmailMode = 'simulated';
let emailStatus: EmailStatus = 'simulated';
let lastError: string | null = null;
let lastChecked: Date | null = null;
let transporter: nodemailer.Transporter | null = null;
let retryCount = 0;
let retryTimeout: NodeJS.Timeout | null = null;
const MAX_RETRIES = 3;

// Parse the "from" field: "Name <email>" or just "email"
const getSenderDetails = () => {
  const fromMatch = env.BREVO_SENDER_EMAIL.match(/^"?(.+?)"?\s*<(.+?)>$/);
  const senderName = fromMatch ? fromMatch[1] : 'FlowNop';
  const senderEmail = fromMatch ? fromMatch[2] : env.BREVO_SENDER_EMAIL;
  return { name: senderName, email: senderEmail };
};

const parseSmtpPort = (value: string | undefined): number => {
  if (!value) {
    return DEFAULT_SMTP_PORT;
  }

  const parsedPort = Number.parseInt(value, 10);
  if (Number.isNaN(parsedPort) || parsedPort <= 0 || parsedPort > 65535) {
    logger.warn(`[Email] Invalid BREVO_SMTP_PORT "${value}". Falling back to ${DEFAULT_SMTP_PORT}.`);
    return DEFAULT_SMTP_PORT;
  }

  return parsedPort;
};

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) {
    return fallback;
  }
  return value.toLowerCase() === 'true';
};

/**
 * Attempts connection and verification with the SMTP server.
 */
const attemptSmtpConnection = async (): Promise<void> => {
  if (!transporter) {
    emailStatus = 'disconnected';
    lastError = 'Transporter not initialized';
    return;
  }

  emailStatus = 'connecting';
  lastChecked = new Date();
  logger.info('[Email] Verifying connection to Brevo SMTP server...');

  try {
    await transporter.verify();
    emailStatus = 'ready';
    lastError = null;
    retryCount = 0; // Reset retries on successful connection
    logger.info('[Email] Brevo SMTP Connection Status: Online (Connection is working and ready to send emails)');
  } catch (error: any) {
    emailStatus = 'disconnected';
    lastError = error.message || String(error);
    logger.error(`[Email] Brevo SMTP Connection Status: Failed. Error: ${lastError}`);
    scheduleSmtpRetry();
  }
};

/**
 * Schedules background SMTP reconnection retry with exponential backoff.
 */
const scheduleSmtpRetry = (): void => {
  if (retryTimeout) {
    clearTimeout(retryTimeout);
  }

  if (retryCount >= MAX_RETRIES) {
    logger.warn(`[Email] SMTP Max retries (${MAX_RETRIES}) reached. Falling back to SIMULATION mode. Emails will be logged to console instead of being sent.`);
    emailStatus = 'simulated';
    emailMode = 'simulated';
    transporter = null;
    lastError = `SMTP unavailable after ${MAX_RETRIES} retries — running in simulation mode`;
    return;
  }

  const delay = Math.min(5000 * Math.pow(2, retryCount), 60000);
  retryCount++;

  logger.warn(`[Email] Scheduling SMTP retry #${retryCount}/${MAX_RETRIES} in ${delay / 1000} seconds...`);

  retryTimeout = setTimeout(async () => {
    logger.info(`[Email] Retrying Brevo SMTP connection (attempt #${retryCount}/${MAX_RETRIES})...`);
    await attemptSmtpConnection();
  }, delay);
};

/**
 * Initializes the Brevo email service.
 * Mode is controlled by BREVO_EMAIL_MODE (api|smtp), defaults to api.
 */
export const initializeEmailService = async (): Promise<void> => {
  // Clear any existing timeouts/transporters in case of re-init
  if (retryTimeout) {
    clearTimeout(retryTimeout);
    retryTimeout = null;
  }
  transporter = null;
  retryCount = 0;

  const configuredMode = env.BREVO_EMAIL_MODE?.toLowerCase() === 'smtp' ? 'smtp' : 'api';
  const apiKey = env.BREVO_API_KEY?.trim() || '';
  const smtpPassword = env.BREVO_SMTP_PASSWORD?.trim() || '';

  if (configuredMode === 'smtp') {
    if (!smtpPassword && !apiKey.startsWith('xsmtpsib-')) {
      emailMode = 'simulated';
      emailStatus = 'simulated';
      lastError = 'SMTP mode selected but no SMTP relay key configured';
      logger.error('[Email] SMTP mode selected but credentials are missing. Falling back to SIMULATION mode.');
      return;
    }

    emailMode = 'smtp';
    const { email: senderEmail } = getSenderDetails();
    const smtpHost = env.BREVO_SMTP_HOST || DEFAULT_SMTP_HOST;
    const smtpPort = parseSmtpPort(env.BREVO_SMTP_PORT);
    const smtpSecure = parseBoolean(env.BREVO_SMTP_SECURE, smtpPort === 465);
    const smtpUser = env.BREVO_SMTP_USER || senderEmail;
    const smtpPass = smtpPassword || apiKey;

    if (!smtpUser || !smtpPass) {
      emailStatus = 'simulated';
      emailMode = 'simulated';
      lastError = 'Missing BREVO_SMTP_USER or BREVO_SMTP_PASSWORD for SMTP mode';
      logger.error('[Email] SMTP selected but credentials are incomplete. Falling back to SIMULATION mode.');
      return;
    }

    logger.info(
      `[Email] Initializing Brevo SMTP relay ${smtpHost}:${smtpPort} (secure=${smtpSecure}) with user: ${smtpUser}`
    );

    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    // Non-blocking: attempt connection in background
    attemptSmtpConnection().catch((err) => {
      logger.error('[Email] Background SMTP connection attempt failed:', err);
    });
    return;
  }

  // API mode (default on Render to avoid SMTP port restrictions)
  if (!apiKey) {
    emailMode = 'simulated';
    emailStatus = 'simulated';
    logger.info('[Email] Email service initialized in SIMULATION mode (BREVO_API_KEY not configured for API mode).');
    return;
  }

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
      const data = await response.json() as any;
      logger.info(`[Email] Brevo API connected successfully. Account: ${data.email || 'unknown'}`);
    } else {
      const errorData = await response.text();
      emailStatus = 'simulated';
      emailMode = 'simulated';
      lastError = `Brevo API returned ${response.status}: ${errorData}`;
      lastChecked = new Date();
      logger.error(`[Email] Brevo API key validation failed (${response.status}). Falling back to SIMULATION mode.`);
    }
  } catch (error: any) {
    emailStatus = 'simulated';
    emailMode = 'simulated';
    lastError = error.message || String(error);
    lastChecked = new Date();
    logger.error('[Email] Failed to validate Brevo API key. Falling back to SIMULATION mode:', error.message);
  }
};

interface ISendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Sends an email using either Brevo REST API or Nodemailer SMTP, depending on current mode.
 */
export const sendEmail = async (options: ISendEmailOptions): Promise<void> => {
  if (emailStatus === 'simulated' || emailMode === 'simulated') {
    logger.info('--- MAIL SIMULATION (Brevo API key not configured or fallback active) ---');
    logger.info(`To: ${options.to}`);
    logger.info(`Subject: ${options.subject}`);
    logger.info(`Text Body:\n${options.text}`);
    if (options.html) {
      logger.info(`HTML Body:\n${options.html}`);
    }
    logger.info('----------------------------------------------------');
    return;
  }

  const { name: senderName, email: senderEmail } = getSenderDetails();

  if (emailMode === 'smtp') {
    if (emailStatus !== 'ready' || !transporter) {
      logger.warn(`[Email] Attempted to send email but SMTP connection status is: ${emailStatus}. Retrying connection.`);
      if (emailStatus === 'disconnected') {
        attemptSmtpConnection().catch(() => {});
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
      logger.info(`[Email] Email successfully sent via SMTP to: ${options.to}`);
    } catch (error: any) {
      logger.error(`[Email] Error sending email via SMTP to ${options.to}:`, error);
      emailStatus = 'disconnected';
      lastError = error.message || String(error);
      scheduleSmtpRetry();
      throw error;
    }
    return;
  }

  // REST API Mode
  const brevoApiKey = env.BREVO_API_KEY?.trim();
  if (!brevoApiKey) {
    throw new Error('Brevo API mode selected but BREVO_API_KEY is not configured.');
  }

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
        'api-key': brevoApiKey,
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json() as any;
      logger.info(`[Email] Email successfully sent via API to: ${options.to} (messageId: ${data.messageId || 'N/A'})`);
    } else {
      const errorData = await response.text();
      logger.error(`[Email] Brevo API error (${response.status}) sending to ${options.to}: ${errorData}`);
      throw new Error(`Brevo API error (${response.status}): ${errorData}`);
    }
  } catch (error: any) {
    if (error.message?.startsWith('Brevo API error')) {
      throw error;
    }
    logger.error(`[Email] Network error sending email via API to ${options.to}:`, error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Returns current email service status and monitoring information.
 */
export const getSmtpStatus = () => {
  const activeCredential = env.BREVO_SMTP_PASSWORD?.trim() || env.BREVO_API_KEY?.trim();
  const keyPrefix = activeCredential
    ? `${activeCredential.substring(0, 8)}...`
    : 'not_configured';

  return {
    status: emailStatus,
    provider: emailMode === 'api' ? 'Brevo REST API' : emailMode === 'smtp' ? 'Brevo SMTP Relay' : 'Simulation',
    keyPrefix: keyPrefix,
    smtpHost: env.BREVO_SMTP_HOST || DEFAULT_SMTP_HOST,
    smtpPort: parseSmtpPort(env.BREVO_SMTP_PORT),
    smtpUser: env.BREVO_SMTP_USER || getSenderDetails().email,
    lastChecked: lastChecked ? lastChecked.toISOString() : null,
    error: lastError,
  };
};

export default {
  initializeEmailService,
  sendEmail,
  getSmtpStatus,
};
