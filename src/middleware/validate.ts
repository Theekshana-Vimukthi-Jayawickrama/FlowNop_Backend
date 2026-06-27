import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  // Format the errors list to have { field, message } shape
  const formattedErrors = errors.array().map((err: any) => ({
    field: err.path || err.param || 'unknown',
    message: err.msg,
  }));

  res.status(422).json({
    success: false,
    message: 'Validation failed',
    errors: formattedErrors,
  });
};

export default validate;
