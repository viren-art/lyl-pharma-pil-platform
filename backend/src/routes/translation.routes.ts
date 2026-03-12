import { Router } from 'express';
import { TranslationController } from '../controllers/translation.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();
const controller = new TranslationController();

// POST /api/v1/pils/:id/translate
router.post(
  '/:id/translate',
  authenticateJWT,
  requireRole('Translator', 'Regulatory_Reviewer', 'Admin'),
  (req, res) => controller.translatePIL(req, res)
);

// GET /api/v1/translations/:id/traceability
router.get(
  '/:id/traceability',
  authenticateJWT,
  (req, res) => controller.getTraceability(req, res)
);

export default router;