import express from 'express';
import { getAllUsers, toggleBlockUser } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Apply protect and admin authorization to all user routes
router.use(protect);
router.use(authorize('Admin'));

router.get('/', getAllUsers);
router.put('/:userId/block', toggleBlockUser);

export default router;
