/**
 * Simple request logger middleware that logs details of incoming HTTP requests.
 * Prints: Method, URL, Status, Response Time.
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[Request] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - Time: ${duration}ms`
    );
  });

  next();
};
