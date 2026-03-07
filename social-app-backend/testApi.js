const mongoose = require('mongoose');
const User = require('./src/models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_temporary_jwt_secret';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/social-app';

const run = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        const user = await User.findOne({ name: 'Alex Smith' }); // Try to grab a specific known user, or just first
        const targetUser = user || await User.findOne();

        console.log(`Log in test user: ${targetUser.email}`);

        const token = jwt.sign({ id: targetUser._id, email: targetUser.email }, JWT_SECRET, { expiresIn: '7d' });

        const suggRes = await fetch('http://localhost:5000/api/users/suggestions', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const suggestions = await suggRes.json();

        console.log(`Suggestions returned:`, suggestions.length ? `${suggestions.length} items` : suggestions);
        if (suggestions.length) {
            console.log(suggestions.map(u => u.name));
        } else {
            console.log("Empty suggestions array returned from backend!");
        }
    } catch (e) {
        console.error("Fetch error:", e);
    }
    process.exit(0);
}
run();
