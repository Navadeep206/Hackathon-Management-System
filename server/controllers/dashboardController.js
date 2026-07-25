import mongoose from 'mongoose';
import User from '../models/User.js';
import Hackathon from '../models/Hackathon.js';
import Team from '../models/Team.js';
import Registration from '../models/Registration.js';
import Submission from '../models/Submission.js';
import Review from '../models/Review.js';
import Leaderboard from '../models/Leaderboard.js';
import JudgeAssignment from '../models/JudgeAssignment.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Get Admin Dashboard Stats & Lists
 * @route   GET /api/dashboard/admin
 * @access  Private (Admin only)
 */
export const getAdminDashboard = asyncHandler(async (req, res) => {
  // Aggregate Counts
  const [
    totalUsers,
    totalOrganizers,
    totalParticipants,
    totalJudges,
    totalHackathons,
    totalTeams,
    totalRegistrations,
    totalSubmissions,
    totalReviews,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'Organizer' }),
    User.countDocuments({ role: 'Participant' }),
    User.countDocuments({ role: 'Judge' }),
    Hackathon.countDocuments(),
    Team.countDocuments(),
    Registration.countDocuments(),
    Submission.countDocuments(),
    Review.countDocuments(),
  ]);

  // Retrieve Lists
  const [latestUsers, latestHackathons] = await Promise.all([
    User.find().select('name email role isBlocked createdAt').sort({ createdAt: -1 }).limit(5),
    Hackathon.find().populate('createdBy', 'name email').sort({ createdAt: -1 }).limit(5),
  ]);

  res.status(200).json({
    success: true,
    stats: {
      totalUsers,
      totalOrganizers,
      totalParticipants,
      totalJudges,
      totalHackathons,
      totalTeams,
      totalRegistrations,
      totalSubmissions,
      totalReviews,
    },
    latestUsers,
    latestHackathons,
  });
});

/**
 * @desc    Get Organizer Dashboard Stats & Lists
 * @route   GET /api/dashboard/organizer
 * @access  Private (Organizer only)
 */
export const getOrganizerDashboard = asyncHandler(async (req, res) => {
  const organizerId = req.user._id;

  // Find all hackathons created by the organizer
  const organizerHackathons = await Hackathon.find({ createdBy: organizerId });
  const myHackathonsCount = organizerHackathons.length;
  const hackathonIds = organizerHackathons.map((h) => h._id);

  if (hackathonIds.length === 0) {
    return res.status(200).json({
      success: true,
      stats: {
        myHackathons: 0,
        registrationCount: 0,
        teamsRegistered: 0,
        totalSubmissions: 0,
        pendingReviews: 0,
        winnersAnnounced: 0,
      },
      recentHackathons: [],
      recentRegistrations: [],
      recentSubmissions: [],
    });
  }

  // Aggregate stats relative to the organizer's hackathons
  const [
    registrationCount,
    teamsRegistered,
    totalSubmissions,
    pendingReviews,
    winnersAnnounced,
  ] = await Promise.all([
    Registration.countDocuments({ hackathon: { $in: hackathonIds } }),
    Team.countDocuments({ hackathon: { $in: hackathonIds } }),
    Submission.countDocuments({ hackathon: { $in: hackathonIds } }),
    Review.countDocuments({ hackathon: { $in: hackathonIds }, status: 'Pending' }),
    Hackathon.countDocuments({ _id: { $in: hackathonIds }, status: 'Completed' }),
  ]);

  // Retrieve organizer's lists
  const [recentHackathons, recentRegistrations, recentSubmissions] = await Promise.all([
    Hackathon.find({ createdBy: organizerId }).sort({ createdAt: -1 }).limit(5),
    Registration.find({ hackathon: { $in: hackathonIds } })
      .populate('participant', 'name email')
      .populate('hackathon', 'title')
      .sort({ createdAt: -1 })
      .limit(5),
    Submission.find({ hackathon: { $in: hackathonIds } })
      .populate('team', 'teamName')
      .populate('hackathon', 'title')
      .sort({ createdAt: -1 })
      .limit(5),
  ]);

  res.status(200).json({
    success: true,
    stats: {
      myHackathons: myHackathonsCount,
      registrationCount,
      teamsRegistered,
      totalSubmissions,
      pendingReviews,
      winnersAnnounced,
    },
    recentHackathons,
    recentRegistrations,
    recentSubmissions,
  });
});

/**
 * @desc    Get Participant Dashboard Stats & Lists
 * @route   GET /api/dashboard/participant
 * @access  Private (Participant only)
 */
export const getParticipantDashboard = asyncHandler(async (req, res) => {
  const participantId = req.user._id;

  // Retrieve Registrations
  const registrations = await Registration.find({ participant: participantId })
    .populate('hackathon')
    .sort({ createdAt: -1 });
  const registeredHackathonsCount = registrations.length;

  // Retrieve Participant's Teams
  const teams = await Team.find({
    $or: [{ leader: participantId }, { members: participantId }],
  }).populate('hackathon');
  const myTeamsCount = teams.length;
  const teamIds = teams.map((t) => t._id);

  // Retrieve Submissions
  const submissions = await Submission.find({ team: { $in: teamIds } })
    .populate('team', 'teamName')
    .populate('hackathon', 'title')
    .sort({ createdAt: -1 });

  const submissionsCount = submissions.length;
  const latestSubmissionStatus = submissions[0] ? submissions[0].status : 'No Submissions';

  // Retrieve Leaderboard Rank positions
  const ranks = await Leaderboard.find({ team: { $in: teamIds }, published: true })
    .populate('hackathon', 'title')
    .populate('team', 'teamName')
    .sort({ rank: 1 });

  const currentRank = ranks[0]
    ? `${ranks[0].position || `#${ranks[0].rank}`} in ${ranks[0].hackathon?.title}`
    : 'No Rankings';

  // Count upcoming Hackathons
  const upcomingHackathonsCount = await Hackathon.countDocuments({
    status: { $in: ['Upcoming', 'Registration Open'] },
  });

  res.status(200).json({
    success: true,
    stats: {
      registeredHackathons: registeredHackathonsCount,
      myTeam: myTeamsCount,
      submissionStatus: latestSubmissionStatus,
      currentRank,
      upcomingHackathons: upcomingHackathonsCount,
    },
    recentRegistrations: registrations.slice(0, 5),
    submissionDetails: submissions,
    leaderboardPositions: ranks,
  });
});

/**
 * @desc    Get Judge Dashboard Stats & Lists
 * @route   GET /api/dashboard/judge
 * @access  Private (Judge only)
 */
export const getJudgeDashboard = asyncHandler(async (req, res) => {
  const judgeId = req.user._id;

  // Fetch JudgeAssignments
  const assignments = await JudgeAssignment.find({ judge: judgeId });
  const assignedHackathonsCount = assignments.length;
  const hackathonIds = assignments.map((a) => (a.hackathon?._id ? a.hackathon._id : a.hackathon));

  if (hackathonIds.length === 0) {
    return res.status(200).json({
      success: true,
      stats: {
        assignedHackathons: 0,
        assignedProjects: 0,
        pendingReviews: 0,
        completedReviews: 0,
      },
      assignedProjectsList: [],
    });
  }

  // Fetch all submissions in judge's hackathons
  const submissions = await Submission.find({ hackathon: { $in: hackathonIds } })
    .populate('team', 'teamName')
    .populate('hackathon', 'title');

  // Fetch judge's evaluations
  const reviews = await Review.find({ judge: judgeId });
  const completedReviewsCount = reviews.filter((r) => r.status === 'Completed').length;
  const pendingReviewsCount = submissions.length - completedReviewsCount;

  // Map submissions to show current review details
  const assignedProjectsList = submissions.map((sub) => {
    const rev = reviews.find((r) => r.submission.toString() === sub._id.toString());
    return {
      _id: sub._id,
      projectName: sub.projectName,
      teamName: sub.team?.teamName || 'Unknown Team',
      hackathonTitle: sub.hackathon?.title || 'Unknown Hackathon',
      status: rev ? rev.status : 'Not Started',
      score: rev && rev.status === 'Completed' ? rev.totalScore : null,
      reviewId: rev ? rev._id : null,
    };
  });

  res.status(200).json({
    success: true,
    stats: {
      assignedHackathons: assignedHackathonsCount,
      assignedProjects: submissions.length,
      pendingReviews: pendingReviewsCount >= 0 ? pendingReviewsCount : 0,
      completedReviews: completedReviewsCount,
    },
    assignedProjectsList,
  });
});
