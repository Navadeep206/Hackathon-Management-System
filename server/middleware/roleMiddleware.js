/**
 * Middleware to authorize routes based on user roles.
 * Expects req.user to be set by the authentication middleware.
 * @param {...string} allowedRoles - The roles permitted to access the route
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user credentials not verified',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Access is denied',
      });
    }

    next();
  };
};
