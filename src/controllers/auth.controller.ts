import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { LoginDTO, RegisterDTO, AuthRequest } from '../types';

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Username or email already taken
 *       500:
 *         description: Internal server error
 */
export const register = async (req: Request<{}, {}, RegisterDTO>, res: Response): Promise<void> => {
  try {
    const { username, email, password, name } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: 'username, email and password are required' });
      return;
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] }
    });

    if (existing) {
      res.status(400).json({ error: 'Username or email already taken' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { username, email, password: hashedPassword, name },
      select: { id: true, username: true, email: true, name: true, status: true, createdAt: true }
    });

    // Auto-create student profile for every new user
    await prisma.studentProfile.create({
      data: { studentId: user.id, points: 0, level: 'BRONZE' }
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(201).json({ user, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error registering user' });
  }
};

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with credentials
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *       400:
 *         description: Missing credentials
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
export const login = async (req: Request<{}, {}, LoginDTO>, res: Response): Promise<void> => {
  try {
    const { login: loginField, password } = req.body;

    if (!loginField || !password) {
      res.status(400).json({ error: 'login (email or username) and password are required' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: loginField }, { username: loginField }],
        status: 'ACTIVE'
      }
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error during login' });
  }
};

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get the current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, username: true, email: true, name: true, status: true, createdAt: true, updatedAt: true }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching profile' });
  }
};

export const myProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await prisma.studentProfile.findUnique({
      where: { studentId: req.userId },
      include: {
        pointsHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!profile) {
      res.status(404).json({ error: 'Student profile not found' });
      return;
    }

    const levelThresholds: Record<string, { next: string; max: number; min: number }> = {
      BRONZE:  { next: 'SILVER',  min: 0,   max: 100 },
      SILVER:  { next: 'GOLD',    min: 100,  max: 300 },
      GOLD:    { next: 'DIAMOND', min: 300,  max: 600 },
      DIAMOND: { next: 'DIAMOND', min: 600,  max: 600 },
    };

    const threshold = levelThresholds[profile.level];
    const progress = profile.level === 'DIAMOND'
      ? 100
      : Math.min(100, Math.round(((profile.points - threshold.min) / (threshold.max - threshold.min)) * 100));
    const pointsToNext = Math.max(0, threshold.max - profile.points);

    res.json({
      points: profile.points,
      level: profile.level,
      progress,
      pointsToNext,
      nextLevel: threshold.next,
      history: profile.pointsHistory.map((m: any) => ({
        id: m.id,
        reason: m.reason,
        points: m.points > 0 ? `+${m.points}` : `${m.points}`,
        date: m.createdAt,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching student profile' });
  }
};

const weekdayMap = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;

export const myAttendanceSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const [present, late, absent, left] = await Promise.all([
      prisma.attendanceRecord.count({ where: { studentId: req.userId, status: 'PRESENT' } }),
      prisma.attendanceRecord.count({ where: { studentId: req.userId, status: 'LATE' } }),
      prisma.attendanceRecord.count({ where: { studentId: req.userId, status: 'ABSENT' } }),
      prisma.attendanceRecord.count({ where: { studentId: req.userId, status: 'LEFT' } }),
    ]);

    res.json({
      present,
      late,
      pending: absent + left,
      total: present + late + absent + left,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching attendance summary' });
  }
};

export const myRecentAttendances = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const limit = Math.min(Number(req.query.limit) || 10, 20);

    const records = await prisma.attendanceRecord.findMany({
      where: { studentId: req.userId },
      orderBy: { recordedAt: 'desc' },
      take: limit,
      include: {
        session: {
          include: {
            section: {
              include: {
                course: true,
                schedules: true,
              },
            },
          },
        },
      },
    });

    const items = records.map((record: any) => {
      const sessionDate = new Date(record.session.date);
      const weekday = weekdayMap[sessionDate.getDay()];
      const matchedSchedule = record.session.section.schedules.find((s: any) => s.weekday === weekday);

      return {
        id: record.id,
        status: record.status,
        className: record.session.section.course.name,
        sectionName: record.session.section.name,
        classroom: matchedSchedule?.classroom || null,
        date: record.session.date,
        startTime: record.session.startTime,
        recordedAt: record.recordedAt,
      };
    });

    res.json({ items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching recent attendances' });
  }
};
