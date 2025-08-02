import { body, param, query } from 'express-validator';

const urlValidation = {
  shortenUrl: [
    body('longUrl')
      .notEmpty()
      .withMessage('Original URL is required')
      .isURL({ require_protocol: true })
      .withMessage('Please provide a valid URL with protocol (http/https)'),

    body('customUrl')
      .optional()
      .isLength({ max: 8 })
      .withMessage('Custom URL cannot exceed 8 characters'),

    body('title')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Title cannot exceed 200 characters'),

    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters')
  ],

  getUrl: [
    param('id')
      .isMongoId()
      .withMessage('Invalid URL ID format')
  ],

  getUserUrls: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ]
};

const authValidation = {
  signup: [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),

    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
  ],

  login: [
    body('email')
      .notEmpty()
      .isEmail()
      .withMessage('Email is required')
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),

    body('password')
      .notEmpty()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
  ],

  forgotPassword: [
    body('email') 
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail()
  ],

  resetPassword: [
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
  ]
};

export { urlValidation, authValidation }; 