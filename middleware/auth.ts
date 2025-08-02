import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import { USER } from '../models/User';
import logger from '../utils/logger/logger';
import { AuthenticatedRequest, JWTPayload, ApiResponse } from '../types/index';

const auth = async (req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ 
        success: false,
        message: 'Access denied. No token provided.' 
      });
      return;
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;
    
    if (!token) {
      res.status(401).json({ 
        success: false,
        message: 'Access denied. Invalid token format.' 
      });
      return;
    }

    const decoded = jwt.verify(token, process.env['JWT_SECRET'] || '') as JWTPayload;
  
    const user = await USER.findById(decoded.userId).select('is_active').select('is_verified');
    if (!user || !user.is_active) {
      res.status(401).json({
        success: false,
        message: 'Access denied. User not found or inactive.'
      });
      return;
    }

    req.user = decoded.userId;
    (req as any).userEmail = decoded.email;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    
    if (error instanceof Error) {
      if (error.name === 'JsonWebTokenError') {
        res.status(403).json({ 
          success: false,
          message: 'Access denied. Invalid token.' 
        });
        return;
      }
      
      if (error.name === 'TokenExpiredError') {
        res.status(403).json({ 
          success: false,
          message: 'Access denied. Token expired.' 
        });
        return;
      }
    }

    res.status(500).json({ 
      success: false,
      message: 'Internal server error during authentication.' 
    });
  }
};

export { auth }; 