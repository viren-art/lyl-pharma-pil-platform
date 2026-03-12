import { Router } from 'express';
import { ApprovalController } from '../controllers/approval.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.enhanced.middleware';
import { Permission } from '../services/auth/rbac/rbac.service';

const router = Router();
const controller = new ApprovalController();

// POST /api/v1/approvals - Submit approval decision
router.post(
  '/',
  authenticateJWT,
  requirePermission(Permission.SUBMIT_APPROVAL),
  controller.submitApproval
);

// GET /api/v1/pils/:pilId/approval-status - Get approval workflow status
router.get(
  '/pils/:pilId/approval-status',
  authenticateJWT,
  requirePermission(Permission.VIEW_APPROVAL_STATUS),
  controller.getApprovalStatus
);

// POST /api/v1/pils/:pilId/workflow - Create multi-level approval workflow
router.post(
  '/pils/:pilId/workflow',
  authenticateJWT,
  requirePermission(Permission.CREATE_APPROVAL_GATE),
  controller.createWorkflow
);

// GET /api/v1/approvals/pending - Get pending approvals for current user
router.get(
  '/pending',
  authenticateJWT,
  requirePermission(Permission.VIEW_APPROVAL_STATUS),
  controller.getPendingApprovals
);

export default router;