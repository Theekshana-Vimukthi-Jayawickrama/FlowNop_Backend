import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import User, { IUser } from '../models/User';
import ApiError from '../utils/ApiError';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check for authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      throw new ApiError(401, 'Access denied. No token provided.');
    }

    // Verify token payload
    let decodedPayload;
    try {
      decodedPayload = verifyToken(token);
    } catch (error) {
      throw new ApiError(401, 'Access denied. Invalid or expired token.');
    }

    // Retrieve user and check existence
    const user = await User.findById(decodedPayload.id);
    if (!user) {
      throw new ApiError(401, 'User belonging to this token no longer exists.');
    }

    if (user.isDisabled) {
      throw new ApiError(403, 'Access denied. Your account is disabled.');
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export default protect;
