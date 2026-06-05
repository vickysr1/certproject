import { Router } from 'express';
import bcryptjs from 'bcryptjs';
import { z } from 'zod';
import { getDatabase } from '../lib/database.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { createHttpError, sanitizeUser } from '../lib/http.js';
import { validate } from '../lib/validate.js';
import { authenticate, issueAuthToken } from '../middleware/auth.js';
import { registerStudent } from '../services/userService.js';

const router = Router();
const { compare } = bcryptjs;

const loginSchema = z.object({
  userId: z.string().trim().min(1),
  password: z.string().min(1),
});

const signupSchema = z.object({
  name: z.string().trim().min(3),
  email: z.string().trim().email(),
  rollNumber: z.string().trim().min(3),
  password: z.string().min(6),
  department: z.string().trim().min(2),
  batch: z.string().trim().min(4),
});

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const payload = validate(loginSchema, req.body);
    const lowercaseId = payload.userId.trim().toLowerCase();
    const uppercaseId = payload.userId.trim().toUpperCase();

    const user = getDatabase().users.find((entry) => 
      entry.id === payload.userId || 
      entry.id === lowercaseId ||
      entry.id === uppercaseId ||
      (entry.rollNumber && entry.rollNumber.toUpperCase() === uppercaseId) ||
      (entry.email && entry.email.toLowerCase() === lowercaseId)
    );

    if (!user) {
      throw createHttpError(401, 'Invalid user ID or password');
    }

    if (user.status === 'pending') {
      throw createHttpError(403, 'Your account is pending administrator approval');
    }

    if (user.status !== 'active') {
      throw createHttpError(401, 'Invalid user ID or password');
    }

    const passwordMatches = await compare(payload.password, user.passwordHash);

    if (!passwordMatches) {
      throw createHttpError(401, 'Invalid user ID or password');
    }

    const token = issueAuthToken(user);
    res.json({
      token,
      user: sanitizeUser(user),
    });
  }),
);

router.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const payload = validate(signupSchema, req.body);
    const student = await registerStudent(payload);
    res.status(201).json({
      success: true,
      student,
    });
  }),
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  }),
);

export default router;
