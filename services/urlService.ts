import { URL } from "../models/Url";
import { USER } from "../models/User";
import shortid from "shortid";
import logger from "../utils/logger/logger";
import { IUrl } from "../types/index";

interface CreateUrlData {
  longUrl: string;
  customUrl?: string;
  title?: string;
  userId: string;
  qrCode?: string | null;
  source: string;
}

interface CreatedUrlResponse {
  _id: string;
  original_url: string;
  short_url: string;
  custom_url?: string | undefined;
  title: string;
  source: string;
  qr?: string | null | undefined;
  createdAt: Date;
}

class UrlService {
  async generateUniqueShortUrl(): Promise<string> {
    let shortUrl = '';
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 100;

    while (!isUnique && attempts < maxAttempts) {
      shortUrl = shortid.generate();
      const existing = await URL.findOne({ short_url: shortUrl });
      isUnique = !existing;
      attempts++;
    }

    if (!isUnique) {
      throw new Error("Unable to generate unique short URL");
    }

    return shortUrl;
  }

  async createShortUrl({ longUrl, customUrl, title, userId, qrCode,source }: CreateUrlData): Promise<CreatedUrlResponse> {
    try {
      // Generate short URL
      const shortUrl = customUrl || (await this.generateUniqueShortUrl());
      if (customUrl) {
        const existing = await URL.findOne({
          $or: [
            { custom_url: customUrl.toLowerCase() },
            { short_url: customUrl.toLowerCase() },
          ],
        });

        if (existing) {
          throw new Error("Custom URL already exists");
        }
      }

      // Create new URL document
      const newUrl = new URL({
        original_url: longUrl,
        custom_url: customUrl ? customUrl.toLowerCase() : undefined,
        short_url: shortUrl,
        user_id: userId,
        title: title || longUrl,
        qr: qrCode,
        source
      });
      
      await newUrl.save();
      logger.info(`URL shortened successfully: ${longUrl} -> ${shortUrl}`);

      return {
        _id: (newUrl._id as any).toString(),
        original_url: longUrl,
        short_url: shortUrl,
        custom_url: customUrl,
        title: newUrl.title || '',
        qr: qrCode || null,
        createdAt: newUrl.createdAt,
        source: source
      };
    } catch (error) {
      logger.error("Error creating short URL:", error);
      throw error;
    }
  }

  async getUrlByShortUrl(shortUrl: string): Promise<IUrl | null> {
    try {
      const url = await URL.findOne({
        $or: [{ short_url: shortUrl }, { custom_url: shortUrl }],
        is_active: true,
      });

      if (!url) {
        return null;
      }

      // Check if URL is expired
      if (url.isExpired()) {
        return null;
      }

      return url;
    } catch (error) {
      logger.error("Error getting URL by short URL:", error);
      throw error;
    }
  }

  async findByLongUrl(longUrl: string, userId: string): Promise<IUrl | null> {
    return URL.findOne({ original_url: longUrl, user_id: userId });
  }

  async findByCustomUrl(customUrl: string): Promise<IUrl | null> {
    return URL.findOne({ custom_url: customUrl });
  }
}

export default new UrlService(); 