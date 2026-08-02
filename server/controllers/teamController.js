import mongoose from 'mongoose';
import Team from '../models/Team.js';
import Hackathon from '../models/Hackathon.js';
import Registration from '../models/Registration.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Create a new team for a hackathon
 * @route   POST /api/teams
 * @access  Private (Participant only)
 */
export const createTeam = asyncHandler(async (req, res) => {
  const { teamName, hackathon: hackathonId } = req.body;

  if (!teamName || !hackathonId) {
    res.status(400);
    throw new Error('Please enter teamName and hackathon ID');
  }

  if (!mongoose.Types.ObjectId.isValid(hackathonId)) {
    res.status(400);
    throw new Error('Invalid hackathon ID');
  }

  // Verify Hackathon exists
  const hackathon = await Hackathon.findById(hackathonId);
  if (!hackathon) {
    res.status(404);
    throw new Error('Hackathon not found');
  }

  // Verify Participant has an Approved registration for this hackathon
  const registration = await Registration.findOne({
    participant: req.user._id,
    hackathon: hackathonId,
    status: 'Approved',
  });

  if (!registration) {
    res.status(400);
    throw new Error(
      'You must have an Approved registration for this hackathon to create a team'
    );
  }

  // Verify participant is not already in a team (leader or member) for this hackathon
  const inTeam = await Team.findOne({
    hackathon: hackathonId,
    $or: [{ leader: req.user._id }, { members: req.user._id }],
    status: { $ne: 'Disbanded' },
  });

  if (inTeam) {
    res.status(400);
    throw new Error('You already belong to a team for this hackathon');
  }

  // Verify team name is unique within this hackathon (excluding disbanded teams)
  const nameExists = await Team.findOne({
    hackathon: hackathonId,
    teamName: { $regex: new RegExp(`^${teamName.trim()}$`, 'i') },
    status: { $ne: 'Disbanded' },
  });

  if (nameExists) {
    res.status(400);
    throw new Error('Team name is already taken for this hackathon');
  }

  const team = await Team.create({
    teamName: teamName.trim(),
    hackathon: hackathonId,
    leader: req.user._id,
    members: [req.user._id],
    maxMembers: hackathon.maxTeamSize,
    status: 'Active',
  });

  res.status(201).json({
    success: true,
    message: 'Team created successfully',
    team,
  });
});

/**
 * @desc    Get all teams the current user belongs to (leader or member)
 * @route   GET /api/teams/my
 * @access  Private (Authenticated users)
 */
export const getMyTeam = asyncHandler(async (req, res) => {
  const teams = await Team.find({
    $or: [{ leader: req.user._id }, { members: req.user._id }],
    status: { $ne: 'Disbanded' },
  })
    .populate('hackathon', 'title theme mode status')
    .populate('leader', 'name email role')
    .populate('members', 'name email role');

  res.status(200).json({
    success: true,
    count: teams.length,
    teams,
  });
});

/**
 * @desc    Get all teams (with search, filter, sort, pagination)
 * @route   GET /api/teams
 * @access  Private (Authenticated users)
 */
export const getAllTeams = asyncHandler(async (req, res) => {
  const { search, status, sort, page = 1, limit = 10, hackathon } = req.query;

  const queryObj = {};

  // Search by teamName
  if (search) {
    queryObj.teamName = { $regex: search, $options: 'i' };
  }

  // Filters
  if (status) {
    queryObj.status = status;
  } else {
    // Exclude disbanded teams by default unless requested
    queryObj.status = { $ne: 'Disbanded' };
  }

  if (hackathon) {
    queryObj.hackathon = hackathon;
  }

  // Sorting
  let sortQuery = { createdAt: -1 }; // default: latest
  if (sort === 'oldest') {
    sortQuery = { createdAt: 1 };
  } else if (sort === 'alphabetical') {
    sortQuery = { teamName: 1 };
  }

  // Pagination
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.max(1, parseInt(limit) || 10);
  const skip = (pageNum - 1) * limitNum;

  const totalRecords = await Team.countDocuments(queryObj);
  const teams = await Team.find(queryObj)
    .sort(sortQuery)
    .skip(skip)
    .limit(limitNum)
    .populate('hackathon', 'title theme mode status')
    .populate('leader', 'name email role')
    .populate('members', 'name email role');

  res.status(200).json({
    success: true,
    page: pageNum,
    totalPages: Math.ceil(totalRecords / limitNum),
    totalRecords,
    count: teams.length,
    total: totalRecords,
    pages: Math.ceil(totalRecords / limitNum),
    teams,
  });
});

/**
 * @desc    Get detailed view of a team
 * @route   GET /api/teams/:teamId
 * @access  Private (Members, Hackathon Organizer, Admin)
 */
export const getTeam = asyncHandler(async (req, res) => {
  const { teamId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    res.status(400);
    throw new Error('Invalid team ID');
  }

  const team = await Team.findById(teamId)
    .populate('hackathon')
    .populate('leader', 'name email role')
    .populate('members', 'name email role');

  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  const isMember = team.members.some(
    (m) => m._id.toString() === req.user._id.toString()
  );
  const isCreatorOrganizer =
    req.user.role === 'Organizer' &&
    team.hackathon.createdBy.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'Admin';

  if (!isMember && !isCreatorOrganizer && !isAdmin) {
    res.status(403);
    throw new Error('Access denied: You are not authorized to view this team');
  }

  res.status(200).json({
    success: true,
    team,
  });
});

/**
 * @desc    Update team details (e.g. name or status lock)
 * @route   PUT /api/teams/:teamId
 * @access  Private (Team leader only)
 */
export const updateTeam = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { teamName, status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    res.status(400);
    throw new Error('Invalid team ID');
  }

  const team = await Team.findById(teamId);
  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  // Verify leader
  if (team.leader.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Forbidden: Only the team leader can update details');
  }

  if (team.status === 'Disbanded') {
    res.status(400);
    throw new Error('Cannot update a disbanded team');
  }

  if (teamName && teamName.trim() !== team.teamName) {
    // Validate uniqueness of new name in this hackathon
    const nameExists = await Team.findOne({
      hackathon: team.hackathon,
      teamName: { $regex: new RegExp(`^${teamName.trim()}$`, 'i') },
      status: { $ne: 'Disbanded' },
    });

    if (nameExists) {
      res.status(400);
      throw new Error('Team name is already taken for this hackathon');
    }
    team.teamName = teamName.trim();
  }

  if (status) {
    if (!['Active', 'Locked'].includes(status)) {
      res.status(400);
      throw new Error('Invalid status. Status can only be Active or Locked');
    }
    team.status = status;
  }

  await team.save();

  res.status(200).json({
    success: true,
    message: 'Team updated successfully',
    team,
  });
});

/**
 * @desc    Disband/Delete a team
 * @route   DELETE /api/teams/:teamId
 * @access  Private (Team leader only)
 */
export const deleteTeam = asyncHandler(async (req, res) => {
  const { teamId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    res.status(400);
    throw new Error('Invalid team ID');
  }

  const team = await Team.findById(teamId);
  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  // Verify leader
  if (team.leader.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Forbidden: Only the team leader can disband the team');
  }

  team.status = 'Disbanded';
  await team.save();

  res.status(200).json({
    success: true,
    message: 'Team disbanded successfully',
  });
});

/**
 * @desc    Join an active team using invite code
 * @route   POST /api/teams/:teamId/join
 * @access  Private (Participant only)
 */
export const joinTeam = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { inviteCode } = req.body;

  let team;
  if (teamId && teamId !== 'join') {
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      res.status(400);
      throw new Error('Invalid team ID');
    }
    team = await Team.findById(teamId);
  } else if (inviteCode) {
    team = await Team.findOne({ inviteCode });
  }

  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  if (team.status !== 'Active') {
    res.status(400);
    throw new Error(`Cannot join team. Current status is ${team.status}`);
  }

  // Validate invite code matches if joined by teamId
  if (teamId && teamId !== 'join' && inviteCode && team.inviteCode !== inviteCode) {
    res.status(400);
    throw new Error('Invalid invite code');
  }

  // Verify user is registered & approved for this hackathon
  const reg = await Registration.findOne({
    participant: req.user._id,
    hackathon: team.hackathon,
    status: 'Approved',
  });

  if (!reg) {
    res.status(400);
    throw new Error('You must have an Approved registration to join a team');
  }

  // Verify user is not already in a team (leader or member) for this hackathon
  const inTeam = await Team.findOne({
    hackathon: team.hackathon,
    $or: [{ leader: req.user._id }, { members: req.user._id }],
    status: { $ne: 'Disbanded' },
  });

  if (inTeam) {
    res.status(400);
    throw new Error('You already belong to a team for this hackathon');
  }

  // Check team capacity
  if (team.members.length >= team.maxMembers) {
    res.status(400);
    throw new Error('Team capacity has been reached (team is full)');
  }

  team.members.push(req.user._id);
  await team.save();

  res.status(200).json({
    success: true,
    message: 'Joined team successfully',
    team,
  });
});

/**
 * @desc    Leave a team
 * @route   DELETE /api/teams/:teamId/leave
 * @access  Private (Team member only)
 */
export const leaveTeam = asyncHandler(async (req, res) => {
  const { teamId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    res.status(400);
    throw new Error('Invalid team ID');
  }

  const team = await Team.findById(teamId);
  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  // Verify requester is a member of the team
  const isMember = team.members.some(
    (m) => m.toString() === req.user._id.toString()
  );
  if (!isMember) {
    res.status(400);
    throw new Error('You are not a member of this team');
  }

  // Leader cannot leave without transferring leadership first
  if (team.leader.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('Team leaders cannot leave without transferring leadership first');
  }

  team.members = team.members.filter(
    (m) => m.toString() !== req.user._id.toString()
  );
  await team.save();

  res.status(200).json({
    success: true,
    message: 'Left team successfully',
  });
});

/**
 * @desc    Remove a member from the team
 * @route   DELETE /api/teams/:teamId/remove-member/:memberId
 * @access  Private (Team leader only)
 */
export const removeMember = asyncHandler(async (req, res) => {
  const { teamId, memberId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(teamId) || !mongoose.Types.ObjectId.isValid(memberId)) {
    res.status(400);
    throw new Error('Invalid parameters');
  }

  const team = await Team.findById(teamId);
  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  // Verify leader
  if (team.leader.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Forbidden: Only the team leader can remove members');
  }

  // Validate leader cannot remove themselves
  if (memberId === req.user._id.toString()) {
    res.status(400);
    throw new Error('Team leaders cannot remove themselves');
  }

  // Verify member belongs to team
  const isMember = team.members.some((m) => m.toString() === memberId);
  if (!isMember) {
    res.status(400);
    throw new Error('User is not a member of this team');
  }

  team.members = team.members.filter((m) => m.toString() !== memberId);
  await team.save();

  res.status(200).json({
    success: true,
    message: 'Member removed successfully',
  });
});

/**
 * @desc    Transfer team leadership to another member
 * @route   PUT /api/teams/:teamId/transfer-leadership
 * @access  Private (Team leader only)
 */
export const transferLeadership = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { memberId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(teamId) || !memberId || !mongoose.Types.ObjectId.isValid(memberId)) {
    res.status(400);
    throw new Error('Invalid parameters');
  }

  const team = await Team.findById(teamId);
  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  // Verify leader
  if (team.leader.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Forbidden: Only the team leader can transfer leadership');
  }

  // Verify memberId is a current member of the team
  const isMember = team.members.some((m) => m.toString() === memberId);
  if (!isMember) {
    res.status(400);
    throw new Error('New leader must be an active member of the team');
  }

  team.leader = memberId;
  await team.save();

  res.status(200).json({
    success: true,
    message: 'Leadership transferred successfully',
    team,
  });
});

/**
 * @desc    Get list of participants eligible to join the hackathon team
 * @route   GET /api/teams/:teamId/eligible-participants
 * @access  Private (Participant only)
 */
export const getEligibleParticipants = asyncHandler(async (req, res) => {
  const { teamId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    res.status(400);
    throw new Error('Invalid team ID');
  }

  const team = await Team.findById(teamId);
  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  // Get all approved registrations for this hackathon
  const registrations = await Registration.find({
    hackathon: team.hackathon,
    status: 'Approved',
  }).populate('participant', 'name email role');

  // Get all active (non-disbanded) teams for this hackathon
  const teams = await Team.find({
    hackathon: team.hackathon,
    status: { $ne: 'Disbanded' },
  });

  // Collect IDs of participants who are already in a team (either as leader or member)
  const usersInTeams = new Set();
  teams.forEach((t) => {
    usersInTeams.add(t.leader.toString());
    t.members.forEach((m) => usersInTeams.add(m.toString()));
  });

  // Filter registrations to find participants who are not in any team
  const eligible = registrations
    .map((r) => r.participant)
    .filter((user) => user && !usersInTeams.has(user._id.toString()));

  res.status(200).json({
    success: true,
    count: eligible.length,
    participants: eligible,
  });
});

/**
 * @desc    Add a member to the team directly
 * @route   POST /api/teams/:teamId/add-member
 * @access  Private (Team leader only)
 */
export const addMember = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { memberId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    res.status(400);
    throw new Error('Invalid team ID');
  }

  if (!mongoose.Types.ObjectId.isValid(memberId)) {
    res.status(400);
    throw new Error('Invalid member ID');
  }

  const team = await Team.findById(teamId);
  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  // Verify that req.user is the team leader
  const isLeader = team.leader.toString() === req.user._id.toString();
  if (!isLeader) {
    res.status(403);
    throw new Error('Forbidden: Only the team leader can add members directly');
  }

  if (team.status !== 'Active') {
    res.status(400);
    throw new Error(`Cannot add member. Current team status is ${team.status}`);
  }

  // Verify target user exists and is a participant
  const targetUser = await User.findById(memberId);
  if (!targetUser) {
    res.status(404);
    throw new Error('User not found');
  }

  if (targetUser.role !== 'Participant') {
    res.status(400);
    throw new Error('Only users with the Participant role can be added to teams');
  }

  // Verify target user is registered and approved for this hackathon
  const reg = await Registration.findOne({
    participant: memberId,
    hackathon: team.hackathon,
    status: 'Approved',
  });

  if (!reg) {
    res.status(400);
    throw new Error('Target user does not have an Approved registration for this hackathon');
  }

  // Verify target user is not already in a team (leader or member) for this hackathon
  const inTeam = await Team.findOne({
    hackathon: team.hackathon,
    $or: [{ leader: memberId }, { members: memberId }],
    status: { $ne: 'Disbanded' },
  });

  if (inTeam) {
    res.status(400);
    throw new Error('Target user already belongs to a team for this hackathon');
  }

  // Check team capacity
  if (team.members.length >= team.maxMembers) {
    res.status(400);
    throw new Error('Team capacity has been reached (team is full)');
  }

  team.members.push(memberId);
  await team.save();

  // Populate members
  const populatedTeam = await Team.findById(teamId)
    .populate('leader', 'name email role')
    .populate('members', 'name email role')
    .populate('hackathon', 'title');

  res.status(200).json({
    success: true,
    message: 'Member added to team successfully',
    team: populatedTeam,
  });
});
