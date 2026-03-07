const Report = require('../models/Report');
const Post = require('../models/Post');
const User = require('../models/User');

// Get all reports (with pagination and filtering)
exports.getReports = async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        let query = {};

        if (status && status !== 'ALL') {
            query.status = status;
        }

        const reports = await Report.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('reporter', 'name email avatar')
            .populate({
                path: 'post',
                populate: { path: 'author', select: 'name email avatar' }
            })
            .exec();

        const total = await Report.countDocuments(query);

        res.status(200).json({
            reports,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Update a report's decision and take action
exports.updateReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, decision, moderatorNotes } = req.body;
        const moderatorId = req.user.userId;

        const report = await Report.findById(id).populate('post');
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        if (status) report.status = status;
        if (decision) report.decision = decision;
        if (moderatorNotes) report.moderatorNotes = moderatorNotes;

        report.reviewedBy = moderatorId;
        await report.save();

        // Take action on the Post and possibly the User based on the decision
        if (decision && report.post) {
            const post = await Post.findById(report.post._id);
            if (post) {
                switch (decision) {
                    case 'APPROVED':
                    case 'DISMISSED':
                        post.status = 'PUBLISHED';
                        break;
                    case 'REMOVED':
                        post.status = 'REMOVED';
                        break;
                    case 'USER_WARNED':
                        post.status = 'REMOVED'; // usually remove the content too
                        await User.findByIdAndUpdate(post.author, { status: 'WARNED' });
                        break;
                    case 'USER_SUSPENDED':
                        post.status = 'REMOVED';
                        await User.findByIdAndUpdate(post.author, { status: 'SUSPENDED' });
                        break;
                }
                await post.save();
            }
        }

        res.status(200).json({ message: 'Report updated successfully', report });
    } catch (error) {
        console.error('Error updating report:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Get Single User Moderation Grid
exports.getUserModerationGrid = async (req, res) => {
    try {
        const { userId } = req.params;
        const { minRisk, maxRisk, category, community, status, dateRange } = req.query;

        // 1. Verify user exists
        const user = await User.findById(userId).select('name email avatar createdAt status');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 2. Build the initial match for Post fields
        const postMatch = { 'postDoc.author': new require('mongoose').Types.ObjectId(userId) };
        if (community && community !== 'ALL') {
            postMatch['postDoc.community'] = community;
        }
        if (status && status !== 'ALL') {
            postMatch['postDoc.status'] = status;
        }

        // Date Range Logic
        if (dateRange && dateRange !== 'ALL') {
            const date = new Date();
            if (dateRange === '7') {
                date.setDate(date.getDate() - 7);
                postMatch['postDoc.createdAt'] = { $gte: date };
            } else if (dateRange === '30') {
                date.setDate(date.getDate() - 30);
                postMatch['postDoc.createdAt'] = { $gte: date };
            }
        }

        // 3. Aggregate reports
        const aggregatedReports = await Report.aggregate([
            {
                $lookup: {
                    from: 'posts',
                    localField: 'post',
                    foreignField: '_id',
                    as: 'postDoc'
                }
            },
            { $unwind: '$postDoc' },
            { $match: postMatch },
            {
                $group: {
                    _id: '$post',
                    postContent: { $first: '$postDoc.content' },
                    postCreatedAt: { $first: '$postDoc.createdAt' },
                    postStatus: { $first: '$postDoc.status' },
                    reportCount: { $sum: 1 },
                    maxRiskScore: { $max: '$aiToxicityScore' },
                    allReasons: { $push: '$reason' }
                }
            },
            { $sort: { reportCount: -1 } }
        ]);

        // 4. Process and filter calculated fields (Category & Risk Score)
        let gridData = aggregatedReports.map(agg => {
            const reasonCounts = {};
            let topReason = 'Unknown';
            let maxCount = 0;
            
            agg.allReasons.forEach(reason => {
                reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
                if (reasonCounts[reason] > maxCount) {
                    maxCount = reasonCounts[reason];
                    topReason = reason;
                }
            });

            return {
                postId: agg._id,
                content: agg.postContent,
                createdDate: agg.postCreatedAt,
                status: agg.postStatus,
                reportCount: agg.reportCount,
                riskScore: agg.maxRiskScore,
                category: topReason
            };
        });

        // Apply dynamic filters manually
        if (category && category !== 'ALL') {
            gridData = gridData.filter(row => row.category === category);
        }
        if (minRisk !== undefined && minRisk !== '') {
            gridData = gridData.filter(row => row.riskScore >= parseFloat(minRisk));
        }
        if (maxRisk !== undefined && maxRisk !== '') {
            gridData = gridData.filter(row => row.riskScore <= parseFloat(maxRisk));
        }

        res.status(200).json({
            user,
            gridData
        });

    } catch (error) {
        console.error('Error fetching user moderation grid:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
