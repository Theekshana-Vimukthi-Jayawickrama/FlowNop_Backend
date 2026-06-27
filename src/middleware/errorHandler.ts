import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError';
import logger from '../utils/logger';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = err;

  // Log error details for server diagnostics
  logger.error(`${req.method} ${req.originalUrl} - Error: ${err.message || err}`, err.stack);

  // Handle specific Mongoose database errors

  // 1. Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val: any) => val.message);
    error = new ApiError(400, 'Validation Error', messages);
  }

  // 2. Mongoose Duplicate Key Error
  else if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {}).join(', ');
    const message = fields 
      ? `Duplicate value for field(s): ${fields}. Please use another value.`
      : 'Duplicate value entered.';
    error = new ApiError(400, message);
  }

  // 3. Mongoose Cast Error (e.g. invalid ObjectId format)
  else if (err.name === 'CastError') {
    const message = `Invalid format for field ${err.path}: ${err.value}`;
    error = new ApiError(400, message);
  }

  // Default to ApiError if not already one
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message);
  }

  // Respond with standard structure
  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(error.errors !== undefined ? { errors: error.errors } : {}),
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};

export default errorHandler;
