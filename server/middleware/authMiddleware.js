import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Middleware to protect routes by verifying JWT.
 * Verifies token from Authorization header or cookie.
 * Attaches authenticated user to req.user (excluding password).
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, token missing');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from the database, excluding password
    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401);
      throw new Error('Not authorized, user not found');
    }

    if (user.isBlocked) {
      res.status(403);
      throw new Error('Access denied, user is blocked');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    if (error.name === 'TokenExpiredError') {
      throw new Error('Not authorized, token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Not authorized, token is invalid');
    } else {
      throw error;
    }
  }
});
