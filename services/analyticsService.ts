import { CLICKS } from "../models/Clicks";
import { URL } from "../models/Url";
import mongoose from "mongoose";
import { PipelineStage } from "mongoose";
import { AnalyticsFilters, OverallAnalytics, PaginatedResponse } from "../types";

class AnalyticsService {
  async getOverallAnalytics(
    userId: string,
    filters: AnalyticsFilters = {}
  ): Promise<OverallAnalytics> {
    const { startDate, endDate, country, device } = filters;
    const userUrls = await URL.find({ user_id: userId }).select("_id");
    const urlIds = userUrls.map((url) => url._id);
    const matchConditions: any = {
      url_id: { $in: urlIds },
    };

    if (startDate || endDate) {
      matchConditions.timestamp = {};
      if (startDate) matchConditions.timestamp.$gte = startDate;
      if (endDate) matchConditions.timestamp.$lte = endDate;
    }

    if (country) matchConditions.country = country;
    if (device) matchConditions.device = device;

    // Parallel execution for better performance
    const [
      totalStats,
      clicksOverTime,
      locationStats,
      deviceStats,
      browserStats,
      topUrls
    ] = await Promise.all([
      this.getTotalStats(userId, matchConditions),
      this.getClicksOverTime(matchConditions),
      this.getLocationStats(matchConditions),
      this.getDeviceStats(matchConditions),
      this.getBrowserStats(matchConditions),
      this.getTopPerformingUrls(userId, matchConditions)
    ]);

    return {
      totalClicks: totalStats.totalClicks,
      totalUrls: totalStats.totalUrls,
      clicksOverTime,
      topCountries: locationStats.countries,
      topCities: locationStats.cities,
      topDevices: deviceStats,
      topBrowsers: browserStats,
      topPerformingUrls: topUrls,
    };
  }

  private async getTotalStats(userId: string, matchConditions: any) {
    const [clicksResult, urlsCount] = await Promise.all([
      CLICKS.countDocuments(matchConditions),
      URL.countDocuments({ user_id: userId, is_active: true }),
    ]);

    return {
      totalClicks: clicksResult,
      totalUrls: urlsCount,
    };
  }

  private async getClicksOverTime(matchConditions: any) {
    const pipeline: PipelineStage[] = [
      { $match: matchConditions },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
          },
          clicks: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: "$_id",
          clicks: 1,
          _id: 0,
        },
      },
    ];

    return await CLICKS.aggregate(pipeline);
  }

  private async getLocationStats(matchConditions: any) {
    const pipeline: PipelineStage[] = [
      { $match: matchConditions },
      {
        $facet: {
          countries: [
            {
              $group: {
                _id: "$country",
                clicks: { $sum: 1 },
              },
            },
            { $sort: { clicks: -1 } },
            { $limit: 10 },
          ],
          cities: [
            {
              $group: {
                _id: { country: "$country", city: "$city" },
                clicks: { $sum: 1 },
              },
            },
            { $sort: { clicks: -1 } },
            { $limit: 10 },
            {
              $project: {
                city: { $concat: ["$_id.city", ", ", "$_id.country"] },
                clicks: 1,
                _id: 0,
              },
            },
          ],
          total: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
              },
            },
          ],
        },
      },
    ];

    const result = await CLICKS.aggregate(pipeline);
    const data = result[0];
    const total = data.total[0]?.total || 1;

    return {
      countries: data.countries.map((item: any) => ({
        country: item._id,
        clicks: item.clicks,
        percentage: Math.round((item.clicks / total) * 100),
      })),
      cities: data.cities.map((item: any) => ({
        city: item.city,
        clicks: item.clicks,
        percentage: Math.round((item.clicks / total) * 100),
      })),
    };
  }

  private async getDeviceStats(matchConditions: any) {
    const pipeline: PipelineStage[] = [
      { $match: matchConditions },
      {
        $group: {
          _id: "$device",
          clicks: { $sum: 1 },
        },
      },
      { $sort: { clicks: -1 } },
      {
        $group: {
          _id: null,
          devices: { $push: { device: "$_id", clicks: "$clicks" } },
          total: { $sum: "$clicks" },
        },
      },
    ];

    const result = await CLICKS.aggregate(pipeline);
    const data = result[0];

    if (!data) return [];

    return data.devices.map((item: any) => ({
      device: item.device,
      clicks: item.clicks,
      percentage: Math.round((item.clicks / data.total) * 100),
    }));
  }

  private async getBrowserStats(matchConditions: any) {
    const pipeline: PipelineStage[] = [
      { $match: matchConditions },
      {
        $group: {
          _id: "$browser",
          clicks: { $sum: 1 },
        },
      },
      { $sort: { clicks: -1 } },
      { $limit: 10 },
      {
        $group: {
          _id: null,
          browsers: { $push: { browser: "$_id", clicks: "$clicks" } },
          total: { $sum: "$clicks" },
        },
      },
    ];

    const result = await CLICKS.aggregate(pipeline);
    const data = result[0];

    if (!data) return [];

    return data.browsers.map((item: any) => ({
      browser: item.browser,
      clicks: item.clicks,
      percentage: Math.round((item.clicks / data.total) * 100),
    }));
  }

  private async getTopPerformingUrls(userId: string, matchConditions: any) {
    const pipeline: PipelineStage[] = [
      { $match: matchConditions },
      {
        $group: {
          _id: "$url_id",
          clicks: { $sum: 1 },
        },
      },
      { $sort: { clicks: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "urls",
          localField: "_id",
          foreignField: "_id",
          as: "url",
        },
      },
      { $unwind: "$url" },
      {
        $project: {
          url_id: "$_id",
          title: "$url.title",
          short_url: "$url.short_url",
          original_url: "$url.original_url",
          clicks: 1,
          _id: 0,
        },
      },
    ];

    return await CLICKS.aggregate(pipeline);
  }

  public async getRecentActivity(
    matchConditions: any,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<any>> {
    const skip = (page - 1) * pageSize;
    const pipeline: PipelineStage[] = [
      { $match: matchConditions },
      { $sort: { timestamp: -1 } },
      { $skip: skip },
      { $limit: pageSize },
      {
        $lookup: {
          from: "urls",
          localField: "url_id",
          foreignField: "_id",
          as: "url",
        },
      },
      { $unwind: "$url" },
      {
        $project: {
          timestamp: 1,
          country: 1,
          city: 1,
          device: 1,
          url_title: "$url.title",
          _id: 0,
        },
      },
    ];

    const recentActivity = await CLICKS.aggregate(pipeline);
    const totalCount = await CLICKS.countDocuments(matchConditions);
    const response: PaginatedResponse<any> = {
      data: recentActivity,
      pagination: {
        totalItems: totalCount,
        currentPage: page,
        pageSize: pageSize,
        totalPages: Math.ceil(totalCount / pageSize), // Calculate total pages
      },
    };

    return response;
  }

  // Method for URL-specific analytics (for individual URL pages)
  async getUrlAnalytics(urlId: string, filters: AnalyticsFilters = {}) {
    const matchConditions: any = { url_id: new mongoose.Types.ObjectId(urlId) };

    if (filters.startDate || filters.endDate) {
      matchConditions.timestamp = {};
      if (filters.startDate) matchConditions.timestamp.$gte = filters.startDate;
      if (filters.endDate) matchConditions.timestamp.$lte = filters.endDate;
    }

    const [
      totalClicks,
      clicksOverTime,
      locationStats,
      deviceStats,
    ] = await Promise.all([
      CLICKS.countDocuments(matchConditions),
      this.getClicksOverTime(matchConditions),
      this.getLocationStats(matchConditions),
      this.getDeviceStats(matchConditions),
      this.getRecentActivity(matchConditions, 20),
    ]);

    return {
      totalClicks,
      clicksOverTime,
      topCountries: locationStats.countries,
      topCities: locationStats.cities,
      topDevices: deviceStats,
    };
  }
}

export const analyticsService = new AnalyticsService();
