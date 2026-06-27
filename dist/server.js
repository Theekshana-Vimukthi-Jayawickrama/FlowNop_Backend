"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = __importDefault(require("./config/env"));
const app_1 = __importDefault(require("./app"));
const db_1 = __importDefault(require("./config/db"));
const logger_1 = __importDefault(require("./utils/logger"));
const emailService_1 = require("./services/emailService");
const startServer = async () => {
    try {
        // Connect to MongoDB Atlas
        await (0, db_1.default)();
        // Check SMTP Server Connection Status
        await (0, emailService_1.verifySmtpConnection)();
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
