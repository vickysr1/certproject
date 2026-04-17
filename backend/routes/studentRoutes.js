import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../lib/asyncHandler.js';
import { validate } from '../lib/validate.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { archiveStudent, createStudent, listStudents } from '../services/userService.js';

const router = Router();

const createStudentSchema = z.object({
  name: z.string().trim().min(3),
  email: z.string().trim().min(2).optional(),
  password: z.string().min(6),
  department: z.string().trim().min(2).optional(),
  batch: z.string().trim().min(4).optional(),
  rollNumber: z.string().trim().min(3).optional(),
});

router.use(authenticate, requireRole('admin'));

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(listStudents());
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const payload = validate(createStudentSchema, req.body);
    const student = await createStudent(payload);
    res.status(201).json(student);
  }),
);

router.delete(
  '/:studentId',
  asyncHandler(async (req, res) => {
    const student = await archiveStudent(req.params.studentId);
    res.json({
      success: true,
      student,
    });
  }),
);

export default router;
