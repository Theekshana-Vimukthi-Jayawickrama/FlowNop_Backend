"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jwt_1 = require("../utils/jwt");
const User_1 = __importDefault(require("../models/User"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const protect = async (req, res, next) => {
    try {
        let token;
        // Check for authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
        if (!token) {
            throw new ApiError_1.default(401, 'Access denied. No token provided.');
        }
        // Verify token payload
        let decodedPayload;
        try {
            decodedPayload = (0, jwt_1.verifyToken)(token);
        }
        catch (error) {
            throw new ApiError_1.default(401, 'Access denied. Invalid or expired token.');
        }
        // Retrieve user and check existence
        const user = await User_1.default.findById(decodedPayload.id);
        if (!user) {
            throw new ApiError_1.default(401, 'User belonging to this token no longer exists.');
        }
        if (user.isDisabled) {
            throw new ApiError_1.default(403, 'Access denied. Your account is disabled.');
        }
        // Attach user to request object
        req.user = user;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.protect = protect;
exports.default = exports.protect;
