import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger/logger';
import { ApiResponse } from '../types/index';

interface CustomError extends Error {
  statusCode?: number;
  code?: number;
  keyValue?: { [key: string]: any };
  errors?: { [key: string]: any };
}

const errorHandler = (err: CustomError, req: Request, res: Response<ApiResponse>, _next: NextFunction): void => {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors || {}).map((e: any) => e.message);
    res.status(400).json({
      success: false,
      message: 'Validation Error',
      error: errors
    });
    return;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
    return;
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expired'
    });
    return;
  }

  // Default server error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env['NODE_ENV'] === 'development' && { error: err.stack })
  });
};

export default errorHandler; 