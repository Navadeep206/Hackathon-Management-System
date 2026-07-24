import fs from 'fs';
import mongoose from 'mongoose';
import Submission from '../models/Submission.js';
import Team from '../models/Team.js';
import Hackathon from '../models/Hackathon.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Submit a new project for a team
 * @route   POST /api/submissions
 * @access  Private (Team Leader only)
 */
export const createSubmission = asyncHandler(async (req, res) => {
  // Enforce role check is Participant (handled by route middleware)
  
  // Find team where user is the leader and status is not Disbanded
  const team = await Team.findOne({ leader: req.user._id, status: { $ne: 'Disbanded' } });
  if (!team) {
    res.status(403);
    throw new Error('Forbidden: Only active team leaders can submit project proposals');
  }

  // Check duplicate submission
  const existingSubmission = await Submission.findOne({ team: team._id });
  if (existingSubmission) {
    res.status(400);
    throw new Error('Duplicate submission: Your team has already submitted a project');
  }

  // Fetch Hackathon to verify deadline
  const hackathon = await Hackathon.findById(team.hackathon);
  if (!hackathon) {
    res.status(404);
    throw new Error('Hackathon not found');
  }

  // No submissions after hackathon end date
  if (new Date() > new Date(hackathon.endDate)) {
    res.status(400);
    throw new Error('Submission blocked: Hackathon deadline has passed');
  }

  const {
    projectName,
    problemStatement,
    solution,
    description,
    githubRepository,
    liveDemo,
    techStack,
    demoVideo,
  } = req.body;

  // Validate required fields
  if (!projectName || !problemStatement || !solution || !githubRepository || !techStack) {
    res.status(400);
    throw new Error(
      'Please fill all required fields (projectName, problemStatement, solution, githubRepository, techStack)'
    );
  }

  // Validate GitHub repository URL
  const gitHubRegex = /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/?.*$/i;
  if (!gitHubRegex.test(githubRepository)) {
    res.status(400);
    throw new Error('Invalid GitHub repository URL');
  }

  // Validate optional Live Demo and Video URLs if provided
  const urlRegex = /^(https?:\/\/)/i;
  if (liveDemo && !urlRegex.test(liveDemo)) {
    res.status(400);
    throw new Error('Invalid Live Demo URL. Must start with http:// or https://');
  }
  if (demoVideo && !urlRegex.test(demoVideo)) {
    res.status(400);
    throw new Error('Invalid Demo Video URL. Must start with http:// or https://');
  }

  // Parse techStack
  let techStackArray = [];
  if (Array.isArray(techStack)) {
    techStackArray = techStack;
  } else if (typeof techStack === 'string') {
    techStackArray = techStack
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // Handle uploaded files
  const presentationPDF =
    req.files && req.files.presentationPDF
      ? `/uploads/presentations/${req.files.presentationPDF[0].filename}`
      : '';

  const screenshots =
    req.files && req.files.screenshots
      ? req.files.screenshots.map((file) => `/uploads/screenshots/${file.filename}`)
      : [];

  const submission = await Submission.create({
    team: team._id,
    hackathon: team.hackathon,
    projectName,
    problemStatement,
    solution,
    description: description || '',
    githubRepository,
    liveDemo: liveDemo || '',
    techStack: techStackArray,
    screenshots,
    presentationPDF,
    demoVideo: demoVideo || '',
    status: 'Pending',
    submittedBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Project submitted successfully',
    submission,
  });
});

/**
 * @desc    Get submission details of the logged-in user's team
 * @route   GET /api/submissions/my
 * @access  Private (Team members only)
 */
export const getMySubmission = asyncHandler(async (req, res) => {
  const team = await Team.findOne({
    members: req.user._id,
    status: { $ne: 'Disbanded' },
  });

  if (!team) {
    res.status(404);
    throw new Error('You do not belong to an active team');
  }

  const submission = await Submission.findOne({ team: team._id })
    .populate('team', 'teamName leader members')
    .populate('hackathon', 'title theme mode status endDate')
    .populate('submittedBy', 'name email');

  if (!submission) {
    res.status(404);
    throw new Error('No project submission found for your team');
  }

  res.status(200).json({
    success: true,
    submission,
  });
});

/**
 * @desc    Get detailed project submission by ID
 * @route   GET /api/submissions/:submissionId
 * @access  Private (Team Members, Hackathon Creator Organizers, Admins)
 */
export const getSubmission = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(submissionId)) {
    res.status(400);
    throw new Error('Invalid submission ID');
  }

  const submission = await Submission.findById(submissionId)
    .populate('team')
    .populate('hackathon')
    .populate('submittedBy', 'name email');

  if (!submission) {
    res.status(404);
    throw new Error('Project submission not found');
  }

  // Authorization check: Admins can view; Organizers can view if they created the hackathon;
  // Participants can view if they are members of the team.
  const isMember =
    submission.team &&
    submission.team.members.some((m) => m.toString() === req.user._id.toString());
  const isCreatorOrganizer =
    req.user.role === 'Organizer' &&
    submission.hackathon &&
    submission.hackathon.createdBy.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'Admin';

  if (!isMember && !isCreatorOrganizer && !isAdmin) {
    res.status(403);
    throw new Error('Access denied: You are not authorized to view this project submission');
  }

  res.status(200).json({
    success: true,
    submission,
  });
});

/**
 * @desc    Update a project submission
 * @route   PUT /api/submissions/:submissionId
 * @access  Private (Team Leader owner only)
 */
export const updateSubmission = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(submissionId)) {
    res.status(400);
    throw new Error('Invalid submission ID');
  }

  const submission = await Submission.findById(submissionId).populate('hackathon');
  if (!submission) {
    res.status(404);
    throw new Error('Project submission not found');
  }

  // Check ownership: only the leader who submitted it (or active team leader) can update
  if (submission.submittedBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Forbidden: Only the team leader who submitted the project can edit it');
  }

  // Enforce submission editing allowed only before hackathon deadline
  if (
    submission.hackathon &&
    new Date() > new Date(submission.hackathon.endDate)
  ) {
    res.status(400);
    throw new Error('Cannot edit submission: Hackathon submission deadline has passed');
  }

  const {
    projectName,
    problemStatement,
    solution,
    description,
    githubRepository,
    liveDemo,
    techStack,
    demoVideo,
  } = req.body;

  if (projectName !== undefined) submission.projectName = projectName;
  if (problemStatement !== undefined) submission.problemStatement = problemStatement;
  if (solution !== undefined) submission.solution = solution;
  if (description !== undefined) submission.description = description;

  if (githubRepository !== undefined) {
    const gitHubRegex = /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/?.*$/i;
    if (!gitHubRegex.test(githubRepository)) {
      res.status(400);
      throw new Error('Invalid GitHub repository URL');
    }
    submission.githubRepository = githubRepository;
  }

  const urlRegex = /^(https?:\/\/)/i;
  if (liveDemo !== undefined) {
    if (liveDemo && !urlRegex.test(liveDemo)) {
      res.status(400);
      throw new Error('Invalid Live Demo URL. Must start with http:// or https://');
    }
    submission.liveDemo = liveDemo;
  }

  if (demoVideo !== undefined) {
    if (demoVideo && !urlRegex.test(demoVideo)) {
      res.status(400);
      throw new Error('Invalid Demo Video URL. Must start with http:// or https://');
    }
    submission.demoVideo = demoVideo;
  }

  if (techStack !== undefined) {
    let techStackArray = [];
    if (Array.isArray(techStack)) {
      techStackArray = techStack;
    } else if (typeof techStack === 'string') {
      techStackArray = techStack
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    submission.techStack = techStackArray;
  }

  // Process uploaded files replacement
  if (req.files) {
    if (req.files.presentationPDF) {
      // Unlink old presentation PDF if it exists
      if (
        submission.presentationPDF &&
        fs.existsSync(submission.presentationPDF.replace(/^\//, ''))
      ) {
        try {
          fs.unlinkSync(submission.presentationPDF.replace(/^\//, ''));
        } catch (err) {
          console.error('Error unlinking old presentation PDF:', err.message);
        }
      }
      submission.presentationPDF = `/uploads/presentations/${req.files.presentationPDF[0].filename}`;
    }

    if (req.files.screenshots && req.files.screenshots.length > 0) {
      // Unlink old screenshots if they exist
      submission.screenshots.forEach((screenshot) => {
        if (fs.existsSync(screenshot.replace(/^\//, ''))) {
          try {
            fs.unlinkSync(screenshot.replace(/^\//, ''));
          } catch (err) {
            console.error('Error unlinking old screenshot:', err.message);
          }
        }
      });
      submission.screenshots = req.files.screenshots.map(
        (file) => `/uploads/screenshots/${file.filename}`
      );
    }
  }

  const updatedSubmission = await submission.save();

  res.status(200).json({
    success: true,
    message: 'Project submission updated successfully',
    submission: updatedSubmission,
  });
});

/**
 * @desc    Delete a project submission
 * @route   DELETE /api/submissions/:submissionId
 * @access  Private (Team Leader owner only)
 */
export const deleteSubmission = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(submissionId)) {
    res.status(400);
    throw new Error('Invalid submission ID');
  }

  const submission = await Submission.findById(submissionId).populate('hackathon');
  if (!submission) {
    res.status(404);
    throw new Error('Project submission not found');
  }

  // Check ownership
  if (submission.submittedBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Forbidden: Only the team leader can delete this submission');
  }

  // Enforce delete before deadline
  if (
    submission.hackathon &&
    new Date() > new Date(submission.hackathon.endDate)
  ) {
    res.status(400);
    throw new Error('Cannot delete submission: Hackathon submission deadline has passed');
  }

  // Clean up local presentation file
  if (
    submission.presentationPDF &&
    fs.existsSync(submission.presentationPDF.replace(/^\//, ''))
  ) {
    try {
      fs.unlinkSync(submission.presentationPDF.replace(/^\//, ''));
    } catch (err) {
      console.error('Error deleting presentation PDF:', err.message);
    }
  }

  // Clean up local screenshot files
  submission.screenshots.forEach((screenshot) => {
    if (fs.existsSync(screenshot.replace(/^\//, ''))) {
      try {
        fs.unlinkSync(screenshot.replace(/^\//, ''));
      } catch (err) {
        console.error('Error deleting screenshot:', err.message);
      }
    }
  });

  await Submission.deleteOne({ _id: submission._id });

  res.status(200).json({
    success: true,
    message: 'Project submission deleted successfully',
  });
});
