import { Router } from 'express';
import { ValidationController } from '../controllers/validation.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.enhanced.middleware';
import { Permission } from '../services/auth/rbac/rbac.service';

const router = Router();
const controller = new ValidationController();

// POST /api/v1/validation/reports - Generate AI validation report
router.post(
  '/reports',
  authenticateJWT,
  requirePermission(Permission.VIEW_AI_VALIDATION),
  controller.generateReport
);

// GET /api/v1/validation/models/:modelId/compliance - Get compliance report
router.get(
  '/models/:modelId/compliance',
  authenticateJWT,
  requirePermission(Permission.VIEW_AI_VALIDATION),
  controller.getComplianceReport
);

// GET /api/v1/validation/models/active - Get active model
router.get(
  '/models/active',
  authenticateJWT,
  requirePermission(Permission.VIEW_AI_VALIDATION),
  controller.getActiveModel
);

// GET /api/v1/validation/models - List all models
router.get(
  '/models',
  authenticateJWT,
  requirePermission(Permission.VIEW_AI_VALIDATION),
  controller.listModels
);

// POST /api/v1/validation/models/:modelId/update-statistics - Update statistics
router.post(
  '/models/:modelId/update-statistics',
  authenticateJWT,
  requirePermission(Permission.MANAGE_AI_VALIDATION),
  controller.updateStatistics
);

export default router;