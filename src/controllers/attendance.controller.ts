import { Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/prisma';
import { AuthRequest, MarkAttendanceDTO, GenerateQRDTO, CreateClassSessionDTO } from '../types';

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

export const createClassSession = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const teacherId = req.userId;
    const { sectionId, date, startTime, endTime } = req.body as CreateClassSessionDTO;

    if (!teacherId) {
      res.status(401).json({ error: 'Unauthorized user' });
      return;
    }

    if (!sectionId || !date || !startTime) {
      res.status(400).json({ error: 'sectionId, date, and startTime are required' });
      return;
    }

    // Verify section exists
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      res.status(404).json({ error: 'Section not found' });
      return;
    }

    // Verify teacher is assigned to this section
    const assignment = await prisma.teacherAssignment.findFirst({
      where: {
        sectionId,
        teacherId,
      },
    });

    if (!assignment) {
      res.status(403).json({ error: 'You are not assigned to this section' });
      return;
    }

    const classSession = await prisma.classSession.create({
      data: {
        sectionId,
        teacherId,
        date: new Date(date),
        startTime: new Date(`1970-01-01T${startTime}`),
        endTime: endTime ? new Date(`1970-01-01T${endTime}`) : null,
        status: 'ACTIVE',
      },
      include: {
        section: {
          select: {
            id: true,
            name: true,
            course: {
              select: { name: true, code: true },
            },
          },
        },
      },
    });

    res.status(201).json({
      message: 'Class session created successfully',
      classSession,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating class session' });
  }
};

export const getClassSessions = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const teacherId = req.userId;
    const { sectionId, date } = req.query;

    const where: any = { teacherId };
    if (sectionId) where.sectionId = Number(sectionId);
    if (date) where.date = new Date(date as string);

    const sessions = await prisma.classSession.findMany({
      where,
      include: {
        section: {
          select: {
            id: true,
            name: true,
            course: { select: { name: true, code: true } },
          },
        },
        qrTokens: {
          where: { status: 'ACTIVE' },
          select: { token: true, expiresAt: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json({ sessions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching class sessions' });
  }
};

export const closeClassSession = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const teacherId = req.userId;
    const { id } = req.params;

    const session = await prisma.classSession.findUnique({ where: { id: Number(id) } });

    if (!session) {
      res.status(404).json({ error: 'Class session not found' });
      return;
    }

    if (session.teacherId !== teacherId) {
      res.status(403).json({ error: 'You are not the teacher of this session' });
      return;
    }

    // Expire active QR tokens
    await prisma.qRToken.updateMany({
      where: { sessionId: session.id, status: 'ACTIVE' },
      data: { status: 'EXPIRED' },
    });

    const updated = await prisma.classSession.update({
      where: { id: session.id },
      data: { status: 'CLOSED', endTime: new Date() },
    });

    res.json({ message: 'Class session closed', session: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error closing class session' });
  }
};
