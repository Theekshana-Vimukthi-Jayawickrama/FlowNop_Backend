import { Request, Response } from 'express';
import taskService from '../services/taskService';
import { sendSuccess } from '../utils/response';
import asyncHandler from '../utils/asyncHandler';

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await taskService.createTask(req.user!._id.toString(), req.body);
  return sendSuccess(res, task, 'Task created successfully', undefined, 201);
});

export const listTasks = asyncHandler(async (req: Request, res: Response) => {
  const { tasks, total, page, limit, pages } = await taskService.listTasks(req.user!, req.query);
  return sendSuccess(res, tasks, 'Tasks retrieved successfully', { total, page, limit, pages });
});

export const listAllTasks = asyncHandler(async (req: Request, res: Response) => {
  const { tasks, total, page, limit, pages } = await taskService.listAllTasks(req.query);
  return sendSuccess(res, tasks, 'All tasks retrieved successfully', { total, page, limit, pages });
});

export const getTaskById = asyncHandler(async (req: Request, res: Response) => {
  const task = await taskService.getTaskById(req.user!, req.params.id);
  return sendSuccess(res, task, 'Task retrieved successfully');
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await taskService.updateTask(req.user!, req.params.id, req.body);
  return sendSuccess(res, task, 'Task updated successfully');
});

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  await taskService.deleteTask(req.user!, req.params.id);
  return sendSuccess(res, null, 'Task deleted successfully');
});

export const approveTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await taskService.approveTask(req.user!, req.params.id);
  return sendSuccess(res, task, 'Task approved successfully');
});

export default {
  createTask,
  listTasks,
  listAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  approveTask,
};
