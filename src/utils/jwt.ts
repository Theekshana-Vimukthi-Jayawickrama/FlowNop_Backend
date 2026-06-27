import jwt from 'jsonwebtoken';
import env from '../config/env';

export interface ITokenPayload {
  id: string;
  role: string;
}

export const signToken = (payload: ITokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
};

export const verifyToken = (token: string): ITokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as ITokenPayload;
};

export const signRefreshToken = (payload: ITokenPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
  });
};

export const verifyRefreshToken = (token: string): ITokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as ITokenPayload;
};
