# URL Shortener API - TypeScript Version

A complete URL shortening service built with Node.js, Express, TypeScript, and MongoDB.

## Features

- **User Authentication**: Signup, login, password reset with JWT
- **URL Shortening**: Create custom or auto-generated short URLs
- **QR Code Generation**: Automatic QR code generation for shortened URLs
- **Analytics**: Track clicks with detailed analytics (location, device, browser, OS)
- **Rate Limiting**: Built-in rate limiting for API endpoints
- **Email Notifications**: Password reset and URL management emails
- **TypeScript**: Full TypeScript implementation with strict typing

## Project Structure

```
src/
├── config/
│   └── db.ts                 # Database connection
├── controllers/
│   ├── authController.ts     # Authentication logic
│   └── urlController.ts      # URL management logic
├── middleware/
│   ├── auth.ts              # JWT authentication middleware
│   ├── errorHandler.ts      # Global error handling
│   ├── rateLimiter.ts       # Rate limiting middleware
│   └── validation.ts        # Request validation
├── models/
│   ├── User.ts              # User model
│   ├── Url.ts               # URL model
│   └── Clicks.ts            # Click tracking model
├── routes/
│   ├── authRoutes.ts        # Authentication routes
│   └── urlRoutes.ts         # URL management routes
├── services/
│   ├── emailService.ts      # Email functionality
│   ├── geoService.ts        # Geolocation and analytics
│   ├── qrService.ts         # QR code generation
│   └── urlService.ts        # URL business logic
├── types/
│   └── index.ts             # TypeScript type definitions
├── utils/
│   ├── logger/
│   │   └── logger.ts        # Winston logger configuration
│   └── templates/
│       ├── createdURLTemplate.ts
│       ├── deletedURLTemplate.ts
│       ├── passwordResetTemplate.ts
│       └── welcomeEmailTemplate.ts
└── index.ts                 # Main application entry point
```

## Generic Response Format

The API uses a consistent response format:

### Standard Response
```typescript
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
}
```

### Paginated Response
```typescript
interface PaginatedResponse<T> {
  success: boolean;
  message?: string;
  data: T[];
  pagination: {
    totalItems: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
  };
}
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password (requires auth)
- `GET /api/auth/profile` - Get user profile (requires auth)
- `PUT /api/auth/profile` - Update user profile (requires auth)

### URL Management
- `POST /api/url/shorten` - Create shortened URL (requires auth)
- `GET /api/url/user-urls` - Get user's URLs with pagination (requires auth)
- `GET /api/url/get/:id` - Get specific URL details (requires auth)
- `DELETE /api/url/delete/:id` - Delete URL (requires auth)
- `GET /url/:shortUrl` - Redirect to original URL

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=24h
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_password
   NODE_ENV=development
   ```

4. Build the project:
   ```bash
   npm run build
   ```

5. Start the server:
   ```bash
   npm start
   ```

## Development

For development with hot reload:
```bash
npm run dev
```

## Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start the production server
- `npm run dev` - Start development server with hot reload
- `npm run clean` - Clean the dist directory

## TypeScript Features

- **Strict Type Checking**: Full TypeScript strict mode enabled
- **Generic Response Types**: Consistent API response format
- **Interface Definitions**: Complete type definitions for all models and requests
- **Type Safety**: Compile-time error checking for all operations
- **Modern ES2020**: Latest JavaScript features with TypeScript support

## Database Models

### User Model
- Email and password authentication
- Profile image generation
- Password reset functionality
- URL tracking

### URL Model
- Original and shortened URLs
- Custom URL support
- QR code storage
- Expiration dates
- Click tracking

### Clicks Model
- Detailed analytics data
- Geolocation information
- Device and browser tracking
- Timestamp and referrer data

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on sensitive endpoints
- Input validation and sanitization
- CORS configuration
- Helmet security headers

## Error Handling

Comprehensive error handling with:
- Validation errors
- Authentication errors
- Database errors
- Custom error responses
- Detailed logging

## Logging

Winston-based logging system with:
- Console and file logging
- Error tracking
- Request logging
- Performance monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License. 