import User, { IUser } from '../models/User';
import ApiError from '../utils/ApiError';

export const listUsers = async (): Promise<IUser[]> => {
  // Query all users projecting all details fields
  return User.find({})
    .select('name email role address phoneNumber birthday eid isDisabled disabledReason reactivationRequested reactivationRequestReason disabledBy disabledAt reactivatedBy reactivatedAt reactivationReason')
    .populate('disabledBy', 'name')
    .populate('reactivatedBy', 'name');
};

export const createAdmin = async (dto: any): Promise<IUser> => {
  const { username, password, name, eid, address, phoneNumber } = dto;

  // Check unique username (email)
  const existingUser = await User.findOne({ email: username });
  if (existingUser) {
    throw new ApiError(400, 'A user with this username already exists');
  }

  const admin = await User.create({
    name,
    email: username,
    password,
    role: 'admin',
    eid,
    address,
    phoneNumber,
  });

  return admin;
};

export const updateAdmin = async (id: string, dto: any): Promise<IUser> => {
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'Admin account not found');
  }

  if (user.role !== 'admin') {
    throw new ApiError(400, 'User is not an administrator');
  }

  const updatableFields = ['name', 'eid', 'address', 'phoneNumber'];
  for (const field of updatableFields) {
    if (dto[field] !== undefined) {
      (user as any)[field] = dto[field];
    }
  }

  if (dto.password) {
    user.password = dto.password;
  }

  await user.save();

  const updatedAdmin = await User.findById(id).select('name email role address phoneNumber birthday eid');
  return updatedAdmin!;
};

export const deleteAdmin = async (id: string): Promise<void> => {
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'Admin account not found');
  }

  if (user.role !== 'admin') {
    throw new ApiError(400, 'Cannot delete standard user via admin endpoint');
  }

  // Prevent deleting the default Super Admin
  if (user.email.toLowerCase() === 'superadminflownop@gmail.com') {
    throw new ApiError(400, 'Cannot delete the default Super Admin account');
  }

  await User.findByIdAndDelete(id);
};

export const disableUser = async (operator: IUser, targetId: string, reason: string): Promise<IUser> => {
  const targetUser = await User.findById(targetId);
  if (!targetUser) {
    throw new ApiError(404, 'User account not found');
  }

  // 1. Cannot disable yourself
  if (targetUser._id.toString() === operator._id.toString()) {
    throw new ApiError(400, 'You cannot disable your own account');
  }

  // 2. If target is admin: only Super Admin can disable
  if (targetUser.role === 'admin') {
    const isSuperUser = operator.email.toLowerCase() === 'superadminflownop@gmail.com';
    if (!isSuperUser) {
      throw new ApiError(403, 'Access denied. Only Super User can disable Admin accounts.');
    }
  }

  // 3. Prevent disabling default Super Admin
  if (targetUser.email.toLowerCase() === 'superadminflownop@gmail.com') {
    throw new ApiError(400, 'Cannot disable the default Super Admin account');
  }

  targetUser.isDisabled = true;
  targetUser.disabledReason = reason;
  targetUser.disabledBy = operator._id;
  targetUser.disabledAt = new Date();
  
  // Clear user sessions
  targetUser.refreshTokens = [];

  await targetUser.save();

  const updatedUser = await User.findById(targetId)
    .select('name email role address phoneNumber birthday eid isDisabled disabledReason reactivationRequested reactivationRequestReason disabledBy disabledAt reactivatedBy reactivatedAt reactivationReason')
    .populate('disabledBy', 'name')
    .populate('reactivatedBy', 'name');

  return updatedUser!;
};

export const reactivateUser = async (operator: IUser, targetId: string, reason: string): Promise<IUser> => {
  const targetUser = await User.findById(targetId);
  if (!targetUser) {
    throw new ApiError(404, 'User account not found');
  }

  if (!targetUser.isDisabled) {
    throw new ApiError(400, 'User account is already active');
  }

  // If target is admin: only Super Admin can reactivate
  if (targetUser.role === 'admin') {
    const isSuperUser = operator.email.toLowerCase() === 'superadminflownop@gmail.com';
    if (!isSuperUser) {
      throw new ApiError(403, 'Access denied. Only Super User can reactivate Admin accounts.');
    }
  }

  targetUser.isDisabled = false;
  targetUser.disabledReason = undefined;
  targetUser.disabledBy = undefined;
  targetUser.disabledAt = undefined;

  targetUser.reactivationRequested = false;
  targetUser.reactivationRequestReason = undefined;
  targetUser.reactivationRequestedAt = undefined;

  targetUser.reactivationReason = reason;
  targetUser.reactivatedBy = operator._id;
  targetUser.reactivatedAt = new Date();

  await targetUser.save();

  const updatedUser = await User.findById(targetId)
    .select('name email role address phoneNumber birthday eid isDisabled disabledReason reactivationRequested reactivationRequestReason disabledBy disabledAt reactivatedBy reactivatedAt reactivationReason')
    .populate('disabledBy', 'name')
    .populate('reactivatedBy', 'name');

  return updatedUser!;
};

export default {
  listUsers,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  disableUser,
  reactivateUser,
};
