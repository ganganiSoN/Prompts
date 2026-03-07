const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/social-app';

const run = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        const currentUser = await User.findOne();
        if (!currentUser) return;
        const userId = currentUser._id.toString();

        console.log(`Testing with user ${currentUser.name} (${userId}), interests:`, currentUser.interests);

        let suggestions = [];

        // 1. Try to find users with at least 1 shared interest
        if (currentUser && currentUser.interests && currentUser.interests.length > 0) {
            const normalizedUserInterests = currentUser.interests.map(i => i.toLowerCase());

            suggestions = await User.aggregate([
                { $match: { _id: { $ne: new mongoose.Types.ObjectId(userId) } } },
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
                { $match: { sharedInterestsCount: { $gt: 0 } } },
                { $sort: { sharedInterestsCount: -1 } },
                { $limit: 15 },
                { $sample: { size: 5 } },
                { $project: { password: 0 } }
            ]);
        }

        console.log(`Matched ${suggestions.length} users by interest.`);

        if (suggestions.length < 5) {
            const excludeIds = [new mongoose.Types.ObjectId(userId), ...suggestions.map(s => s._id)];

            const randomSuggestions = await User.aggregate([
                { $match: { _id: { $nin: excludeIds } } },
                { $sample: { size: 5 - suggestions.length } },
                {
                    $addFields: {
                        sharedInterestsCount: 0
                    }
                },
                { $project: { password: 0 } }
            ]);

            console.log(`Matched ${randomSuggestions.length} random users.`);
            suggestions = [...suggestions, ...randomSuggestions];
        }

        suggestions.sort((a, b) => b.sharedInterestsCount - a.sharedInterestsCount);
        console.log(`Final suggestions: ${suggestions.length}`);
        console.log(suggestions.map(u => ({ name: u.name, shared: u.sharedInterestsCount })));

        process.exit(0);
    } catch (e) {
        console.error("Test error:", e);
        process.exit(1);
    }
}
run();
