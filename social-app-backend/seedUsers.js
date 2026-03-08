const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./src/models/User'); // Adjust path if necessary
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/social-app';

const generateUsers = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB. Starting seed process...');

        // 1. Pre-hash a single default password to save time (bcrypting 1000 times takes forever)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        const TOTAL_USERS = 1000000;
        const BATCH_SIZE = 1000;
        let totalInserted = 0;

        const firstNames = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Sam', 'Riley', 'Morgan', 'Avery', 'River', 'Quinn', 'Skyler', 'Cameron', 'Dakota', 'Drew', 'Harper'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson'];
        const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'example.com'];
        const locations = ['New York', 'Los Angeles', 'London', 'Tokyo', 'Berlin', 'Sydney', 'Toronto', 'Paris', 'Remote', 'Earth', 'Mars'];
        const bios = [
            'Tech enthusiast and coffee lover.',
            'Just a random person on the internet.',
            'Always learning something new.',
            'Love coding, gaming, and exploring.',
            'Living life one line of code at a time.',
            'Dreamer. Doer. Thinker.',
            'Software engineering by day, gamer by night.'
        ];
        const possibleInterests = ['Coding', 'Gaming', 'Music', 'Movies', 'Sports', 'Photography', 'Travel', 'Reading', 'Art', 'Technology', 'Science', 'Fitness', 'Food', 'Fashion', 'History'];

        console.log(`Generating ${TOTAL_USERS} random user records in batches of ${BATCH_SIZE}...`);

        for (let batch = 0; batch < TOTAL_USERS / BATCH_SIZE; batch++) {
            const usersToInsert = [];
            for (let i = 0; i < BATCH_SIZE; i++) {
                const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
                const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
                const domain = domains[Math.floor(Math.random() * domains.length)];
                const location = locations[Math.floor(Math.random() * locations.length)];
                const bio = bios[Math.floor(Math.random() * bios.length)];

                const userInterests = [];
                const numInterests = Math.floor(Math.random() * 4) + 2; 
                const shuffledInterests = [...possibleInterests].sort(() => 0.5 - Math.random());
                for (let j = 0; j < numInterests; j++) {
                    userInterests.push(shuffledInterests[j]);
                }

                // Make sure random strings are extremely unique for 1M
                const randomString = Math.random().toString(36).substring(2, 9) + Math.random().toString(36).substring(2, 5);
                const uniqueId = totalInserted + i; 
                const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${uniqueId}.${randomString}@${domain}`;

                const name = `${firstName} ${lastName}`;

                const pastDate = new Date();
                pastDate.setDate(pastDate.getDate() - Math.floor(Math.random() * 365));

                const assignedRole = Math.random() < 0.2 ? 'moderator' : 'user';

                usersToInsert.push({
                    email,
                    name,
                    password: hashedPassword,
                    bio,
                    location,
                    interests: userInterests,
                    role: assignedRole,
                    hasAcceptedTerms: true,
                    isEmailVerified: Math.random() > 0.3,
                    createdAt: pastDate,
                    updatedAt: pastDate
                });
            }

            const result = await User.insertMany(usersToInsert);
            totalInserted += result.length;
            
            // Print progress every 10% 
            if ((batch + 1) % 100 === 0) {
                console.log(`Progress: Injected ${totalInserted} / ${TOTAL_USERS} users...`);
            }
        }

        console.log(`Successfully completed! Inserted exactly ${totalInserted} users!`);
        process.exit(0);

    } catch (error) {
        console.error('Error seeding users:', error);
        process.exit(1);
    }
};

generateUsers();
