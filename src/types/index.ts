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
  email: string;
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
  role?: string;
}

export interface MarkAttendanceDTO {
  token: string;
  photoUrl: string;
  status?: 'PRESENT' | 'LATE' | 'LEFT';
}

export interface GenerateQRDTO {
  sessionId: number;
}

export interface CreateClassSessionDTO {
  sectionId: number;
  date: string;
  startTime: string;
  endTime?: string;
}
