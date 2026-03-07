const User = require('../models/User');
const mongoose = require('mongoose');

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
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

