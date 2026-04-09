const User = require('../models/User');

module.exports = async function (req, res, next) {
    try {
        if (!req.user || !req.user.id) {
            return res.status(403).json({ msg: 'Access denied. Admin only.' });
        }
        const user = await User.findById(req.user.id);
        if (user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Admin only.' });
        }
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error' });
    }
};
