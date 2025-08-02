import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { USER } from '../models/User';
import emailService from '../services/emailService';
import logger from '../utils/logger/logger';
import { AuthenticatedRequest, ApiResponse, IUserLogin, IUserProfile } from '../types/index';
import { nanoid } from 'nanoid';
import emailVerifiedTemplate from './../utils/templates/emailVerifiedTemplate';

class AuthController {
  async signup(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: errors.array()
        });
        return;
      }

      const { email, password } = req.body;

      // Check if user already exists
      const existingUser = await USER.findOne({ email });
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'User already exists with this email'
        });
        return;
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create new user
      const newUser = new USER({
        email,
        password: hashedPassword
      });

      await newUser.save();

      const token = nanoid(32);
      newUser.verification_token = token;
      newUser.verification_token_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
      await newUser.save();

      await emailService.sendVerificationEmail(newUser.email, token);

      logger.info(`New user registered: ${email}`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully'
      });

    } catch (error) {
      logger.error('Signup error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during registration'
      });
    }
  }

  async login(req: Request, res: Response<ApiResponse<{ token: string; user: IUserLogin }>>): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: errors.array()
        });
        return;
      }

      const { email, password } = req.body;

      // Find user
      const user = await USER.findOne({ email, is_active: true });
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
        return;
      }
      if (!user.is_verified) {
        res.status(401).json({
          success: false,
          message: 'Your Email not verified !! Please verify your email to login'
        });
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
        return;
      }

      user.last_login = new Date();
      await user.save();

      const payload: JwtPayload = {
        userId: user._id,
        email: user.email,
        profile_img: user.profile_img
      };

      const token = jwt.sign(payload, process.env['JWT_SECRET'] || 'default-secret', { expiresIn: '1h' });

      logger.info(`User logged in: ${email}`);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: (user._id as any).toString(),
            email: user.email,
            profile_img: user.profile_img,
            total_links: user.total_links
          }
        }
      });

    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during login'
      });
    }
  }

  async forgotPassword(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: errors.array()
        });
        return;
      }

      const { email } = req.body;

      const user = await USER.findOne({ email, is_active: true });
      if (!user) {
        res.status(200).json({
          success: true,
          message: 'If the email exists, a reset code has been sent'
        });
        return;
      }

      const otp = Math.floor(100000 + Math.random() * 900000);
      user.reset_password_otp = otp;
      user.reset_password_otp_expires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      await emailService.sendPasswordResetOTP(user.email, otp);

      logger.info(`Password reset OTP sent to: ${email}`);

      res.status(200).json({
        success: true,
        message: 'Reset code sent to your email',
        data: { otp }
      });

    } catch (error) {
      console.log(error);
      logger.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Error sending reset code'
      });
    }
  }

  async resetPassword(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: errors.array()
        });
        return;
      }

      const { password } = req.body;
      const userId = req.user;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const user = await USER.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      user.password = hashedPassword;
      user.reset_password_otp = null;
      user.reset_password_otp_expires = undefined;
      await user.save();

      logger.info(`Password reset successful for user: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Password reset successfully'
      });

    } catch (error) {
      logger.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Error resetting password'
      });
    }
  }

  async getProfile(req: AuthenticatedRequest, res: Response<ApiResponse<IUserProfile>>): Promise<void> {
    try {
      const userId = req.user;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const user = await USER.findById(userId)
        .select('-password -reset_password_otp -reset_password_otp_expires')
        .populate({
          path: 'urls',
          select: 'title createdAt clicks',
          options: { sort: { createdAt: -1 }, limit: 5 }
        });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Profile fetched successfully',
        data: {
          id: (user._id as any).toString(),
          email: user.email,
          profile_img: user.profile_img,
          total_links: user.total_links,
          totalClicks: user.totalClicks || 0
        }
      });

    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching profile'
      });
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const userId = req.user;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }
      const { email } = req.body;

      const user = await USER.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      if (email && email !== user.email) {
        const existingUser = await USER.findOne({ email });
        if (existingUser) {
          res.status(409).json({
            success: false,
            message: 'Email already exists'
          });
          return;
        }
        user.email = email;
      }

      await user.save();
      logger.info(`Profile updated for user: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully'
      });

    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating profile'
      });
    }
  }

  async verifyEmail(req: Request, res: Response<ApiResponse>) {

    const { token } = req.query;
    if (!token) return res.status(400).json({ success: false, message: 'Token required' });
    const user = await USER.findOne({
      verification_token: token,
      verification_token_expires: { $gt: new Date() }
    });


    if (!user) {
      console.log('No user found with this token');
      return res.status(400).json({ success: false, message: 'Invalid token' });
    }

    if (user != null && user.verification_token_expires != null && user.verification_token_expires < new Date()) {
      return res.status(400).json({ success: false, message: 'Token expired' });
    }
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    user.is_verified = true;
    user.verification_token = null;
    user.verification_token_expires = null;
    await user.save();
    await emailService.sendWelcomeEmail(user.email, user.email);
    return res.status(200).send(emailVerifiedTemplate(user.email));
  }
}

export default new AuthController(); 