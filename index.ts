import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import logger from './utils/logger/logger';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import urlRoutes from './routes/urlRoutes';
import urlController from './controllers/urlController';
import errorHandler from './middleware/errorHandler';

const app = express();
dotenv.config();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
  origin:"http://localhost:5173",
  credentials:true,
  methods:["GET","POST","PUT","DELETE"],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check route
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Server is healthy' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/url', urlRoutes);
app.use('/api/analytics', analyticsRoutes);
// URL redirect route
app.get('/url/:shortUrl', (req, res) => {
  return urlController.redirectUrl(req, res);
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env['PORT'] || 5000;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  console.log(`Server started successfully on port ${PORT}!`);
}); 