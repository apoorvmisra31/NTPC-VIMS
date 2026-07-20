const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const hr = require('../controllers/hrController');

// Leave Management
router.get('/leaves', protect, hr.getLeaves);
router.post('/leaves', protect, hr.submitLeave);
router.get('/leaves/:id', protect, hr.getLeaveById);
router.patch('/leaves/:id', protect, authorize('hr_admin', 'system_admin'), hr.approveLeave);
router.patch('/leaves/:id/update', protect, hr.updateLeave);
router.get('/leave-balance', protect, hr.getLeaveBalance);

// Travel Claims
router.get('/travel-claims', protect, hr.getTravelClaims);
router.post('/travel-claims', protect, hr.submitTravelClaim);
router.get('/travel-claims/:id', protect, hr.getTravelClaimById);
router.patch('/travel-claims/:id/update', protect, hr.updateTravelClaim);
router.patch('/travel-claims/:id/approve', protect, authorize('hr_admin', 'system_admin'), hr.approveTravelClaim);
router.patch('/travel-claims/:id/process', protect, authorize('finance', 'system_admin'), hr.processTravelClaim);

module.exports = router;
