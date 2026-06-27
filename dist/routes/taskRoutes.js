"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskController_1 = __importDefault(require("../controllers/taskController"));
const taskValidation_1 = require("../validations/taskValidation");
const validate_1 = __importDefault(require("../middleware/validate"));
const auth_1 = __importDefault(require("../middleware/auth"));
const authorize_1 = require("../middleware/authorize");
const router = (0, express_1.Router)();
// Secure all task routes
router.use(auth_1.default);
// Global "All Tasks" endpoint — accessible to all authenticated users
router.get('/all', taskValidation_1.listTasksValidation, validate_1.default, taskController_1.default.listAllTasks);
router.route('/')
    .get(taskValidation_1.listTasksValidation, validate_1.default, taskController_1.default.listTasks)
    .post(taskValidation_1.createTaskValidation, validate_1.default, taskController_1.default.createTask);
router.patch('/:id/approve', (0, authorize_1.requireRole)('admin'), authorize_1.loadTaskAndCheckAccess, taskController_1.default.approveTask);
router.route('/:id')
    .get(authorize_1.loadTaskAndCheckAccess, taskController_1.default.getTaskById)
    .patch(taskValidation_1.updateTaskValidation, validate_1.default, authorize_1.loadTaskAndCheckAccess, taskController_1.default.updateTask)
    .delete(authorize_1.loadTaskAndCheckAccess, taskController_1.default.deleteTask);
exports.default = router;
