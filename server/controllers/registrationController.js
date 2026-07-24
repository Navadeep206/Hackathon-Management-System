import mongoose from 'mongoose';
import Registration from '../models/Registration.js';
import Hackathon from '../models/Hackathon.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Register a participant for a hackathon
 * @route   POST /api/registrations/:hackathonId
 * @access  Private (Participant only)
 */
export const registerHackathon = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;

  // Validate hackathonId format
  if (!mongoose.Types.ObjectId.isValid(hackathonId)) {
    res.status(400);
    throw new Error('Invalid hackathon ID');
  }

  // Validate user is a Participant
  if (req.user.role !== 'Participant') {
    res.status(403);
    throw new Error('Forbidden: Only participants can register for hackathons');
  }

  // Check if hackathon exists
  const hackathon = await Hackathon.findById(hackathonId);
  if (!hackathon) {
    res.status(404);
    throw new Error('Hackathon not found');
  }

  // Check if hackathon status is "Registration Open"
  if (hackathon.status !== 'Registration Open') {
    res.status(400);
    throw new Error('Registration is closed for this hackathon');
  }

  // Check if registration deadline has passed
  if (new Date() > new Date(hackathon.registrationDeadline)) {
    res.status(400);
    throw new Error('Registration deadline has passed');
  }

  // Check if participant is already registered
  const existingRegistration = await Registration.findOne({
    participant: req.user._id,
    hackathon: hackathonId,
  });

  if (existingRegistration) {
    res.status(400);
    throw new Error('You are already registered for this hackathon');
  }

  // Create registration
  const registration = await Registration.create({
    participant: req.user._id,
    hackathon: hackathonId,
    status: 'Pending',
  });

  res.status(201).json({
    success: true,
    message: 'Registration submitted successfully',
    status: registration.status,
  });
});

/**
 * @desc    Cancel a pending registration
 * @route   DELETE /api/registrations/:registrationId
 * @access  Private (Participant owner only)
 */
export const cancelRegistration = asyncHandler(async (req, res) => {
  const { registrationId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(registrationId)) {
    res.status(400);
    throw new Error('Invalid registration ID');
  }

  const registration = await Registration.findById(registrationId);
  if (!registration) {
    res.status(404);
    throw new Error('Registration not found');
  }

  // Check ownership
  if (registration.participant.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Forbidden: You can only cancel your own registrations');
  }

  // Enforce cancellation only before approval (must be Pending)
  if (registration.status !== 'Pending') {
    res.status(400);
    throw new Error(
      `Cannot cancel registration. Current status is ${registration.status}`
    );
  }

  registration.status = 'Cancelled';
  await registration.save();

  res.status(200).json({
    success: true,
    message: 'Registration cancelled successfully',
  });
});

/**
 * @desc    Get currently logged-in participant's registrations
 * @route   GET /api/registrations/my
 * @access  Private (Participant only)
 */
export const getMyRegistrations = asyncHandler(async (req, res) => {
  if (req.user.role !== 'Participant') {
    res.status(403);
    throw new Error('Forbidden: Only participants can view their own registrations');
  }

  const { status } = req.query;
  const queryObj = { participant: req.user._id };

  if (status) {
    queryObj.status = status;
  }

  const registrations = await Registration.find(queryObj).populate(
    'hackathon',
    'title theme mode status startDate endDate registrationDeadline'
  );

  res.status(200).json({
    success: true,
    count: registrations.length,
    registrations,
  });
});

/**
 * @desc    Get registrations for a specific hackathon
 * @route   GET /api/registrations/hackathon/:hackathonId
 * @access  Private (Admin or Organizer creator only)
 */
export const getHackathonRegistrations = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params;
  const { status } = req.query;

  if (!mongoose.Types.ObjectId.isValid(hackathonId)) {
    res.status(400);
    throw new Error('Invalid hackathon ID');
  }

  const hackathon = await Hackathon.findById(hackathonId);
  if (!hackathon) {
    res.status(404);
    throw new Error('Hackathon not found');
  }

  // Access validation: Admin can view all; Organizer can only view their own hackathons
  if (req.user.role === 'Organizer') {
    if (hackathon.createdBy.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error(
        'Forbidden: You can only view registrations for your own hackathons'
      );
    }
  } else if (req.user.role !== 'Admin') {
    res.status(403);
    throw new Error('Forbidden: Unauthorized role access');
  }

  const queryObj = { hackathon: hackathonId };
  if (status) {
    queryObj.status = status;
  }

  const registrations = await Registration.find(queryObj).populate(
    'participant',
    'name email role profileImage'
  );

  res.status(200).json({
    success: true,
    count: registrations.length,
    registrations,
  });
});

/**
 * @desc    Approve or reject a registration
 * @route   PUT /api/registrations/:registrationId/status
 * @access  Private (Organizer owner only)
 */
export const updateRegistrationStatus = asyncHandler(async (req, res) => {
  const { registrationId } = req.params;
  const { status, remarks } = req.body;

  if (!mongoose.Types.ObjectId.isValid(registrationId)) {
    res.status(400);
    throw new Error('Invalid registration ID');
  }

  if (!status || !['Approved', 'Rejected'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status. Must be Approved or Rejected');
  }

  // Fetch registration and populate hackathon to verify creator
  const registration = await Registration.findById(registrationId).populate(
    'hackathon'
  );

  if (!registration) {
    res.status(404);
    throw new Error('Registration not found');
  }

  // Verify the Organizer is the creator of the hackathon
  if (
    registration.hackathon.createdBy.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error(
      'Forbidden: You are not authorized to manage registrations for this hackathon'
    );
  }

  // Enforce role is Organizer (Admin cannot edit status)
  if (req.user.role !== 'Organizer') {
    res.status(403);
    throw new Error('Forbidden: Admins cannot approve or reject registrations');
  }

  registration.status = status;
  if (status === 'Approved') {
    registration.approvedAt = new Date();
  } else {
    registration.approvedAt = undefined;
  }
  registration.remarks = remarks || '';

  await registration.save();

  res.status(200).json({
    success: true,
    message: `Registration ${status.toLowerCase()}`,
  });
});
