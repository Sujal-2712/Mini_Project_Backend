import { Request } from 'express';
import { Document } from 'mongoose';

// Generic Response Interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
}


interface JwtPayload {
  userId: string;
  email: string;
  profile_img?: string;
}

export interface PaginatedResponse<T> {
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

// User Types
export interface IUser extends Document {
  email: string;
  password: string;
  total_links: number;
  profile_img: string;
  reset_password_otp?: number | undefined | null;
  reset_password_otp_expires?: Date | undefined | null;
  is_verified: boolean;
  is_active: boolean;
  last_login?: Date | undefined;
  urls: string[];
  totalClicks?: number | undefined;
  verification_token?: string | undefined | null;
  verification_token_expires?: Date | undefined | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserProfile {
  id: string;
  email: string;
  profile_img: string;
  total_links: number;
  totalClicks?: number;
}

export interface IUserLogin {
  id: string;
  email: string;
  profile_img: string;
  total_links: number;
}

// URL Types
export interface IUrl extends Document {
  original_url: string;
  custom_url?: string;
  short_url: string;
  user_id: string;
  title?: string;
  description?: string;
  qr?: string;
  clicks: string[];
  is_active: boolean;
  expires_at?: Date;
  tags?: string[];
  clickCount?: number;
  createdAt: Date;
  updatedAt: Date;
  isExpired(): boolean;
}

// export interface IUrlAnalytics {
//   totalClicks: number;
//   topCountries: { [key: string]: number };
//   topCities: { [key: string]: number };
//   topDevices: { [key: string]: number };
//   topBrowsers: { [key: string]: number };
//   topOS: { [key: string]: number };
//   clicksByDate: { [key: string]: number };
// }

export interface IUrlWithAnalytics extends IUrl {
  data: IUrl[];
  // analytics: IUrlAnalytics;
}

// Click Types
export interface IClick extends Document {
  url_id: string;
  ip: string;
  city: string;
  country: string;
  device: string;
  browser: string;
  os: string;
  referer: string;
  userAgent: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Request Types
export interface AuthenticatedRequest extends Request {
  user?: string;
}

export interface UrlCreateRequest {
  longUrl: string;
  customUrl?: string;
  title?: string;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
  profile_img: string;
}

// Email Types
export interface EmailData {
  to: string;
  subject: string;
  html: string;
}

// QR Code Types
export interface QRCodeData {
  url: string;
  options?: {
    width?: number;
    height?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  };
}

// Geo Service Types
export interface GeoData {
  ip: string;
  city: string;
  country: string;
  device: string;
  browser: string;
  os: string;
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Pagination Types
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginationResult {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// File Upload Types
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

// Environment Variables
export interface EnvironmentVariables {
  PORT: string;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  EMAIL_HOST: string;
  EMAIL_PORT: string;
  EMAIL_USER: string;
  EMAIL_PASS: string;
  NODE_ENV: string;
}



export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  country?: string;
  device?: string;
}

export interface OverallAnalytics {
  totalClicks: number;
  totalUrls: number;
  clicksOverTime: Array<{ date: string; clicks: number }>;
  topCountries: Array<{ country: string; clicks: number; percentage: number }>;
  topCities: Array<{ city: string; clicks: number; percentage: number }>;
  topDevices: Array<{ device: string; clicks: number; percentage: number }>;
  topBrowsers: Array<{ browser: string; clicks: number; percentage: number }>;
  topPerformingUrls: Array<{
      url_id: string;
      title: string;
      short_url: string;
      clicks: number;
      original_url: string;
  }>;
  recentActivity: Array<{
      timestamp: Date;
      country: string;
      city: string;
      device: string;
      url_title: string;
  }>;
}