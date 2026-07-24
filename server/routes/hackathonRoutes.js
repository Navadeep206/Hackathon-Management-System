import express from 'express';
import {
  createHackathon,
  getAllHackathons,
  getHackathon,
  updateHackathon,
  deleteHackathon,
} from '../controllers/hackathonController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Apply protect middleware to all hackathon endpoints
router.use(protect);

// CREATE endpoint (Organizer only)
router.post('/', authorize('Organizer'), upload.single('bannerImage'), createHackathon);

// READ ALL endpoint (Admin, Organizer, Participant, Judge - handled by protect)
router.get('/', getAllHackathons);

// READ SINGLE endpoint
router.get('/:id', getHackathon);

// UPDATE endpoint (Organizer owner only)
router.put('/:id', authorize('Organizer'), upload.single('bannerImage'), updateHackathon);

// DELETE endpoint (Organizer owner only)
router.delete('/:id', authorize('Organizer'), deleteHackathon);

export default router;
