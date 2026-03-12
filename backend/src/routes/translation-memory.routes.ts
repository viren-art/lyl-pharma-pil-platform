import { Router } from 'express';
import { TranslationMemoryController } from '../controllers/translation-memory.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();
const controller = new TranslationMemoryController();

// GET /api/v1/translation-memory/suggestions - Get term suggestions
router.get(
  '/suggestions',
  authenticateJWT,
  controller.getTermSuggestions.bind(controller)
);

// POST /api/v1/translation-memory/terms - Submit new term
router.post(
  '/terms',
  authenticateJWT,
  requireRole('Translator', 'Regulatory_Reviewer'),
  controller.submitTerm.bind(controller)
);

// POST /api/v1/translation-memory/terms/:id/review - Review term
router.post(
  '/terms/:id/review',
  authenticateJWT,
  requireRole('Regulatory_Reviewer', 'Approver'),
  controller.reviewTerm.bind(controller)
);

// POST /api/v1/translation-memory/terms/:id/override - Override term
router.post(
  '/terms/:id/override',
  authenticateJWT,
  requireRole('Regulatory_Reviewer', 'Approver'),
  controller.overrideTerm.bind(controller)
);

// GET /api/v1/translation-memory/pending - Get pending approvals
router.get(
  '/pending',
  authenticateJWT,
  requireRole('Regulatory_Reviewer', 'Approver'),
  controller.getPendingApprovals.bind(controller)
);

// GET /api/v1/translation-memory/search - Search terms
router.get(
  '/search',
  authenticateJWT,
  controller.searchTerms.bind(controller)
);

// GET /api/v1/translation-memory/consistency-report - Get consistency report
router.get(
  '/consistency-report',
  authenticateJWT,
  requireRole('Regulatory_Reviewer', 'Approver'),
  controller.getConsistencyReport.bind(controller)
);

export default router;