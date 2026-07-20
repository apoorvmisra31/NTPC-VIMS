const User = require('../models/User');

// @desc    Update current user's profile (name, code)
// @route   PATCH /api/profile/update
exports.updateProfile = async (req, res) => {
    try {
        const { vendorName, vendorCode } = req.body;
        const updates = {};

        if (vendorName !== undefined) updates.vendorName = vendorName.trim();
        if (vendorCode !== undefined) updates.vendorCode = vendorCode.trim();

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, data: user, message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
