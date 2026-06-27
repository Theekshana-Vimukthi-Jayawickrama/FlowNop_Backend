import { Router } from 'express';
import userController from '../controllers/userController';
import protect from '../middleware/auth';
import { requireRole } from '../middleware/authorize';
import { createAdminValidation, updateAdminValidation } from '../validations/userValidation';
import validate from '../middleware/validate';

const router = Router();

// GET /api/users - Admin-only user directory list
router.get('/', protect, requireRole('admin'), userController.listUsers);

// Admin account management routes (Guarded for Super Admin)
router.post('/admins', protect, requireRole('admin'), createAdminValidation, validate, userController.createAdmin);
router.patch('/admins/:id', protect, requireRole('admin'), updateAdminValidation, validate, userController.updateAdmin);
router.delete('/admins/:id', protect, requireRole('admin'), userController.deleteAdmin);

// Account disable/reactivate routes (Guarded for Admin role)
router.post('/:id/disable', protect, requireRole('admin'), userController.disableUser);
router.post('/:id/reactivate', protect, requireRole('admin'), userController.reactivateUser);

export default router;
