"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTasksValidation = exports.updateTaskValidation = exports.createTaskValidation = void 0;
const express_validator_1 = require("express-validator");
exports.createTaskValidation = [
    (0, express_validator_1.body)('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ min: 3, max: 120 })
        .withMessage('Title must be between 3 and 120 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Description must not exceed 2000 characters'),
    (0, express_validator_1.body)('priority')
        .optional()
        .isIn(['low', 'medium', 'high'])
        .withMessage('Priority must be one of: low, medium, high'),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['open', 'in_progress', 'testing', 'done'])
        .withMessage('Status must be one of: open, in_progress, testing, done'),
    (0, express_validator_1.body)('dueDate')
        .optional()
        .isISO8601()
        .withMessage('dueDate must be a valid ISO 8601 date')
        .custom((value) => {
        const inputDate = new Date(value);
        const today = new Date();
        // Subtract 24 hours to accommodate any timezone shift
        today.setHours(today.getHours() - 24);
        today.setHours(0, 0, 0, 0);
        if (inputDate < today) {
            throw new Error('Due date must not be in the past');
        }
        return true;
    }),
    (0, express_validator_1.body)('assignedTo')
        .optional()
        .isMongoId()
        .withMessage('assignedTo must be a valid MongoDB ObjectId'),
    (0, express_validator_1.body)('subAssignedTo')
        .optional()
        .isArray()
        .withMessage('subAssignedTo must be an array'),
    (0, express_validator_1.body)('subAssignedTo.*')
        .isMongoId()
        .withMessage('Each subAssignedTo entry must be a valid MongoDB ObjectId'),
];
exports.updateTaskValidation = [
    (0, express_validator_1.body)('title')
        .optional()
        .trim()
        .isLength({ min: 3, max: 120 })
        .withMessage('Title must be between 3 and 120 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Description must not exceed 2000 characters'),
    (0, express_validator_1.body)('priority')
        .optional()
        .isIn(['low', 'medium', 'high'])
        .withMessage('Priority must be one of: low, medium, high'),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['open', 'in_progress', 'testing', 'done'])
        .withMessage('Status must be one of: open, in_progress, testing, done'),
    (0, express_validator_1.body)('dueDate')
        .optional()
        .isISO8601()
        .withMessage('dueDate must be a valid ISO 8601 date')
        .custom((value) => {
        const inputDate = new Date(value);
        const today = new Date();
        // Subtract 24 hours to accommodate any timezone shift
        today.setHours(today.getHours() - 24);
        today.setHours(0, 0, 0, 0);
        if (inputDate < today) {
            throw new Error('Due date must not be in the past');
        }
        return true;
    }),
    (0, express_validator_1.body)('assignedTo')
        .optional()
        .isMongoId()
        .withMessage('assignedTo must be a valid MongoDB ObjectId'),
    (0, express_validator_1.body)('subAssignedTo')
        .optional()
        .isArray()
        .withMessage('subAssignedTo must be an array'),
    (0, express_validator_1.body)('subAssignedTo.*')
        .isMongoId()
        .withMessage('Each subAssignedTo entry must be a valid MongoDB ObjectId'),
];
exports.listTasksValidation = [
    (0, express_validator_1.query)('search')
        .optional()
        .trim(),
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['open', 'in_progress', 'testing', 'done'])
        .withMessage('Status must be one of: open, in_progress, testing, done'),
    (0, express_validator_1.query)('priority')
        .optional()
        .isIn(['low', 'medium', 'high'])
        .withMessage('Priority must be one of: low, medium, high'),
    (0, express_validator_1.query)('assignedTo')
        .optional()
        .isMongoId()
        .withMessage('assignedTo must be a valid MongoDB ObjectId'),
    (0, express_validator_1.query)('sort')
        .optional()
        .custom((value) => {
        const allowedFields = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'status', 'title'];
        const field = value.startsWith('-') ? value.substring(1) : value;
        if (!allowedFields.includes(field)) {
            throw new Error(`Sort field must be one of: ${allowedFields.join(', ')}`);
        }
        return true;
    }),
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('page must be an integer >= 1')
        .toInt(),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('limit must be an integer between 1 and 50')
        .toInt(),
];
