const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        enum: ['Hate Speech', 'Spam', 'Misinformation', 'Harassment', 'NSFW'],
        required: true
    },
    status: {
        type: String,
        enum: ['SUBMITTED', 'AUTO_RISK_SCORING', 'MODERATOR_REVIEW', 'DECISION', 'CLOSED', 'ESCALATED'],
        default: 'SUBMITTED'
    },
    aiToxicityScore: {
        type: Number,
        default: 0
    },
    decision: {
        type: String,
        enum: ['APPROVED', 'REMOVED', 'USER_WARNED', 'USER_SUSPENDED', 'DISMISSED'],
    },
    moderatorNotes: {
        type: String
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
