import { Router } from 'express';
import * as attendanceController from '../controllers/attendance.controller';

const router = Router();

router.post('/scan', attendanceController.markAttendanceByQR);

export default router;
