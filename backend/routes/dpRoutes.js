const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const dp = require('../controllers/dpController');

// Workplace inbox
router.get('/workplace/inbox', protect, authorize('vpd', 'eic', 'vpg', 'finance', 'system_admin'), dp.getWorkplaceInbox);

// DP Document CRUD
router.get('/:dpId', protect, authorize('vpd', 'eic', 'vpg', 'finance', 'system_admin'), dp.getDPDocument);
router.patch('/:dpId/basic-data', protect, authorize('vpd'), dp.updateBasicData);
router.patch('/:dpId/line-items', protect, authorize('eic', 'vpd'), dp.updateLineItems);
router.patch('/:dpId/accounting', protect, authorize('vpd', 'vpg'), dp.updateAccounting);
router.patch('/:dpId/tax', protect, authorize('vpd'), dp.updateTax);
router.patch('/:dpId/other-data', protect, authorize('eic', 'vpd', 'vpg'), dp.updateOtherData);
router.patch('/:dpId/cumulative', protect, authorize('eic', 'vpg'), dp.updateCumulative);

// Actions
router.post('/:dpId/resolve-exception', protect, authorize('eic', 'vpd'), dp.resolveException);
router.post('/:dpId/refer', protect, authorize('eic', 'vpg'), dp.referDocument);
router.post('/:dpId/return-to-vendor', protect, authorize('vpd', 'eic'), dp.returnToVendor);
router.post('/:dpId/approve', protect, authorize('vpd', 'eic', 'vpg', 'finance'), dp.approveDocument);
router.post('/:dpId/post', protect, authorize('finance'), dp.postInvoice);

// History
router.get('/:dpId/history', protect, dp.getDPHistory);

module.exports = router;
