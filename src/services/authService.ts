import User, { IUser } from '../models/User';
import ApiError from '../utils/ApiError';
import { signToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import env from '../config/env';
import emailService from './emailService';

export const register = async (dto: any): Promise<{ user: IUser; token: string; refreshToken: string }> => {
  const { name, email, password, role, address, phoneNumber, birthday } = dto;

  // Check email uniqueness
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, 'A user with this email address already exists');
  }

  // Create user
  const user = await User.create({ name, email, password, role, address, phoneNumber, birthday });

  // Generate tokens
  const token = signToken({ id: user._id.toString(), role: user.role });
  const refreshToken = signRefreshToken({ id: user._id.toString(), role: user.role });

  // Save refresh token to user session array
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push(refreshToken);
  await user.save();

  return { user, token, refreshToken };
};

export const login = async (dto: any): Promise<{ user: IUser; token: string; refreshToken: string }> => {
  const { email, password } = dto;

  // Check Super Admin existence and create if not exists
  const superAdminEmail = 'superAdminFlowNop@gmail.com';
  const superAdminExists = await User.exists({ email: superAdminEmail });
  if (!superAdminExists) {
    await User.create({
      name: 'Super Admin',
      email: superAdminEmail,
      password: 'FlowNop#2026',
      role: 'admin',
      address: 'System HQ',
      phoneNumber: '0000000000',
      eid: 'SUPER_ADMIN_EID',
    });
  }

  // Find user and explicitly select password
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (user.isDisabled) {
    return { user, token: '', refreshToken: '' };
  }

  // Generate tokens
  const token = signToken({ id: user._id.toString(), role: user.role });
  const refreshToken = signRefreshToken({ id: user._id.toString(), role: user.role });

  // Save refresh token to user session array
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push(refreshToken);
  await user.save();

  return { user, token, refreshToken };
};

export const refresh = async (oldRefreshToken: string): Promise<{ token: string; refreshToken: string }> => {
  let payload: any;
  try {
    payload = verifyRefreshToken(oldRefreshToken);
  } catch (error) {
    throw new ApiError(401, 'Access denied. Invalid or expired refresh token.');
  }

  const user = await User.findById(payload.id);
  if (!user || !user.refreshTokens || !user.refreshTokens.includes(oldRefreshToken)) {
    throw new ApiError(401, 'Access denied. Refresh token is not valid.');
  }

  // Generate new access and refresh tokens (Rotation)
  const token = signToken({ id: user._id.toString(), role: user.role });
  const newRefreshToken = signRefreshToken({ id: user._id.toString(), role: user.role });

  // Replace old refresh token with new one
  user.refreshTokens = user.refreshTokens.filter((t) => t !== oldRefreshToken);
  user.refreshTokens.push(newRefreshToken);
  await user.save();

  return { token, refreshToken: newRefreshToken };
};

export const logout = async (refreshToken: string): Promise<void> => {
  let payload: any;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    payload = jwt.decode(refreshToken);
  }

  if (payload) {
    const user = await User.findById(payload.id);
    if (user) {
      user.refreshTokens = user.refreshTokens || [];
      user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
      await user.save();
    }
  }
};

export const requestReactivation = async (email: string, reason: string): Promise<void> => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, 'User account not found');
  }

  if (!user.isDisabled) {
    throw new ApiError(400, 'User account is already active');
  }

  user.reactivationRequested = true;
  user.reactivationRequestReason = reason;
  user.reactivationRequestedAt = new Date();

  await user.save();
};

export const changePassword = async (userId: string, dto: any): Promise<void> => {
  const { currentPassword, newPassword } = dto;

  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new ApiError(404, 'User account not found');
  }

  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(400, 'Invalid current password');
  }

  user.password = newPassword;
  await user.save();
};

export const forgotPassword = async (email: string): Promise<void> => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, 'No user found with that email address');
  }

  // Generate secure reset token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token and set in DB with expiry (1 hour)
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 3600000);

  await user.save();

  // Send email
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${resetToken}`;
  const textMessage = `You requested a password reset. Please click on the link below to reset your password:\n\n${resetUrl}\n\nThis link is valid for 1 hour.`;
  const htmlMessage = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
      <h2 style="color: #4f46e5; text-align: center; margin-bottom: 20px;">TaskFlow Password Reset</h2>
      <p style="color: #333333; font-size: 14px; line-height: 1.5;">Hello,</p>
      <p style="color: #333333; font-size: 14px; line-height: 1.5;">You are receiving this email because you (or someone else) requested a password reset for your account on TaskFlow.</p>
      <p style="color: #333333; font-size: 14px; line-height: 1.5; margin-bottom: 30px;">Please click the button below to choose a new password. This link will expire in 1 hour.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p style="color: #666666; font-size: 13px; line-height: 1.5; margin-top: 30px;">If the button above does not work, copy and paste the link below into your web browser:</p>
      <p style="word-break: break-all; color: #4f46e5; font-size: 13px; line-height: 1.5;">${resetUrl}</p>
      <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 30px 0;" />
      <p style="font-size: 12px; color: #999999; line-height: 1.5;">If you did not request this reset, please ignore this email and your password will remain unchanged.</p>
    </div>
  `;

  await emailService.sendEmail({
    to: user.email,
    subject: 'TaskFlow - Password Reset Request',
    text: textMessage,
    html: htmlMessage,
  });
};

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  if (!token || typeof token !== 'string' || token.trim() === '' || token.length !== 64 || !/^[0-9a-fA-F]+$/.test(token)) {
    throw new ApiError(400, 'Password reset token is invalid or has expired');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new ApiError(400, 'Password reset token is invalid or has expired');
  }

  // Update password
  user.password = newPassword;

  // Clear fields
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  // Invalidate user refresh tokens
  user.refreshTokens = [];

  await user.save();
};

export default {
  register,
  login,
  refresh,
  logout,
  requestReactivation,
  changePassword,
  forgotPassword,
  resetPassword,
};
