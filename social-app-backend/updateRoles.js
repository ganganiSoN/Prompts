const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/social-app';

const run = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB.');

        // 1. Assign admin strictly to superadmin@mail.com
        const superadmin = await User.findOneAndUpdate(
            { email: 'superadmin@mail.com' },
            { $set: { role: 'admin' } },
            { new: true }
        );
        if (superadmin) {
            console.log(`Assigned admin role to ${superadmin.email}`);
        } else {
            console.log(`superadmin@mail.com not found. Create one if needed.`);
        }

        // 2. Fetch all other users
        const otherUsers = await User.find({ email: { $ne: 'superadmin@mail.com' } });
        console.log(`Found ${otherUsers.length} other users.`);

        let mCount = 0;
        let uCount = 0;

        // 3. Randomly assign 'user' or 'moderator'
        const bulkOps = otherUsers.map(u => {
            const assignedRole = Math.random() < 0.2 ? 'moderator' : 'user'; // 20% moderators 80% user
            if (assignedRole === 'moderator') mCount++;
            else uCount++;
            return {
                updateOne: {
                    filter: { _id: u._id },
                    update: { $set: { role: assignedRole } }
                }
            }
        });

        if (bulkOps.length > 0) {
            await User.bulkWrite(bulkOps);
        }

        console.log(`Roles updated. Moderators: ${mCount}, Users: ${uCount}`);
        process.exit(0);

    } catch (error) {
        console.error('Error assigning roles:', error);
        process.exit(1);
    }
};

run();
