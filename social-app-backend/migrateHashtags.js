require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('./src/models/Post');

async function migrateHashtags() {
    try {
        console.log('Connecting to MongoDB...');
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/social-app';
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB.');

        const posts = await Post.find({ content: { $exists: true, $ne: '' } });
        console.log(`Found ${posts.length} posts to process.`);

        let modifiedCount = 0;

        for (const post of posts) {
            const matches = post.content.match(/#[\w]+/g);
            if (matches) {
                const hashtags = matches.map(tag => tag.substring(1).toLowerCase());
                
                // Only update if hashtags array is empty or different
                post.hashtags = hashtags;
                await post.save();
                modifiedCount++;
                
                if (modifiedCount % 100 === 0) {
                    console.log(`Processed ${modifiedCount} posts...`);
                }
            }
        }

        console.log(`Migration complete! Successfully updated hashtags on ${modifiedCount} posts.`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrateHashtags();
