import express from 'express';
import {
  assignJudge,
  removeJudge,
  getAssignedHackathons,
  getHackathonJudges,
} from '../controllers/judgeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/assign', authorize('Organizer'), assignJudge);
router.get('/hackathon/:hackathonId', authorize('Organizer', 'Admin'), getHackathonJudges);
router.delete('/:assignmentId', authorize('Organizer'), removeJudge);
router.get('/hackathons/my', authorize('Judge'), getAssignedHackathons);

export default router;
