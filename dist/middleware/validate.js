"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const express_validator_1 = require("express-validator");
const validate = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (errors.isEmpty()) {
        return next();
    }
    // Format the errors list to have { field, message } shape
    const formattedErrors = errors.array().map((err) => ({
        field: err.path || err.param || 'unknown',
        message: err.msg,
    }));
    res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: formattedErrors,
    });
};
exports.validate = validate;
exports.default = exports.validate;
