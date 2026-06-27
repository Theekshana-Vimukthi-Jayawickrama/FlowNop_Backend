"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken = exports.signRefreshToken = exports.verifyToken = exports.signToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = __importDefault(require("../config/env"));
const signToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, env_1.default.JWT_SECRET, {
        expiresIn: env_1.default.JWT_EXPIRES_IN,
    });
};
exports.signToken = signToken;
const verifyToken = (token) => {
    return jsonwebtoken_1.default.verify(token, env_1.default.JWT_SECRET);
};
exports.verifyToken = verifyToken;
const signRefreshToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, env_1.default.JWT_REFRESH_SECRET, {
        expiresIn: env_1.default.JWT_REFRESH_EXPIRES_IN,
    });
};
exports.signRefreshToken = signRefreshToken;
const verifyRefreshToken = (token) => {
    return jsonwebtoken_1.default.verify(token, env_1.default.JWT_REFRESH_SECRET);
};
exports.verifyRefreshToken = verifyRefreshToken;
