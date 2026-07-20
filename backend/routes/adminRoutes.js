const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const admin = require('../controllers/adminController');

// User Management
router.get('/users', protect, authorize('system_admin'), admin.getUsers);
router.patch('/users/:id/role', protect, authorize('system_admin'), admin.updateUserRole);

// Workflow Configuration
router.get('/workflow-config', protect, authorize('system_admin'), admin.getWorkflowConfig);
router.put('/workflow-config', protect, authorize('system_admin'), admin.updateWorkflowConfig);

// Checklist Configuration
router.get('/checklist-config', protect, authorize('system_admin'), admin.getChecklistConfig);
router.put('/checklist-config', protect, authorize('system_admin'), admin.updateChecklistConfig);

// Audit Logs
router.get('/audit-logs', protect, authorize('system_admin'), admin.getAuditLogs);

// Report Generation
router.get('/reports/generate', protect, authorize('system_admin'), admin.generateReport);

// Purchase Order Management
router.post('/purchase-orders', protect, authorize('system_admin'), admin.createPO);
router.get('/purchase-orders', protect, authorize('system_admin'), admin.getPurchaseOrders);
router.get('/purchase-orders/:id', protect, authorize('system_admin'), admin.getPurchaseOrderById);
router.put('/purchase-orders/:id', protect, authorize('system_admin'), admin.updatePO);
router.patch('/purchase-orders/:id/status', protect, authorize('system_admin'), admin.changePOStatus);

module.exports = router;
