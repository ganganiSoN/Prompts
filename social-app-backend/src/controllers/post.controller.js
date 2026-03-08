const Post = require('../models/Post');
const Engagement = require('../models/Engagement');
const User = require('../models/User');
const Report = require('../models/Report');
const Notification = require('../models/Notification');
const Community = require('../models/Community');

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

        // Extract hashtags from content
        const hashtags = [];
        if (content) {
            const matches = content.match(/#[\w]+/g);
            if (matches) {
                matches.forEach(tag => {
                    hashtags.push(tag.substring(1).toLowerCase());
                });
            }
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
            scheduledFor,
            hashtags
        });

        await newPost.save();

        // Populate author to match feed item shape for seamless frontend insertion
        const populatedPost = await Post.findById(newPost._id)
            .populate('author', 'email _id name avatar');

        // --- NEW NOTIFICATION LOGIC ---
        const io = req.app.get('io');

        // 1. Mentions
        if (content && typeof content === 'string') {
            const mentions = content.match(/@(\w+)/g);
            if (mentions) {
                const usernamesStringArray = mentions.map(m => m.substring(1)); // remove @
                const mentionedUsers = await User.find({ name: { $in: usernamesStringArray } }).select('_id name');

                const mentionPayloads = mentionedUsers
                    .filter(u => u._id.toString() !== userId.toString())
                    .map(u => ({
                        user: u._id,
                        type: 'MENTION',
                        sender: userId,
                        post: newPost._id
                    }));

                if (mentionPayloads.length > 0) {
                    const insertedMentions = await Notification.insertMany(mentionPayloads);
                    if (io) {
                        const senderUser = await User.findById(userId).select('name avatar');
                        insertedMentions.forEach(notif => {
                            const payload = {
                                ...notif.toObject(),
                                sender: senderUser,
                                post: { _id: newPost._id, content: newPost.content, type: newPost.type }
                            };
                            io.to('user_' + notif.user.toString()).emit('new_notification', payload);
                        });
                    }
                }
            }
        }

        // 2. Notify Followers about NEW_POST
        if (status === 'PUBLISHED') {
            const followers = await Engagement.find({ targetUser: userId, type: 'follow' }).select('user');

            const followerPayloads = followers.map(f => ({
                user: f.user,
                type: 'NEW_POST',
                sender: userId,
                post: newPost._id
            }));

            if (followerPayloads.length > 0) {
                const insertedFollowers = await Notification.insertMany(followerPayloads);
                if (io) {
                    const senderUser = await User.findById(userId).select('name avatar');
                    insertedFollowers.forEach(notif => {
                        const payload = {
                            ...notif.toObject(),
                            sender: senderUser,
                            post: { _id: newPost._id, content: newPost.content, type: newPost.type }
                        };
                        io.to('user_' + notif.user.toString()).emit('new_notification', payload);
                    });
                }
            }
        }

        // 3. Notify Community Members about COMMUNITY_POST
        if (status === 'PUBLISHED' && community && community !== 'General') {
            const communityDoc = await Community.findOne({ name: community });
            if (communityDoc) {
                const membersToNotify = communityDoc.members.filter(m => m && m.toString() !== userId.toString());
                if (membersToNotify.length > 0) {
                    const communityPayloads = membersToNotify.map(m => ({
                        user: m,
                        type: 'COMMUNITY_POST',
                        sender: userId,
                        post: newPost._id,
                        community: communityDoc._id
                    }));
                    const insertedCommunityPosts = await Notification.insertMany(communityPayloads);
                    if (io) {
                        const senderUser = await User.findById(userId).select('name avatar');
                        insertedCommunityPosts.forEach(notif => {
                            const payload = {
                                ...notif.toObject(),
                                sender: senderUser,
                                post: { _id: newPost._id, content: newPost.content, type: newPost.type },
                                community: { _id: communityDoc._id, name: communityDoc.name }
                            };
                            io.to('user_' + notif.user.toString()).emit('new_notification', payload);
                        });
                    }
                }
            }
        }
        // --- END NOTIFICATION LOGIC ---

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

// Get Post by ID
exports.getPostById = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id)
            .populate('author', 'email _id name avatar')
            .populate({
                path: 'originalPost',
                populate: { path: 'author', select: 'email _id name avatar' }
            })
            .exec();

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.status(200).json(post);
    } catch (error) {
        console.error('Error fetching post by ID:', error);
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

        if (type === 'like' || type === 'comment') {
            let communityId;
            if (post.community && post.community !== 'General') {
                const communityDoc = await Community.findOne({ name: post.community }).select('_id');
                if (communityDoc) {
                    communityId = communityDoc._id;
                }
            }

            // Uncomment the following line in production to prevent self-notifications
            // if (post.author.toString() !== userId.toString()) {
            const notification = new Notification({
                user: post.author,
                type: type === 'like' ? 'LIKE' : 'COMMENT',
                sender: userId,
                post: id,
                ...(communityId && { community: communityId }),
                ...(type === 'comment' && { comment: engagement._id })
            });
            await notification.save();

            const io = req.app.get('io');
            if (io) {
                const populatedNotif = await Notification.findById(notification._id)
                    .populate('sender', 'name avatar')
                    .populate('post', 'content type')
                    .populate('community', 'name');
                io.to('user_' + post.author.toString()).emit('new_notification', populatedNotif);
            }
            // }

            // 1. Mentions (if comment)
            if (type === 'comment' && content) {
                const mentions = content.match(/@(\w+)/g);
                if (mentions) {
                    const usernames = mentions.map(m => m.substring(1));
                    const mentionedUsers = await User.find({ name: { $in: usernames } }).select('_id');

                    const mentionPayloads = mentionedUsers
                        .filter(u => u._id.toString() !== userId.toString())
                        .map(u => ({
                            user: u._id,
                            type: 'MENTION',
                            sender: userId,
                            post: id,
                            comment: engagement._id
                        }));

                    if (mentionPayloads.length > 0) {
                        const insertedMentions = await Notification.insertMany(mentionPayloads);
                        if (io) {
                            const senderUser = await User.findById(userId).select('name avatar');
                            insertedMentions.forEach(notif => {
                                const payload = {
                                    ...notif.toObject(),
                                    sender: senderUser,
                                    post: { _id: post._id, content: post.content, type: post.type }
                                };
                                io.to('user_' + notif.user.toString()).emit('new_notification', payload);
                            });
                        }
                    }
                }
            }

            // 2. Notify Followers about Like/Comment
            const followers = await Engagement.find({ targetUser: userId, type: 'follow' }).select('user');

            const followerPayloads = followers.map(f => ({
                user: f.user,
                type: type === 'like' ? 'LIKE' : 'COMMENT',
                sender: userId,
                post: id,
                ...(type === 'comment' && { comment: engagement._id })
            }));

            if (followerPayloads.length > 0) {
                const insertedFollowers = await Notification.insertMany(followerPayloads);
                if (io) {
                    const senderUser = await User.findById(userId).select('name avatar');
                    insertedFollowers.forEach(notif => {
                        const payload = {
                            ...notif.toObject(),
                            sender: senderUser,
                            post: { _id: post._id, content: post.content, type: post.type }
                        };
                        io.to('user_' + notif.user.toString()).emit('new_notification', payload);
                    });
                }
            }
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
        if (content !== undefined) {
            post.content = content;
            // Re-extract hashtags
            const hashtags = [];
            const matches = content.match(/#[\w]+/g);
            if (matches) {
                matches.forEach(tag => {
                    hashtags.push(tag.substring(1).toLowerCase());
                });
            }
            post.hashtags = hashtags;
        }
        if (status !== undefined) post.status = status;

        await post.save();

        const populatedPost = await Post.findById(post._id).populate('author', 'email _id name avatar');

        res.status(200).json(populatedPost);
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Get Trending Hashtags
exports.getTrendingHashtags = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        // Only look at hashtags from published posts in the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const trendingTags = await Post.aggregate([
            { $match: { status: 'PUBLISHED', createdAt: { $gte: sevenDaysAgo } } },
            { $unwind: '$hashtags' },
            { $group: { _id: '$hashtags', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: parseInt(limit) },
            { $project: { _id: 0, tag: '$_id', count: 1 } }
        ]);

        res.status(200).json(trendingTags);
    } catch (error) {
        console.error('Error fetching trending hashtags:', error);
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
            .lean() // Vastly improves performance by returning plain JS objects instead of Mongoose Documents
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

        // 1. Immediately return a 202 Accepted response
        res.status(202).json({ message: 'Report received and is being processed.' });

        const io = req.app.get('io');

        // 2. Call a background asynchronous function
        processPostReport(io, id, reporterId, reason).catch(err => {
            console.error('Background AI scoring error:', err);
        });

    } catch (error) {
        if (!res.headersSent) {
            console.error('Error reporting post:', error);
            res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    }
};

const toxicity = require('@tensorflow-models/toxicity');
const nsfwjs = require('nsfwjs');
let tf;
try {
    tf = require('@tensorflow/tfjs-node');
} catch (e) {
    console.warn('tfjs-node is not available. Image NSFW scoring will be skipped.');
}
const mongoose = require('mongoose');

async function processPostReport(io, postId, reporterId, reason) {
    try {
        // Fetch the post from the posts collection using the native MongoDB driver
        const db = mongoose.connection.db;
        const postsCollection = db.collection('posts');

        const postDoc = await postsCollection.findOne({ _id: new mongoose.Types.ObjectId(postId) });
        if (!postDoc) return;

        let textScore = 0;
        let imageScore = 0;

        // Text Scoring: Pass the post text through the @tensorflow-models/toxicity model
        if (postDoc.content && typeof postDoc.content === 'string') {
            try {
                const plainText = postDoc.content.replace(/<[^>]*>?/gm, '');
                const toxicityModel = await toxicity.load(0.5);
                const predictions = await toxicityModel.classify([plainText]);

                let maxProb = 0;
                predictions.forEach(p => {
                    const matchProb = p.results[0]?.probabilities[1];
                    if (matchProb > maxProb) maxProb = matchProb;
                });
                textScore = maxProb * 100; // 0-100 severity score
            } catch (err) {
                console.error('Toxicity scoring error:', err);
            }
        }

        // Image Scoring: If post type is image and contains an image URL, pass to nsfwjs
        let imageUrl = null;
        if (postDoc.type === 'image' && postDoc.content) {
            const lines = postDoc.content.split('\n').map(l => l.trim());
            const urlLine = lines.find(l => l.startsWith('data:image') || l.startsWith('http'));
            if (urlLine) imageUrl = urlLine;
        }

        if (imageUrl && tf) {
            try {
                const model = await nsfwjs.load();
                let decodedImage;

                if (imageUrl.startsWith('data:image')) {
                    const base64Data = imageUrl.split(',')[1];
                    const imageBuffer = Buffer.from(base64Data, 'base64');
                    decodedImage = tf.node.decodeImage(imageBuffer, 3);
                } else if (imageUrl.startsWith('http')) {
                    const response = await fetch(imageUrl);
                    const arrayBuffer = await response.arrayBuffer();
                    const imageBuffer = Buffer.from(arrayBuffer);
                    decodedImage = tf.node.decodeImage(imageBuffer, 3);
                }

                if (decodedImage) {
                    const predictions = await model.classify(decodedImage);
                    decodedImage.dispose();

                    // Assign severity score based on 'Porn' or 'Hentai' probabilities
                    predictions.forEach(p => {
                        if (p.className === 'Porn' || p.className === 'Hentai') {
                            const score = p.probability * 100;
                            if (score > imageScore) imageScore = score;
                        }
                    });
                }
            } catch (err) {
                console.error('NSFWJS scoring error:', err);
            }
        }

        // Combine into a total_toxicity_score
        const total_toxicity_score = Math.max(textScore, imageScore);

        // Debug logging for user verification
        console.log(`\n===========================================`);
        console.log(`🧠 AI Moderation API Finished Processing`);
        console.log(`📃 Text Toxicity Score: ${textScore.toFixed(2)} / 100`);
        console.log(`🖼️ Image NSFW Score:  ${imageScore.toFixed(2)} / 100`);
        console.log(`🛡️ Final Total Score:   ${total_toxicity_score.toFixed(2)} / 100`);
        console.log(`===========================================\n`);

        // Database Updates (Native MongoDB Driver)
        let newStatus = postDoc.status;
        let moderationReasons = [reason];

        const updates = {
            $set: {
                aiToxicityScore: total_toxicity_score
            }
        };

        if (total_toxicity_score > 80) {
            newStatus = 'quarantined';
            moderationReasons.push('High AI Toxicity Score (nsfwjs/toxicity)');
            updates.$set.status = newStatus;
            updates.$set.moderationReasons = moderationReasons;
        } else if (total_toxicity_score > 40 && total_toxicity_score <= 80) {
            newStatus = 'pending_review';
            updates.$set.status = newStatus;
        }

        await postsCollection.updateOne(
            { _id: new mongoose.Types.ObjectId(postId) },
            updates
        );

        // Record the report in the reports collection
        const reportsCollection = db.collection('reports');
        await reportsCollection.insertOne({
            post: new mongoose.Types.ObjectId(postId),
            reporter: new mongoose.Types.ObjectId(reporterId),
            reason,
            status: total_toxicity_score > 80 ? 'AUTO_RISK_SCORING' : 'SUBMITTED',
            aiToxicityScore: total_toxicity_score,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Notify all admins and moderators of the new report
        const modsAndAdmins = await mongoose.connection.db.collection('users').find({ role: { $in: ['admin', 'moderator'] } }).toArray();
        for (let modUser of modsAndAdmins) {
            const ModNotification = require('../models/Notification');
            const modNotification = new ModNotification({
                user: modUser._id,
                type: 'REPORT',
                post: postDoc._id,
                message: `A new report has been submitted. Reason: ${reason}`,
                sender: reporterId
            });
            await modNotification.save();
            if (io) {
                const popModNotif = await ModNotification.findById(modNotification._id).populate('sender', 'name avatar').populate('post', 'content type');
                io.to('user_' + modUser._id.toString()).emit('new_notification', popModNotif);
            }
        }

        // Notify user if post was flagged
        if (total_toxicity_score > 40) {
            const ModNotification = require('../models/Notification');
            const modNotification = new ModNotification({
                user: postDoc.author,
                type: 'MODERATION',
                post: postDoc._id,
                message: `Your post was flagged by our automated systems with status: ${newStatus}.`
            });
            await modNotification.save();
            if (io) {
                io.to('user_' + postDoc.author.toString()).emit('new_notification', modNotification);
            }
        }


        // Socket.io Event Emitting
        if (io) {
            if (total_toxicity_score > 85) {
                // Emit a post_quarantined event to the main feed room
                io.to('main_feed').emit('post_quarantined', {
                    postId: postId.toString()
                });
            }
            if (total_toxicity_score > 45) {
                // Attach the moderation items to the emitted post object
                const emittedPost = { ...postDoc, status: newStatus, aiToxicityScore: total_toxicity_score, moderationReasons: moderationReasons };

                // Emit a new_mod_ticket event specifically to the Moderator Dashboard socket room
                io.to('moderator_dashboard').emit('new_mod_ticket', {
                    post: emittedPost,
                    aiToxicityScore: total_toxicity_score,
                    moderationReasons: moderationReasons
                });
            }
        }
    } catch (err) {
        console.error('Error in processPostReport:', err);
    }
}
