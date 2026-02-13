import { Router, Request, Response } from 'express';
import userRoutes from './user.routes';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'API v1',
    version: '1.0.0'
  });
});

router.use('/users', userRoutes);

export default router;
