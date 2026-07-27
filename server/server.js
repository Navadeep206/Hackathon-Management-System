import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/db.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5001;

/**
 * Initializes and starts the Express server.
 * Connects to MongoDB first. If database connection fails,
 * the server does not start and the process is terminated.
 */
const startServer = async () => {
  // 1. Connect to MongoDB
  await connectDB();

  // 2. Start Express Server
  const server = app.listen(PORT, () => {
    console.log(
      `[Server] Running on port ${PORT} in [${process.env.NODE_ENV || 'development'}] mode`
    );
  });

  // Handle unhandled promise rejections gracefully
  process.on('unhandledRejection', (err) => {
    console.error(`[Server] Unhandled Promise Rejection: ${err.message}`);
    // Shut down the server, then exit
    server.close(() => {
      process.exit(1);
    });
  });
};

startServer();
