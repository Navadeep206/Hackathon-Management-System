import jwt from 'jsonwebtoken';

/**
 * Generates a JWT token for the user, sets it as an HTTP-only cookie, and returns the token string.
 * @param {Object} res - Express response object (optional, if setting cookie is desired)
 * @param {string} userId - User ID to embed in the payload
 * @returns {string} - The generated JWT token
 */
const generateToken = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  if (res) {
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  return token;
};

export default generateToken;
