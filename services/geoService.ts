import axios from 'axios';
import UAParser from 'ua-parser-js';
import logger from '../utils/logger/logger';
import { Request } from 'express';


interface GeoProvider {
  name: string;
  url: (ip: string) => string;
  parseResponse: (data: any) => { city: string; country: string; ip: string };
  isValid: (data: any) => boolean;
}

interface LocationData {
  city: string;
  country: string;
  ip: string;
}

interface DeviceInfo {
  device: string;
  browser: string;
  os: string;
}

interface AnalyticsData extends LocationData, DeviceInfo {
  timestamp: Date;
  userAgent: string;
  referer: string;
}

class GeoService {
  private geoProviders: GeoProvider[];

  constructor() {
    this.geoProviders = [
      {
        name: 'ipapi',
        url: (ip: string) => `http://ip-api.com/json/${ip}?fields=status,country,city,query`,
        parseResponse: (data: any) => ({
          city: data.city || 'Unknown',
          country: data.country || 'Unknown',
          ip: data.query
        }),
        isValid: (data: any) => data.status === 'success'
      },
      {
        name: 'ipgeolocation',
        url: (ip: string) => `https://api.ipgeolocation.io/ipgeo?apiKey=${process.env['IPGEOLOCATION_KEY']}&ip=${ip}`,
        parseResponse: (data: any) => ({
          city: data.city || 'Unknown',
          country: data.country_name || 'Unknown',
          ip: data.ip
        }),
        isValid: (data: any) => !data.message
      },
      {
        name: 'ipstack',
        url: (ip: string) => `http://api.ipstack.com/${ip}?access_key=${process.env['IPSTACK_KEY']}`,
        parseResponse: (data: any) => ({
          city: data.city || 'Unknown',
          country: data.country_name || 'Unknown',
          ip: data.ip
        }),
        isValid: (data: any) => !data.error
      }
    ];
  }

  extractClientIP(req: Request): string | null {
    const forwarded = req.headers['x-forwarded-for'] as string;
    const realIP = req.headers['x-real-ip'] as string;
    const cfConnectingIP = req.headers['cf-connecting-ip'] as string; // Cloudflare
    const azureClientIP = req.headers['x-azure-clientip'] as string; // Azure
    const xClientIP = req.headers['x-client-ip'] as string;

    let clientIP = (req as any).connection?.remoteAddress || 
                   (req as any).socket?.remoteAddress || 
                   req.ip || '';

    // Priority order for proxy headers
    if (cfConnectingIP) {
      clientIP = cfConnectingIP;
    } else if (azureClientIP) {
      clientIP = azureClientIP;
    } else if (realIP) {
      clientIP = realIP;
    } else if (xClientIP) {
      clientIP = xClientIP;
    } else if (forwarded) {
      // x-forwarded-for may contain multiple IPs, take the first one
      clientIP = forwarded.split(',')[0]?.trim() || '';
    } 

    // Clean up the IP address
    if (clientIP) {
      // Remove IPv6 prefix if present
      clientIP = clientIP.replace(/^::ffff:/, '');
      
      // Handle localhost scenarios
      if (clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === 'localhost') {
        return null; // Will fallback to external IP detection
      }
    }

    return clientIP;
  }

  async getExternalIP(): Promise<string | null> {
    const ipServices = [
      'https://api.ipify.org?format=json',
      'https://ipapi.co/json',
      'https://httpbin.org/ip'
    ];

    for (const service of ipServices) {
      try {
        const response = await axios.get(service, { timeout: 5000 });
        
        if (service.includes('ipify')) {
          return response.data.ip;
        } else if (service.includes('ipapi.co')) {
          return response.data.ip;
        } else if (service.includes('httpbin')) {
          return response.data.origin.split(',')[0].trim();
        }
      } catch (error) {
        logger.warn(`Failed to get IP from ${service}:`, error instanceof Error ? error.message : 'Unknown error');
        continue;
      }
    }

    return null;
  }

  async getLocationFromIP(ip: string): Promise<LocationData> {
    if (!ip) {
      return {
        city: 'Unknown',
        country: 'Unknown',
        ip: 'Unknown'
      };
    }

    // Try each provider until one succeeds
    for (const provider of this.geoProviders) {
      try {
        // Skip providers that require API keys if not configured
        if (provider.name === 'ipgeolocation' && !process.env['IPGEOLOCATION_KEY']) continue;
        if (provider.name === 'ipstack' && !process.env['IPSTACK_KEY']) continue;

        const response = await axios.get(provider.url(ip), {
          timeout: 5000,
          headers: {
            'User-Agent': 'URL-Shortener-Service/1.0'
          }
        });

        if (provider.isValid(response.data)) {
          const locationData = provider.parseResponse(response.data);
          logger.info(`Successfully got location from ${provider.name} for IP: ${ip}`);
          return locationData;
        }
      } catch (error) {
        logger.warn(`${provider.name} failed for IP ${ip}:`, error instanceof Error ? error.message : 'Unknown error');
        continue;
      }
    }

    // If all providers fail, return default
    logger.warn(`All geolocation providers failed for IP: ${ip}`);
    return {
      city: 'Unknown',
      country: 'Unknown',
      ip: ip
    };
  }

  parseDeviceInfo(userAgent: string): DeviceInfo {
    if (!userAgent) {
      return {
        device: 'unknown',
        browser: 'unknown',
        os: 'unknown'
      };
    }

    const parser = new (UAParser as any)(userAgent);
    const result = parser.getResult();

    return {
      device: result.device.type || 'desktop',
      browser: result.browser.name || 'unknown',
      os: result.os.name || 'unknown'
    };
  }

  async getAnalyticsData(req: Request): Promise<AnalyticsData> {
    try {
      // Extract IP address
      let clientIP = this.extractClientIP(req);
      if (!clientIP) {
        clientIP = await this.getExternalIP();
      }

      // Get location data
      const locationData = await this.getLocationFromIP(clientIP || 'Unknown');

      // Get device info
      const deviceInfo = this.parseDeviceInfo(req.headers['user-agent'] as string);

      // Combine all data
      const analyticsData: AnalyticsData = {
        ...locationData,
        ...deviceInfo,
        timestamp: new Date(),
        userAgent: req.headers['user-agent'] as string || 'unknown',
        referer: req.headers.referer as string || req.headers['referrer'] as string || 'direct'
      };

      logger.info('Analytics data collected:', {
        ip: clientIP,
        city: analyticsData.city,
        country: analyticsData.country,
        device: analyticsData.device
      });

      return analyticsData;
    } catch (error) {
      logger.error('Error collecting analytics data:', error);
      
      return {
        city: 'Unknown',
        country: 'Unknown',
        device: 'unknown',
        browser: 'unknown',
        os: 'unknown',
        ip: 'Unknown',
        timestamp: new Date(),
        userAgent: req.headers['user-agent'] as string || 'unknown',
        referer: req.headers.referer as string || req.headers['referrer'] as string || 'direct'
      };
    }
  }
}

export default new GeoService(); 