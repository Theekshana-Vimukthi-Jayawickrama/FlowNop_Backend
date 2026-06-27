"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = __importDefault(require("../controllers/authController"));
const authValidation_1 = require("../validations/authValidation");
const validate_1 = __importDefault(require("../middleware/validate"));
const auth_1 = __importDefault(require("../middleware/auth"));
const router = (0, express_1.Router)();
// Route for user registration
router.post('/register', authValidation_1.registerValidation, validate_1.default, authController_1.default.register);
// Route for user login
router.post('/login', authValidation_1.loginValidation, validate_1.default, authController_1.default.login);
// Route for getting the current authenticated user's profile
router.get('/me', auth_1.default, authController_1.default.me);
// Route for changing the user's password (verified current password)
router.put('/change-password', auth_1.default, authValidation_1.changePasswordValidation, validate_1.default, authController_1.default.changePassword);
// Route for refreshing the JWT tokens
router.post('/refresh', authValidation_1.refreshValidation, validate_1.default, authController_1.default.refresh);
// Route for logging out (invalidating refresh token)
router.post('/logout', authValidation_1.logoutValidation, validate_1.default, authController_1.default.logout);
// Route for requesting reactivation of a disabled account
router.post('/request-reactivation', authValidation_1.requestReactivationValidation, validate_1.default, authController_1.default.requestReactivation);
// Route for requesting password reset link
router.post('/forgot-password', authValidation_1.forgotPasswordValidation, validate_1.default, authController_1.default.forgotPassword);
// Route for resetting password
router.post('/reset-password', authValidation_1.resetPasswordValidation, validate_1.default, authController_1.default.resetPassword);
exports.default = router;
