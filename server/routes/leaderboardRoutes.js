import express from 'express';
import {
  generateLeaderboard,
  publishResults,
  getLeaderboard,
  getWinners,
} from '../controllers/leaderboardController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All leaderboard routes require authentication
router.use(protect);

// Generation and publication are restricted to Organizer or Admin roles
router.post('/:hackathonId/generate', authorize('Organizer', 'Admin'), generateLeaderboard);
router.put('/:hackathonId/publish', authorize('Organizer', 'Admin'), publishResults);

// Viewing the leaderboard and winners is accessible by authenticated users (with role checks done in controllers)
router.get('/:hackathonId', getLeaderboard);
router.get('/:hackathonId/winners', getWinners);

export default router;
