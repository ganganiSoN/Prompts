const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    ipAddress: {
        type: String,
        required: true
    },
    userAgent: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILED'],
        default: 'SUCCESS'
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 2592000 // Automatically delete logs older than 30 days (in seconds)
    }
});

module.exports = mongoose.model('AccessLog', accessLogSchema);
