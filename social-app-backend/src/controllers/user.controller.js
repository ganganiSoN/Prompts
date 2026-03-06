const User = require('../models/User');

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
        const { name, bio, website, location } = req.body;

        // Find user by ID from JWT token and update
        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { name, bio, website, location },
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

        // Use MongoDB aggregation pipeline to sample 5 random users, excluding the requesting user
        // We'll also only select necessary fields to keep the payload light
        const suggestions = await User.aggregate([
            { $match: { _id: { $ne: new require('mongoose').Types.ObjectId(userId) } } },
            { $sample: { size: 5 } },
            { $project: { password: 0, mfaSecret: 0, resetPasswordToken: 0, resetPasswordExpires: 0 } }
        ]);

        res.status(200).json(suggestions);
    } catch (error) {
        console.error('Error fetching user suggestions:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

