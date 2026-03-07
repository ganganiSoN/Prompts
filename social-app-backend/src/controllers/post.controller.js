const Post = require('../models/Post');
const Engagement = require('../models/Engagement');
const User = require('../models/User');
const Report = require('../models/Report');

// Create a new post
exports.createPost = async (req, res) => {
    try {
        const userId = req.user.userId; // assuming auth middleware attaches user.userId
        const { type, content, poll, threadId, community, isScheduled, scheduledFor, status: explicitStatus } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let status = explicitStatus === 'DRAFT' ? 'DRAFT' : 'PUBLISHED';

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

        // Populate author to match feed item shape for seamless frontend insertion
        const populatedPost = await Post.findById(newPost._id)
            .populate('author', 'email _id name avatar');

        res.status(201).json(populatedPost);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Get Feed
exports.getFeed = async (req, res) => {
    try {
        const { page = 1, limit = 20, community, followingOnly } = req.query;
        const query = { status: 'PUBLISHED' };
        const userId = req.user?.userId;

        if (followingOnly === 'true' && userId) {
            // Get array of user IDs that current user follows
            const followingEngagements = await Engagement.find({ user: userId, type: 'follow' }).select('targetUser');
            const followingIds = followingEngagements.map(eng => eng.targetUser);
            // Include user's own posts in their feed as well
            followingIds.push(userId);
            query.author = { $in: followingIds };
        }

        if (community) {
            query.community = community;
        }

        const posts = await Post.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('author', 'email _id name avatar')
            .populate({
                path: 'originalPost',
                populate: { path: 'author', select: 'email _id name avatar' }
            })
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

// Vote on Poll Option
exports.votePoll = async (req, res) => {
    try {
        const { id } = req.params;
        const { optionIndex } = req.body;
        const userId = req.user.userId;

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.type !== 'poll' || !post.poll || !post.poll.options) {
            return res.status(400).json({ message: 'Post is not a valid poll' });
        }

        if (optionIndex < 0 || optionIndex >= post.poll.options.length) {
            return res.status(400).json({ message: 'Invalid poll option index' });
        }

        // Ideally, check Engagement model to prevent double voting. For now, track via Engagement:
        const existingVote = await Engagement.findOne({ user: userId, post: id, type: 'poll_vote' });
        if (existingVote) {
            return res.status(400).json({ message: 'You have already voted on this poll' });
        }

        // Increment the specific option vote
        post.poll.options[optionIndex].votes += 1;
        await post.save();

        // Record vote
        await Engagement.create({
            user: userId,
            post: id,
            type: 'poll_vote',
            content: optionIndex.toString() // Store the index they voted for in content
        });

        // Re-fetch populated post
        const populatedPost = await Post.findById(id).populate('author', 'email _id name avatar');

        res.status(200).json(populatedPost);
    } catch (error) {
        console.error('Error voting on poll:', error);
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

// Repost a post
exports.repostPost = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const content = req.body.content || ''; // Optional quote quote for the repost

        // Check if original post exists
        const originalPost = await Post.findById(id);
        if (!originalPost) {
            return res.status(404).json({ message: 'Original post not found' });
        }

        // Check if user already reposted this exact post (prevent spam)
        const existingRepost = await Post.findOne({
            author: userId,
            type: 'repost',
            originalPost: id
        });

        if (existingRepost) {
            return res.status(400).json({ message: 'You have already reposted this post' });
        }

        // Create the repost entry
        const newRepost = await Post.create({
            author: userId,
            type: 'repost',
            content: content,
            originalPost: id,
            community: originalPost.community || 'General' // keep it in same community realm
        });

        // Increment the repost count on the original post
        await Post.findByIdAndUpdate(id, { $inc: { 'engagementCount.reposts': 1 } });

        // Also log the engagement for history/analytics
        await Engagement.create({
            post: id,
            user: userId,
            type: 'repost'
        });

        const populatedRepost = await Post.findById(newRepost._id)
            .populate('author', 'name email avatar')
            .populate({
                path: 'originalPost',
                populate: { path: 'author', select: 'name email avatar' }
            });

        res.status(201).json(populatedRepost);

    } catch (error) {
        console.error('Error in repostPost:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Delete a post
exports.deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check if the user is the author
        if (post.author.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this post' });
        }

        // Delete associated engagements (likes, comments, etc)
        await Engagement.deleteMany({ post: id });

        // If this post is a repost of something, we don't need to do anything tricky,
        // but if we wanted to decrement the original post's repost count, we could do it here
        if (post.type === 'repost' && post.originalPost) {
            await Post.findByIdAndUpdate(post.originalPost, { $inc: { 'engagementCount.reposts': -1 } });
        }

        await post.deleteOne();

        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Update a post
exports.updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const { content, status } = req.body;

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check if the user is the author
        if (post.author.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to update this post' });
        }

        // Only allow text/content updates and status transitions (e.g., DRAFT to PUBLISHED)
        if (content !== undefined) post.content = content;
        if (status !== undefined) post.status = status;

        await post.save();

        const populatedPost = await Post.findById(post._id).populate('author', 'email _id name avatar');

        res.status(200).json(populatedPost);
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Get Drafts for the current user
exports.getDrafts = async (req, res) => {
    try {
        const userId = req.user.userId;

        const drafts = await Post.find({ author: userId, status: 'DRAFT' })
            .sort({ createdAt: -1 })
            .populate('author', 'email _id name avatar');

        res.status(200).json(drafts);
    } catch (error) {
        console.error('Error fetching drafts:', error);
    }
};
// Get Explore/Trending Feed
exports.getExplore = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, timeRange, language, minEngagement } = req.query;
        let query = { status: 'PUBLISHED' };

        // 1. Keyword Search
        if (search) {
            query.$or = [
                { content: { $regex: search, $options: 'i' } },
                { 'poll.question': { $regex: search, $options: 'i' } }
            ];
        }

        // 2. Language Filter
        if (language && language !== 'all') {
            query.language = language;
        }

        // 3. Date Range Filter
        if (timeRange && timeRange !== 'all') {
            const now = new Date();
            let startDate = new Date();

            if (timeRange === '24h') startDate.setHours(now.getHours() - 24);
            else if (timeRange === '7d') startDate.setDate(now.getDate() - 7);
            else if (timeRange === '30d') startDate.setDate(now.getDate() - 30);

            query.createdAt = { $gte: startDate };
        }

        // 4. Minimum Engagement Filter (Likes + Comments threshold)
        if (minEngagement && !isNaN(parseInt(minEngagement))) {
            const threshold = parseInt(minEngagement);
            if (threshold > 0) {
                // Use MongoDB aggregation expression to sum likes and comments
                query.$expr = {
                    $gte: [
                        { $add: ["$engagementCount.likes", "$engagementCount.comments"] },
                        threshold
                    ]
                };
            }
        }

        // Base sorting on engagement (likes + comments) to simulate trending
        let sortConfig = { createdAt: -1 };
        if (!search) {
            // If no search, sort absolutely by trending magnitude
            sortConfig = { 'engagementCount.likes': -1, 'engagementCount.comments': -1, createdAt: -1 };
        }

        const posts = await Post.find(query)
            .sort(sortConfig)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('author', 'email _id name avatar')
            .populate({
                path: 'originalPost',
                populate: { path: 'author', select: 'email _id name avatar' }
            })
            .exec();

        res.status(200).json(posts);
    } catch (error) {
        console.error('Error fetching explore feed:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Report a post
exports.reportPost = async (req, res) => {
    try {
        const { id } = req.params;
        const reporterId = req.user.userId;
        const { reason } = req.body;

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Auto-Risk Scoring Rules
        let aiToxicityScore = 0;
        if (['Hate Speech', 'Harassment', 'NSFW'].includes(reason)) {
            // Mocking an AI toxicity score
            aiToxicityScore = 0.5 + Math.random() * 0.5; // Between 0.5 and 1.0
        } else {
            aiToxicityScore = Math.random() * 0.5;
        }

        let reportStatus = 'AUTO_RISK_SCORING';

        // IF AI_toxicity_score > 0.85 THEN auto_flag
        if (aiToxicityScore > 0.85) {
            post.status = 'FLAGGED';
            await post.save();
        }

        const report = new Report({
            post: id,
            reporter: reporterId,
            reason,
            status: reportStatus,
            aiToxicityScore
        });

        await report.save();

        // IF reports_count > 5 THEN escalate_to_senior_moderator
        const reportsCount = await Report.countDocuments({ post: id });
        if (reportsCount > 5) {
            report.status = 'ESCALATED'; // Or specifically route to senior moderator
            await report.save();

            // Optionally pull from feed by putting under review
            if (post.status !== 'UNDER_REVIEW') {
                post.status = 'UNDER_REVIEW';
                await post.save();
            }
        }

        res.status(201).json({ message: 'Report submitted successfully', report });
    } catch (error) {
        console.error('Error reporting post:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
