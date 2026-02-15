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
