import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Submission from '../models/Submission.js';
import JudgeAssignment from '../models/JudgeAssignment.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Submit a review for a project submission
 * @route   POST /api/reviews
 * @access  Private (Judge only)
 */
export const submitReview = asyncHandler(async (req, res) => {
  const {
    submissionId,
    innovation,
    technicalComplexity,
    userInterface,
    functionality,
    scalability,
    documentation,
    presentation,
    feedback,
    status,
  } = req.body;

  // Validation
  if (
    !submissionId ||
    innovation === undefined ||
    technicalComplexity === undefined ||
    userInterface === undefined ||
    functionality === undefined ||
    scalability === undefined ||
    documentation === undefined ||
    presentation === undefined ||
    !feedback
  ) {
    res.status(400);
    throw new Error('Please fill all required evaluation fields');
  }

  if (!mongoose.Types.ObjectId.isValid(submissionId)) {
    res.status(400);
    throw new Error('Invalid submission ID');
  }

  const submission = await Submission.findById(submissionId);
  if (!submission) {
    res.status(404);
    throw new Error('Submission not found');
  }

  // Validate Judge is assigned to this hackathon
  const assigned = await JudgeAssignment.findOne({
    judge: req.user._id,
    hackathon: submission.hackathon,
  });

  if (!assigned) {
    res.status(403);
    throw new Error('Forbidden: You are not assigned to evaluate this hackathon');
  }

  // Validate Judge has not already reviewed this submission
  const duplicate = await Review.findOne({
    judge: req.user._id,
    submission: submissionId,
  });

  if (duplicate) {
    res.status(400);
    throw new Error('Duplicate review: You have already evaluated this submission');
  }

  const review = await Review.create({
    submission: submissionId,
    hackathon: submission.hackathon,
    judge: req.user._id,
    innovation,
    technicalComplexity,
    userInterface,
    functionality,
    scalability,
    documentation,
    presentation,
    feedback,
    status: status || 'Pending',
  });

  res.status(201).json({
    success: true,
    message: 'Evaluation review submitted successfully',
    review,
  });
});

/**
 * @desc    Update an evaluation review
 * @route   PUT /api/reviews/:reviewId
 * @access  Private (Judge owner only)
 */
export const updateReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const {
    innovation,
    technicalComplexity,
    userInterface,
    functionality,
    scalability,
    documentation,
    presentation,
    feedback,
    status,
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    res.status(400);
    throw new Error('Invalid review ID');
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    res.status(404);
    throw new Error('Evaluation review not found');
  }

  // Verify Ownership
  if (review.judge.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Forbidden: You are not authorized to update this review');
  }

  // Verify review can be edited only if it is Pending
  if (review.status === 'Completed') {
    res.status(400);
    throw new Error('Cannot edit review: Final review has already been submitted');
  }

  if (innovation !== undefined) review.innovation = innovation;
  if (technicalComplexity !== undefined) review.technicalComplexity = technicalComplexity;
  if (userInterface !== undefined) review.userInterface = userInterface;
  if (functionality !== undefined) review.functionality = functionality;
  if (scalability !== undefined) review.scalability = scalability;
  if (documentation !== undefined) review.documentation = documentation;
  if (presentation !== undefined) review.presentation = presentation;
  if (feedback !== undefined) review.feedback = feedback;
  if (status !== undefined) review.status = status;

  const updatedReview = await review.save();

  res.status(200).json({
    success: true,
    message: 'Evaluation review updated successfully',
    review: updatedReview,
  });
});

/**
 * @desc    Get all evaluation reviews for a submission
 * @route   GET /api/reviews/submission/:submissionId
 * @access  Private (Admins, Hackathon Organizers, Judges, Team Members after results published)
 */
export const getSubmissionReviews = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(submissionId)) {
    res.status(400);
    throw new Error('Invalid submission ID');
  }

  const submission = await Submission.findById(submissionId)
    .populate('team')
    .populate('hackathon');

  if (!submission) {
    res.status(404);
    throw new Error('Project submission not found');
  }

  const isAdmin = req.user.role === 'Admin';
  const isOrganizer =
    req.user.role === 'Organizer' &&
    submission.hackathon &&
    submission.hackathon.createdBy.toString() === req.user._id.toString();
  const isJudge = req.user.role === 'Judge';
  
  const isTeamMember =
    submission.team &&
    submission.team.members.some((m) => m.toString() === req.user._id.toString());

  let query = { submission: submissionId };

  if (isAdmin || isOrganizer) {
    // Access allowed, fetch all reviews
  } else if (isJudge) {
    // Only retrieve own review
    query.judge = req.user._id;
  } else if (isTeamMember) {
    // Participants can view reviews for their team only after hackathon status is Completed
    if (submission.hackathon && submission.hackathon.status !== 'Completed') {
      res.status(403);
      throw new Error(
        'Access denied: Reviews are only visible to participants after the hackathon results are published (Completed)'
      );
    }
  } else {
    res.status(403);
    throw new Error('Access denied: You are not authorized to view reviews for this submission');
  }

  const { page = 1, limit = 10 } = req.query;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.max(1, parseInt(limit) || 10);
  const skip = (pageNum - 1) * limitNum;

  const totalRecords = await Review.countDocuments(query);
  const reviews = await Review.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .populate('judge', 'name email')
    .populate('submission', 'projectName');

  res.status(200).json({
    success: true,
    page: pageNum,
    totalPages: Math.ceil(totalRecords / limitNum),
    totalRecords,
    count: reviews.length,
    total: totalRecords,
    pages: Math.ceil(totalRecords / limitNum),
    reviews,
  });
});

/**
 * @desc    Get all evaluation reviews submitted by the current Judge
 * @route   GET /api/reviews/my
 * @access  Private (Judge only)
 */
export const getMyReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.max(1, parseInt(limit) || 10);
  const skip = (pageNum - 1) * limitNum;

  const queryObj = { judge: req.user._id };

  const totalRecords = await Review.countDocuments(queryObj);
  const reviews = await Review.find(queryObj)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .populate('submission', 'projectName')
    .populate('hackathon', 'title theme');

  res.status(200).json({
    success: true,
    page: pageNum,
    totalPages: Math.ceil(totalRecords / limitNum),
    totalRecords,
    count: reviews.length,
    total: totalRecords,
    pages: Math.ceil(totalRecords / limitNum),
    reviews,
  });
});
