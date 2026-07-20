const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { updateProfile } = require('../controllers/profileController');

// Profile update — any authenticated user
router.patch('/update', protect, updateProfile);

module.exports = router;
