import { Router } from 'express';
import { SubmissionPackageController } from '../controllers/submission-package.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();
const controller = new SubmissionPackageController();

// GET /api/v1/pils/:id/submission-package - Generate submission package
router.get(
  '/:id/submission-package',
  authenticateJWT,
  requireRole('Regulatory_Reviewer', 'Approver'),
  controller.generatePackage
);

export default router;