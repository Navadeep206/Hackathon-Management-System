import express from 'express';
import mongoose from 'mongoose';
import authRoutes from './authRoutes.js';
import hackathonRoutes from './hackathonRoutes.js';

const router = express.Router();

// Mount Auth routes
router.use('/auth', authRoutes);

// Mount Hackathon routes
router.use('/hackathons', hackathonRoutes);

/**
 * @route   GET /api
 * @desc    Base API index endpoint
 * @access  Public
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Hackathon Management System API - Base Endpoint"
  });
});

/**
 * @route   GET /api/health
 * @desc    Health Check Endpoint to verify server and database connectivity
 * @access  Public
 */
router.get('/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  
  res.status(200).json({
    success: true,
    message: "Server running successfully",
    database: isConnected ? "Connected" : "Disconnected"
  });
});

export default router;
