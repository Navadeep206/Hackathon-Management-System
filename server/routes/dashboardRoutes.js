import express from 'express';
import {
  getAdminDashboard,
  getOrganizerDashboard,
  getParticipantDashboard,
  getJudgeDashboard,
} from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All dashboard endpoints require authentication
router.use(protect);

// Define dashboard paths with corresponding role checks
router.get('/admin', authorize('Admin'), getAdminDashboard);
router.get('/organizer', authorize('Organizer'), getOrganizerDashboard);
router.get('/participant', authorize('Participant'), getParticipantDashboard);
router.get('/judge', authorize('Judge'), getJudgeDashboard);

export default router;
