import Task, { ITask } from '../models/Task';
import User, { IUser } from '../models/User';
import ApiError from '../utils/ApiError';

/**
 * Validates that all given user IDs exist and have role === 'user'.
 * Throws ApiError if any ID is an admin or doesn't exist.
 */
const validateAssigneesAreUsers = async (ids: string[]): Promise<void> => {
  if (ids.length === 0) return;

  const uniqueIds = [...new Set(ids)];
  const users = await User.find({ _id: { $in: uniqueIds } }).select('_id role isDisabled');

  if (users.length !== uniqueIds.length) {
    throw new ApiError(400, 'One or more assigned user IDs are invalid.');
  }

  const nonUsers = users.filter((u) => u.role !== 'user');
  if (nonUsers.length > 0) {
    throw new ApiError(400, 'Tasks can only be assigned to users, not admins.');
  }

  const disabledUsers = users.filter((u) => u.isDisabled === true);
  if (disabledUsers.length > 0) {
    throw new ApiError(400, 'Tasks cannot be assigned to disabled users.');
  }
};

export const createTask = async (creatorId: string, dto: any): Promise<ITask> => {
  const { title, description, priority, status, dueDate, assignedTo, subAssignedTo } = dto;

  // Validate that assignees are users (not admins)
  const idsToValidate: string[] = [];
  if (assignedTo) idsToValidate.push(assignedTo);
  if (subAssignedTo && Array.isArray(subAssignedTo)) {
    idsToValidate.push(...subAssignedTo);
  }
  if (idsToValidate.length > 0) {
    await validateAssigneesAreUsers(idsToValidate);
  }

  const initialStatus = status || 'open';

  const task = await Task.create({
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

export interface IListTasksResult {
  tasks: ITask[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const listTasks = async (user: IUser, query: any): Promise<IListTasksResult> => {
  const filter: any = {};
  const { search, status, priority, assignedTo, sort, page, limit, approved } = query;

  // Handle approved vs in-progress filtering
  if (approved === 'true') {
    filter.approved = true;
  } else if (approved === 'all') {
    // Do not filter by approval status, return all tasks
  } else {
    filter.approved = { $ne: true };
  }

  // 1. Apply role scope restrictions
  const isSuperAdmin = user.email.toLowerCase() === 'superadminflownop@gmail.com';
  if (user.role !== 'admin') {
    // Users see tasks where they are primary assigned or sub-assigned
    filter.$or = [
      { assignedTo: user._id },
      { subAssignedTo: user._id },
    ];
  } else if (!isSuperAdmin) {
    // Regular Admins see only tasks they created (or approved)
    if (approved === 'true') {
      filter.$or = [
        { createdBy: user._id },
        { approvedByAdmin: user.name },
      ];
    } else {
      filter.createdBy = user._id;
    }
  } else {
    // Super Admin:
    // Approved tab: sees all approved tasks.
    // In-Progress tab: sees all in-progress/unapproved tasks.
    // No createdBy/approvedByAdmin filters applied.
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
  let sortOption: any = { createdAt: -1 };

  if (sort) {
    const isDesc = sort.startsWith('-');
    const field = isDesc ? sort.substring(1) : sort;
    if (allowedSortFields.includes(field)) {
      sortOption = { [field]: isDesc ? -1 : 1 };
    }
  }

  // 4. Pagination configuration
  const parsedPage = parseInt(page as string, 10) || 1;
  const parsedLimit = parseInt(limit as string, 10) || 10;
  const sanitizedPage = Math.max(1, parsedPage);
  const sanitizedLimit = Math.min(50, Math.max(1, parsedLimit));

  const skip = (sanitizedPage - 1) * sanitizedLimit;

  // 5. Query execution
  const total = await Task.countDocuments(filter);
  const tasks = await Task.find(filter)
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

export const listAllTasks = async (query: any): Promise<IListTasksResult> => {
  const filter: any = {};
  const { search, status, priority, assignedTo, sort, page, limit, approved } = query;

  // Handle approved vs in-progress filtering
  if (approved === 'true') {
    filter.approved = true;
  } else if (approved === 'all') {
    // No filter
  } else {
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
  let sortOption: any = { createdAt: -1 };

  if (sort) {
    const isDesc = sort.startsWith('-');
    const field = isDesc ? sort.substring(1) : sort;
    if (allowedSortFields.includes(field)) {
      sortOption = { [field]: isDesc ? -1 : 1 };
    }
  }

  // Pagination
  const parsedPage = parseInt(page as string, 10) || 1;
  const parsedLimit = parseInt(limit as string, 10) || 10;
  const sanitizedPage = Math.max(1, parsedPage);
  const sanitizedLimit = Math.min(50, Math.max(1, parsedLimit));

  const skip = (sanitizedPage - 1) * sanitizedLimit;

  const total = await Task.countDocuments(filter);
  const tasks = await Task.find(filter)
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

export const getTaskById = async (user: IUser, id: string): Promise<ITask> => {
  const task = await Task.findById(id)
    .populate('createdBy', 'name email role')
    .populate('assignedTo', 'name email role')
    .populate('subAssignedTo', 'name email role')
    .populate('statusHistory.changedBy', 'name email');

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  const isCreator = task.createdBy._id.toString() === user._id.toString();
  const isAssignee = task.assignedTo && task.assignedTo._id.toString() === user._id.toString();
  const isSubAssignee = task.subAssignedTo && task.subAssignedTo.some(
    (u: any) => (u._id || u).toString() === user._id.toString()
  );
  const isAdmin = user.role === 'admin';

  if (!isAdmin && !isCreator && !isAssignee && !isSubAssignee) {
    throw new ApiError(403, 'Access denied. You do not have permission to access this task.');
  }

  return task;
};

export const updateTask = async (user: IUser, id: string, dto: any): Promise<ITask> => {
  const task = await Task.findById(id);

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  const isCreator = task.createdBy.toString() === user._id.toString();
  const isAssignee = task.assignedTo && task.assignedTo.toString() === user._id.toString();
  const isSubAssignee = task.subAssignedTo && task.subAssignedTo.some(
    (uid: any) => uid.toString() === user._id.toString()
  );

  if (!isCreator && !isAssignee && !isSubAssignee) {
    throw new ApiError(403, 'Access denied. You do not have permission to update this task.');
  }

  // Validate assignees are users if being changed
  const idsToValidate: string[] = [];
  if (dto.assignedTo) idsToValidate.push(dto.assignedTo);
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
    } as any);
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
        } else if (field === 'subAssignedTo') {
          const taskVal = (task.subAssignedTo || []).map((id: any) => id.toString()).sort();
          const dtoVal = (Array.isArray(dto.subAssignedTo) ? dto.subAssignedTo : []).map((id: any) => id.toString()).sort();
          isDifferent = JSON.stringify(taskVal) !== JSON.stringify(dtoVal);
        } else if (field === 'dueDate') {
          const taskVal = task.dueDate ? new Date(task.dueDate).toISOString() : '';
          const dtoVal = dto.dueDate ? new Date(dto.dueDate).toISOString() : '';
          isDifferent = taskVal !== dtoVal;
        } else {
          isDifferent = dto[field] !== (task as any)[field];
        }

        if (isDifferent) {
          throw new ApiError(403, 'Access denied. You are only allowed to update the task status.');
        }
      }
    }
    updatableFields = ['status'];
  }

  for (const field of updatableFields) {
    if (dto[field] !== undefined) {
      (task as any)[field] = dto[field];
    }
  }

  await task.save();

  const updatedTask = await Task.findById(id)
    .populate('createdBy', 'name email role')
    .populate('assignedTo', 'name email role')
    .populate('subAssignedTo', 'name email role')
    .populate('statusHistory.changedBy', 'name email');

  return updatedTask!;
};

export const deleteTask = async (user: IUser, id: string): Promise<void> => {
  const task = await Task.findById(id);

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  const isCreator = task.createdBy.toString() === user._id.toString();
  const isAdmin = user.role === 'admin';

  if (!isAdmin && !isCreator) {
    throw new ApiError(403, 'Access denied. You do not have permission to delete this task.');
  }

  await Task.findByIdAndDelete(id);
};

export const approveTask = async (user: IUser, id: string): Promise<ITask> => {
  const task = await Task.findById(id);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  if (user.role !== 'admin') {
    throw new ApiError(403, 'Access denied. Only admins can approve tasks.');
  }

  const isSuperAdmin = user.email.toLowerCase() === 'superadminflownop@gmail.com';
  const isCreator = task.createdBy.toString() === user._id.toString();

  // Only the task's assigned admin (creator) and the Super Admin are authorized to approve
  if (!isCreator && !isSuperAdmin) {
    throw new ApiError(403, "Access denied. Only the task's assigned admin or the Super Admin are authorized to approve it.");
  }

  if (task.status !== 'done') {
    throw new ApiError(400, 'Only tasks with "done" status can be approved.');
  }

  task.approved = true;
  if (isSuperAdmin) {
    task.approvedByAdmin = 'Super Admin';
    task.status = 'Super Admin Approved';
  } else {
    task.approvedByAdmin = user.name;
  }
  await task.save();

  const updatedTask = await Task.findById(id)
    .populate('createdBy', 'name email role')
    .populate('assignedTo', 'name email role')
    .populate('subAssignedTo', 'name email role')
    .populate('statusHistory.changedBy', 'name email');

  return updatedTask!;
};

export default {
  createTask,
  listTasks,
  listAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  approveTask,
};
