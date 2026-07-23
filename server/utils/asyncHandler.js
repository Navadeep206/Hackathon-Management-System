/**
 * asyncHandler is a wrapper utility that catches any errors thrown by async routes
 * and forwards them to the Express global error handler middleware (using next(err)),
 * eliminating the need for repeating try-catch blocks in route controllers.
 * 
 * @param {Function} fn - The asynchronous request handler function.
 * @returns {Function} - Express middleware function.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
