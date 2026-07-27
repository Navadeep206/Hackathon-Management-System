import express from 'express';
import {
  createSubmission,
  getMySubmission,
  getAllSubmissions,
  getSubmission,
  updateSubmission,
  deleteSubmission,
  updateSubmissionStatus,
} from '../controllers/submissionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { uploadFields } from '../middleware/uploadSubmissionMiddleware.js';

const router = express.Router();

// Apply protect middleware globally to submission endpoints
router.use(protect);

// CREATE, GET ALL and GET MY routes
router.get('/', getAllSubmissions);
router.post('/', authorize('Participant'), uploadFields, createSubmission);
router.get('/my', getMySubmission);

// GET details route
router.get('/:submissionId', getSubmission);

// EDIT and DELETE routes (Team leader only)
router.put('/:submissionId', authorize('Participant'), uploadFields, updateSubmission);
router.put('/:submissionId/status', authorize('Organizer', 'Admin'), updateSubmissionStatus);
router.delete('/:submissionId', authorize('Participant'), deleteSubmission);

export default router;
