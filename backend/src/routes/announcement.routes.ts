import { Router } from 'express';
import { AnnouncementController } from '../controllers/announcement.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();
const controller = new AnnouncementController();

// GET /api/v1/announcements - List announcements with filtering
router.get(
  '/',
  authenticateJWT,
  requireRole('Regulatory_Reviewer', 'Approver', 'Admin'),
  (req, res) => controller.listAnnouncements(req, res)
);

// POST /api/v1/announcements/webhook - Handle webhook from regulatory authority
router.post('/webhook', (req, res) => controller.handleWebhook(req, res));

// POST /api/v1/announcements/:id/parse - Manually trigger announcement parsing
router.post(
  '/:id/parse',
  authenticateJWT,
  requireRole('Regulatory_Reviewer', 'Admin'),
  (req, res) => controller.parseAnnouncement(req, res)
);

// GET /api/v1/announcements/no-pils - Get announcements with no affected PILs
router.get(
  '/no-pils',
  authenticateJWT,
  requireRole('Regulatory_Reviewer', 'Admin'),
  (req, res) => controller.getAnnouncementsWithNoPILs(req, res)
);

export default router;