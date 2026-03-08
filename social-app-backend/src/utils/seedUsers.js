const User = require('../models/User');

const seedDefaultUsers = async () => {
    const defaultUsers = [
        {
            email: 'superadmin@mail.com',
            name: 'Super Admin',
            password: 'password123',
            role: 'admin',
            isMfaEnabled: true,
            mfaPin: '123456',
            isEmailVerified: true,
            hasAcceptedTerms: true,
            hasVerifiedAge: true,
        },
        {
            email: 'moderate@mail.com',
            name: 'Moderator',
            password: 'password123',
            role: 'moderator',
            isMfaEnabled: true,
            mfaPin: '123456',
            isEmailVerified: true,
            hasAcceptedTerms: true,
            hasVerifiedAge: true,
        },
        {
            email: 'user@mail.com',
            name: 'Standard User',
            password: 'password123',
            role: 'user',
            isMfaEnabled: true,
            mfaPin: '123456',
            isEmailVerified: true,
            hasAcceptedTerms: true,
            hasVerifiedAge: true,
        }
    ];

    try {
        for (const userData of defaultUsers) {
            const existingUser = await User.findOne({ email: userData.email });
            if (!existingUser) {
                const user = new User(userData);
                await user.save();
                console.log(`[DB Seed] Successfully created default user: ${userData.email} (Role: ${userData.role})`);
            }
        }
    } catch (error) {
        console.error('[DB Seed] Error seeding default users:', error);
    }
};

module.exports = seedDefaultUsers;
