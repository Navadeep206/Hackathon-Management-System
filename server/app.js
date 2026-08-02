import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { requestLogger } from './middleware/loggerMiddleware.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import apiRouter from './routes/index.js';

// Load environment variables
dotenv.config();

const app = express();

// Request logging middleware (must be configured early to log all requests)
app.use(requestLogger);

const configuredOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((origin) => origin.trim())
  : [];

const allowedOrigins = [
  ...configuredOrigins,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://hackathon-management-system-seven.vercel.app',
];

const isLocalDevOrigin = (origin) => {
  try {
    const { hostname, protocol } = new URL(origin);
    return protocol === 'http:' && ['localhost', '127.0.0.1'].includes(hostname);
  } catch {
    return false;
  }
};

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  if (allowedOrigins.includes(origin) || isLocalDevOrigin(origin)) {
    return true;
  }

  try {
    const { hostname } = new URL(origin);
    if (hostname.endsWith('.vercel.app') || hostname.endsWith('.onrender.com')) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
};

// CORS configuration - supports local Vite dev ports and comma-separated CLIENT_URL values.
app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);

// Standard body-parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parsing middleware for authorization tokens
app.use(cookieParser());

// Base application routing
app.use('/api', apiRouter);

// 404 handler for any requests to unregistered routes
app.use(notFound);

// Global error handler for catching and standardizing API errors
app.use(errorHandler);

export default app;
