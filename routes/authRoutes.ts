import express from 'express';
import authController from '../controllers/authController';
import { auth } from '../middleware/auth';
import { authValidation } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Authentication routes
router.post('/signup', 
  authLimiter,
  authValidation.signup,
  authController.signup
);

router.post('/login', 
  authLimiter,
  authValidation.login,
  authController.login
);

router.post('/forgot-password',
  authLimiter,
  authValidation.forgotPassword,
  authController.forgotPassword
);

router.post('/reset-password',
  auth,
  authValidation.resetPassword,
  authController.resetPassword
);

router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);

// Email verification route
router.get('/verify-email', authController.verifyEmail);

export default router; 