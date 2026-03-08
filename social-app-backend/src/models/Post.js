const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'image', 'video', 'poll', 'thread', 'repost'],
        default: 'text',
        required: true
    },
    content: {
        type: String, // Can be text, or URL for image/video
        required: false // Reposts might not have extra text content initially
    },
    language: {
        type: String,
        default: 'en'
    },
    originalPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    },
    poll: {
        question: String,
        options: [{
            text: String,
            votes: { type: Number, default: 0 }
        }],
        endsAt: Date
    },
    threadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    },
    community: {
        type: String,
        default: 'General'
    },
    status: {
        type: String,
        enum: ['DRAFT', 'PUBLISHED', 'FLAGGED', 'UNDER_REVIEW', 'APPROVED', 'REMOVED', 'ARCHIVED'],
        default: 'PUBLISHED'
    },
    isScheduled: {
        type: Boolean,
        default: false
    },
    scheduledFor: {
        type: Date
    },
    engagementCount: {
        likes: { type: Number, default: 0 },
        comments: { type: Number, default: 0 },
        reposts: { type: Number, default: 0 },
        bookmarks: { type: Number, default: 0 },
        share: { type: Number, default: 0 }
    },
    aiToxicityScore: {
        type: Number,
        default: 0
    },
    moderationReasons: [{
        type: String
    }],
    hashtags: [{
        type: String,
        lowercase: true,
        trim: true
    }]
}, { timestamps: true });

postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ status: 1, community: 1, createdAt: -1 }); // Optimized for filtered feed
postSchema.index({ hashtags: 1, createdAt: -1 }); // Fast hashtag timeline queries
postSchema.index({ status: 1, 'engagementCount.likes': -1, 'engagementCount.comments': -1, createdAt: -1 }, { background: true }); // Optimized for Explore Trending

module.exports = mongoose.model('Post', postSchema);
