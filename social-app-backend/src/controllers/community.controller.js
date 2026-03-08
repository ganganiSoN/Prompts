const Community = require('../models/Community');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Create a new community
// @route   POST /api/communities
// @access  Private
const createCommunity = async (req, res) => {
    try {
        const { name, description, tags, coverImage } = req.body;

        // Check if community with same name exists
        const communityExists = await Community.findOne({ name });

        if (communityExists) {
            return res.status(400).json({ message: 'Community with this name already exists' });
        }

        // Process tags (if sent as comma separated string or array)
        let processedTags = [];
        if (typeof tags === 'string') {
            processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        } else if (Array.isArray(tags)) {
            processedTags = tags;
        }

        const creatorId = req.user.userId || req.user.id || req.user._id;
        const newCommunity = await Community.create({
            name,
            description,
            tags: processedTags,
            coverImage: coverImage || '',
            creator: creatorId,
            members: [creatorId], // Creator is automatically the first member
            memberCount: 1
        });

        res.status(201).json(newCommunity);
    } catch (error) {
        console.error('Error in createCommunity:', error);
        res.status(500).json({ message: 'Server error creating community' });
    }
};

// @desc    Get all communities (with optional search/filtering)
// @route   GET /api/communities
// @access  Private
const getCommunities = async (req, res) => {
    try {
        const { search } = req.query;

        let query = {};
        if (search) {
            query = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { tags: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const communities = await Community.find(query)
            .populate('creator', 'name username')
            .sort({ createdAt: -1 });

        res.json(communities);
    } catch (error) {
        console.error('Error in getCommunities:', error);
        res.status(500).json({ message: 'Server error fetching communities' });
    }
};

// @desc    Get community by ID
// @route   GET /api/communities/:id
// @access  Private
const getCommunityById = async (req, res) => {
    try {
        const community = await Community.findById(req.params.id)
            .populate('creator', 'name username avatar')
            .populate('members', 'name username avatar'); // Might want to limit this in production

        if (!community) {
            return res.status(404).json({ message: 'Community not found' });
        }

        res.json(community);
    } catch (error) {
        console.error('Error in getCommunityById:', error);
        res.status(500).json({ message: 'Server error fetching community details' });
    }
};

// @desc    Toggle joining/leaving a community
// @route   POST /api/communities/:id/join
// @access  Private
const toggleJoinCommunity = async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);

        if (!community) {
            return res.status(404).json({ message: 'Community not found' });
        }

        const userId = req.user.userId || req.user.id || req.user._id;
        const isMember = community.members.some(id => id && id.toString() === userId.toString());

        if (isMember) {
            // Leave community
            community.members = community.members.filter(id => id && id.toString() !== userId.toString());

        } else {
            // Join community
            // Check if they are already in the array somehow before pushing
            if (!community.members.find(id => id && id.toString() === userId.toString())) {
                community.members.push(userId);
            }
        }

        // Since we use a sync pre-save hook for memberCount, just save
        await community.save();

        if (!isMember) {
            // User just joined, send notification to other existing members
            try {
                const io = req.app.get('io');
                const joiningUser = await User.findById(userId).select('name avatar');

                // Members array includes the newly joined user now (added above)
                // Filter them out for the notification
                const membersToNotify = community.members.filter(id => id && id.toString() !== userId.toString());

                if (membersToNotify.length > 0) {
                    const notifyPayloads = membersToNotify.map(memberId => ({
                        user: memberId,
                        type: 'COMMUNITY_JOIN',
                        sender: userId,
                        community: community._id
                    }));

                    const insertedNotifs = await Notification.insertMany(notifyPayloads);

                    if (io) {
                        insertedNotifs.forEach(notif => {
                            const payload = {
                                ...notif.toObject(),
                                sender: joiningUser,
                                community: { _id: community._id, name: community.name }
                            };
                            io.to('user_' + notif.user.toString()).emit('new_notification', payload);
                        });
                    }
                }
            } catch (notifError) {
                console.error('Error sending COMMUNITY_JOIN notification:', notifError);
            }
        }

        res.json({
            message: isMember ? 'Left community' : 'Joined community',
            isMember: !isMember,
            community
        });
    } catch (error) {
        console.error('Error in toggleJoinCommunity:', error);
        res.status(500).json({ message: 'Server error toggling membership' });
    }
};

module.exports = {
    createCommunity,
    getCommunities,
    getCommunityById,
    toggleJoinCommunity
};

