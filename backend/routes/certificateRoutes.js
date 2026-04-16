import fs from 'node:fs/promises';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { asyncHandler } from '../lib/asyncHandler.js';
import { createHttpError } from '../lib/http.js';
import { validate } from '../lib/validate.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  getCertificateDocument,
  listCertificates,
  issueCertificate,
  uploadCertificate,
} from '../services/certificateService.js';
import { verifyCertificateById, verifyUploadedCertificate } from '../services/verificationService.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    const isImage = file.mimetype.startsWith('image/');
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');

    if (!isImage && !isPdf) {
      callback(createHttpError(400, 'Only PDF or image files are supported for certificate verification'));
      return;
    }

    callback(null, true);
  },
});

const issueCertificateSchema = z.object({
  studentId: z.string().trim().min(1),
  degree: z.string().trim().min(3),
  branch: z.string().trim().min(2),
  institution: z.string().trim().min(3),
  year: z.union([z.string().trim().min(4), z.number().int()]),
  grade: z.string().trim().min(2),
});

router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const isStudent = req.user.role === 'student';
    const requestedStudentId = req.query.studentId?.toString().trim();
    const studentId = isStudent ? req.user.id : requestedStudentId;

    if (isStudent && requestedStudentId && requestedStudentId !== req.user.id) {
      throw createHttpError(403, 'Students can only view their own certificates');
    }

    res.json(listCertificates({ studentId }));
  }),
);

router.post(
  '/issue',
  authenticate,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const payload = validate(issueCertificateSchema, req.body);
    const certificate = await issueCertificate(payload, req.user);
    res.status(201).json(certificate);
  }),
);

router.post(
  '/upload',
  authenticate,
  requireRole('admin'),
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw createHttpError(400, 'Please upload a certificate file');
    }

    const payload = validate(issueCertificateSchema, req.body);
    const certificate = await uploadCertificate(payload, req.file, req.user);
    res.status(201).json(certificate);
  }),
);

router.get(
  '/verify/:certificateId',
  asyncHandler(async (req, res) => {
    const result = await verifyCertificateById(req.params.certificateId);
    res.json(result);
  }),
);

router.get(
  '/qrcode/:certificateId',
  asyncHandler(async (req, res) => {
    const { config } = await import('../config.js');
    const QRCode = (await import('qrcode')).default;
    const url = `${config.publicUrl}/verify/${req.params.certificateId}`;
    const qrBuffer = await QRCode.toBuffer(url, { margin: 1, width: 300 });

    res.setHeader('Content-Type', 'image/png');
    res.send(qrBuffer);
  }),
);

router.post(
  '/verify-upload',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw createHttpError(400, 'Please upload a certificate PDF or image');
    }

    const result = await verifyUploadedCertificate(req.file);
    res.json(result);
  }),
);

router.get(
  '/document/:certificateId',
  authenticate,
  asyncHandler(async (req, res) => {
    const certificate = getCertificateDocument(req.params.certificateId);
    const allowed = req.user.role === 'admin' || req.user.id === certificate.studentId;

    if (!allowed) {
      throw createHttpError(403, 'You do not have access to this certificate document');
    }

    const fileBuffer = await fs.readFile(certificate.storagePath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${certificate.documentFileName}"`);
    res.send(fileBuffer);
  }),
);

export default router;
