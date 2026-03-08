const User = require('../models/User');
const Post = require('../models/Post');
const Engagement = require('../models/Engagement');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const PDFDocument = require('pdfkit');
const AccessLog = require('../models/AccessLog');
const AuditLog = require('../models/AuditLog');
const Report = require('../models/Report');

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Dynamically sync the counts to ensure absolute accuracy (in case engagements were added/removed outside normal flow)
        const followersCount = await Engagement.countDocuments({ targetUser: req.user.userId, type: 'follow' });
        const followingCount = await Engagement.countDocuments({ user: req.user.userId, type: 'follow' });

        if (user.followersCount !== followersCount || user.followingCount !== followingCount) {
            await User.updateOne(
                { _id: req.user.userId },
                { $set: { followersCount, followingCount } }
            );

            user.followersCount = followersCount;
            user.followingCount = followingCount;
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, bio, website, location, interests } = req.body;

        // Find user by ID from JWT token and update
        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { name, bio, website, location, interests },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await new AuditLog({
            user: req.user.userId,
            action: 'UPDATE_PROFILE',
            details: 'User updated their profile information',
            ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown'
        }).save();

        res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getSuggestions = async (req, res) => {
    try {
        const userId = req.user.userId;
        const currentUser = await User.findById(userId).select('interests').lean();

        let suggestions = [];

        // 1. Try to find users with at least 1 shared interest
        if (currentUser && currentUser.interests && currentUser.interests.length > 0) {
            // Fast indexed point query for users sharing any of the same interests
            const usersWithInterests = await User.find({
                _id: { $ne: userId },
                interests: { $in: currentUser.interests }
            })
                .select('name email username src followersCount followingCount bio')
                .limit(50) // Limit to a small active subset to prevent massive memory payloads
                .lean();

            // Perform simple JS shuffling and pick 5 instead of DB-level $sample which forces full table scans
            suggestions = usersWithInterests
                .sort(() => 0.5 - Math.random())
                .slice(0, 5)
                .map(user => {
                    // Calculate a quick shared count in JS rather than DB projection
                    const sharedInterests = (user.interests || []).filter(i => currentUser.interests.includes(i));
                    return { ...user, sharedInterestsCount: sharedInterests.length };
                });
        }

        // 2. If we have less than 5 suggestions, fill the rest with fast fallback queries
        if (suggestions.length < 5) {
            const excludeIds = [userId, ...suggestions.map(s => s._id)];

            const randomFallbacks = await User.find({
                _id: { $nin: excludeIds }
            })
                .select('name email username src followersCount followingCount bio')
                .limit(10) // Small limit, fast cursor read
                .lean();

            const fastRandoms = randomFallbacks
                .sort(() => 0.5 - Math.random())
                .slice(0, 5 - suggestions.length)
                .map(user => ({ ...user, sharedInterestsCount: 0 }));

            suggestions = [...suggestions, ...fastRandoms];
        }

        // Sort by most shared interests
        suggestions.sort((a, b) => b.sharedInterestsCount - a.sharedInterestsCount);

        res.status(200).json(suggestions);
    } catch (error) {
        console.error('Error fetching user suggestions:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.createModerator = async (req, res) => {
    try {
        const { email, name, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newModerator = new User({
            email,
            name,
            password: hashedPassword,
            role: 'moderator',
            hasAcceptedTerms: true,
            hasVerifiedAge: true,
            isEmailVerified: true // Assuming admins verify them inherently
        });

        await newModerator.save();

        res.status(201).json({
            message: 'Moderator created successfully',
            user: {
                id: newModerator._id,
                email: newModerator.email,
                name: newModerator.name,
                role: newModerator.role
            }
        });
    } catch (error) {
        console.error('Error creating moderator:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || query.trim().length === 0) {
            return res.status(200).json([]);
        }

        const escapedSearch = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const mongoose = require('mongoose');
        const queryObj = {
            $or: [
                { name: { $regex: new RegExp(escapedSearch, 'i') } },
                { email: { $regex: new RegExp(escapedSearch, 'i') } }
            ]
        };

        if (req.user && req.user.userId && mongoose.Types.ObjectId.isValid(req.user.userId)) {
            queryObj._id = { $ne: req.user.userId };
        }

        // Find users matching name or email substring
        const users = await User.find(queryObj)
            .select('name email avatar bio followersCount role')
            .limit(10) // Small limit for dropdowns
            .lean();

        res.status(200).json(users);
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const sort = req.query.sort || 'createdAt_desc'; // e.g. "name_asc", "createdAt_desc"

        const skip = (page - 1) * limit;

        // Build the search query
        const query = { _id: { $ne: req.user.userId } };
        if (search) {
            // Escape special regex characters
            const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Remove the ^ anchor to allow substring matching (e.g. searching "Smith" finds "John Smith")
            query.$or = [
                { name: { $regex: new RegExp(escapedSearch, 'i') } },
                { email: { $regex: new RegExp(escapedSearch, 'i') } }
            ];
        }

        // Build the sort parameters
        const sortOptions = {};
        const [sortField, sortOrder] = sort.split('_');
        sortOptions[sortField] = sortOrder === 'desc' ? -1 : 1;

        // Execute query
        const users = await User.find(query)
            .select('-password -mfaSecret -verificationToken') // omit sensitive data
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .lean(); // Vastly improves performance by returning plain JS objects instead of Mongoose Documents

        // Avoid extremely slow full-collection scans unless actively searching
        const totalUsers = search
            ? await User.countDocuments(query)
            : await User.estimatedDocumentCount();

        res.status(200).json({
            users,
            currentPage: page,
            totalPages: Math.ceil(totalUsers / limit),
            totalUsers
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid User ID format' });
        }
        const user = await User.findById(req.params.id).select('-password -mfaSecret -verificationToken');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!['admin', 'moderator', 'user'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });

        await new AuditLog({
            user: req.user.userId,
            action: 'UPDATE_ROLE',
            details: `Updated role of user ${user.email} to ${role}`,
            ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown'
        }).save();

        res.json({ message: 'Role updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.followUser = async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const currentUserId = req.user.userId;

        if (targetUserId === currentUserId) {
            return res.status(400).json({ message: 'You cannot follow yourself' });
        }

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if follow engagement already exists
        const existingFollow = await Engagement.findOne({
            user: currentUserId,
            targetUser: targetUserId,
            type: 'follow'
        });

        if (existingFollow) {
            // Unfollow
            await existingFollow.deleteOne();

            // Adjust counters (optional, depends on schema)
            await User.findByIdAndUpdate(targetUserId, { $inc: { followersCount: -1 } });
            await User.findByIdAndUpdate(currentUserId, { $inc: { followingCount: -1 } });

            return res.status(200).json({ message: 'Successfully unfollowed user', isFollowing: false });
        } else {
            // Follow
            await Engagement.create({
                user: currentUserId,
                targetUser: targetUserId,
                type: 'follow'
            });

            // Adjust counters
            await User.findByIdAndUpdate(targetUserId, { $inc: { followersCount: 1 } });
            await User.findByIdAndUpdate(currentUserId, { $inc: { followingCount: 1 } });

            // Generate Follow Notification
            const notification = new Notification({
                user: targetUserId,
                type: 'FOLLOW',
                sender: currentUserId
            });
            await notification.save();

            // Emit using Socket.io
            const io = req.app.get('io');
            if (io) {
                const populatedNotif = await Notification.findById(notification._id)
                    .populate('sender', 'name avatar');
                io.to('user_' + targetUserId.toString()).emit('new_notification', populatedNotif);
            }

            return res.status(200).json({ message: 'Successfully followed user', isFollowing: true });
        }
    } catch (error) {
        console.error('Error toggling follow:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getFollowers = async (req, res) => {
    try {
        const userId = req.params.id;
        // Find engagements where targetUser is this userId and type is 'follow'
        const follows = await Engagement.find({ targetUser: userId, type: 'follow' })
            .populate('user', 'name email followersCount followingCount src _id');

        // Map to just the user objects
        const followers = follows.map(f => f.user).filter(u => u != null);

        res.status(200).json(followers);
    } catch (error) {
        console.error('Error fetching followers:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getFollowing = async (req, res) => {
    try {
        const userId = req.params.id;
        // Find engagements where user is this userId and type is 'follow'
        const follows = await Engagement.find({ user: userId, type: 'follow' })
            .populate('targetUser', 'name email followersCount followingCount src _id');

        // Map to just the user objects
        const following = follows.map(f => f.targetUser).filter(u => u != null);

        res.status(200).json(following);
    } catch (error) {
        console.error('Error fetching following:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getUserPosts = async (req, res) => {
    try {
        const userId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const posts = await mongoose.model('Post').find({ author: userId, status: 'PUBLISHED' })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('author', 'name username _id')
            .populate({
                path: 'originalPost',
                populate: { path: 'author', select: 'name username _id' }
            });

        res.status(200).json(posts);
    } catch (error) {
        console.error('Error fetching user posts:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getUserBookmarks = async (req, res) => {
    try {
        const userId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const bookmarks = await Engagement.find({ user: userId, type: 'bookmark' })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate({
                path: 'post',
                populate: [
                    { path: 'author', select: 'name username _id' },
                    { path: 'originalPost', populate: { path: 'author', select: 'name username _id' } }
                ]
            });

        // Map engagements to just the posts, filter out any null posts (if they were deleted)
        const posts = bookmarks.map(b => b.post).filter(p => p != null && p.status === 'PUBLISHED');

        res.status(200).json(posts);
    } catch (error) {
        console.error('Error fetching user bookmarks:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};



exports.getAccessHistory = async (req, res) => {
    try {
        const logs = await AccessLog.find({ user: req.user.userId })
            .sort({ createdAt: -1 })
            .limit(30)
            .select('-user -__v');
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getAuditLogs = async (req, res) => {
    try {
        const logs = await AuditLog.find({ user: req.user.userId })
            .sort({ createdAt: -1 })
            .limit(50)
            .select('-user -__v');
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.exportData = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { posts, comments, messages, profile, activity, format } = req.query;

        // Safely parse boolean strings from query, defaulting to true if no params provided
        const hasParams = Object.keys(req.query).length > 0 && !Object.keys(req.query).every(k => k === 'format');
        const includePosts = hasParams ? posts === 'true' : true;
        const includeComments = hasParams ? comments === 'true' : true;
        const includeMessages = hasParams ? messages === 'true' : true;
        const includeProfile = hasParams ? profile === 'true' : true;
        const includeActivity = hasParams ? activity === 'true' : true;

        // Return immediately to the user while processing massive aggregations in the background
        res.status(202).json({ message: 'Data export request has been received. You will receive an email shortly with your requested files.' });

        // Proceed asynchronously
        (async () => {
            try {
                const AuthUser = await User.findById(userId).select('email username');
                if (!AuthUser || !AuthUser.email) {
                    console.error('Cannot export data: User or email not found for ID', userId);
                    return;
                }

                await new AuditLog({
                    user: userId,
                    action: 'DATA_EXPORT',
                    details: 'Requested selective profile and activity export',
                    ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown'
                }).save();

                const exportPayload = {
                    generatedAt: new Date().toISOString(),
                };

                if (includeProfile) {
                    exportPayload.profile = await User.findById(userId).select('-password -__v');
                }

                if (includePosts) {
                    exportPayload.postsCreated = await Post.find({ author: userId }).select('-__v');
                }

                if (includeComments) {
                    exportPayload.comments = await Engagement.find({ user: userId, type: 'comment' })
                        .populate('post', 'content')
                        .select('-__v');
                }

                if (includeMessages) {
                    exportPayload.messages = []; // Placeholder until direct messaging is implemented
                }

                if (includeActivity) {
                    exportPayload.platformActivity = await Engagement.find({ user: userId, type: { $ne: 'comment' } }).select('-__v');
                    exportPayload.securityLogs = await AccessLog.find({ user: userId }).select('-__v');
                }

                // Stringify JSON
                const jsonString = JSON.stringify(exportPayload, null, 2);

                // Convert JSON metrics to generic flat CSV
                let csvString = 'Category,Data\n';

                const flattenObj = (obj, parentKey = '') => {
                    for (let key in obj) {
                        if (typeof obj[key] === 'object' && obj[key] !== null) {
                            if (Array.isArray(obj[key])) {
                                csvString += `${parentKey}${key},"[Array of ${obj[key].length} items]"\n`;
                            } else {
                                flattenObj(obj[key], `${parentKey}${key}.`);
                            }
                        } else {
                            const val = String(obj[key]).replace(/"/g, '""');
                            csvString += `${parentKey}${key},"${val}"\n`;
                        }
                    }
                };
                flattenObj(exportPayload);

                // Load email tool and dispatch
                const { sendDataExportEmail } = require('../utils/email');

                let pdfBuffer = null;
                if (!format || format === 'pdf' || format === 'all') {
                    pdfBuffer = await new Promise((resolve, reject) => {
                        try {
                            const doc = new PDFDocument();
                            const buffers = [];
                            doc.on('data', buffers.push.bind(buffers));
                            doc.on('end', () => {
                                resolve(Buffer.concat(buffers));
                            });

                            doc.fontSize(20).text('Social App Data Export', { align: 'center' });
                            doc.moveDown();
                            doc.fontSize(12).text(`Generated At: ${exportPayload.generatedAt}`);
                            doc.moveDown();

                            // Iterate over properties to format them simply for the PDF
                            doc.fontSize(10);
                            for (const [key, val] of Object.entries(exportPayload)) {
                                if (key !== 'generatedAt') {
                                    doc.font('Helvetica-Bold').text(`${key.toUpperCase()}:`);
                                    doc.font('Helvetica').text(JSON.stringify(val, null, 2));
                                    doc.moveDown();
                                }
                            }

                            doc.end();
                        } catch (err) {
                            reject(err);
                        }
                    });
                }

                await sendDataExportEmail(AuthUser.email, AuthUser.username, jsonString, csvString, pdfBuffer);

            } catch (backgroundError) {
                console.error('Background Data Export failed:', backgroundError);
                // In a real application, you might dispatch a failure email here
            }
        })();

    } catch (error) {
        console.error('Data export error:', error);
        res.status(500).json({ message: 'Server error during data export initialization', error: error.message });
    }
};

exports.requestDeletion = async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user.userId;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.authProvider === 'local') {
            if (!password) return res.status(400).json({ message: 'Password is required to delete account' });
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({ message: 'Incorrect password' });
        }

        await Engagement.deleteMany({ $or: [{ user: userId }, { targetUser: userId }] });
        await Post.deleteMany({ author: userId });
        await AccessLog.deleteMany({ user: userId });
        await AuditLog.deleteMany({ user: userId });
        await Report.deleteMany({ $or: [{ reporter: userId }, { reportedUser: userId }] });
        await Notification.deleteMany({ $or: [{ user: userId }, { sender: userId }] });

        await User.findByIdAndDelete(userId);

        res.status(200).json({ message: 'Account and all associated data have been permanently deleted.' });
    } catch (error) {
        console.error('Account deletion error:', error);
        res.status(500).json({ message: 'Server error during account deletion', error: error.message });
    }
};
