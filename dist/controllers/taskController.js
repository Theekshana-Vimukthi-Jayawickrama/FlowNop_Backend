"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.approveTask = exports.deleteTask = exports.updateTask = exports.getTaskById = exports.listAllTasks = exports.listTasks = exports.createTask = void 0;
const taskService_1 = __importDefault(require("../services/taskService"));
const response_1 = require("../utils/response");
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
exports.createTask = (0, asyncHandler_1.default)(async (req, res) => {
    const task = await taskService_1.default.createTask(req.user._id.toString(), req.body);
    return (0, response_1.sendSuccess)(res, task, 'Task created successfully', undefined, 201);
});
exports.listTasks = (0, asyncHandler_1.default)(async (req, res) => {
    const { tasks, total, page, limit, pages } = await taskService_1.default.listTasks(req.user, req.query);
    return (0, response_1.sendSuccess)(res, tasks, 'Tasks retrieved successfully', { total, page, limit, pages });
});
exports.listAllTasks = (0, asyncHandler_1.default)(async (req, res) => {
    const { tasks, total, page, limit, pages } = await taskService_1.default.listAllTasks(req.query);
    return (0, response_1.sendSuccess)(res, tasks, 'All tasks retrieved successfully', { total, page, limit, pages });
});
exports.getTaskById = (0, asyncHandler_1.default)(async (req, res) => {
    const task = await taskService_1.default.getTaskById(req.user, req.params.id);
    return (0, response_1.sendSuccess)(res, task, 'Task retrieved successfully');
});
exports.updateTask = (0, asyncHandler_1.default)(async (req, res) => {
    const task = await taskService_1.default.updateTask(req.user, req.params.id, req.body);
    return (0, response_1.sendSuccess)(res, task, 'Task updated successfully');
});
exports.deleteTask = (0, asyncHandler_1.default)(async (req, res) => {
    await taskService_1.default.deleteTask(req.user, req.params.id);
    return (0, response_1.sendSuccess)(res, null, 'Task deleted successfully');
});
exports.approveTask = (0, asyncHandler_1.default)(async (req, res) => {
    const task = await taskService_1.default.approveTask(req.user, req.params.id);
    return (0, response_1.sendSuccess)(res, task, 'Task approved successfully');
});
exports.default = {
    createTask: exports.createTask,
    listTasks: exports.listTasks,
    listAllTasks: exports.listAllTasks,
    getTaskById: exports.getTaskById,
    updateTask: exports.updateTask,
    deleteTask: exports.deleteTask,
    approveTask: exports.approveTask,
};
