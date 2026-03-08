const mongoose = require('mongoose');
const User = require('./src/models/User');
const Post = require('./src/models/Post');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/social-app';

const generatePosts = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB. Starting Post seed process...');

        const TOTAL_POSTS = 1000000;
        const BATCH_SIZE = 1000;
        let totalInserted = 0;

        console.log('Fetching a pool of 50,000 users to act as authors...');
        const users = await User.find().select('_id').limit(50000).lean();

        if (users.length === 0) {
            console.error('No users found in the database. Please run seedUsers.js first!');
            process.exit(1);
        }

        const userIds = users.map(u => u._id);
        console.log(`Successfully fetched ${userIds.length} users. Generating ${TOTAL_POSTS} random posts in batches of ${BATCH_SIZE}...`);

        const buzzwords = ['technology', 'AI', 'gaming', 'future', 'crypto', 'art', 'music', 'weekend', 'vibes', 'coding', 'bugs', 'coffee', 'lifestyle', 'startup', 'innovation'];
        const sentenceStarts = ['Just thinking about', 'Can we talk about', 'I really love', 'Who else is into', 'Hot take on', 'Learning more about', 'Exploring the world of'];
        const communities = ['General', 'Tech', 'Gaming', 'Art', 'Music', 'Science', 'Memes'];

        const loremStyles = [
            '<p>Lorem ipsum dolor sit amet, <strong>consectetur adipiscing elit</strong>. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p><p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. <em>Excepteur sint occaecat cupidatat non proident</em>, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>',
            '<p>Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris.</p><p>Integer in mauris eu nibh euismod gravida. <strong>Duis ac tellus et risus vulputate vehicula.</strong> Donec lobortis risus a elit. Etiam tempor. Ut ullamcorper, ligula eu tempor congue, <em>eros est euismod turpis</em>, id tincidunt sapien risus a quam.</p>',
            '<p>Maecenas fermentum consequat mi. Donec fermentum. Pellentesque malesuada nulla a mi. Duis sapien sem, aliquet nec, commodo eget, consequat quis, neque. <strong>Aliquam faucibus, elit ut dictum aliquet</strong>, felis nisl adipiscing sapien, sed malesuada diam lacus eget erat.</p><p>Cras mollis scelerisque nunc. <em>Nullam arcu.</em> Aliquam consequat. Curabitur augue lorem, dapibus quis, laoreet et, pretium ac, nisi. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.</p>'
        ];

        for (let batch = 0; batch < TOTAL_POSTS / BATCH_SIZE; batch++) {
            const postsToInsert = [];
            for (let i = 0; i < BATCH_SIZE; i++) {
                const randomAuthorId = userIds[Math.floor(Math.random() * userIds.length)];

                const word1 = buzzwords[Math.floor(Math.random() * buzzwords.length)];
                const word2 = buzzwords[Math.floor(Math.random() * buzzwords.length)];
                const start = sentenceStarts[Math.floor(Math.random() * sentenceStarts.length)];
                const community = communities[Math.floor(Math.random() * communities.length)];
                const lorem = loremStyles[Math.floor(Math.random() * loremStyles.length)];

                const content = `<h2>${start} ${word1} today!</h2> <p>It really feels like <strong>${word2}</strong> is taking over! 🚀</p> ${lorem}`;

                const numHashtags = Math.floor(Math.random() * 3) + 1;
                const hashtags = [];
                for (let h = 0; h < numHashtags; h++) {
                    hashtags.push(buzzwords[Math.floor(Math.random() * buzzwords.length)]);
                }

                // Scatter timestamps over the last year
                const pastDate = new Date();
                pastDate.setDate(pastDate.getDate() - Math.floor(Math.random() * 365));

                postsToInsert.push({
                    author: randomAuthorId,
                    type: 'text',
                    content,
                    language: 'en',
                    community,
                    status: 'PUBLISHED',
                    isScheduled: false,
                    engagementCount: {
                        likes: Math.floor(Math.random() * 500),
                        comments: Math.floor(Math.random() * 50),
                        reposts: Math.floor(Math.random() * 20),
                        bookmarks: Math.floor(Math.random() * 10),
                        share: Math.floor(Math.random() * 5)
                    },
                    hashtags,
                    createdAt: pastDate,
                    updatedAt: pastDate
                });
            }

            const result = await Post.insertMany(postsToInsert);
            totalInserted += result.length;

            // Print progress every 5%
            if ((batch + 1) % 50 === 0) {
                console.log(`Progress: Injected ${totalInserted} / ${TOTAL_POSTS} posts...`);
            }
        }

        console.log(`Successfully completed! Inserted exactly ${totalInserted} posts!`);
        process.exit(0);

    } catch (error) {
        console.error('Error seeding posts:', error);
        process.exit(1);
    }
};

generatePosts();
