import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { nanoid } from 'nanoid';

import { URL } from '../models/Url';
import { USER } from '../models/User';
import { CLICKS } from '../models/Clicks';
import urlService from '../services/urlService';
import qrService from '../services/qrService';
import geoService from '../services/geoService';
import logger from '../utils/logger/logger';
import { AuthenticatedRequest, ApiResponse, IUrlWithAnalytics, IUrlAnalytics, PaginatedResponse } from '../types/index';

class UrlController {
  async shortenUrl(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          error: errors.array(),
        });
        return;
      }

      const { longUrl, customUrl, title } = req.body;
      const userId = req.user;
      const qrCodeBuffer = (req as any).file?.buffer;
      let qrCodeBase64: string | undefined;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      // Step 1: Check if longUrl already exists
      const existingLongUrl = await urlService.findByLongUrl(longUrl, userId);
      if (existingLongUrl) {
        res.status(409).json({
          success: false,
          message: "This long URL already exists in your account",
          data: existingLongUrl,
        });
        return;
      }

      if (customUrl) {
        const existingCustomUrl = await urlService.findByCustomUrl(customUrl);
        if (existingCustomUrl) {
          res.status(409).json({
            success: false,
            message: "Custom URL already used. Please choose another.",
            data: existingCustomUrl,
          });
          return;
        }
      }

      if (qrCodeBuffer) {
        qrCodeBase64 = `data:image/png;base64,${qrCodeBuffer.toString("base64")}`;
      } else {
        qrCodeBase64 = await qrService.generateQRCode(longUrl);
      }

      const shortId = customUrl || nanoid(8);
      const urlData = await urlService.createShortUrl({
        longUrl,
        customUrl: shortId,
        title: title || longUrl,
        userId,
        qrCode: qrCodeBase64,
      });

      res.status(201).json({
        success: true,
        message: "URL shortened successfully",
        data: urlData,
      });
    } catch (error) {
      console.error(error);
      logger.error("Error shortening URL:", error);

      if ((error as any).code === 11000) {
        res.status(400).json({
          success: false,
          message: "Custom URL already exists",
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getUserUrls(req: AuthenticatedRequest, res: Response<PaginatedResponse<IUrlWithAnalytics>>): Promise<void> {
    try {
      const userId = req.user;
      const page = parseInt(req.query['page'] as string) || 1;
      const limit = parseInt(req.query['limit'] as string) || 10;
      const skip = (page - 1) * limit;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
          data: [],
          pagination: {
            totalItems: 0,
            currentPage: page,
            pageSize: limit,
            totalPages: 0
          }
        });
        return;
      }

      const urls = await URL.find({ user_id: userId })
        .populate({
          path: "clicks",
          select: "city device country browser os timestamp",
          options: { sort: { createdAt: -1 } },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalUrls = await URL.countDocuments({ user_id: userId });
      const urlsWithAnalytics = urls.map((url) => {
        const analytics = this.calculateUrlAnalytics(url.clicks as any[]);
        return {
          ...url.toObject(),
          analytics,
        };
      });

      res.status(200).json({
        success: true,
        message: "URLs fetched successfully",
        data: urlsWithAnalytics,
        pagination: {
          totalItems: totalUrls,
          currentPage: page,
          pageSize: limit,
          totalPages: Math.ceil(totalUrls / limit)
        }
      });
    } catch (error) {
      logger.error("Error fetching user URLs:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch URLs",
        data: [],
        pagination: {
          totalItems: 0,
          currentPage: 1,
          pageSize: 10,
          totalPages: 0
        }
      });
    }
  }

  async getUrlById(req: AuthenticatedRequest, res: Response<ApiResponse<IUrlWithAnalytics>>): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const url = await URL.findOne({ _id: id, user_id: userId }).populate({
        path: "clicks",
        select: "city device country browser os timestamp referer",
        options: { sort: { createdAt: -1 } },
      });

      if (!url) {
        res.status(404).json({
          success: false,
          message: "URL not found",
        });
        return;
      }

      const analytics = this.calculateDetailedAnalytics(url.clicks as any[]);

      res.status(200).json({
        success: true,
        message: "URL fetched successfully",
        data: {
          ...url.toObject(),
          analytics,
        },
      });
    } catch (error) {
      logger.error("Error fetching URL:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch URL",
      });
    }
  }

  async deleteUrl(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const deletedURL = await URL.findOneAndDelete({
        _id: id,
        user_id: userId,
      });

      if (!deletedURL) {
        res.status(404).json({
          success: false,
          message: "URL not found",
        });
        return;
      }

      await USER.findByIdAndUpdate(userId, {
        $pull: { urls: id },
        $inc: { total_links: -1 },
      });
      await CLICKS.deleteMany({ url_id: id });
      
      res.status(200).json({
        success: true,
        message: "URL deleted successfully",
      });
    } catch (error) {
      logger.error("Error deleting URL:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete URL",
      });
    }
  }

  async redirectUrl(req: Request, res: Response): Promise<void> {
    try {
      const { shortUrl } = req.params;

      const urlData = await URL.findOne({ short_url: shortUrl }).select(
        "_id original_url"
      );
      if (!urlData) {
        res.status(404).json({
          success: false,
          message: "URL not found",
        });
        return;
      }
      await this.trackClick((urlData._id as any).toString(), req);
      res.redirect(301, urlData.original_url);
    } catch (error) {
      logger.error("Error redirecting URL:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while processing your request",
      });
    }
  }

  private async trackClick(urlId: string, req: Request): Promise<void> {
    try {
      const analyticsData = await geoService.getAnalyticsData(req);

      // Create click record
      const click = new CLICKS({
        url_id: urlId,
        city: analyticsData.city.toLowerCase(),
        country: analyticsData.country.toLowerCase(),
        device: analyticsData.device.toLowerCase(),
        browser: analyticsData.browser.toLowerCase(),
        os: analyticsData.os.toLowerCase(),
        ip: analyticsData.ip,
        referer: analyticsData.referer,
        userAgent: analyticsData.userAgent,
        timestamp: analyticsData.timestamp,
      });

      await click.save();

      // Update URL with click reference
      await URL.findByIdAndUpdate(urlId, {
        $push: { clicks: click._id },
      });

      logger.info(`Click tracked for URL: ${urlId}`);
    } catch (error) {
      logger.error("Error tracking click:", error);
    }
  }

  private calculateUrlAnalytics(clicks: any[]): IUrlAnalytics {
    const analytics: IUrlAnalytics = {
      totalClicks: clicks.length,
      topCountries: {},
      topCities: {},
      topDevices: {},
      topBrowsers: {},
      topOS: {},
      clicksByDate: {},
    };

    clicks.forEach((click) => {
      // Count countries
      analytics.topCountries[click.country] = (analytics.topCountries[click.country] || 0) + 1;

      // Count cities
      analytics.topCities[click.city] = (analytics.topCities[click.city] || 0) + 1;

      // Count devices
      analytics.topDevices[click.device] = (analytics.topDevices[click.device] || 0) + 1;

      // Count browsers
      analytics.topBrowsers[click.browser] = (analytics.topBrowsers[click.browser] || 0) + 1;

      // Count OS
      analytics.topOS[click.os] = (analytics.topOS[click.os] || 0) + 1;

      // Count by date
      const date = new Date(click.timestamp).toISOString().split('T')[0];
      if (date) {
        analytics.clicksByDate[date] = (analytics.clicksByDate[date] || 0) + 1;
      }
    });

    // Sort all objects by value (descending)
    analytics.topCountries = this.sortObjectByValue(analytics.topCountries);
    analytics.topCities = this.sortObjectByValue(analytics.topCities);
    analytics.topDevices = this.sortObjectByValue(analytics.topDevices);
    analytics.topBrowsers = this.sortObjectByValue(analytics.topBrowsers);
    analytics.topOS = this.sortObjectByValue(analytics.topOS);

    return analytics;
  }

  private calculateDetailedAnalytics(clicks: any[]): IUrlAnalytics {
    return this.calculateUrlAnalytics(clicks);
  }

  private sortObjectByValue(obj: { [key: string]: number }): { [key: string]: number } {
    return Object.fromEntries(
      Object.entries(obj).sort(([, a], [, b]) => b - a)
    );
  }
}

export default new UrlController(); 