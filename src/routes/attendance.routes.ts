import { Router } from 'express';
import * as attendanceController from '../controllers/attendance.controller';
import { authenticateToken } from '../middlewares';

const router = Router();

router.post('/generate-qr', authenticateToken, attendanceController.generateQRToken);
router.post('/scan', authenticateToken, attendanceController.markAttendanceByQR);

// Admin QR routes - create and manage class sessions
router.post('/sessions', authenticateToken, attendanceController.createClassSession);
router.get('/sessions', authenticateToken, attendanceController.getClassSessions);
router.patch('/sessions/:id/close', authenticateToken, attendanceController.closeClassSession);

export default router;
