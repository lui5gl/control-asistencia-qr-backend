import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload } from '../types';

export const validateApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || apiKey !== process.env.API_KEY) {
    res.status(401).json({ error: 'Invalid or missing API Key' });
    return;
  }

  next();
};

export const validateEmail = (req: Request, res: Response, next: NextFunction): void => {
  const { email } = req.body;
  
  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'Invalid email' });
    return;
  }
  
  next();
};

export const logger = (req: Request, res: Response, next: NextFunction): void => {
  console.log(`${req.method} ${req.path}`);
  next();
};

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
