"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = __importDefault(require("../controllers/userController"));
const auth_1 = __importDefault(require("../middleware/auth"));
const authorize_1 = require("../middleware/authorize");
const userValidation_1 = require("../validations/userValidation");
const validate_1 = __importDefault(require("../middleware/validate"));
const router = (0, express_1.Router)();
// GET /api/users - Admin-only user directory list
router.get('/', auth_1.default, (0, authorize_1.requireRole)('admin'), userController_1.default.listUsers);
// Admin account management routes (Guarded for Super Admin)
router.post('/admins', auth_1.default, (0, authorize_1.requireRole)('admin'), userValidation_1.createAdminValidation, validate_1.default, userController_1.default.createAdmin);
router.patch('/admins/:id', auth_1.default, (0, authorize_1.requireRole)('admin'), userValidation_1.updateAdminValidation, validate_1.default, userController_1.default.updateAdmin);
router.delete('/admins/:id', auth_1.default, (0, authorize_1.requireRole)('admin'), userController_1.default.deleteAdmin);
// Account disable/reactivate routes (Guarded for Admin role)
router.post('/:id/disable', auth_1.default, (0, authorize_1.requireRole)('admin'), userController_1.default.disableUser);
router.post('/:id/reactivate', auth_1.default, (0, authorize_1.requireRole)('admin'), userController_1.default.reactivateUser);
exports.default = router;
