import { Request, Response } from 'express';
import userService from '../services/userService';
import { sendSuccess } from '../utils/response';
import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await userService.listUsers();
  return sendSuccess(res, users, 'Users retrieved successfully');
});

export const createAdmin = asyncHandler(async (req: Request, res: Response) => {
  if (req.user?.email.toLowerCase() !== 'superadminflownop@gmail.com') {
    throw new ApiError(403, 'Access denied. Only Super Admin can manage admin accounts.');
  }
  const admin = await userService.createAdmin(req.body);
  return sendSuccess(res, admin, 'Admin created successfully', undefined, 201);
});

export const updateAdmin = asyncHandler(async (req: Request, res: Response) => {
  if (req.user?.email.toLowerCase() !== 'superadminflownop@gmail.com') {
    throw new ApiError(403, 'Access denied. Only Super Admin can manage admin accounts.');
  }
  const admin = await userService.updateAdmin(req.params.id, req.body);
  return sendSuccess(res, admin, 'Admin updated successfully');
});

export const deleteAdmin = asyncHandler(async (req: Request, res: Response) => {
  if (req.user?.email.toLowerCase() !== 'superadminflownop@gmail.com') {
    throw new ApiError(403, 'Access denied. Only Super Admin can manage admin accounts.');
  }
  await userService.deleteAdmin(req.params.id);
  return sendSuccess(res, null, 'Admin deleted successfully');
});

export const disableUser = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body;
  if (!reason) {
    throw new ApiError(400, 'Reason is required to disable user account.');
  }
  const user = await userService.disableUser(req.user!, req.params.id, reason);
  return sendSuccess(res, user, 'User account disabled successfully');
});

export const reactivateUser = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body;
  if (!reason) {
    throw new ApiError(400, 'Reason is required to reactivate user account.');
  }
  const user = await userService.reactivateUser(req.user!, req.params.id, reason);
  return sendSuccess(res, user, 'User account reactivated successfully');
});

export default {
  listUsers,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  disableUser,
  reactivateUser,
};
