import { Response } from 'express';

export const sendSuccess = (
  res: Response,
  data: any,
  message = 'Success',
  meta?: any,
  statusCode = 200
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta !== undefined ? { meta } : {}),
  });
};

export default sendSuccess;
