import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const REQUIRED_ENV_VARS = [
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'JWT_REFRESH_SECRET',
  'JWT_REFRESH_EXPIRES_IN',
  'CLIENT_URL',
] as const;

const missingEnvVars: string[] = [];

for (const key of REQUIRED_ENV_VARS) {
  if (!process.env[key]) {
    missingEnvVars.push(key);
  }
}

if (missingEnvVars.length > 0) {
  const errorMessage = `Configuration Error: Missing required environment variables: ${missingEnvVars.join(', ')}`;
  console.error(`[FATAL] ${errorMessage}`);
  throw new Error(errorMessage);
}

export const env = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI!,
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN!,
  CLIENT_URL: process.env.CLIENT_URL!.replace(/\/$/, ''),
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.ethereal.email',
  SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM || 'TaskFlow <no-reply@taskflow.com>',
};

export default env;
