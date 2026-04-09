/**
 * Middleware to check if user has verified their company email
 * Use this to protect routes that require company verification
 */
const User = require('../models/User');

const requireCompanyVerification = async (req, res, next) => {
    try {
        // User should already be authenticated (auth middleware should run first)
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.isCompanyVerified) {
            return res.status(403).json({
                error: 'Company email verification required',
                message: 'Please verify your company email before sharing interviews',
                requiresVerification: true
            });
        }

        // User is verified, proceed
        next();

    } catch (error) {
        console.error('Company verification middleware error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = requireCompanyVerification;
