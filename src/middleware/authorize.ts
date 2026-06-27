import { Request, Response, NextFunction } from 'express';
import Task, { ITask } from '../models/Task';
import ApiError from '../utils/ApiError';

declare global {
  namespace Express {
    interface Request {
      task?: ITask;
    }
  }
}

export const requireRole = (role: 'admin' | 'user') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }
    if (req.user.role !== role) {
      return next(new ApiError(403, `Access denied. ${role} role required.`));
    }
    next();
  };
};

export const loadTaskAndCheckAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    // Verify task ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new ApiError(400, 'Invalid task ID format');
    }

    const task = await Task.findById(id);
    if (!task) {
      throw new ApiError(404, 'Task not found');
    }

    const isCreator = task.createdBy.toString() === req.user._id.toString();
    const isAssignee = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();
    const isSubAssignee = task.subAssignedTo && task.subAssignedTo.some(
      (id: any) => id.toString() === req.user!._id.toString()
    );
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && !isCreator && !isAssignee && !isSubAssignee) {
      throw new ApiError(403, 'Access denied. You do not have permission to access this task.');
    }

    req.task = task;
    next();
  } catch (error) {
    next(error);
  }
};
