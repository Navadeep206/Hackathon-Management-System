import mongoose from 'mongoose';
import Leaderboard from '../models/Leaderboard.js';
import Hackathon from '../models/Hackathon.js';
import Submission from '../models/Submission.js';
import Review from '../models/Review.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Generate leaderboard for a hackathon
 * @route   POST /api/leaderboard/:hackathonId/generate
 * @access  Private (Organizer of the hackathon, Admin)
 */
export const generateLeaderboard = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(hackathonId)) {
    res.status(400);
    throw new Error('Invalid hackathon ID');
  }

  // 1. Check if Hackathon exists
  const hackathon = await Hackathon.findById(hackathonId);
  if (!hackathon) {
    res.status(404);
    throw new Error('Hackathon not found');
  }

  // 2. Verify Authorization (Organizer creator or Admin)
  const isAdmin = req.user.role === 'Admin';
  const isOrganizerCreator =
    req.user.role === 'Organizer' &&
    hackathon.createdBy.toString() === req.user._id.toString();

  if (!isAdmin && !isOrganizerCreator) {
    res.status(403);
    throw new Error('Forbidden: Only the hackathon creator can generate the leaderboard');
  }

  // 3. Validate Leaderboard not already generated
  const existingLeaderboard = await Leaderboard.findOne({ hackathon: hackathonId });
  if (existingLeaderboard) {
    res.status(400);
    throw new Error('Leaderboard has already been generated for this hackathon');
  }

  // 4. Validate Submissions exist
  const submissions = await Submission.find({ hackathon: hackathonId });
  if (!submissions || submissions.length === 0) {
    res.status(400);
    throw new Error('Missing reviews: No submissions found to evaluate');
  }

  // 5. Validate Reviews exist
  const reviews = await Review.find({ hackathon: hackathonId });
  if (!reviews || reviews.length === 0) {
    res.status(400);
    throw new Error('Missing reviews: No reviews have been submitted for this hackathon');
  }

  // 6. Validate all reviews are Completed (not Pending)
  const pendingReview = reviews.find((r) => r.status === 'Pending');
  if (pendingReview) {
    res.status(400);
    throw new Error('Reviews not completed: Some reviews are still pending evaluation');
  }

  // 7. Validate every submission has at least one completed review
  for (const sub of submissions) {
    const subReviews = reviews.filter((r) => r.submission.toString() === sub._id.toString());
    if (subReviews.length === 0) {
      res.status(400);
      throw new Error(`Reviews not completed: Project submission "${sub.projectName}" has not been evaluated`);
    }
  }

  // 8. Calculate scores & sort teams
  const teamScores = submissions.map((sub) => {
    const subReviews = reviews.filter((r) => r.submission.toString() === sub._id.toString());
    
    // Final score is the average of totalScore of all reviews
    const totalScoreSum = subReviews.reduce((sum, r) => sum + r.totalScore, 0);
    const averageScore = Number((totalScoreSum / subReviews.length).toFixed(2));

    // Innovation score is the average of innovation scores
    const innovationSum = subReviews.reduce((sum, r) => sum + r.innovation, 0);
    const averageInnovation = Number((innovationSum / subReviews.length).toFixed(2));

    return {
      submissionId: sub._id,
      teamId: sub.team,
      averageScore,
      averageInnovation,
      submittedAt: sub.submittedAt || sub.createdAt,
    };
  });

  // Sort logic: Higher Score -> Higher Innovation Score -> Earlier Submission Time
  teamScores.sort((a, b) => {
    if (b.averageScore !== a.averageScore) {
      return b.averageScore - a.averageScore;
    }
    if (b.averageInnovation !== a.averageInnovation) {
      return b.averageInnovation - a.averageInnovation;
    }
    return new Date(a.submittedAt) - new Date(b.submittedAt);
  });

  // 9. Assign ranks and save leaderboard documents
  const leaderboardDocs = [];
  for (let i = 0; i < teamScores.length; i++) {
    const item = teamScores[i];
    const rank = i + 1;
    
    let position = '';
    let isWinner = false;

    if (rank === 1) {
      position = '1st Place';
      isWinner = true;
    } else if (rank === 2) {
      position = '2nd Place';
      isWinner = true;
    } else if (rank === 3) {
      position = '3rd Place';
      isWinner = true;
    }

    const leaderboardEntry = await Leaderboard.create({
      hackathon: hackathonId,
      team: item.teamId,
      submission: item.submissionId,
      averageScore: item.averageScore,
      rank,
      position,
      isWinner,
      published: false,
    });

    leaderboardDocs.push(leaderboardEntry);
  }

  // Retrieve populated entries to return
  const populatedLeaderboard = await Leaderboard.find({ hackathon: hackathonId })
    .sort({ rank: 1 })
    .populate('team', 'teamName')
    .populate('submission', 'projectName');

  // Format response mapping
  const responseData = populatedLeaderboard.map((item) => ({
    rank: item.rank,
    team: item.team?.teamName || 'Deleted Team',
    project: item.submission?.projectName || 'Deleted Project',
    score: item.averageScore,
    position: item.position,
  }));

  res.status(201).json({
    success: true,
    message: 'Leaderboard generated successfully',
    leaderboard: responseData,
  });
});

/**
 * @desc    Publish results and announce winners for a hackathon
 * @route   PUT /api/leaderboard/:hackathonId/publish
 * @access  Private (Organizer of the hackathon, Admin)
 */
export const publishResults = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(hackathonId)) {
    res.status(400);
    throw new Error('Invalid hackathon ID');
  }

  // 1. Check if Hackathon exists
  const hackathon = await Hackathon.findById(hackathonId);
  if (!hackathon) {
    res.status(404);
    throw new Error('Hackathon not found');
  }

  // 2. Verify Authorization (Organizer creator or Admin)
  const isAdmin = req.user.role === 'Admin';
  const isOrganizerCreator =
    req.user.role === 'Organizer' &&
    hackathon.createdBy.toString() === req.user._id.toString();

  if (!isAdmin && !isOrganizerCreator) {
    res.status(403);
    throw new Error('Forbidden: Only the hackathon creator can publish results');
  }

  // 3. Find leaderboard documents
  const leaderboardEntries = await Leaderboard.find({ hackathon: hackathonId });
  if (!leaderboardEntries || leaderboardEntries.length === 0) {
    res.status(404);
    throw new Error('Leaderboard not found: Generate leaderboard before publishing');
  }

  // 4. Validate not already published
  if (leaderboardEntries[0].published) {
    res.status(400);
    throw new Error('Results have already been published');
  }

  // 5. Update leaderboard entries as published
  await Leaderboard.updateMany({ hackathon: hackathonId }, { published: true });

  // 6. Automatically update hackathon status to Completed
  hackathon.status = 'Completed';
  await hackathon.save();

  res.status(200).json({
    success: true,
    message: 'Hackathon results published and winners announced successfully',
  });
});

/**
 * @desc    View leaderboard for a hackathon
 * @route   GET /api/leaderboard/:hackathonId
 * @access  Private (Organizer creator, Admin anytime. Participant/Judge only after publication)
 */
export const getLeaderboard = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(hackathonId)) {
    res.status(400);
    throw new Error('Invalid hackathon ID');
  }

  // 1. Check if Hackathon exists
  const hackathon = await Hackathon.findById(hackathonId);
  if (!hackathon) {
    res.status(404);
    throw new Error('Hackathon not found');
  }

  // 2. Check if leaderboard has been generated
  const leaderboardEntries = await Leaderboard.find({ hackathon: hackathonId })
    .sort({ rank: 1 })
    .populate('team', 'teamName')
    .populate('submission', 'projectName');

  if (!leaderboardEntries || leaderboardEntries.length === 0) {
    res.status(404);
    throw new Error('Leaderboard not found for this hackathon');
  }

  // 3. Verify access rights
  const isPublished = leaderboardEntries[0].published;
  const isAdmin = req.user.role === 'Admin';
  const isOrganizerCreator =
    req.user.role === 'Organizer' &&
    hackathon.createdBy.toString() === req.user._id.toString();

  // If not Admin and not Organizer creator, check if published
  if (!isAdmin && !isOrganizerCreator && !isPublished) {
    res.status(403);
    throw new Error('Forbidden: Leaderboard is not published yet');
  }

  // 4. Format output
  const formattedLeaderboard = leaderboardEntries.map((item) => ({
    rank: item.rank,
    team: item.team?.teamName || 'Deleted Team',
    project: item.submission?.projectName || 'Deleted Project',
    score: item.averageScore,
    position: item.position,
  }));

  res.status(200).json({
    success: true,
    leaderboard: formattedLeaderboard,
  });
});

/**
 * @desc    Get top winners for a hackathon
 * @route   GET /api/leaderboard/:hackathonId/winners
 * @access  Private (Organizer creator, Admin anytime. Participant/Judge only after publication)
 */
export const getWinners = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(hackathonId)) {
    res.status(400);
    throw new Error('Invalid hackathon ID');
  }

  // 1. Check if Hackathon exists
  const hackathon = await Hackathon.findById(hackathonId);
  if (!hackathon) {
    res.status(404);
    throw new Error('Hackathon not found');
  }

  // 2. Check if leaderboard has been generated
  const leaderboardEntries = await Leaderboard.find({ hackathon: hackathonId })
    .sort({ rank: 1 })
    .populate('team', 'teamName')
    .populate('submission', 'projectName');

  if (!leaderboardEntries || leaderboardEntries.length === 0) {
    res.status(404);
    throw new Error('Leaderboard not found for this hackathon');
  }

  // 3. Verify access rights
  const isPublished = leaderboardEntries[0].published;
  const isAdmin = req.user.role === 'Admin';
  const isOrganizerCreator =
    req.user.role === 'Organizer' &&
    hackathon.createdBy.toString() === req.user._id.toString();

  if (!isAdmin && !isOrganizerCreator && !isPublished) {
    res.status(403);
    throw new Error('Forbidden: Winners have not been announced yet');
  }

  // 4. Filter winners (isWinner === true)
  const winners = leaderboardEntries.filter((item) => item.isWinner);

  const formattedWinners = winners.map((item) => ({
    rank: item.rank,
    team: item.team?.teamName || 'Deleted Team',
    project: item.submission?.projectName || 'Deleted Project',
    score: item.averageScore,
    position: item.position,
  }));

  res.status(200).json({
    success: true,
    winners: formattedWinners,
  });
});
