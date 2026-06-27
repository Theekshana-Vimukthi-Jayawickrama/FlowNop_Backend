"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.changePassword = exports.requestReactivation = exports.logout = exports.refresh = exports.me = exports.login = exports.register = void 0;
const authService_1 = __importDefault(require("../services/authService"));
const response_1 = require("../utils/response");
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
exports.register = (0, asyncHandler_1.default)(async (req, res) => {
    const { user, token, refreshToken } = await authService_1.default.register(req.body);
    return (0, response_1.sendSuccess)(res, { user, token, refreshToken }, 'User registered successfully', undefined, 201);
});
exports.login = (0, asyncHandler_1.default)(async (req, res) => {
    const { user, token, refreshToken } = await authService_1.default.login(req.body);
    if (user.isDisabled) {
        return res.status(403).json({
            success: false,
            message: `Your account has been disabled. Reason: ${user.disabledReason || 'No reason specified'}`,
            disabled: true,
            disabledReason: user.disabledReason || 'No reason specified',
            email: user.email,
        });
    }
    return (0, response_1.sendSuccess)(res, { user, token, refreshToken }, 'User logged in successfully');
});
exports.me = (0, asyncHandler_1.default)(async (req, res) => {
    return (0, response_1.sendSuccess)(res, { user: req.user }, 'Current user retrieved successfully');
});
exports.refresh = (0, asyncHandler_1.default)(async (req, res) => {
    const { token, refreshToken } = await authService_1.default.refresh(req.body.refreshToken);
    return (0, response_1.sendSuccess)(res, { token, refreshToken }, 'Tokens refreshed successfully');
});
exports.logout = (0, asyncHandler_1.default)(async (req, res) => {
    await authService_1.default.logout(req.body.refreshToken);
    return (0, response_1.sendSuccess)(res, null, 'User logged out successfully');
});
exports.requestReactivation = (0, asyncHandler_1.default)(async (req, res) => {
    const { email, reason } = req.body;
    await authService_1.default.requestReactivation(email, reason);
    return (0, response_1.sendSuccess)(res, null, 'Reactivation request submitted successfully');
});
exports.changePassword = (0, asyncHandler_1.default)(async (req, res) => {
    await authService_1.default.changePassword(req.user._id.toString(), req.body);
    return (0, response_1.sendSuccess)(res, null, 'Password changed successfully');
});
exports.forgotPassword = (0, asyncHandler_1.default)(async (req, res) => {
    const { email } = req.body;
    await authService_1.default.forgotPassword(email);
    return (0, response_1.sendSuccess)(res, null, 'Password reset link sent to your email address');
});
exports.resetPassword = (0, asyncHandler_1.default)(async (req, res) => {
    const { token, password } = req.body;
    await authService_1.default.resetPassword(token, password);
    return (0, response_1.sendSuccess)(res, null, 'Password has been reset successfully');
});
exports.default = {
    register: exports.register,
    login: exports.login,
    me: exports.me,
    refresh: exports.refresh,
    logout: exports.logout,
    requestReactivation: exports.requestReactivation,
    changePassword: exports.changePassword,
    forgotPassword: exports.forgotPassword,
    resetPassword: exports.resetPassword,
};
