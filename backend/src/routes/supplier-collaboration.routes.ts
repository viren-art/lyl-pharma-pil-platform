import { Router } from 'express';
import multer from 'multer';
import { SupplierCollaborationController } from '../controllers/supplier-collaboration.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requirePermission, requirePILAccess } from '../middleware/rbac.enhanced.middleware';
import { Permission } from '../services/auth/rbac/rbac.service';

const router = Router();
const controller = new SupplierCollaborationController();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// POST /api/v1/supplier/revisions/:revisionRoundId/upload - Upload artwork
router.post(
  '/revisions/:revisionRoundId/upload',
  authenticateJWT,
  requirePermission(Permission.ARTWORK_UPLOAD),
  upload.single('artwork'),
  controller.uploadArtwork
);

// POST /api/v1/supplier/revisions/:revisionRoundId/comments - Add comment
router.post(
  '/revisions/:revisionRoundId/comments',
  authenticateJWT,
  requirePermission(Permission.ARTWORK_COMMENT),
  controller.addComment
);

// GET /api/v1/supplier/revisions/:revisionRoundId - Get revision details
router.get(
  '/revisions/:revisionRoundId',
  authenticateJWT,
  requirePermission(Permission.ARTWORK_VIEW),
  controller.getRevisionDetails
);

// GET /api/v1/supplier/:supplierId/revisions - Get supplier's revisions
router.get(
  '/:supplierId/revisions',
  authenticateJWT,
  requirePermission(Permission.ARTWORK_VIEW),
  controller.getSupplierRevisions
);

// POST /api/v1/supplier/revisions/:artworkRevisionId/approve - Approve artwork
router.post(
  '/revisions/:artworkRevisionId/approve',
  authenticateJWT,
  requirePermission(Permission.ARTWORK_APPROVE),
  controller.approveArtwork
);

// POST /api/v1/supplier/revisions/:artworkRevisionId/reject - Reject artwork
router.post(
  '/revisions/:artworkRevisionId/reject',
  authenticateJWT,
  requirePermission(Permission.ARTWORK_APPROVE),
  controller.rejectArtwork
);

// GET /api/v1/supplier/:supplierId/performance - Get performance metrics
router.get(
  '/:supplierId/performance',
  authenticateJWT,
  requirePermission(Permission.SUPPLIER_PERFORMANCE_VIEW),
  controller.getPerformanceMetrics
);

// GET /api/v1/supplier/rankings - Get supplier rankings
router.get(
  '/rankings',
  authenticateJWT,
  requirePermission(Permission.SUPPLIER_PERFORMANCE_VIEW),
  controller.getSupplierRankings
);

export default router;