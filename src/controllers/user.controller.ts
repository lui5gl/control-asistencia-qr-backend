import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { CreateUserDTO, UpdateUserDTO, UserParams } from '../types';

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching users' });
  }
};

export const getById = async (req: Request<UserParams>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching user' });
  }
};

export const create = async (req: Request<{}, {}, CreateUserDTO>, res: Response): Promise<void> => {
  try {
    const { username, email, password, name } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: { 
        username,
        email, 
        password: hashedPassword,
        name 
      }
    });
    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating user' });
  }
};

export const update = async (req: Request<UserParams, {}, UpdateUserDTO>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { username, email, password, name } = req.body;
    
    const updateData: any = { username, email, name };
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating user' });
  }
};

export const deleteUser = async (req: Request<UserParams>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error deleting user' });
  }
};
