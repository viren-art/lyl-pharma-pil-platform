import { Router } from 'express';
import { MultiLanguageTranslationController } from '../controllers/multi-language-translation.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();
const controller = new MultiLanguageTranslationController();

// POST /api/v1/pils/:id/translate/thai - Translate to Thai with FDA Thailand validation
router.post(
  '/:id/translate/thai',
  authenticateJWT,
  requireRole('Translator', 'Regulatory_Reviewer'),
  (req, res) => controller.translateToThai(req, res)
);

// POST /api/v1/pils/:id/translate/vietnamese - Translate to Vietnamese with DAV validation
router.post(
  '/:id/translate/vietnamese',
  authenticateJWT,
  requireRole('Translator', 'Regulatory_Reviewer'),
  (req, res) => controller.translateToVietnamese(req, res)
);

// GET /api/v1/translations/:id/validation - Get validation results
router.get(
  '/:id/validation',
  authenticateJWT,
  requireRole('Translator', 'Regulatory_Reviewer', 'Approver'),
  (req, res) => controller.getValidationResults(req, res)
);

export default router;