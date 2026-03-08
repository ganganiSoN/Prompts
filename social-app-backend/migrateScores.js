require('dotenv').config();
const mongoose = require('mongoose');

async function migrateScores() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/social-app');
        console.log('Connected to MongoDB. Starting migration...');

        const db = mongoose.connection.db;

        // 1. Migrate Posts
        const postsCollection = db.collection('posts');
        const postUpdateResult = await postsCollection.updateMany(
            { ai_toxicity_score: { $exists: true } },
            { $rename: { "ai_toxicity_score": "aiToxicityScore", "moderation_reasons": "moderationReasons" } }
        );
        console.log(`Migrated ${postUpdateResult.modifiedCount} posts.`);

        // 2. Migrate Reports
        const reportsCollection = db.collection('reports');
        const reportUpdateResult = await reportsCollection.updateMany(
            { ai_toxicity_score: { $exists: true } },
            { $rename: { "ai_toxicity_score": "aiToxicityScore" } }
        );
        console.log(`Migrated ${reportUpdateResult.modifiedCount} reports.`);

        console.log('Migration complete!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        mongoose.disconnect();
    }
}

migrateScores();
