const mongoose = require('mongoose');
const User = require('./src/models/User');
const Post = require('./src/models/Post');
const Engagement = require('./src/models/Engagement');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/social-app';

const generatePostsAndEngagements = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB. Starting seed process...');

        const users = await User.find({}, '_id').lean();
        if (users.length === 0) {
            console.error('No users found. Please run seedUsers.js first.');
            process.exit(1);
        }

        const userIds = users.map(u => u._id);

        console.log(`Found ${userIds.length} users. Generating 1200 random posts...`);

        const communities = ['General', 'Finance', 'Tech', 'Gaming'];
        const types = ['text', 'text', 'text', 'image', 'video', 'poll'];
        const sampleTexts = [
            '<p>Just had a great cup of coffee! ☕</p>',
            '<p>Working on some new coding projects today. The grind never stops!</p>',
            '<p>What does everyone think about the latest tech news? 🤔</p>',
            '<p>Taking a long walk in the park. The weather is beautiful right now.</p>',
            '<p>Excited for the weekend! Any plans?</p>',
            '<p>Can anyone recommend a good book to read?</p>',
            '<p>Just deployed a massive update to production!</p>',
            '<h2>The Future of Web Development in 2026</h2><p>Web development has been moving at an absolutely breakneck pace over the last few years. We have seen the rise of incredible tooling, AI-assisted development paradigms, and highly optimized frontend frameworks.</p><p>However, the real shift isn\'t just in the tools we use, but how we think about the architecture of full-stack applications. Serverless functions at the edge, native integrated databases like SQLite running directly in the browser via WebAssembly, and zero-bundle build tools are fundamentally changing what it means to be a "full stack developer."</p><p>What are your thoughts? Are we moving too fast, or is this the golden age of building things on the internet?</p>',
            '<p>I\'ve been reflecting a lot lately on the concept of work-life balance, specifically in the tech industry. It\'s incredibly easy to fall into the trap of letting your projects consume all of your free time, especially when you are deeply passionate about what you are building.</p><p>This week, I decided to close my laptop at exactly 5 PM every single day. The results have been pretty astounding. Not only have I found myself substantially more well-rested, but my output during actual working hours has been significantly higher in quality. Sometimes stepping away from the keyboard is the most productive thing you can do to solve a difficult engineering problem.</p>'
        ];

        const postsToInsert = [];

        for (let i = 0; i < 1200; i++) {
            const author = userIds[Math.floor(Math.random() * userIds.length)];
            const community = communities[Math.floor(Math.random() * communities.length)];
            const type = types[Math.floor(Math.random() * types.length)];

            const pastDate = new Date();
            // Random date within the last 30 days
            pastDate.setDate(pastDate.getDate() - Math.floor(Math.random() * 30));

            let content = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
            let poll = undefined;

            if (type === 'image') {
                content += `<p><img src="https://picsum.photos/seed/${i}/800/600" style="max-width: 100%; border-radius: 8px;" /></p>`;
            } else if (type === 'video') {
                content += `<p><video controls style="max-width: 100%; border-radius: 8px;"><source src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" type="video/mp4"></video></p>`;
            } else if (type === 'poll') {
                poll = {
                    question: 'Which of these do you prefer?',
                    options: [
                        { text: 'Option A', votes: Math.floor(Math.random() * 20) },
                        { text: 'Option B', votes: Math.floor(Math.random() * 20) },
                        { text: 'Something else entirely', votes: Math.floor(Math.random() * 5) }
                    ],
                    endsAt: new Date(Date.now() + 86400000)
                };
            }

            postsToInsert.push({
                author,
                type,
                content,
                poll,
                community,
                status: 'PUBLISHED',
                isScheduled: false,
                engagementCount: { likes: 0, comments: 0, reposts: 0, bookmarks: 0, shares: 0 },
                createdAt: pastDate,
                updatedAt: pastDate
            });
        }

        const insertedPosts = await Post.insertMany(postsToInsert);
        console.log(`Successfully inserted ${insertedPosts.length} posts.`);

        console.log('Generating random engagements (likes, comments)...');

        const engagementsToInsert = [];
        const postUpdates = []; // For bulkWrite updates 

        // Add varying amounts of engagement to a subset of posts
        for (const post of insertedPosts) {
            // ~75% of posts get some engagement
            if (Math.random() > 0.25) {
                const numLikes = Math.floor(Math.random() * 15);
                const numComments = Math.floor(Math.random() * 5);

                // Track users who engaged to avoid unique constraint violations on likes
                const engagedUsers = new Set();

                for (let j = 0; j < numLikes; j++) {
                    const randomUserId = userIds[Math.floor(Math.random() * userIds.length)].toString();
                    if (!engagedUsers.has(randomUserId)) {
                        engagedUsers.add(randomUserId);
                        engagementsToInsert.push({
                            user: randomUserId,
                            post: post._id,
                            type: 'like',
                            createdAt: post.createdAt,
                            updatedAt: post.createdAt
                        });
                    }
                }

                for (let j = 0; j < numComments; j++) {
                    const randomUserId = userIds[Math.floor(Math.random() * userIds.length)].toString();
                    const commentOptions = ['Nice!', 'Great post!', 'I totally agree.', 'Thanks for sharing!', 'Interesting thoughts.'];

                    engagementsToInsert.push({
                        user: randomUserId,
                        post: post._id,
                        type: 'comment',
                        content: commentOptions[Math.floor(Math.random() * commentOptions.length)],
                        createdAt: new Date(post.createdAt.getTime() + Math.random() * 3600000 * 24), // Random time within next day
                        updatedAt: new Date()
                    });
                }

                if (engagedUsers.size > 0 || numComments > 0) {
                    postUpdates.push({
                        updateOne: {
                            filter: { _id: post._id },
                            update: {
                                $inc: {
                                    'engagementCount.likes': engagedUsers.size,
                                    'engagementCount.comments': numComments
                                }
                            }
                        }
                    });
                }
            }
        }

        if (engagementsToInsert.length > 0) {
            // ordered: false skips duplicate key errors without failing the batch insertion
            await Engagement.insertMany(engagementsToInsert, { ordered: false }).catch(err => {
                // Ignore bulk write errors from unique constraints, process proceeds normally
                if (err.code !== 11000) console.error('Minor insertion error:', err.message);
            });
            console.log(`Inserted ~${engagementsToInsert.length} engagements.`);
        }

        if (postUpdates.length > 0) {
            await Post.bulkWrite(postUpdates);
            console.log(`Updated engagement counts on posts.`);
        }

        console.log('Database seeding complete!');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

generatePostsAndEngagements();
