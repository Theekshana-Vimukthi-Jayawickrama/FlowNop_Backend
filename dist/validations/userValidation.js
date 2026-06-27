"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAdminValidation = exports.createAdminValidation = void 0;
const express_validator_1 = require("express-validator");
exports.createAdminValidation = [
    (0, express_validator_1.body)('username')
        .trim()
        .notEmpty()
        .withMessage('Username (email) is required')
        .isEmail()
        .withMessage('Username must be a valid email address')
        .normalizeEmail(),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('Password is required')
        .isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
    })
        .withMessage('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    (0, express_validator_1.body)('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('eid')
        .trim()
        .notEmpty()
        .withMessage('EID is required'),
    (0, express_validator_1.body)('address')
        .trim()
        .notEmpty()
        .withMessage('Address is required'),
    (0, express_validator_1.body)('phoneNumber')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required'),
];
exports.updateAdminValidation = [
    (0, express_validator_1.body)('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('eid')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('EID cannot be empty'),
    (0, express_validator_1.body)('address')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Address cannot be empty'),
    (0, express_validator_1.body)('phoneNumber')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Phone number cannot be empty'),
    (0, express_validator_1.body)('password')
        .optional()
        .isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
    })
        .withMessage('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
];
exports.default = {
    createAdminValidation: exports.createAdminValidation,
    updateAdminValidation: exports.updateAdminValidation,
};
