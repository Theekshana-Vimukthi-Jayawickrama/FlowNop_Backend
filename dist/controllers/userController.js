"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reactivateUser = exports.disableUser = exports.deleteAdmin = exports.updateAdmin = exports.createAdmin = exports.listUsers = void 0;
const userService_1 = __importDefault(require("../services/userService"));
const response_1 = require("../utils/response");
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
exports.listUsers = (0, asyncHandler_1.default)(async (req, res) => {
    const users = await userService_1.default.listUsers();
    return (0, response_1.sendSuccess)(res, users, 'Users retrieved successfully');
});
exports.createAdmin = (0, asyncHandler_1.default)(async (req, res) => {
    if (req.user?.email.toLowerCase() !== 'superadminflownop@gmail.com') {
        throw new ApiError_1.default(403, 'Access denied. Only Super Admin can manage admin accounts.');
    }
    const admin = await userService_1.default.createAdmin(req.body);
    return (0, response_1.sendSuccess)(res, admin, 'Admin created successfully', undefined, 201);
});
exports.updateAdmin = (0, asyncHandler_1.default)(async (req, res) => {
    if (req.user?.email.toLowerCase() !== 'superadminflownop@gmail.com') {
        throw new ApiError_1.default(403, 'Access denied. Only Super Admin can manage admin accounts.');
    }
    const admin = await userService_1.default.updateAdmin(req.params.id, req.body);
    return (0, response_1.sendSuccess)(res, admin, 'Admin updated successfully');
});
exports.deleteAdmin = (0, asyncHandler_1.default)(async (req, res) => {
    if (req.user?.email.toLowerCase() !== 'superadminflownop@gmail.com') {
        throw new ApiError_1.default(403, 'Access denied. Only Super Admin can manage admin accounts.');
    }
    await userService_1.default.deleteAdmin(req.params.id);
    return (0, response_1.sendSuccess)(res, null, 'Admin deleted successfully');
});
exports.disableUser = (0, asyncHandler_1.default)(async (req, res) => {
    const { reason } = req.body;
    if (!reason) {
        throw new ApiError_1.default(400, 'Reason is required to disable user account.');
    }
    const user = await userService_1.default.disableUser(req.user, req.params.id, reason);
    return (0, response_1.sendSuccess)(res, user, 'User account disabled successfully');
});
exports.reactivateUser = (0, asyncHandler_1.default)(async (req, res) => {
    const { reason } = req.body;
    if (!reason) {
        throw new ApiError_1.default(400, 'Reason is required to reactivate user account.');
    }
    const user = await userService_1.default.reactivateUser(req.user, req.params.id, reason);
    return (0, response_1.sendSuccess)(res, user, 'User account reactivated successfully');
});
exports.default = {
    listUsers: exports.listUsers,
    createAdmin: exports.createAdmin,
    updateAdmin: exports.updateAdmin,
    deleteAdmin: exports.deleteAdmin,
    disableUser: exports.disableUser,
    reactivateUser: exports.reactivateUser,
};
