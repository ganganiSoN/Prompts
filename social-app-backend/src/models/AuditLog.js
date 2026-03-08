const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    action: {
        type: String,
        required: true,
        enum: ['PASSWORD_CHANGE', 'PROFILE_UPDATE', 'DATA_EXPORT', 'ROLE_CHANGE', 'ACCOUNT_CREATED', 'MODERATOR_CREATED']
    },
    details: {
        type: String
    },
    ipAddress: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
