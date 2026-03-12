import { Router } from 'express';
import { QualityValidationController } from '../controllers/quality-validation.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();
const controller = new QualityValidationController();

// POST /api/v1/translations/:id/validate - Validate translation
router.post(
  '/:id/validate',
  authenticateJWT,
  requireRole('Translator', 'Regulatory_Reviewer'),
  controller.validateTranslation.bind(controller)
);

// POST /api/v1/translations/validate-section - Validate section
router.post(
  '/validate-section',
  authenticateJWT,
  requireRole('Translator', 'Regulatory_Reviewer'),
  controller.validateSection.bind(controller)
);

export default router;