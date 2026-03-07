const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your_temporary_jwt_secret';
const MFA_MOCK_REQUIRED = true; // For demonstration, default to requiring MFA if local login

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

        // Handle OAuth Login
        if (authProvider && authProvider !== 'local') {
            let user = await User.findOne({ email });
            if (!user) {
                // Auto-register OAuth users
                user = new User({
                    email,
                    authProvider,
                    isEmailVerified: true, // Assuming OAuth provider verified it
                    hasAcceptedTerms: true,
                    hasVerifiedAge: true
                });
                await user.save();
            }
            const token = generateToken(user._id, user.email, user.role);
            return res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
        }

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
        if (user.isMfaEnabled || MFA_MOCK_REQUIRED) {
            // Mock sending MFA code
            const tempMfaToken = jwt.sign({ id: user._id, pendingMfa: true }, JWT_SECRET, { expiresIn: '5m' });
            return res.json({
                message: 'MFA code sent',
                mfaRequired: true,
                tempToken: tempMfaToken
            });
        }

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

        // Mock MFA Verification (accepts any 6 digit code for now)
        if (mfaCode.length !== 6) {
            return res.status(400).json({ message: 'Invalid MFA code' });
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

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
