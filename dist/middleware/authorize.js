"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadTaskAndCheckAccess = exports.requireRole = void 0;
const Task_1 = __importDefault(require("../models/Task"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ApiError_1.default(401, 'Authentication required'));
        }
        if (req.user.role !== role) {
            return next(new ApiError_1.default(403, `Access denied. ${role} role required.`));
        }
        next();
    };
};
exports.requireRole = requireRole;
const loadTaskAndCheckAccess = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!req.user) {
            throw new ApiError_1.default(401, 'Authentication required');
        }
        // Verify task ID format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            throw new ApiError_1.default(400, 'Invalid task ID format');
        }
        const task = await Task_1.default.findById(id);
        if (!task) {
            throw new ApiError_1.default(404, 'Task not found');
        }
        const isCreator = task.createdBy.toString() === req.user._id.toString();
        const isAssignee = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();
        const isSubAssignee = task.subAssignedTo && task.subAssignedTo.some((id) => id.toString() === req.user._id.toString());
        const isAdmin = req.user.role === 'admin';
        if (!isAdmin && !isCreator && !isAssignee && !isSubAssignee) {
            throw new ApiError_1.default(403, 'Access denied. You do not have permission to access this task.');
        }
        req.task = task;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.loadTaskAndCheckAccess = loadTaskAndCheckAccess;
