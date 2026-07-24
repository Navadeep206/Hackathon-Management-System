import express from 'express';
import {
  registerHackathon,
  cancelRegistration,
  getMyRegistrations,
  getHackathonRegistrations,
  updateRegistrationStatus,
} from '../controllers/registrationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Apply protect middleware globally to registrations routes
router.use(protect);

// Participant routes
router.post('/:hackathonId', authorize('Participant'), registerHackathon);
router.get('/my', authorize('Participant'), getMyRegistrations);
router.delete('/:registrationId', authorize('Participant'), cancelRegistration);

// Admin / Organizer read routes
router.get(
  '/hackathon/:hackathonId',
  authorize('Admin', 'Organizer'),
  getHackathonRegistrations
);

// Organizer write routes
router.put('/:registrationId/status', authorize('Organizer'), updateRegistrationStatus);

export default router;
