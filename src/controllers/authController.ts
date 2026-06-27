import { Request, Response } from 'express';
import authService from '../services/authService';
import { sendSuccess } from '../utils/response';
import asyncHandler from '../utils/asyncHandler';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user, token, refreshToken } = await authService.register(req.body);
  return sendSuccess(res, { user, token, refreshToken }, 'User registered successfully', undefined, 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, token, refreshToken } = await authService.login(req.body);
  if (user.isDisabled) {
    return res.status(403).json({
      success: false,
      message: `Your account has been disabled. Reason: ${user.disabledReason || 'No reason specified'}`,
      disabled: true,
      disabledReason: user.disabledReason || 'No reason specified',
      email: user.email,
    });
  }
  return sendSuccess(res, { user, token, refreshToken }, 'User logged in successfully');
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  return sendSuccess(res, { user: req.user }, 'Current user retrieved successfully');
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { token, refreshToken } = await authService.refresh(req.body.refreshToken);
  return sendSuccess(res, { token, refreshToken }, 'Tokens refreshed successfully');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.body.refreshToken);
  return sendSuccess(res, null, 'User logged out successfully');
});

export const requestReactivation = asyncHandler(async (req: Request, res: Response) => {
  const { email, reason } = req.body;
  await authService.requestReactivation(email, reason);
  return sendSuccess(res, null, 'Reactivation request submitted successfully');
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.changePassword(req.user!._id.toString(), req.body);
  return sendSuccess(res, null, 'Password changed successfully');
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  await authService.forgotPassword(email);
  return sendSuccess(res, null, 'Password reset link sent to your email address');
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;
  await authService.resetPassword(token, password);
  return sendSuccess(res, null, 'Password has been reset successfully');
});

export default {
  register,
  login,
  me,
  refresh,
  logout,
  requestReactivation,
  changePassword,
  forgotPassword,
  resetPassword,
};

