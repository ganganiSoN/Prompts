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
