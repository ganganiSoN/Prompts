const mongoose = require('mongoose');
const User = require('./src/models/User');
const Engagement = require('./src/models/Engagement');
require('dotenv').config();

async function test() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/social-app');

    // Pick any user who is following someone
    const follow = await Engagement.findOne({ type: 'follow' });
    if (!follow) {
        console.log("No follows found in database.");
        process.exit(0);
    }

    const userIdStr = follow.user.toString();
    console.log("Test User ID (String):", userIdStr);

    const countWithStr = await Engagement.countDocuments({ user: userIdStr, type: 'follow' });
    const countWithObj = await Engagement.countDocuments({ user: follow.user, type: 'follow' });

    console.log(`Count with String: ${countWithStr}`);
    console.log(`Count with ObjectId: ${countWithObj}`);

    process.exit(0);
}

test();
