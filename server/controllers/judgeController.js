import mongoose from 'mongoose';
import JudgeAssignment from '../models/JudgeAssignment.js';
import Hackathon from '../models/Hackathon.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Assign a judge to a hackathon
 * @route   POST /api/judges/assign
 * @access  Private (Organizer only)
 */
export const assignJudge = asyncHandler(async (req, res) => {
  const { judgeId, hackathonId } = req.body;

  if (!judgeId || !hackathonId) {
    res.status(400);
    throw new Error('Please enter judgeId and hackathonId');
  }

  if (!mongoose.Types.ObjectId.isValid(judgeId) || !mongoose.Types.ObjectId.isValid(hackathonId)) {
    res.status(400);
    throw new Error('Invalid parameter IDs');
  }

  // Verify Hackathon exists & belongs to Organizer
  const hackathon = await Hackathon.findById(hackathonId);
  if (!hackathon) {
    res.status(404);
    throw new Error('Hackathon not found');
  }

  if (hackathon.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Forbidden: Only the hackathon creator can assign judges');
  }

  // Verify User to assign is a Judge
  const judgeUser = await User.findById(judgeId);
  if (!judgeUser) {
    res.status(404);
    throw new Error('User not found');
  }
  if (judgeUser.role !== 'Judge') {
    res.status(400);
    throw new Error('Selected user does not have the Judge role');
  }

  // Check duplicate assignment
  const existing = await JudgeAssignment.findOne({ judge: judgeId, hackathon: hackathonId });
  if (existing) {
    res.status(400);
    throw new Error('Judge is already assigned to this hackathon');
  }

  const assignment = await JudgeAssignment.create({
    judge: judgeId,
    hackathon: hackathonId,
    assignedBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Judge assigned successfully',
    assignment,
  });
});

/**
 * @desc    Remove a judge from a hackathon
 * @route   DELETE /api/judges/:assignmentId
 * @access  Private (Organizer only)
 */
export const removeJudge = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
    res.status(400);
    throw new Error('Invalid assignment ID');
  }

  const assignment = await JudgeAssignment.findById(assignmentId).populate('hackathon');
  if (!assignment) {
    res.status(404);
    throw new Error('Judge assignment not found');
  }

  // Check ownership
  if (assignment.hackathon.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Forbidden: Only the hackathon creator can remove judges');
  }

  await JudgeAssignment.deleteOne({ _id: assignmentId });

  res.status(200).json({
    success: true,
    message: 'Judge assignment removed successfully',
  });
});

/**
 * @desc    Get all assigned hackathons for a judge
 * @route   GET /api/judges/hackathons/my
 * @access  Private (Judge only)
 */
export const getAssignedHackathons = asyncHandler(async (req, res) => {
  const assignments = await JudgeAssignment.find({ judge: req.user._id })
    .populate('hackathon')
    .populate('assignedBy', 'name email');

  res.status(200).json({
    success: true,
    count: assignments.length,
    assignments,
  });
});

/**
 * @desc    Get all judges assigned to a hackathon
 * @route   GET /api/judges/hackathon/:hackathonId
 * @access  Private (Organizer/Admin only)
 */
export const getHackathonJudges = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(hackathonId)) {
    res.status(400);
    throw new Error('Invalid hackathon ID');
  }

  const hackathon = await Hackathon.findById(hackathonId);
  if (!hackathon) {
    res.status(404);
    throw new Error('Hackathon not found');
  }

  // Restrict to hackathon creator Organizer or Admin
  if (
    req.user.role !== 'Admin' &&
    hackathon.createdBy.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Forbidden: You are not authorized to view judge assignments for this hackathon');
  }

  const assignments = await JudgeAssignment.find({ hackathon: hackathonId })
    .populate('judge', 'name email role')
    .populate('assignedBy', 'name email');

  res.status(200).json({
    success: true,
    count: assignments.length,
    assignments,
  });
});
