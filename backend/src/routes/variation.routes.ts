import { Router } from 'express';
import { VariationController } from '../controllers/variation.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();
const controller = new VariationController();

// POST /api/v1/variations/detect - Generate variation diff
router.post(
  '/detect',
  authenticateJWT,
  requireRole('Regulatory_Reviewer', 'Approver'),
  controller.detectVariation
);

// POST /api/v1/variations/:id/generate-draft - Generate draft PIL
router.post(
  '/:id/generate-draft',
  authenticateJWT,
  requireRole('Regulatory_Reviewer', 'Approver'),
  controller.generateDraft
);

// GET /api/v1/variations/:id - Get variation details
router.get(
  '/:id',
  authenticateJWT,
  controller.getVariation
);

// POST /api/v1/variations/:id/approve - Approve variation
router.post(
  '/:id/approve',
  authenticateJWT,
  requireRole('Regulatory_Reviewer', 'Approver'),
  controller.approveVariation
);

// POST /api/v1/variations/:id/reject - Reject variation
router.post(
  '/:id/reject',
  authenticateJWT,
  requireRole('Regulatory_Reviewer', 'Approver'),
  controller.rejectVariation
);

// GET /api/v1/pils/:pilId/variations - Get variations for PIL
router.get(
  '/pils/:pilId/variations',
  authenticateJWT,
  controller.getVariationsForPIL
);

export default router;