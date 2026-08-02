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

// CREATE endpoint (Organizer only)
router.post('/', protect, authorize('Organizer'), upload.single('bannerImage'), createHackathon);

// READ ALL endpoint (Publicly readable)
router.get('/', getAllHackathons);

// READ SINGLE endpoint (Publicly readable)
router.get('/:id', getHackathon);

// UPDATE endpoint (Organizer owner only)
router.put('/:id', protect, authorize('Organizer'), upload.single('bannerImage'), updateHackathon);

// DELETE endpoint (Organizer owner only)
router.delete('/:id', protect, authorize('Organizer'), deleteHackathon);

export default router;
