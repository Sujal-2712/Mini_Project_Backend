import rateLimit from 'express-rate-limit';
import logger from '../utils/logger/logger';
import { ApiResponse } from '../types/index';

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
  max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '20'), //  requests
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`General rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.'
    } as ApiResponse);
  }
});

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: parseInt(process.env['AUTH_RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 mintues,
  max: parseInt(process.env['AUTH_RATE_LIMIT_MAX_REQUESTS'] || '20'),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later.'
    } as ApiResponse);
  }
});

// URL shortening limiter
const shortenLimiter = rateLimit({
  windowMs: parseInt(process.env['SHORTEN_RATE_LIMIT_WINDOW_MS'] || '60000'), // 1 minute
  max: parseInt(process.env['SHORTEN_RATE_LIMIT_MAX_REQUESTS'] || '10'), // default to 10 requests/min
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Shorten rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many URL shortening requests, please slow down.'
    } as ApiResponse);
  }
});

export {
  generalLimiter,
  authLimiter,
  shortenLimiter
}; 