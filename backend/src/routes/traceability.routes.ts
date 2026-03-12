import { Router } from 'express';
import { TraceabilityController } from '../controllers/traceability.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();
const controller = new TraceabilityController();

// GET /api/v1/translations/:translationId/traceability
router.get(
  '/:translationId/traceability',
  authenticateJWT,
  requireRole('Translator', 'Regulatory_Reviewer', 'Approver'),
  (req, res) => controller.getTraceability(req, res)
);

// GET /api/v1/translations/:translationId/traceability/verify
router.get(
  '/:translationId/traceability/verify',
  authenticateJWT,
  requireRole('Regulatory_Reviewer', 'Approver'),
  (req, res) => controller.verifyIntegrity(req, res)
);

// POST /api/v1/translations/:translationId/traceability/export
router.post(
  '/:translationId/traceability/export',
  authenticateJWT,
  requireRole('Regulatory_Reviewer', 'Approver'),
  (req, res) => controller.exportLog(req, res)
);

export default router;