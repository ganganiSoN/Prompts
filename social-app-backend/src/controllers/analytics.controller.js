const Post = require('../models/Post');
const User = require('../models/User');
const Engagement = require('../models/Engagement');
const mongoose = require('mongoose');

exports.getCreatorMetrics = async (req, res) => {
    console.log("HIT CREATOR METRICS ROUTE!");
    try {
        const userId = req.user.userId;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 1. Overview Stats (Total Posts, Total Engagement)
        const postsAggregation = await Post.aggregate([
            { $match: { author: userId } },
            {
                $group: {
                    _id: null,
                    totalPosts: { $sum: 1 },
                    totalLikes: { $sum: "$engagementCount.likes" },
                    totalComments: { $sum: "$engagementCount.comments" },
                    totalReposts: { $sum: "$engagementCount.reposts" },
                    totalBookmarks: { $sum: "$engagementCount.bookmarks" },
                    totalShares: { $sum: "$engagementCount.shares" },
                }
            }
        ]);

        const stats = postsAggregation.length > 0 ? postsAggregation[0] : { totalPosts: 0, totalLikes: 0, totalComments: 0, totalReposts: 0, totalBookmarks: 0, totalShares: 0 };
        const totalEngagement = stats.totalLikes + stats.totalComments + stats.totalReposts + stats.totalBookmarks + stats.totalShares;
        const engagementRate = stats.totalPosts > 0 ? ((totalEngagement / stats.totalPosts) * 100).toFixed(2) : 0;

        // 2. Follower Growth Pipeline (Last 30 Days)
        const followerGrowth = await Engagement.aggregate([
            {
                $match: {
                    targetUser: userId,
                    type: 'follow',
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 3. Post Performance (Top 5 Ranked by Engagement)
        const topPosts = await Post.find({ author: userId })
            .select('content type engagementCount createdAt')
            .sort({
                'engagementCount.likes': -1,
                'engagementCount.comments': -1
            })
            .limit(5);

        // 4. Time-of-Day Heatmap Pipeline
        // Map user's POSTS and their received engagements to the Hour and Day they were published.
        const heatmapData = await Post.aggregate([
            { $match: { author: userId } },
            {
                $project: {
                    dayOfWeek: { $dayOfWeek: "$createdAt" }, // 1 (Sun) to 7 (Sat)
                    hourOfDay: { $hour: "$createdAt" },      // 0 to 23
                    engagement: {
                        $add: [
                            { $ifNull: ["$engagementCount.likes", 0] },
                            { $ifNull: ["$engagementCount.comments", 0] },
                            { $ifNull: ["$engagementCount.reposts", 0] },
                            { $ifNull: ["$engagementCount.shares", 0] }
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: { day: "$dayOfWeek", hour: "$hourOfDay" },
                    totalEngagement: { $sum: "$engagement" },
                    postCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    day: "$_id.day",
                    hour: "$_id.hour",
                    avgEngagement: { $divide: ["$totalEngagement", "$postCount"] },
                    totalEngagement: 1,
                    postCount: 1
                }
            }
        ]);

        res.status(200).json({
            overview: {
                totalPosts: stats.totalPosts,
                totalEngagement,
                engagementRate: parseFloat(engagementRate),
            },
            followerGrowth,
            topPosts,
            heatmapData
        });

    } catch (error) {
        console.error('Error fetching creator analytics:', error);
        res.status(500).json({ message: error.stack || error.message, error: error.toString() });
    }
};

exports.getAdminOverview = async (req, res) => {
    try {
        const Report = require('../models/Report'); // Import needed

        // 1. Active Users (Users who logged in or created an account recently)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const activeUsers = await User.countDocuments({
            $or: [
                { createdAt: { $gte: thirtyDaysAgo } },
                { updatedAt: { $gte: thirtyDaysAgo } }
            ],
            status: 'ACTIVE'
        });

        // 2. Flagged Content Ratio
        const totalPosts = await Post.countDocuments();
        const flaggedPosts = await Post.countDocuments({ status: { $in: ['FLAGGED', 'UNDER_REVIEW', 'REMOVED'] } });
        const flaggedContentRatio = totalPosts > 0 ? ((flaggedPosts / totalPosts) * 100).toFixed(2) : 0;

        // 3. Moderation SLA (Average time between Report creation and Decision)
        const resolvedReports = await Report.aggregate([
            { $match: { status: { $in: ['CLOSED', 'DECISION'] }, updatedAt: { $exists: true } } },
            {
                $project: {
                    resolutionTimeMs: { $subtract: ["$updatedAt", "$createdAt"] }
                }
            },
            {
                $group: {
                    _id: null,
                    avgResolutionTime: { $avg: "$resolutionTimeMs" }
                }
            }
        ]);

        const avgResolutionHours = resolvedReports.length > 0
            ? (resolvedReports[0].avgResolutionTime / (1000 * 60 * 60)).toFixed(1)
            : 0;

        // 4. Abuse Metrics (Breakdown by report reason)
        const abuseMetrics = await Report.aggregate([
            {
                $group: {
                    _id: "$reason",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // 5. Trending Topics (Simple aggregation based on recent post engagement)
        // Since we don't have explicit hashtag arrays yet, we'll aggregate by community
        const trendingTopics = await Post.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: "$community",
                    totalEngagement: {
                        $sum: {
                            $add: [
                                { $ifNull: ["$engagementCount.likes", 0] },
                                { $ifNull: ["$engagementCount.comments", 0] },
                                { $ifNull: ["$engagementCount.reposts", 0] }
                            ]
                        }
                    },
                    postCount: { $sum: 1 }
                }
            },
            { $sort: { totalEngagement: -1 } },
            { $limit: 5 }
        ]);

        res.status(200).json({
            activeUsers,
            flaggedContentRatio: parseFloat(flaggedContentRatio),
            moderationSLAHours: parseFloat(avgResolutionHours),
            abuseMetrics,
            trendingTopics
        });

    } catch (error) {
        console.error('Error fetching admin analytics overview:', error);
        res.status(500).json({ message: 'Error fetching admin metrics' });
    }
};
