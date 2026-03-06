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

        console.log('Generating 1500 random user records...');

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

        const usersToInsert = [];

        // Generate 1500 unique random users
        for (let i = 0; i < 1500; i++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const domain = domains[Math.floor(Math.random() * domains.length)];
            const location = locations[Math.floor(Math.random() * locations.length)];
            const bio = bios[Math.floor(Math.random() * bios.length)];

            // Unique email guaranteed by index
            const randomString = Math.random().toString(36).substring(2, 7);
            const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Date.now()}.${randomString}@${domain}`;

            const name = `${firstName} ${lastName}`;

            // Create dates scattered randomly over the last year
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - Math.floor(Math.random() * 365));

            usersToInsert.push({
                email,
                name,
                password: hashedPassword, // Bypassing hook via insertMany
                bio,
                location,
                hasAcceptedTerms: true,
                isEmailVerified: Math.random() > 0.3, // 70% chance of verified
                createdAt: pastDate,
                updatedAt: pastDate
            });
        }

        console.log(`Inserting ${usersToInsert.length} records into the database...`);

        // insertMany skips the pre('save') hook, which is what we want for mass insertion speed
        const result = await User.insertMany(usersToInsert);

        console.log(`Successfully inserted ${result.length} users!`);
        process.exit(0);

    } catch (error) {
        console.error('Error seeding users:', error);
        process.exit(1);
    }
};

generateUsers();
