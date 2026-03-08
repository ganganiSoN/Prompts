const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    name: {
        type: String,
        trim: true,
    },
    bio: {
        type: String,
        trim: true,
        maxLength: 500
    },
    website: {
        type: String,
        trim: true
    },
    location: {
        type: String,
        trim: true
    },
    interests: [{
        type: String,
        trim: true
    }],
    followersCount: {
        type: Number,
        default: 0
    },
    followingCount: {
        type: Number,
        default: 0
    },
    password: {
        type: String,
        required: function () {
            // Password is required only if they aren't using OAuth
            return !this.authProvider || this.authProvider === 'local';
        }
    },
    authProvider: {
        type: String,
        enum: ['local', 'google', 'github'],
        default: 'local'
    },
    hasAcceptedTerms: {
        type: Boolean,
        default: false
    },
    hasVerifiedAge: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ['admin', 'moderator', 'user'],
        default: 'user'
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'WARNED', 'SUSPENDED'],
        default: 'ACTIVE'
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String
    },
    isMfaEnabled: {
        type: Boolean,
        default: false
    },
    mfaPin: {
        type: String, // E.g., '123456'
    },
    mfaSecret: {
        type: String
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    }
}, { timestamps: true });

// Hash password before saving if it was modified
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
        throw error;
    }
});

// Method to verify password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Performance Indexes for 1M+ rows
userSchema.index({ name: 1 }, { background: true });
userSchema.index({ createdAt: -1 }, { background: true });

module.exports = mongoose.model('User', userSchema);
