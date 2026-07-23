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

// CORS configuration - allowing origins specified in environment variables
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
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
