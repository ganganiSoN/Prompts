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
        enum: ['like', 'comment', 'repost', 'bookmark', 'share'],
        required: true
    },
    content: {
        type: String // Required if type is 'comment'
    }
}, { timestamps: true });

// Prevent multiple likes/reposts/bookmarks on the same post by the same user
engagementSchema.index({ user: 1, post: 1, type: 1 }, { unique: true, partialFilterExpression: { type: { $in: ['like', 'repost', 'bookmark'] } } });

module.exports = mongoose.model('Engagement', engagementSchema);
