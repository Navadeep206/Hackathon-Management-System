import express from 'express';
import {
  createTeam,
  getMyTeam,
  getAllTeams,
  getTeam,
  updateTeam,
  deleteTeam,
  joinTeam,
  leaveTeam,
  removeMember,
  transferLeadership,
  getEligibleParticipants,
  addMember,
} from '../controllers/teamController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Apply protect middleware globally to team endpoints
router.use(protect);

// CREATE, READ ALL and READ MY routes
router.get('/', getAllTeams);
router.post('/', authorize('Participant'), createTeam);
router.get('/my', getMyTeam);

// GET, UPDATE, DELETE routes
router.get('/:teamId', getTeam);
router.put('/:teamId', updateTeam);
router.delete('/:teamId', deleteTeam);

// JOIN and LEAVE routes
router.post('/join', authorize('Participant'), joinTeam);
router.post('/:teamId/join', authorize('Participant'), joinTeam);
router.delete('/:teamId/leave', authorize('Participant'), leaveTeam);

// LEADER operations
router.put('/:teamId/transfer-leadership', authorize('Participant'), transferLeadership);
router.delete('/:teamId/remove-member/:memberId', authorize('Participant'), removeMember);
router.get('/:teamId/eligible-participants', authorize('Participant'), getEligibleParticipants);
router.post('/:teamId/add-member', authorize('Participant'), addMember);

export default router;
