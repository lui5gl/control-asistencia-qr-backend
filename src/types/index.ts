import { Request } from 'express';

export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
  name?: string;
}

export interface UpdateUserDTO {
  username?: string;
  email?: string;
  password?: string;
  name?: string;
}

export interface UserParams {
  id: string;
}

export interface AuthRequest extends Request {
  userId?: number;
}

export interface LoginDTO {
  login: string;
  password: string;
}

export interface RegisterDTO {
  username: string;
  email: string;
  password: string;
  name?: string;
}

export interface JwtPayload {
  userId: number;
}
