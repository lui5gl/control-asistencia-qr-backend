import { Request } from 'express';

export interface CreateUserDTO {
  email: string;
  name?: string;
}

export interface UpdateUserDTO {
  email?: string;
  name?: string;
}

export interface UserParams {
  id: string;
}

export interface AuthRequest extends Request {
  userId?: number;
}
