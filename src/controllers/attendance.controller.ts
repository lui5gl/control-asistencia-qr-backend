import { Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/prisma';
import { AuthRequest, MarkAttendanceDTO, GenerateQRDTO } from '../types';

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

export const generateQRToken = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const teacherId = req.userId;
    const { sessionId } = req.body as GenerateQRDTO;

    if (!teacherId) {
      res.status(401).json({ error: 'Unauthorized user' });
      return;
    }

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' });
      return;
    }

    const session = await prisma.classSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      res.status(404).json({ error: 'Class session not found' });
      return;
    }

    if (session.teacherId !== teacherId) {
      res.status(403).json({ error: 'You are not the teacher of this session' });
      return;
    }

    if (session.status !== 'ACTIVE') {
      res.status(400).json({ error: 'Class session is not active' });
      return;
    }

    // Expire any existing active QR tokens for this session
    await prisma.qRToken.updateMany({
      where: {
        sessionId: session.id,
        status: 'ACTIVE',
      },
      data: {
        status: 'EXPIRED',
      },
    });

    const tokenValue = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const qrToken = await prisma.qRToken.create({
      data: {
        token: tokenValue,
        sessionId: session.id,
        status: 'ACTIVE',
        expiresAt,
      },
      select: {
        id: true,
        token: true,
        expiresAt: true,
        status: true,
      },
    });

    res.status(201).json({ message: 'QR token generated successfully', qrToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error generating QR token' });
  }
};
