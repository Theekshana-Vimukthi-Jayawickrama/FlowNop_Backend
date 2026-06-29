"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables only in non-production environments
if (process.env.NODE_ENV !== 'production') {
    dotenv_1.default.config();
}
const REQUIRED_ENV_VARS = [
    'MONGO_URI',
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'JWT_REFRESH_SECRET',
    'JWT_REFRESH_EXPIRES_IN',
    'CLIENT_URL',
];
const missingEnvVars = [];
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
exports.env = {
    PORT: process.env.PORT || 5000,
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
    CLIENT_URL: process.env.CLIENT_URL.replace(/\/$/, ''),
    BREVO_API_KEY: process.env.BREVO_API_KEY,
    BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL || 'FlowNop <no-reply@flownop.com>',
    BREVO_SMTP_USER: process.env.BREVO_SMTP_USER,
};
exports.default = exports.env;
