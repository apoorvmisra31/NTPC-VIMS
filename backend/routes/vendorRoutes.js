const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const PurchaseOrder = require('../models/PurchaseOrder');
const { Message, Notification } = require('../models');
const vendorCtrl = require('../controllers/vendorController');
const { validatePO, getProposal } = require('../services/poValidationService');
const { getUserNotifications, markAsRead } = require('../services/notificationService');

// Dashboard
router.get('/dashboard', protect, authorize('vendor', 'vendor_sub_user'), vendorCtrl.getDashboard);

// Purchase Orders
router.get('/purchase-orders', protect, authorize('vendor', 'vendor_sub_user'), async (req, res) => {
  try {
    const pos = await PurchaseOrder.find({ vendorCode: req.user.vendorCode });
    res.json({ success: true, data: pos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/purchase-orders/:poNumber', protect, async (req, res) => {
  try {
    const po = await PurchaseOrder.findOne({ poNumber: req.params.poNumber });
    if (!po) return res.status(404).json({ success: false, message: 'PO not found' });
    res.json({ success: true, data: po });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PO Validation
router.post('/validate-po', protect, async (req, res) => {
  try {
    const result = await validatePO(req.body.poNumber, req.user.vendorCode);
    if (!result.isValid) {
      return res.status(400).json({ success: false, message: result.error });
    }
    res.json({ success: true, data: result.data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// EIC Get Proposal
router.get('/proposal/:poNumber', protect, authorize('eic'), async (req, res) => {
  try {
    const proposal = await getProposal(req.params.poNumber);
    if (!proposal) return res.status(404).json({ success: false, message: 'PO not found' });
    res.json({ success: true, data: proposal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Sub-user management
router.get('/sub-users', protect, authorize('vendor'), vendorCtrl.getSubUsers);
router.post('/sub-users', protect, authorize('vendor'), vendorCtrl.addSubUser);
router.patch('/sub-users/:id/toggle', protect, authorize('vendor'), vendorCtrl.toggleSubUser);

// Vendor Reports
router.get('/reports', protect, authorize('vendor', 'vendor_sub_user'), vendorCtrl.getReports);

// Messages
router.get('/messages/:invoiceId', protect, async (req, res) => {
  try {
    const messages = await Message.find({ invoiceRef: req.params.invoiceId })
      .populate('sender', 'email role vendorName')
      .sort({ createdAt: 1 });
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/messages', protect, async (req, res) => {
  try {
    const { invoiceId, message } = req.body;
    const msg = await Message.create({
      invoiceRef: invoiceId,
      sender: req.user._id,
      senderName: req.user.vendorName || req.user.email,
      senderRole: req.user.role,
      message,
    });

    // Push via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`invoice-${invoiceId}`).emit('new-message', {
        ...msg.toObject(),
        sender: { email: req.user.email, role: req.user.role },
      });
    }

    res.status(201).json({ success: true, data: msg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Notifications
router.get('/notifications', protect, async (req, res) => {
  try {
    const result = await getUserNotifications(req.user._id, req.query.page, req.query.limit);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/notifications/read', protect, async (req, res) => {
  try {
    await markAsRead(req.body.ids, req.user._id);
    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
