const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    tags: [{
        type: String,
        trim: true,
    }],
    coverImage: {
        type: String,
        default: '',
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    memberCount: {
        type: Number,
        default: 1,
    }
}, { timestamps: true });

// Pre-save middleware to update memberCount if members array changes
communitySchema.pre('save', function () {
    if (this.isModified('members')) {
        this.memberCount = this.members.length;
    }
});

const Community = mongoose.model('Community', communitySchema);

module.exports = Community;

