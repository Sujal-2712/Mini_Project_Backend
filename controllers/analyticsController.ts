import { AnalyticsFilters, analyticsService } from "../services/analyticsService";
import { ApiResponse, AuthenticatedRequest } from "../types";
import { Response } from 'express';
import { URL } from "../models/Url";

class AnalyticsController {
    async getOverview(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
        const user_id = req.user;

        if (!user_id) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }
        const {
            startDate,
            endDate,
            country,
            device,
            timeRange = '30d' // 7d, 30d, 90d, 1y, all

        } = req.query;

        // Parse date filters
        const filters: AnalyticsFilters = {};

        if (timeRange !== 'all') {
            const days = parseInt(timeRange.toString().replace('d', '').replace('y', '')) || 30;
            const multiplier = timeRange.toString().includes('y') ? 365 : 1;
            filters.endDate = new Date();
            filters.startDate = new Date(Date.now() - (days * multiplier * 24 * 60 * 60 * 1000));
        }

        if (startDate) {
            filters.startDate = new Date(startDate.toString());
        }

        if (endDate) {
            filters.endDate = new Date(endDate.toString());
        }

        if (country) {
            filters.country = country.toString().toLowerCase();
        }

        if (device) {
            filters.device = device.toString().toLowerCase();
        }

        const analytics = await analyticsService.getOverallAnalytics(user_id, filters);

        res.status(200).json({
            success: true,
            message: 'Analytics retrieved successfully',
            data: analytics
        });
    }


    async getDashboardAnalytics(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
        const user_id = req.user;
        const last30Days = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
        const last7Days = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));

        const [
            last30DaysAnalytics,
            last7DaysAnalytics,
            allTimeAnalytics
        ] = await Promise.all([
            analyticsService.getOverallAnalytics(user_id || '', { startDate: last30Days }),
            analyticsService.getOverallAnalytics(user_id || '', { startDate: last7Days }),
            analyticsService.getOverallAnalytics(user_id || '', {})
        ]);

        const clicksGrowth = last30DaysAnalytics.totalClicks > 0
            ? Math.round(((last7DaysAnalytics.totalClicks - (last30DaysAnalytics.totalClicks / 4)) / (last30DaysAnalytics.totalClicks / 4)) * 100)
            : 0;

        res.status(200).json({
            success: true,
            message: 'Dashboard analytics retrieved successfully',
            data: {
                summary: {
                    totalClicks: allTimeAnalytics.totalClicks,
                    totalUrls: allTimeAnalytics.totalUrls,
                    clicksLast7Days: last7DaysAnalytics.totalClicks,
                    clicksLast30Days: last30DaysAnalytics.totalClicks,
                    clicksGrowth: clicksGrowth
                },
                charts: {
                    clicksOverTime: last30DaysAnalytics.clicksOverTime,
                    topDevices: last30DaysAnalytics.topDevices.slice(0, 5),
                    topCountries: last30DaysAnalytics.topCountries.slice(0, 5),
                    topUrls: last30DaysAnalytics.topPerformingUrls.slice(0, 5)
                },
                recentActivity: allTimeAnalytics.recentActivity.slice(0, 5)
            }
        });
    }


    async getUrlSpecificAnalytics(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
        const { urlId } = req.params;
        const user_id = req.user;
        const { startDate, endDate, timeRange = '30d' } = req.query;

        const url = await URL.findOne({ _id: urlId, user_id });
        if (!url) {
            res.status(404).json({
                success: false,
                message: 'URL not found or access denied'
            });
            return;
        }

        const filters: AnalyticsFilters = {};

        if (timeRange !== 'all') {
            const days = parseInt(timeRange.toString().replace('d', '')) || 30;
            filters.endDate = new Date();
            filters.startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
        }

        if (startDate) filters.startDate = new Date(startDate.toString());
        if (endDate) filters.endDate = new Date(endDate.toString());

        const analytics = await analyticsService.getUrlAnalytics(urlId || '', filters);

        res.status(200).json({
            success: true,
            message: 'URL analytics retrieved successfully',
            data: {
                ...analytics,
                url: {
                    title: url.title,
                    short_url: url.short_url,
                    original_url: url.original_url,
                    created_at: url.createdAt
                }
            }
        });


    }
}

export default new AnalyticsController(); 