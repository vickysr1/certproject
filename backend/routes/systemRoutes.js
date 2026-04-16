import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getClassifierSummary } from '../services/ai/cnnClassifier.js';
import { getAdminOverview } from '../services/dashboardService.js';

const router = Router();

router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    res.json({
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      classifier: await getClassifierSummary(),
    });
  }),
);

router.get(
  '/overview',
  authenticate,
  requireRole('admin'),
  asyncHandler(async (_req, res) => {
    res.json(getAdminOverview());
  }),
);

export default router;
