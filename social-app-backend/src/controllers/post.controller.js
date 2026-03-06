const Post = require('../models/Post');
const Engagement = require('../models/Engagement');
const User = require('../models/User');

// Create a new post
exports.createPost = async (req, res) => {
    try {
        const userId = req.user.userId; // assuming auth middleware attaches user.userId
        const { type, content, poll, threadId, community, isScheduled, scheduledFor } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let status = 'PUBLISHED';

        // Rule 1: Finance community requires moderation
        if (community && community.toLowerCase() === 'finance') {
            status = 'UNDER_REVIEW';
        }

        // Rule 2: If account age < 7 days, limit to 3 posts per day
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        if (user.createdAt > sevenDaysAgo) {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const postCountToday = await Post.countDocuments({
                author: userId,
                createdAt: { $gte: startOfDay }
            });

            if (postCountToday >= 3) {
                return res.status(429).json({ message: 'Account is under 7 days old: Posts per day limit (3) exceeded' });
            }
        }

        if (isScheduled && new Date(scheduledFor) > new Date()) {
            status = 'DRAFT';
        }

        const newPost = new Post({
            author: userId,
            type,
            content,
            poll,
            threadId,
            community,
            status,
            isScheduled,
            scheduledFor
        });

        await newPost.save();
        res.status(201).json(newPost);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Get Feed
exports.getFeed = async (req, res) => {
    try {
        const { page = 1, limit = 20, community } = req.query;
        const query = { status: 'PUBLISHED' };

        if (community) {
            query.community = community;
        }

        const posts = await Post.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('author', 'email _id') // Adjust depending on user fields available
            .exec();

        res.status(200).json(posts);
    } catch (error) {
        console.error('Error fetching feed:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Engage with post
exports.engage = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, content, parentEngagementId } = req.body;
        const userId = req.user.userId;

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const validTypes = ['like', 'comment', 'repost', 'bookmark', 'share', 'comment_like'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ message: 'Invalid engagement type' });
        }

        // Handle unique engagements to prevent duplicate likes/bookmarks/reposts
        if (['like', 'repost', 'bookmark', 'comment_like'].includes(type)) {
            const query = { user: userId, post: id, type };
            if (parentEngagementId && type === 'comment_like') {
                query.parentEngagement = parentEngagementId;
            }

            const existing = await Engagement.findOne(query);

            if (existing) {
                // Toggle off
                await existing.deleteOne();

                if (type === 'comment_like') {
                    // Decrement comment like counter
                    if (parentEngagementId) {
                        await Engagement.findByIdAndUpdate(parentEngagementId, { $inc: { likesCount: -1 } });
                    }
                } else {
                    // Decrement post counter
                    await Post.findByIdAndUpdate(id, { $inc: { [`engagementCount.${type}s`]: -1 } });
                }

                return res.status(200).json({ message: `${type} removed` });
            }
        }

        const engagementParams = {
            user: userId,
            post: id,
            type,
            content // Used for comments
        };

        if (parentEngagementId) {
            engagementParams.parentEngagement = parentEngagementId;
        }

        const engagement = new Engagement(engagementParams);
        await engagement.save();

        if (type === 'share') {
            await Post.findByIdAndUpdate(id, { $inc: { [`engagementCount.shares`]: 1 } });
        } else if (type === 'comment_like') {
            if (parentEngagementId) {
                await Engagement.findByIdAndUpdate(parentEngagementId, { $inc: { likesCount: 1 } });
            }
        } else {
            await Post.findByIdAndUpdate(id, { $inc: { [`engagementCount.${type}s`]: 1 } });
        }

        res.status(201).json(engagement);
    } catch (error) {
        console.error('Error in engagement:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'User already engaged with this type' });
        }
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Get Post Comments
exports.getComments = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        // Fetch all comments for a post
        const comments = await Engagement.find({ post: id, type: 'comment' })
            .populate('user', 'email _id') // Or populate name, avatar
            .sort({ createdAt: -1 })
            .lean(); // Return plain JS objects so we can attach properties

        if (!comments.length) return res.status(200).json([]);

        // Optionally, check if the current user has liked any of these comments
        let userLikes = new Set();
        if (userId) {
            const likes = await Engagement.find({
                post: id,
                type: 'comment_like',
                user: userId
            }).select('parentEngagement');
            userLikes = new Set(likes.map(l => l.parentEngagement.toString()));
        }

        // Build a hierarchical tree (O(N) time complexity)
        const commentMap = {};
        const rootComments = [];

        comments.forEach(comment => {
            comment.replies = [];
            comment.isLikedByMe = userLikes.has(comment._id.toString());
            commentMap[comment._id.toString()] = comment;
        });

        comments.forEach(comment => {
            if (comment.parentEngagement && commentMap[comment.parentEngagement.toString()]) {
                // Attach as reply
                commentMap[comment.parentEngagement.toString()].replies.push(comment);
            } else {
                // It's a root thread
                rootComments.push(comment);
            }
        });

        res.status(200).json(rootComments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
