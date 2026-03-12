import { Router, Request, Response } from 'express';
import userRoutes from './user.routes';
import anaRoutes from "./ana.routes";

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'API v1',
    version: '1.0.0'
  });
});

router.use('/users', userRoutes);
router.use("/ana", anaRoutes);

export default router;
