"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reactivateUser = exports.disableUser = exports.deleteAdmin = exports.updateAdmin = exports.createAdmin = exports.listUsers = void 0;
const User_1 = __importDefault(require("../models/User"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const listUsers = async () => {
    // Query all users projecting all details fields
    return User_1.default.find({})
        .select('name email role address phoneNumber birthday eid isDisabled disabledReason reactivationRequested reactivationRequestReason disabledBy disabledAt reactivatedBy reactivatedAt reactivationReason')
        .populate('disabledBy', 'name')
        .populate('reactivatedBy', 'name');
};
exports.listUsers = listUsers;
const createAdmin = async (dto) => {
    const { username, password, name, eid, address, phoneNumber } = dto;
    // Check unique username (email)
    const existingUser = await User_1.default.findOne({ email: username });
    if (existingUser) {
        throw new ApiError_1.default(400, 'A user with this username already exists');
    }
    const admin = await User_1.default.create({
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
exports.createAdmin = createAdmin;
const updateAdmin = async (id, dto) => {
    const user = await User_1.default.findById(id);
    if (!user) {
        throw new ApiError_1.default(404, 'Admin account not found');
    }
    if (user.role !== 'admin') {
        throw new ApiError_1.default(400, 'User is not an administrator');
    }
    const updatableFields = ['name', 'eid', 'address', 'phoneNumber'];
    for (const field of updatableFields) {
        if (dto[field] !== undefined) {
            user[field] = dto[field];
        }
    }
    if (dto.password) {
        user.password = dto.password;
    }
    await user.save();
    const updatedAdmin = await User_1.default.findById(id).select('name email role address phoneNumber birthday eid');
    return updatedAdmin;
};
exports.updateAdmin = updateAdmin;
const deleteAdmin = async (id) => {
    const user = await User_1.default.findById(id);
    if (!user) {
        throw new ApiError_1.default(404, 'Admin account not found');
    }
    if (user.role !== 'admin') {
        throw new ApiError_1.default(400, 'Cannot delete standard user via admin endpoint');
    }
    // Prevent deleting the default Super Admin
    if (user.email.toLowerCase() === 'superadminflownop@gmail.com') {
        throw new ApiError_1.default(400, 'Cannot delete the default Super Admin account');
    }
    await User_1.default.findByIdAndDelete(id);
};
exports.deleteAdmin = deleteAdmin;
const disableUser = async (operator, targetId, reason) => {
    const targetUser = await User_1.default.findById(targetId);
    if (!targetUser) {
        throw new ApiError_1.default(404, 'User account not found');
    }
    // 1. Cannot disable yourself
    if (targetUser._id.toString() === operator._id.toString()) {
        throw new ApiError_1.default(400, 'You cannot disable your own account');
    }
    // 2. If target is admin: only Super Admin can disable
    if (targetUser.role === 'admin') {
        const isSuperUser = operator.email.toLowerCase() === 'superadminflownop@gmail.com';
        if (!isSuperUser) {
            throw new ApiError_1.default(403, 'Access denied. Only Super User can disable Admin accounts.');
        }
    }
    // 3. Prevent disabling default Super Admin
    if (targetUser.email.toLowerCase() === 'superadminflownop@gmail.com') {
        throw new ApiError_1.default(400, 'Cannot disable the default Super Admin account');
    }
    targetUser.isDisabled = true;
    targetUser.disabledReason = reason;
    targetUser.disabledBy = operator._id;
    targetUser.disabledAt = new Date();
    // Clear user sessions
    targetUser.refreshTokens = [];
    await targetUser.save();
    const updatedUser = await User_1.default.findById(targetId)
        .select('name email role address phoneNumber birthday eid isDisabled disabledReason reactivationRequested reactivationRequestReason disabledBy disabledAt reactivatedBy reactivatedAt reactivationReason')
        .populate('disabledBy', 'name')
        .populate('reactivatedBy', 'name');
    return updatedUser;
};
exports.disableUser = disableUser;
const reactivateUser = async (operator, targetId, reason) => {
    const targetUser = await User_1.default.findById(targetId);
    if (!targetUser) {
        throw new ApiError_1.default(404, 'User account not found');
    }
    if (!targetUser.isDisabled) {
        throw new ApiError_1.default(400, 'User account is already active');
    }
    // If target is admin: only Super Admin can reactivate
    if (targetUser.role === 'admin') {
        const isSuperUser = operator.email.toLowerCase() === 'superadminflownop@gmail.com';
        if (!isSuperUser) {
            throw new ApiError_1.default(403, 'Access denied. Only Super User can reactivate Admin accounts.');
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
    const updatedUser = await User_1.default.findById(targetId)
        .select('name email role address phoneNumber birthday eid isDisabled disabledReason reactivationRequested reactivationRequestReason disabledBy disabledAt reactivatedBy reactivatedAt reactivationReason')
        .populate('disabledBy', 'name')
        .populate('reactivatedBy', 'name');
    return updatedUser;
};
exports.reactivateUser = reactivateUser;
exports.default = {
    listUsers: exports.listUsers,
    createAdmin: exports.createAdmin,
    updateAdmin: exports.updateAdmin,
    deleteAdmin: exports.deleteAdmin,
    disableUser: exports.disableUser,
    reactivateUser: exports.reactivateUser,
};
