const mongoose = require('mongoose');

const engagementSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    type: {
        type: String,
        enum: ['like', 'comment', 'repost', 'bookmark', 'share', 'comment_like'],
        required: true
    },
    content: {
        type: String // Required if type is 'comment'
    },
    parentEngagement: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Engagement' // Points back to the parent comment if this is a reply or a comment_like
    },
    likesCount: {
        type: Number, // Only relevant if type is 'comment'
        default: 0
    }
}, { timestamps: true });

// Prevent multiple likes/reposts/bookmarks on the same post by the same user
engagementSchema.index({ user: 1, post: 1, type: 1, parentEngagement: 1 }, { unique: true, partialFilterExpression: { type: { $in: ['like', 'repost', 'bookmark', 'comment_like'] } } });

module.exports = mongoose.model('Engagement', engagementSchema);
