const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const analytics = require('../controllers/analyticsController');

router.get('/vim-summary', protect, authorize('vpd', 'eic', 'vpg', 'finance', 'system_admin'), analytics.getVIMSummary);
router.get('/invoice-trends', protect, authorize('vpd', 'vpg', 'system_admin'), analytics.getInvoiceTrends);
router.get('/exception-report', protect, authorize('system_admin'), analytics.getExceptionReport);
router.get('/payment-status', protect, authorize('vendor', 'finance', 'system_admin'), analytics.getPaymentStatus);

module.exports = router;
