import { Router } from 'express';
import bcryptjs from 'bcryptjs';
import { z } from 'zod';
import { getDatabase } from '../lib/database.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { createHttpError, sanitizeUser } from '../lib/http.js';
import { validate } from '../lib/validate.js';
import { authenticate, issueAuthToken } from '../middleware/auth.js';

const router = Router();
const { compare } = bcryptjs;

const loginSchema = z.object({
  userId: z.string().trim().min(1),
  password: z.string().min(1),
});

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const payload = validate(loginSchema, req.body);
    const user = getDatabase().users.find((entry) => entry.id === payload.userId);

    if (!user || user.status !== 'active') {
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

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  }),
);

export default router;
