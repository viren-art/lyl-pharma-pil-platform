import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();
const controller = new AuditController();

// GET /api/v1/audit/logs - Retrieve audit logs with filtering
router.get(
  '/logs',
  authenticateJWT,
  requireRole('Regulatory_Reviewer', 'Approver', 'Admin'),
  (req, res) => controller.getAuditLogs(req, res)
);

// GET /api/v1/audit/pil/:pilId/lifecycle - Get complete PIL lifecycle report
router.get(
  '/pil/:pilId/lifecycle',
  authenticateJWT,
  requireRole('Regulatory_Reviewer', 'Approver', 'Admin'),
  (req, res) => controller.getPILLifecycle(req, res)
);

// POST /api/v1/audit/export - Export audit trail to S3
router.post(
  '/export',
  authenticateJWT,
  requireRole('Regulatory_Reviewer', 'Admin'),
  (req, res) => controller.exportAuditTrail(req, res)
);

// POST /api/v1/audit/verify - Verify audit chain integrity
router.post(
  '/verify',
  authenticateJWT,
  requireRole('Regulatory_Reviewer', 'Approver', 'Admin'),
  (req, res) => controller.verifyIntegrity(req, res)
);

export default router;