"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = void 0;
const sendSuccess = (res, data, message = 'Success', meta, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        ...(meta !== undefined ? { meta } : {}),
    });
};
exports.sendSuccess = sendSuccess;
exports.default = exports.sendSuccess;
