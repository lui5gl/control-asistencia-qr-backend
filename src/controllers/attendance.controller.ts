import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest, MarkAttendanceDTO } from '../types';

export const markAttendanceByQR = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId;
    const { token, photoUrl, status = 'PRESENT' } = req.body as MarkAttendanceDTO;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized user' });
      return;
    }

    if (!token || !photoUrl) {
      res.status(400).json({ error: 'token and photoUrl are required' });
      return;
    }

    const qrToken = await prisma.qRToken.findUnique({
      where: { token },
      include: { session: true },
    });

    if (!qrToken) {
      res.status(404).json({ error: 'QR token not found' });
      return;
    }

    if (qrToken.status !== 'ACTIVE' || qrToken.expiresAt < new Date()) {
      res.status(400).json({ error: 'QR token expired or inactive' });
      return;
    }

    if (qrToken.session.status !== 'ACTIVE') {
      res.status(400).json({ error: 'Class session is not active' });
      return;
    }

    const enrolled = await prisma.enrollment.findFirst({
      where: {
        sectionId: qrToken.session.sectionId,
        studentId: userId,
        status: 'ENROLLED',
      },
      select: { id: true },
    });

    if (!enrolled) {
      res.status(403).json({ error: 'Student is not enrolled in this section' });
      return;
    }

    const existing = await prisma.attendanceRecord.findUnique({
      where: {
        sessionId_studentId: {
          sessionId: qrToken.sessionId,
          studentId: userId,
        },
      },
      select: { id: true },
    });

    if (existing) {
      res.status(409).json({ error: 'Attendance already registered for this session' });
      return;
    }

    const attendance = await prisma.attendanceRecord.create({
      data: {
        sessionId: qrToken.sessionId,
        studentId: userId,
        status,
        photoUrl,
      },
      select: {
        id: true,
        sessionId: true,
        studentId: true,
        status: true,
        recordedAt: true,
      },
    });

    res.status(201).json({ message: 'Attendance registered successfully', attendance });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      res.status(409).json({ error: 'Attendance already registered for this session' });
      return;
    }

    console.error(error);
    res.status(500).json({ error: 'Error registering attendance' });
  }
};
