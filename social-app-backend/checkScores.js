require('dotenv').config();
const mongoose = require('mongoose');

async function checkScores() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/social-app');
        const db = mongoose.connection.db;

        const reports = await db.collection('reports').find({}).limit(5).toArray();
        console.log('REPORTS SCORES:');
        reports.forEach(r => {
            console.log(`- ID: ${r._id}, aiToxicityScore: ${r.aiToxicityScore}, status: ${r.status}`);
        });

        const posts = await db.collection('posts').find({ aiToxicityScore: { $exists: true } }).limit(5).toArray();
        console.log('\nPOSTS SCORES:');
        posts.forEach(p => {
            console.log(`- ID: ${p._id}, aiToxicityScore: ${p.aiToxicityScore}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}

checkScores();
