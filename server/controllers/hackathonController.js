import fs from 'fs';
import Hackathon from '../models/Hackathon.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Create a new hackathon
 * @route   POST /api/hackathons
 * @access  Private (Organizer only)
 */
export const createHackathon = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    theme,
    mode,
    venue,
    startDate,
    endDate,
    registrationDeadline,
    prizePool,
    maxTeamSize,
    rules,
    judgingCriteria,
    status,
  } = req.body;

  // Backend validations
  if (
    !title ||
    !theme ||
    !mode ||
    !startDate ||
    !endDate ||
    !registrationDeadline ||
    !maxTeamSize
  ) {
    res.status(400);
    throw new Error(
      'Please fill all required fields (title, theme, mode, startDate, endDate, registrationDeadline, maxTeamSize)'
    );
  }

  const parsedMaxTeamSize = Number(maxTeamSize);
  if (isNaN(parsedMaxTeamSize) || parsedMaxTeamSize <= 0) {
    res.status(400);
    throw new Error('Maximum team size must be a number greater than 0');
  }

  const parsedPrizePool = Number(prizePool || 0);
  if (isNaN(parsedPrizePool) || parsedPrizePool < 0) {
    res.status(400);
    throw new Error('Prize pool must be a non-negative number');
  }

  // Handle uploaded banner image
  const bannerImage = req.file ? `/uploads/${req.file.filename}` : '';

  const hackathon = new Hackathon({
    title,
    description: description || '',
    theme,
    mode,
    venue: mode === 'Offline' ? venue : '',
    startDate,
    endDate,
    registrationDeadline,
    bannerImage,
    prizePool: parsedPrizePool,
    maxTeamSize: parsedMaxTeamSize,
    rules: rules || '',
    judgingCriteria: judgingCriteria || '',
    status: status || 'Upcoming',
    createdBy: req.user._id,
  });

  const createdHackathon = await hackathon.save();

  res.status(201).json({
    success: true,
    message: 'Hackathon created successfully',
    hackathon: createdHackathon,
  });
});

/**
 * @desc    Get all hackathons (with search, filter, sort, pagination)
 * @route   GET /api/hackathons
 * @access  Private (Admin, Organizer, Participant, Judge - Read Only)
 */
export const getAllHackathons = asyncHandler(async (req, res) => {
  const { search, mode, theme, status, sort, page = 1, limit = 10 } = req.query;

  const queryObj = {};

  // Search by title or theme
  if (search) {
    queryObj.$or = [
      { title: { $regex: search, $options: 'i' } },
      { theme: { $regex: search, $options: 'i' } },
    ];
  }

  // Filters
  if (mode) {
    queryObj.mode = mode;
  }
  if (theme) {
    queryObj.theme = theme;
  }
  if (status) {
    queryObj.status = status;
  }

  // Sorting
  let sortQuery = { createdAt: -1 }; // default: latest
  if (sort === 'registrationDeadline') {
    sortQuery = { registrationDeadline: 1 };
  } else if (sort === 'startDate') {
    sortQuery = { startDate: 1 };
  } else if (sort === 'latest') {
    sortQuery = { createdAt: -1 };
  }

  // Pagination
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.max(1, parseInt(limit) || 10);
  const skip = (pageNum - 1) * limitNum;

  const total = await Hackathon.countDocuments(queryObj);
  const hackathons = await Hackathon.find(queryObj)
    .sort(sortQuery)
    .skip(skip)
    .limit(limitNum)
    .populate('createdBy', 'name email role');

  res.status(200).json({
    success: true,
    count: hackathons.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    hackathons,
  });
});

/**
 * @desc    Get single hackathon details
 * @route   GET /api/hackathons/:id
 * @access  Private (Admin, Organizer, Participant, Judge - Read Only)
 */
export const getHackathon = asyncHandler(async (req, res) => {
  const hackathon = await Hackathon.findById(req.params.id).populate(
    'createdBy',
    'name email role'
  );

  if (!hackathon) {
    res.status(404);
    throw new Error('Hackathon not found');
  }

  res.status(200).json({
    success: true,
    hackathon,
  });
});

/**
 * @desc    Update an existing hackathon
 * @route   PUT /api/hackathons/:id
 * @access  Private (Organizer owner only)
 */
export const updateHackathon = asyncHandler(async (req, res) => {
  const hackathon = await Hackathon.findById(req.params.id);

  if (!hackathon) {
    res.status(404);
    throw new Error('Hackathon not found');
  }

  // Authorization check (Only the Organizer who created it can edit it)
  if (hackathon.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Forbidden: You are not authorized to update this hackathon');
  }

  const {
    title,
    description,
    theme,
    mode,
    venue,
    startDate,
    endDate,
    registrationDeadline,
    prizePool,
    maxTeamSize,
    rules,
    judgingCriteria,
    status,
  } = req.body;

  // Track field changes
  if (title !== undefined) hackathon.title = title;
  if (description !== undefined) hackathon.description = description;
  if (theme !== undefined) hackathon.theme = theme;
  if (mode !== undefined) {
    hackathon.mode = mode;
    hackathon.venue = mode === 'Offline' ? venue : '';
  } else if (venue !== undefined) {
    hackathon.venue = hackathon.mode === 'Offline' ? venue : '';
  }
  if (startDate !== undefined) hackathon.startDate = startDate;
  if (endDate !== undefined) hackathon.endDate = endDate;
  if (registrationDeadline !== undefined)
    hackathon.registrationDeadline = registrationDeadline;
  if (rules !== undefined) hackathon.rules = rules;
  if (judgingCriteria !== undefined)
    hackathon.judgingCriteria = judgingCriteria;
  if (status !== undefined) hackathon.status = status;

  if (prizePool !== undefined) {
    const parsedPrizePool = Number(prizePool);
    if (isNaN(parsedPrizePool) || parsedPrizePool < 0) {
      res.status(400);
      throw new Error('Prize pool must be a non-negative number');
    }
    hackathon.prizePool = parsedPrizePool;
  }

  if (maxTeamSize !== undefined) {
    const parsedMaxTeamSize = Number(maxTeamSize);
    if (isNaN(parsedMaxTeamSize) || parsedMaxTeamSize <= 0) {
      res.status(400);
      throw new Error('Maximum team size must be greater than 0');
    }
    hackathon.maxTeamSize = parsedMaxTeamSize;
  }

  // Handle uploaded banner image
  if (req.file) {
    // Delete old local file if it exists
    if (
      hackathon.bannerImage &&
      fs.existsSync(hackathon.bannerImage.replace(/^\//, ''))
    ) {
      try {
        fs.unlinkSync(hackathon.bannerImage.replace(/^\//, ''));
      } catch (err) {
        console.error('Error deleting old banner image file:', err.message);
      }
    }
    hackathon.bannerImage = `/uploads/${req.file.filename}`;
  }

  const updatedHackathon = await hackathon.save();

  res.status(200).json({
    success: true,
    message: 'Hackathon updated successfully',
    hackathon: updatedHackathon,
  });
});

/**
 * @desc    Delete a hackathon
 * @route   DELETE /api/hackathons/:id
 * @access  Private (Organizer owner only)
 */
export const deleteHackathon = asyncHandler(async (req, res) => {
  const hackathon = await Hackathon.findById(req.params.id);

  if (!hackathon) {
    res.status(404);
    throw new Error('Hackathon not found');
  }

  // Authorization check (Only the Organizer who created it can delete it)
  if (hackathon.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Forbidden: You are not authorized to delete this hackathon');
  }

  // Delete banner image file
  if (
    hackathon.bannerImage &&
    fs.existsSync(hackathon.bannerImage.replace(/^\//, ''))
  ) {
    try {
      fs.unlinkSync(hackathon.bannerImage.replace(/^\//, ''));
    } catch (err) {
      console.error('Error deleting banner image file:', err.message);
    }
  }

  await Hackathon.deleteOne({ _id: hackathon._id });

  res.status(200).json({
    success: true,
    message: 'Hackathon deleted successfully',
  });
});
