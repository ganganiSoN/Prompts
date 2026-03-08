const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET || 'your_temporary_jwt_secret';

const generateToken = (userId, email, role = 'user') => {
    return jwt.sign({ id: userId, email, role }, JWT_SECRET, {
        expiresIn: '7d',
    });
};

exports.signup = async (req, res) => {
    try {
        const { email, password, hasAcceptedTerms, hasVerifiedAge } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Generate mock verification token
        const verificationToken = Math.random().toString(36).substring(2, 15);

        user = new User({
            email,
            password,
            hasAcceptedTerms,
            hasVerifiedAge,
            verificationToken,
            isEmailVerified: false,
        });

        await user.save();

        // Mock sending email here...

        res.status(201).json({
            message: 'User registered successfully. Please verify your email.',
            mockVerificationToken: verificationToken // sending it back for testing purposes
        });
    } catch (error) {
        console.log('error', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password, authProvider } = req.body;

        // Handle Local Login
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (!user.isEmailVerified) {
            return res.status(403).json({ message: 'Please verify your email first', reqEmail: true });
        }

        // MFA Flow
        if (user.isMfaEnabled) {
            // Note: In production you would integrate an SMS/Email service here to dispatch user.mfaPin
            const tempMfaToken = jwt.sign({ id: user._id, pendingMfa: true }, JWT_SECRET, { expiresIn: '5m' });
            return res.json({
                message: 'MFA code required',
                mfaRequired: true,
                tempToken: tempMfaToken
            });
        }

        // Record successful login access log
        const AccessLog = require('../models/AccessLog');
        const accessLog = new AccessLog({
            user: user._id,
            ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown',
            userAgent: req.headers['user-agent'] || 'Unknown',
            status: 'SUCCESS'
        });
        await accessLog.save();

        const token = generateToken(user._id, user.email, user.role);
        res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        const { token, email } = req.body;
        const user = await User.findOne({ email, verificationToken: token });

        if (!user) {
            return res.status(400).json({ message: 'Invalid verification token' });
        }

        user.isEmailVerified = true;
        user.verificationToken = undefined;
        await user.save();

        const jwtToken = generateToken(user._id, user.email, user.role);
        res.json({ message: 'Email verified successfully', token: jwtToken });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.verifyMfa = async (req, res) => {
    try {
        const { tempToken, mfaCode } = req.body;

        if (!tempToken || !mfaCode) {
            return res.status(400).json({ message: 'Missing token or code' });
        }

        const decoded = jwt.verify(tempToken, JWT_SECRET);
        if (!decoded.pendingMfa) {
            return res.status(400).json({ message: 'Invalid token type' });
        }

        if (mfaCode.length !== 6) {
            return res.status(400).json({ message: 'MFA code must be exactly 6 digits' });
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Extremely strict MFA enforcement check!
        if (user.mfaPin !== mfaCode) {
            return res.status(400).json({ message: 'Invalid MFA pin code' });
        }

        // Successful authentication
        const token = generateToken(user._id, user.email, user.role);
        res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.json({ message: 'If an account exists, a password reset token has been sent.' });
        }

        const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await user.save();

        res.json({
            message: 'If an account exists, a password reset token has been sent.',
            mockResetToken: resetToken
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
        }

        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.json({ message: 'Password has been successfully reset' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.googleAuth = async (req, res) => {
    try {
        const { code, redirectUri } = req.body;

        // 1. Exchange the Authorization Code for an Access Token
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET, // Note: User needs to ensure this is set in .env
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri || `${req.headers.origin}/auth/google/callback` // Use exact frontend string
        });

        const accessToken = tokenResponse.data.access_token;
        if (!accessToken) {
            return res.status(401).json({ message: 'Failed to retrieve access token from Google' });
        }

        // 2. Fetch the user's profile from Google's userinfo endpoint
        const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const { email, name, picture, sub } = response.data;

        if (!email) {
            return res.status(400).json({ message: 'Google account must have a verified email address' });
        }

        let user = await User.findOne({ email });
        if (!user) {
            user = new User({
                email,
                name,
                authProvider: 'google',
                isEmailVerified: true,
                hasAcceptedTerms: true,
                hasVerifiedAge: true,
                avatar: picture
            });
            await user.save();
        }

        const jwtToken = generateToken(user._id, user.email, user.role);
        return res.json({ token: jwtToken, user: { id: user._id, email: user.email, name: user.name, role: user.role, avatar: user.avatar } });

    } catch (error) {
        console.error('Google Auth Error:', error.response?.data || error.message);
        res.status(401).json({ message: 'Google Authentication failed', details: error.response?.data || error.message });
    }
};

exports.githubAuth = async (req, res) => {
    try {
        const { code } = req.body;

        // 1. Exchange code for access token
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code
        }, {
            headers: { Accept: 'application/json' }
        });

        const accessToken = tokenResponse.data.access_token;
        if (!accessToken) {
            return res.status(401).json({ message: 'Failed to retrieve access token from GitHub' });
        }

        // 2. Fetch user profile
        const userResponse = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        // 3. Fetch user emails (if primary email is hidden)
        let email = userResponse.data.email;
        if (!email) {
            const emailResponse = await axios.get('https://api.github.com/user/emails', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            const primaryEmail = emailResponse.data.find((e) => e.primary && e.verified);
            email = primaryEmail ? primaryEmail.email : null;
        }

        if (!email) {
            return res.status(400).json({ message: 'GitHub account must have a verified email address' });
        }

        const { login, avatar_url } = userResponse.data;

        let user = await User.findOne({ email });
        if (!user) {
            user = new User({
                email,
                name: login,
                authProvider: 'github',
                isEmailVerified: true,
                hasAcceptedTerms: true,
                hasVerifiedAge: true,
                avatar: avatar_url
            });
            await user.save();
        }

        const jwtToken = generateToken(user._id, user.email, user.role);
        return res.json({ token: jwtToken, user: { id: user._id, email: user.email, name: user.name, role: user.role, avatar: user.avatar } });

    } catch (error) {
        console.error('GitHub Auth Error:', error.response?.data || error.message);
        res.status(500).json({ message: 'GitHub authentication failed', details: error.response?.data || error.message });
    }
};
