import express from 'express';
import {
  submitReview,
  updateReview,
  getSubmissionReviews,
  getMyReviews,
} from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', authorize('Judge'), submitReview);
router.get('/my', authorize('Judge'), getMyReviews);
router.get('/submission/:submissionId', getSubmissionReviews);
router.put('/:reviewId', authorize('Judge'), updateReview);

export default router;
