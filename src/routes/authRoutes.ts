import { Router } from 'express';
import authController from '../controllers/authController';
import { registerValidation, loginValidation, refreshValidation, logoutValidation, requestReactivationValidation, changePasswordValidation, forgotPasswordValidation, resetPasswordValidation } from '../validations/authValidation';
import validate from '../middleware/validate';
import protect from '../middleware/auth';

const router = Router();

// Route for user registration
router.post('/register', registerValidation, validate, authController.register);

// Route for user login
router.post('/login', loginValidation, validate, authController.login);

// Route for getting the current authenticated user's profile
router.get('/me', protect, authController.me);

// Route for changing the user's password (verified current password)
router.put('/change-password', protect, changePasswordValidation, validate, authController.changePassword);

// Route for refreshing the JWT tokens
router.post('/refresh', refreshValidation, validate, authController.refresh);

// Route for logging out (invalidating refresh token)
router.post('/logout', logoutValidation, validate, authController.logout);

// Route for requesting reactivation of a disabled account
router.post('/request-reactivation', requestReactivationValidation, validate, authController.requestReactivation);

// Route for requesting password reset link
router.post('/forgot-password', forgotPasswordValidation, validate, authController.forgotPassword);

// Route for resetting password
router.post('/reset-password', resetPasswordValidation, validate, authController.resetPassword);

export default router;
