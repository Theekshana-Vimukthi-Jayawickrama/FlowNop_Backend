"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dns_1 = __importDefault(require("dns"));
// Force Node's DNS resolver to prioritize IPv4 addresses over IPv6.
// This prevents ENETUNREACH errors in environments where IPv6 is configured/resolved but unreachable.
dns_1.default.setDefaultResultOrder('ipv4first');
const env_1 = __importDefault(require("./config/env"));
const app_1 = __importDefault(require("./app"));
const db_1 = __importDefault(require("./config/db"));
const logger_1 = __importDefault(require("./utils/logger"));
const emailService_1 = require("./services/emailService");
const startServer = async () => {
    try {
        // Connect to MongoDB Atlas
        await (0, db_1.default)();
        // Initialize SMTP Email Service
        try {
            await (0, emailService_1.initializeEmailService)();
        }
        catch (emailError) {
            logger_1.default.error('[SMTP] Failed to initialize email service during startup (will continue running):', emailError);
        }
        app_1.default.listen(env_1.default.PORT, () => {
            logger_1.default.info(`Server is running on port ${env_1.default.PORT}`);
        });
    }
    catch (error) {
        logger_1.default.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
