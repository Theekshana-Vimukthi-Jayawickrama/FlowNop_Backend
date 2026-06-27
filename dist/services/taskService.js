"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.approveTask = exports.deleteTask = exports.updateTask = exports.getTaskById = exports.listAllTasks = exports.listTasks = exports.createTask = void 0;
const Task_1 = __importDefault(require("../models/Task"));
const User_1 = __importDefault(require("../models/User"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
/**
 * Validates that all given user IDs exist and have role === 'user'.
 * Throws ApiError if any ID is an admin or doesn't exist.
 */
const validateAssigneesAreUsers = async (ids) => {
    if (ids.length === 0)
        return;
    const uniqueIds = [...new Set(ids)];
    const users = await User_1.default.find({ _id: { $in: uniqueIds } }).select('_id role');
    if (users.length !== uniqueIds.length) {
        throw new ApiError_1.default(400, 'One or more assigned user IDs are invalid.');
    }
    const nonUsers = users.filter((u) => u.role !== 'user');
    if (nonUsers.length > 0) {
        throw new ApiError_1.default(400, 'Tasks can only be assigned to users, not admins.');
    }
};
const createTask = async (creatorId, dto) => {
    const { title, description, priority, status, dueDate, assignedTo, subAssignedTo } = dto;
    // Validate that assignees are users (not admins)
    const idsToValidate = [];
    if (assignedTo)
        idsToValidate.push(assignedTo);
    if (subAssignedTo && Array.isArray(subAssignedTo)) {
        idsToValidate.push(...subAssignedTo);
    }
    if (idsToValidate.length > 0) {
        await validateAssigneesAreUsers(idsToValidate);
    }
    const initialStatus = status || 'open';
    const task = await Task_1.default.create({
        title,
        description,
        priority,
        status: initialStatus,
        dueDate,
        createdBy: creatorId,
        assignedTo: assignedTo || undefined,
        subAssignedTo: subAssignedTo || [],
        statusHistory: [
            {
                status: initialStatus,
                changedBy: creatorId,
                changedAt: new Date(),
            },
        ],
    });
    return task;
};
exports.createTask = createTask;
const listTasks = async (user, query) => {
    const filter = {};
    const { search, status, priority, assignedTo, sort, page, limit, approved } = query;
    // Handle approved vs in-progress filtering
    if (approved === 'true') {
        filter.approved = true;
    }
    else if (approved === 'all') {
        // Do not filter by approval status, return all tasks
    }
    else {
        filter.approved = { $ne: true };
    }
    // 1. Apply role scope restrictions
    if (user.role !== 'admin') {
        // Users see tasks where they are primary assigned or sub-assigned
        filter.$or = [
            { assignedTo: user._id },
            { subAssignedTo: user._id },
        ];
    }
    else {
        // Admins see only tasks they created
        if (approved === 'true') {
            // On approved page, admins see tasks they created or approved
            filter.$or = [
                { createdBy: user._id },
                { approvedByAdmin: user.name },
            ];
        }
        else {
            // On in-progress page, admins see only tasks they created
            filter.createdBy = user._id;
        }
    }
    if (search) {
        filter.title = { $regex: search, $options: 'i' };
    }
    // The approved page should not include status filtering
    if (status && approved !== 'true') {
        filter.status = status;
    }
    if (priority) {
        filter.priority = priority;
    }
    if (assignedTo) {
        filter.assignedTo = assignedTo;
    }
    // 3. Sorting configuration
    const allowedSortFields = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'status', 'title'];
    let sortOption = { createdAt: -1 };
    if (sort) {
        const isDesc = sort.startsWith('-');
        const field = isDesc ? sort.substring(1) : sort;
        if (allowedSortFields.includes(field)) {
            sortOption = { [field]: isDesc ? -1 : 1 };
        }
    }
    // 4. Pagination configuration
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;
    const sanitizedPage = Math.max(1, parsedPage);
    const sanitizedLimit = Math.min(50, Math.max(1, parsedLimit));
    const skip = (sanitizedPage - 1) * sanitizedLimit;
    // 5. Query execution
    const total = await Task_1.default.countDocuments(filter);
    const tasks = await Task_1.default.find(filter)
        .populate('createdBy', 'name email role')
        .populate('assignedTo', 'name email role')
        .populate('subAssignedTo', 'name email role')
        .populate('statusHistory.changedBy', 'name email')
        .sort(sortOption)
        .skip(skip)
        .limit(sanitizedLimit);
    const pages = Math.ceil(total / sanitizedLimit);
    return {
        tasks,
        total,
        page: sanitizedPage,
        limit: sanitizedLimit,
        pages,
    };
};
exports.listTasks = listTasks;
const listAllTasks = async (query) => {
    const filter = {};
    const { search, status, priority, assignedTo, sort, page, limit, approved } = query;
    // Handle approved vs in-progress filtering
    if (approved === 'true') {
        filter.approved = true;
    }
    else if (approved === 'all') {
        // No filter
    }
    else {
        filter.approved = { $ne: true };
    }
    if (search) {
        filter.title = { $regex: search, $options: 'i' };
    }
    if (status && approved !== 'true') {
        filter.status = status;
    }
    if (priority) {
        filter.priority = priority;
    }
    if (assignedTo) {
        filter.assignedTo = assignedTo;
    }
    // Sorting
    const allowedSortFields = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'status', 'title'];
    let sortOption = { createdAt: -1 };
    if (sort) {
        const isDesc = sort.startsWith('-');
        const field = isDesc ? sort.substring(1) : sort;
        if (allowedSortFields.includes(field)) {
            sortOption = { [field]: isDesc ? -1 : 1 };
        }
    }
    // Pagination
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;
    const sanitizedPage = Math.max(1, parsedPage);
    const sanitizedLimit = Math.min(50, Math.max(1, parsedLimit));
    const skip = (sanitizedPage - 1) * sanitizedLimit;
    const total = await Task_1.default.countDocuments(filter);
    const tasks = await Task_1.default.find(filter)
        .populate('createdBy', 'name email role')
        .populate('assignedTo', 'name email role')
        .populate('subAssignedTo', 'name email role')
        .populate('statusHistory.changedBy', 'name email')
        .sort(sortOption)
        .skip(skip)
        .limit(sanitizedLimit);
    const pages = Math.ceil(total / sanitizedLimit);
    return {
        tasks,
        total,
        page: sanitizedPage,
        limit: sanitizedLimit,
        pages,
    };
};
exports.listAllTasks = listAllTasks;
const getTaskById = async (user, id) => {
    const task = await Task_1.default.findById(id)
        .populate('createdBy', 'name email role')
        .populate('assignedTo', 'name email role')
        .populate('subAssignedTo', 'name email role')
        .populate('statusHistory.changedBy', 'name email');
    if (!task) {
        throw new ApiError_1.default(404, 'Task not found');
    }
    const isCreator = task.createdBy._id.toString() === user._id.toString();
    const isAssignee = task.assignedTo && task.assignedTo._id.toString() === user._id.toString();
    const isSubAssignee = task.subAssignedTo && task.subAssignedTo.some((u) => (u._id || u).toString() === user._id.toString());
    const isAdmin = user.role === 'admin';
    if (!isAdmin && !isCreator && !isAssignee && !isSubAssignee) {
        throw new ApiError_1.default(403, 'Access denied. You do not have permission to access this task.');
    }
    return task;
};
exports.getTaskById = getTaskById;
const updateTask = async (user, id, dto) => {
    const task = await Task_1.default.findById(id);
    if (!task) {
        throw new ApiError_1.default(404, 'Task not found');
    }
    const isCreator = task.createdBy.toString() === user._id.toString();
    const isAssignee = task.assignedTo && task.assignedTo.toString() === user._id.toString();
    const isSubAssignee = task.subAssignedTo && task.subAssignedTo.some((uid) => uid.toString() === user._id.toString());
    if (!isCreator && !isAssignee && !isSubAssignee) {
        throw new ApiError_1.default(403, 'Access denied. You do not have permission to update this task.');
    }
    // Validate assignees are users if being changed
    const idsToValidate = [];
    if (dto.assignedTo)
        idsToValidate.push(dto.assignedTo);
    if (dto.subAssignedTo && Array.isArray(dto.subAssignedTo)) {
        idsToValidate.push(...dto.subAssignedTo);
    }
    if (idsToValidate.length > 0) {
        await validateAssigneesAreUsers(idsToValidate);
    }
    // Track status change
    if (dto.status && dto.status !== task.status) {
        task.statusHistory.push({
            status: dto.status,
            changedBy: user._id,
            changedAt: new Date(),
        });
    }
    let updatableFields = ['title', 'description', 'priority', 'status', 'dueDate', 'assignedTo', 'subAssignedTo'];
    if (!isCreator) {
        // Non-creators (assignee or sub-assignees) are only allowed to update status.
        // Check if they tried to update any other fields.
        const nonStatusFields = ['title', 'description', 'priority', 'dueDate', 'assignedTo', 'subAssignedTo'];
        for (const field of nonStatusFields) {
            if (dto[field] !== undefined) {
                let isDifferent = false;
                if (field === 'assignedTo') {
                    const taskVal = task.assignedTo ? task.assignedTo.toString() : '';
                    const dtoVal = dto.assignedTo ? dto.assignedTo.toString() : '';
                    isDifferent = taskVal !== dtoVal;
                }
                else if (field === 'subAssignedTo') {
                    const taskVal = (task.subAssignedTo || []).map((id) => id.toString()).sort();
                    const dtoVal = (Array.isArray(dto.subAssignedTo) ? dto.subAssignedTo : []).map((id) => id.toString()).sort();
                    isDifferent = JSON.stringify(taskVal) !== JSON.stringify(dtoVal);
                }
                else if (field === 'dueDate') {
                    const taskVal = task.dueDate ? new Date(task.dueDate).toISOString() : '';
                    const dtoVal = dto.dueDate ? new Date(dto.dueDate).toISOString() : '';
                    isDifferent = taskVal !== dtoVal;
                }
                else {
                    isDifferent = dto[field] !== task[field];
                }
                if (isDifferent) {
                    throw new ApiError_1.default(403, 'Access denied. You are only allowed to update the task status.');
                }
            }
        }
        updatableFields = ['status'];
    }
    for (const field of updatableFields) {
        if (dto[field] !== undefined) {
            task[field] = dto[field];
        }
    }
    await task.save();
    const updatedTask = await Task_1.default.findById(id)
        .populate('createdBy', 'name email role')
        .populate('assignedTo', 'name email role')
        .populate('subAssignedTo', 'name email role')
        .populate('statusHistory.changedBy', 'name email');
    return updatedTask;
};
exports.updateTask = updateTask;
const deleteTask = async (user, id) => {
    const task = await Task_1.default.findById(id);
    if (!task) {
        throw new ApiError_1.default(404, 'Task not found');
    }
    const isCreator = task.createdBy.toString() === user._id.toString();
    const isAdmin = user.role === 'admin';
    if (!isAdmin && !isCreator) {
        throw new ApiError_1.default(403, 'Access denied. You do not have permission to delete this task.');
    }
    await Task_1.default.findByIdAndDelete(id);
};
exports.deleteTask = deleteTask;
const approveTask = async (user, id) => {
    const task = await Task_1.default.findById(id);
    if (!task) {
        throw new ApiError_1.default(404, 'Task not found');
    }
    if (user.role !== 'admin') {
        throw new ApiError_1.default(403, 'Access denied. Only admins can approve tasks.');
    }
    // Only the admin/super admin who created the task can approve it
    if (task.createdBy.toString() !== user._id.toString()) {
        throw new ApiError_1.default(403, 'Access denied. Only the admin who created this task can approve it.');
    }
    if (task.status !== 'done') {
        throw new ApiError_1.default(400, 'Only tasks with "done" status can be approved.');
    }
    task.approved = true;
    task.approvedByAdmin = user.name;
    await task.save();
    const updatedTask = await Task_1.default.findById(id)
        .populate('createdBy', 'name email role')
        .populate('assignedTo', 'name email role')
        .populate('subAssignedTo', 'name email role')
        .populate('statusHistory.changedBy', 'name email');
    return updatedTask;
};
exports.approveTask = approveTask;
exports.default = {
    createTask: exports.createTask,
    listTasks: exports.listTasks,
    listAllTasks: exports.listAllTasks,
    getTaskById: exports.getTaskById,
    updateTask: exports.updateTask,
    deleteTask: exports.deleteTask,
    approveTask: exports.approveTask,
};
