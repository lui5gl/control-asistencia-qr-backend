import { Router } from 'express';
import * as attendanceController from '../controllers/attendance.controller';
import { authenticateToken } from '../middlewares';

const router = Router();

router.post('/generate-qr', authenticateToken, attendanceController.generateQRToken);
router.post('/scan', authenticateToken, attendanceController.markAttendanceByQR);

export default router;
