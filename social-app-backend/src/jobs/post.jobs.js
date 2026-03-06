const cron = require('node-cron');
const Post = require('../models/Post');

// Run every minute
cron.schedule('* * * * *', async () => {
    try {
        const now = new Date();

        // Find all DRAFT posts where isScheduled is true and scheduledFor is in the past or exactly now
        const postsToPublish = await Post.find({
            status: 'DRAFT',
            isScheduled: true,
            scheduledFor: { $lte: now }
        });

        if (postsToPublish.length > 0) {
            console.log(`Found ${postsToPublish.length} scheduled posts to publish.`);

            // Update them all to PUBLISHED
            const result = await Post.updateMany(
                {
                    _id: { $in: postsToPublish.map(p => p._id) }
                },
                {
                    $set: {
                        status: 'PUBLISHED',
                        isScheduled: false // Optional: toggle the flag once handled
                    }
                }
            );

            console.log(`Successfully published ${result.modifiedCount} scheduled posts.`);
        }
    } catch (error) {
        console.error('Error running scheduled post publisher job:', error);
    }
});

console.log('Post publisher cron job initialized.');
