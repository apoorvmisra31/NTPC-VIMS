const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const wf = require('../controllers/workflowController');

// Inbox — role-filtered invoice list
router.get('/inbox', protect, authorize('vpd', 'eic', 'vpg', 'finance', 'system_admin'), wf.getInbox);

// Dashboard metrics (all roles)
router.get('/dashboard-stats', protect, wf.getDashboardMetrics);

// Recent activity (all roles)
router.get('/recent-activity', protect, wf.getRecentActivity);

// Finance combined inbox (invoices + HR claims)
router.get('/finance-inbox', protect, authorize('finance', 'system_admin'), wf.getFinanceInbox);

// Invoice detail with full context
router.get('/:invoiceId/detail', protect, wf.getInvoiceDetail);

// Workflow history
router.get('/:invoiceId/history', protect, wf.getHistory);

// Workflow actions
router.post('/:invoiceId/approve', protect, authorize('vpd', 'eic', 'vpg', 'finance'), wf.approve);
router.post('/:invoiceId/reject', protect, authorize('vpd', 'eic', 'vpg', 'finance'), wf.reject);
router.post('/:invoiceId/clarification', protect, authorize('vpd', 'eic', 'vpg', 'finance'), wf.requestClarification);
router.post('/:invoiceId/hold', protect, authorize('finance'), wf.hold);
router.post('/:invoiceId/forward', protect, authorize('vpg'), wf.forward);
router.post('/:invoiceId/adjust-payment', protect, authorize('vpg'), wf.adjustPayment);
router.post('/:invoiceId/approve-payment', protect, authorize('finance'), wf.approvePayment);

// Comments
router.post('/:invoiceId/comment', protect, wf.addComment);

module.exports = router;
