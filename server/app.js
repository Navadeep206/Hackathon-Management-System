import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Root route
app.get('/', (req, res) => {
  res.json({
    message: "Hackathon Management System API Running"
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: "OK"
  });
});

export default app;
