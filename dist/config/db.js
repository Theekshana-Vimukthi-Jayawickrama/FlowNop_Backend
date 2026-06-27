"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = __importDefault(require("./env"));
const logger_1 = __importDefault(require("../utils/logger"));
const connectDB = async () => {
    try {
        const conn = await mongoose_1.default.connect(env_1.default.MONGO_URI);
        logger_1.default.info(`MongoDB Connected: ${conn.connection.host}`);
    }
    catch (error) {
        logger_1.default.error('Database connection failed', error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
exports.default = exports.connectDB;
