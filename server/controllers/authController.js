import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, profileImage } = req.body;

  // Backend validation for empty fields
  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error('Please fill in all fields (name, email, password, role)');
  }

  // Backend validation for invalid role
  const allowedRoles = ['Admin', 'Organizer', 'Participant', 'Judge'];
  if (!allowedRoles.includes(role)) {
    res.status(400);
    throw new Error('Invalid role. Must be Admin, Organizer, Participant, or Judge');
  }

  // Backend validation for email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error('Please provide a valid email address');
  }

  // Backend validation for weak password (minimum 8 characters)
  if (password.length < 8) {
    res.status(400);
    throw new Error('Password must be at least 8 characters long');
  }

  // Reject duplicate email
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('Email already registered');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role,
    profileImage: profileImage || '',
  });

  if (user) {
    // Generate token and set HTTP-only cookie
    const token = generateToken(res, user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate empty fields
  if (!email || !password) {
    res.status(400);
    throw new Error('Please enter email and password');
  }

  // Fetch user, explicitly selecting password since it is default select: false
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  if (user.isBlocked) {
    return res.status(403).json({
      success: false,
      message: 'Your account is blocked. Please contact support.',
    });
  }

  // Generate token and set HTTP-only cookie
  const token = generateToken(res, user._id);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  });
});

/**
 * @desc    Logout user / clear cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logout = asyncHandler(async (req, res) => {
  // Clear the cookie by setting it to empty and expiring it immediately
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * @desc    Get current logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  // req.user has already been set by protect middleware, and excludes password
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      profileImage: req.user.profileImage,
      isBlocked: req.user.isBlocked,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
    },
  });
});
