import { Router } from 'express';
import taskController from '../controllers/taskController';
import { createTaskValidation, updateTaskValidation, listTasksValidation } from '../validations/taskValidation';
import validate from '../middleware/validate';
import protect from '../middleware/auth';
import { loadTaskAndCheckAccess, requireRole } from '../middleware/authorize';

const router = Router();

// Secure all task routes
router.use(protect);

// Global "All Tasks" endpoint — accessible to all authenticated users
router.get('/all', listTasksValidation, validate, taskController.listAllTasks);

router.route('/')
  .get(listTasksValidation, validate, taskController.listTasks)
  .post(createTaskValidation, validate, taskController.createTask);

router.patch('/:id/approve', requireRole('admin'), loadTaskAndCheckAccess, taskController.approveTask);

router.route('/:id')
  .get(loadTaskAndCheckAccess, taskController.getTaskById)
  .patch(updateTaskValidation, validate, loadTaskAndCheckAccess, taskController.updateTask)
  .delete(loadTaskAndCheckAccess, taskController.deleteTask);

export default router;
