const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['LIKE', 'COMMENT', 'MENTION', 'MODERATION', 'REPORT', 'FOLLOW', 'NEW_POST', 'COMMUNITY_JOIN', 'COMMUNITY_POST'],
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: false
    },
    comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Engagement',
        required: false
    },
    community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
        required: false
    },
    message: {
        type: String,
        required: false
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
