const User = require('../models/User');
const Engagement = require('../models/Engagement');
const mongoose = require('mongoose');

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Dynamically sync the counts to ensure absolute accuracy (in case engagements were added/removed outside normal flow)
        const followersCount = await Engagement.countDocuments({ targetUser: req.user.userId, type: 'follow' });
        const followingCount = await Engagement.countDocuments({ user: req.user.userId, type: 'follow' });

        if (user.followersCount !== followersCount || user.followingCount !== followingCount) {
            await User.updateOne(
                { _id: req.user.userId },
                { $set: { followersCount, followingCount } }
            );

            user.followersCount = followersCount;
            user.followingCount = followingCount;
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, bio, website, location, interests } = req.body;

        // Find user by ID from JWT token and update
        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { name, bio, website, location, interests },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getSuggestions = async (req, res) => {
    try {
        const userId = req.user.userId;
        const currentUser = await User.findById(userId).select('interests');

        let suggestions = [];

        // 1. Try to find users with at least 1 shared interest
        if (currentUser && currentUser.interests && currentUser.interests.length > 0) {
            const normalizedUserInterests = currentUser.interests.map(i => i.toLowerCase());

            suggestions = await User.aggregate([
                { $match: { $expr: { $ne: [{ $toString: "$_id" }, userId] } } },
                {
                    $addFields: {
                        normalizedInterests: {
                            $map: {
                                input: { $ifNull: ["$interests", []] },
                                as: "interest",
                                in: { $toLower: "$$interest" }
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        sharedInterestsCount: {
                            $size: {
                                $setIntersection: [
                                    "$normalizedInterests",
                                    normalizedUserInterests
                                ]
                            }
                        }
                    }
                },
                { $match: { sharedInterestsCount: { $gt: 0 } } }, // Must have at least one shared interest
                { $sort: { sharedInterestsCount: -1 } },
                { $limit: 15 }, // Get top 15 candidates
                { $sample: { size: 5 } }, // Randomly pick 5 among top so it varies slightly
                { $project: { password: 0, mfaSecret: 0, resetPasswordToken: 0, resetPasswordExpires: 0 } }
            ]);
        }

        // 2. If we have less than 5 suggestions, fill the rest with random users
        if (suggestions.length < 5) {
            const excludeIdsStr = [userId, ...suggestions.map(s => s._id.toString())];

            const randomSuggestions = await User.aggregate([
                { $match: { $expr: { $not: { $in: [{ $toString: "$_id" }, excludeIdsStr] } } } },
                { $sample: { size: 5 - suggestions.length } },
                {
                    $addFields: {
                        sharedInterestsCount: 0 // Mark as 0 shared interests
                    }
                },
                { $project: { password: 0, mfaSecret: 0, resetPasswordToken: 0, resetPasswordExpires: 0 } }
            ]);

            suggestions = [...suggestions, ...randomSuggestions];
        }

        // Keep highest shared interests at the top
        suggestions.sort((a, b) => b.sharedInterestsCount - a.sharedInterestsCount);

        res.status(200).json(suggestions);
    } catch (error) {
        console.error('Error fetching user suggestions - Full Stack Trace:');
        console.error(error.stack);
        console.error(error.stack);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const sort = req.query.sort || 'createdAt_desc'; // e.g. "name_asc", "createdAt_desc"

        const skip = (page - 1) * limit;

        // Build the search query
        const query = { _id: { $ne: req.user.userId } };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Build the sort parameters
        const sortOptions = {};
        const [sortField, sortOrder] = sort.split('_');
        sortOptions[sortField] = sortOrder === 'desc' ? -1 : 1;

        // Execute query
        const users = await User.find(query)
            .select('-password -mfaSecret -verificationToken') // omit sensitive data
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);

        const totalUsers = await User.countDocuments(query);

        res.status(200).json({
            users,
            currentPage: page,
            totalPages: Math.ceil(totalUsers / limit),
            totalUsers
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password -mfaSecret -verificationToken');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!['admin', 'moderator', 'user'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'Role updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.followUser = async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const currentUserId = req.user.userId;

        if (targetUserId === currentUserId) {
            return res.status(400).json({ message: 'You cannot follow yourself' });
        }

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if follow engagement already exists
        const existingFollow = await Engagement.findOne({
            user: currentUserId,
            targetUser: targetUserId,
            type: 'follow'
        });

        if (existingFollow) {
            // Unfollow
            await existingFollow.deleteOne();

            // Adjust counters (optional, depends on schema)
            await User.findByIdAndUpdate(targetUserId, { $inc: { followersCount: -1 } });
            await User.findByIdAndUpdate(currentUserId, { $inc: { followingCount: -1 } });

            return res.status(200).json({ message: 'Successfully unfollowed user', isFollowing: false });
        } else {
            // Follow
            await Engagement.create({
                user: currentUserId,
                targetUser: targetUserId,
                type: 'follow'
            });

            // Adjust counters
            await User.findByIdAndUpdate(targetUserId, { $inc: { followersCount: 1 } });
            await User.findByIdAndUpdate(currentUserId, { $inc: { followingCount: 1 } });

            return res.status(200).json({ message: 'Successfully followed user', isFollowing: true });
        }
    } catch (error) {
        console.error('Error toggling follow:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getFollowers = async (req, res) => {
    try {
        const userId = req.params.id;
        // Find engagements where targetUser is this userId and type is 'follow'
        const follows = await Engagement.find({ targetUser: userId, type: 'follow' })
            .populate('user', 'name email followersCount followingCount src _id');

        // Map to just the user objects
        const followers = follows.map(f => f.user).filter(u => u != null);

        res.status(200).json(followers);
    } catch (error) {
        console.error('Error fetching followers:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getFollowing = async (req, res) => {
    try {
        const userId = req.params.id;
        // Find engagements where user is this userId and type is 'follow'
        const follows = await Engagement.find({ user: userId, type: 'follow' })
            .populate('targetUser', 'name email followersCount followingCount src _id');

        // Map to just the user objects
        const following = follows.map(f => f.targetUser).filter(u => u != null);

        res.status(200).json(following);
    } catch (error) {
        console.error('Error fetching following:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
