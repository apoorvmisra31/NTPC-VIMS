const workflowService = require('../services/workflowService');
const Invoice = require('../models/Invoice');
const Comment = require('../models/Comment');
const WorkflowTask = require('../models/WorkflowTask');
const { AuditLog } = require('../models');

// @desc    Approve invoice at current stage
// @route   POST /api/workflow/:invoiceId/approve
exports.approve = async (req, res) => {
  try {
    const { comments } = req.body;
    const result = await workflowService.approveInvoice(
      req.params.invoiceId, req.user._id, req.user.role, comments
    );
    res.json({ success: true, data: result, message: `Approved. Moved to ${result.nextRole}` });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Reject invoice
// @route   POST /api/workflow/:invoiceId/reject
exports.reject = async (req, res) => {
  try {
    const { reason } = req.body;
    const result = await workflowService.rejectInvoice(
      req.params.invoiceId, req.user._id, req.user.role, reason
    );
    res.json({ success: true, data: result, message: `Rejected. Returned to ${result.returnedTo}` });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Request clarification
// @route   POST /api/workflow/:invoiceId/clarification
exports.requestClarification = async (req, res) => {
  try {
    const { message } = req.body;
    const result = await workflowService.requestClarification(
      req.params.invoiceId, req.user._id, req.user.role, message
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Hold invoice (Finance only)
// @route   POST /api/workflow/:invoiceId/hold
exports.hold = async (req, res) => {
  try {
    const { reason } = req.body;
    const result = await workflowService.holdInvoice(
      req.params.invoiceId, req.user._id, req.user.role, reason
    );
    res.json({ success: true, data: result, message: 'Invoice placed on hold' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Forward to Finance (VPG action)
// @route   POST /api/workflow/:invoiceId/forward
exports.forward = async (req, res) => {
  try {
    const { comments } = req.body;
    // Forward is essentially an approval from VPG
    const result = await workflowService.approveInvoice(
      req.params.invoiceId, req.user._id, req.user.role, comments || 'Forwarded to Finance'
    );
    res.json({ success: true, data: result, message: 'Forwarded to Finance' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Adjust payment fields (VPG only)
// @route   POST /api/workflow/:invoiceId/adjust-payment
exports.adjustPayment = async (req, res) => {
  try {
    const { retention_pct, advance_adj, penalty_deduction } = req.body;
    const result = await workflowService.adjustPayment(
      req.params.invoiceId, req.user._id, req.user.role,
      { retention_pct, advance_adj, penalty_deduction }
    );
    res.json({ success: true, data: result, message: 'Payment adjustments saved' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Approve payment (Finance — final approval)
// @route   POST /api/workflow/:invoiceId/approve-payment
exports.approvePayment = async (req, res) => {
  try {
    const { utr_number, payment_date, payment_method } = req.body;
    const result = await workflowService.approvePayment(
      req.params.invoiceId, req.user._id, req.user.role,
      { utr_number, payment_date, payment_method }
    );
    res.json({ success: true, data: result, message: 'Payment approved and processed' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get workflow history for an invoice
// @route   GET /api/workflow/:invoiceId/history
exports.getHistory = async (req, res) => {
  try {
    const result = await workflowService.getWorkflowHistory(req.params.invoiceId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add comment to invoice
// @route   POST /api/workflow/:invoiceId/comment
exports.addComment = async (req, res) => {
  try {
    const { comment, is_internal } = req.body;
    if (!comment) return res.status(400).json({ success: false, message: 'Comment is required' });

    const newComment = await Comment.create({
      invoice_id: req.params.invoiceId,
      user_id: req.user._id,
      role: req.user.role,
      comment,
      is_internal: is_internal || false,
    });

    const populated = await Comment.findById(newComment._id).populate('user_id', 'email role vendorName');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get invoices for current role's inbox
// @route   GET /api/workflow/inbox
exports.getInbox = async (req, res) => {
  try {
    const userRole = req.user.role.toUpperCase();
    const { tab = 'inbox', page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};

    if (tab === 'inbox') {
      // Invoices currently owned by this role
      query.current_role = userRole;
      query.status = { $nin: ['Draft', 'Rejected', 'ON_HOLD'] };
    } else if (tab === 'pending') {
      // Invoices this role has seen but moved on
      const actedInvoiceIds = await WorkflowTask.distinct('invoice_id', {
        assigned_role: userRole, status: 'COMPLETED',
      });
      query._id = { $in: actedInvoiceIds };
      query.current_role = { $ne: userRole };
      query.status = { $nin: ['Paid', 'Rejected'] };
    } else if (tab === 'completed') {
      const actedInvoiceIds = await WorkflowTask.distinct('invoice_id', {
        assigned_role: userRole, status: 'COMPLETED',
      });
      query._id = { $in: actedInvoiceIds };
      query.status = { $in: ['Paid', 'Rejected'] };
    } else if (tab === 'exceptions') {
      query.current_role = userRole;
      query.status = 'ON_HOLD';
    }

    // Additional filters
    if (req.query.vendorCode) query.vendorCode = req.query.vendorCode;
    if (req.query.plant) query.plant = req.query.plant;
    if (req.query.invoiceType) query.invoiceType = req.query.invoiceType;

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('submittedBy', 'email vendorName'),
      Invoice.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: invoices.length,
      total,
      data: invoices,
      pagination: { page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get invoice detail with validation checks
// @route   GET /api/workflow/:invoiceId/detail
exports.getInvoiceDetail = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId)
      .populate('submittedBy', 'email vendorName vendorCode')
      .populate('po_id')
      .populate('vendor_id');

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    // Role isolation check
    const userRole = req.user.role.toUpperCase();
    const isVendor = ['vendor', 'vendor_sub_user'].includes(req.user.role);
    const isAdmin = req.user.role === 'system_admin';

    if (isVendor) {
      // Vendors can always see their own invoices (read-only)
      if (invoice.vendorCode !== req.user.vendorCode) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    } else if (!isAdmin) {
      // Internal users: check role isolation
      const canAccess =
        invoice.current_role === userRole ||
        invoice.status === 'Paid' ||
        invoice.status === 'Rejected' ||
        (invoice.status === 'ON_HOLD' && userRole === 'FINANCE');

      // Also allow if user previously acted on this invoice
      if (!canAccess) {
        const previousTask = await WorkflowTask.findOne({
          invoice_id: invoice._id,
          assigned_role: userRole,
          status: 'COMPLETED',
        });
        if (!previousTask) {
          return res.status(403).json({ success: false, message: 'Invoice not assigned to your role' });
        }
      }
    }

    // Get workflow history
    const history = await workflowService.getWorkflowHistory(invoice._id);

    // Get documents
    const InvoiceDocument = require('../models/Document');
    const documents = await InvoiceDocument.find({ invoice_id: invoice._id }).populate('uploaded_by', 'email role');

    // Get payment if exists
    const Payment = require('../models/Payment');
    const payment = await Payment.findOne({ invoice_id: invoice._id });

    // Get PO details
    const PurchaseOrder = require('../models/PurchaseOrder');
    const po = invoice.poNumber ? await PurchaseOrder.findOne({ poNumber: invoice.poNumber }) : null;

    // Get vendor details
    const Vendor = require('../models/Vendor');
    const vendor = await Vendor.findOne({ vendor_code: invoice.vendorCode });

    res.json({
      success: true,
      data: {
        invoice,
        po,
        vendor,
        documents,
        payment,
        workflow: history,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard metrics for current role
// @route   GET /api/workflow/dashboard-stats
exports.getDashboardMetrics = async (req, res) => {
  try {
    const userRole = req.user.role;
    const upperRole = userRole.toUpperCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const Payment = require('../models/Payment');
    const Vendor = require('../models/Vendor');
    const PurchaseOrder = require('../models/PurchaseOrder');

    let metrics = {};

    if (userRole === 'system_admin') {
      const [activeVendors, openPOs, inPipeline, paymentsMTD] = await Promise.all([
        Vendor.countDocuments({ status: 'ACTIVE' }),
        PurchaseOrder.countDocuments({ status: { $in: ['Open', 'Partially Invoiced'] } }),
        Invoice.countDocuments({ status: { $nin: ['Paid', 'Rejected', 'Draft'] } }),
        Payment.aggregate([
          { $match: { status: 'COMPLETED', payment_date: { $gte: thisMonth } } },
          { $group: { _id: null, total: { $sum: '$payment_amount' } } },
        ]),
      ]);
      metrics = {
        activeVendors,
        openPOs,
        inPipeline,
        paymentsMTD: paymentsMTD[0]?.total || 0,
      };
    } else if (['vendor', 'vendor_sub_user'].includes(userRole)) {
      const vc = req.user.vendorCode;
      const [openPOs, inProgress, paid, rejected] = await Promise.all([
        PurchaseOrder.countDocuments({ vendorCode: vc, status: { $in: ['Open', 'Partially Invoiced'] } }),
        Invoice.countDocuments({ vendorCode: vc, status: { $nin: ['Paid', 'Rejected', 'Draft'] } }),
        Invoice.countDocuments({ vendorCode: vc, status: 'Paid' }),
        Invoice.countDocuments({ vendorCode: vc, status: 'Rejected' }),
      ]);
      metrics = { openPOs, inProgress, paid, rejected };
    } else if (upperRole === 'VPD') {
      const [pending, approvedMTD, returnedMTD, exceptions] = await Promise.all([
        Invoice.countDocuments({ current_role: 'VPD', status: 'Submitted' }),
        WorkflowTask.countDocuments({ assigned_role: 'VPD', action_taken: 'APPROVED', completed_at: { $gte: thisMonth } }),
        WorkflowTask.countDocuments({ assigned_role: 'VPD', action_taken: 'REJECTED', completed_at: { $gte: thisMonth } }),
        WorkflowTask.countDocuments({ assigned_role: 'VPD', action_taken: 'EXCEPTION' }),
      ]);
      metrics = { pending, approvedMTD, returnedMTD, exceptions };
    } else if (upperRole === 'EIC') {
      const [awaiting, certifiedMTD, rejectedMTD] = await Promise.all([
        Invoice.countDocuments({ current_role: 'EIC', status: 'VPD_APPROVED' }),
        WorkflowTask.countDocuments({ assigned_role: 'EIC', action_taken: 'APPROVED', completed_at: { $gte: thisMonth } }),
        WorkflowTask.countDocuments({ assigned_role: 'EIC', action_taken: 'REJECTED', completed_at: { $gte: thisMonth } }),
      ]);
      const completedTasks = await WorkflowTask.find({
        assigned_role: 'EIC', status: 'COMPLETED', action_taken: 'APPROVED', completed_at: { $gte: thisMonth },
      }).select('createdAt completed_at');
      const avgTime = completedTasks.length > 0
        ? completedTasks.reduce((sum, t) => sum + ((t.completed_at || t.updatedAt) - t.createdAt), 0) / completedTasks.length / 3600000
        : 0;
      metrics = { awaiting, certifiedMTD, rejectedMTD, avgApprovalHours: Math.round(avgTime * 10) / 10 };
    } else if (upperRole === 'VPG') {
      const [pending, forwardedMTD, retentionAdj, netPayableMTD] = await Promise.all([
        Invoice.countDocuments({ current_role: 'VPG', status: 'EIC_APPROVED' }),
        WorkflowTask.countDocuments({ assigned_role: 'VPG', action_taken: 'FORWARDED', completed_at: { $gte: thisMonth } }),
        Invoice.countDocuments({ retention_pct: { $gt: 0 }, status: { $in: ['VPG_PROCESSED', 'FINANCE_APPROVED', 'Paid'] } }),
        Invoice.aggregate([
          { $match: { status: 'VPG_PROCESSED', updatedAt: { $gte: thisMonth } } },
          { $group: { _id: null, total: { $sum: '$netAmount' } } },
        ]),
      ]);
      metrics = { pending, forwardedMTD, retentionAdj, netPayableMTD: netPayableMTD[0]?.total || 0 };
    } else if (upperRole === 'FINANCE') {
      const [pending, approvedMTD, released, totalMTD] = await Promise.all([
        Invoice.countDocuments({ current_role: 'FINANCE', status: 'VPG_PROCESSED' }),
        WorkflowTask.countDocuments({ assigned_role: 'FINANCE', action_taken: 'APPROVED', completed_at: { $gte: thisMonth } }),
        Payment.countDocuments({ status: 'COMPLETED' }),
        Payment.aggregate([
          { $match: { status: 'COMPLETED', payment_date: { $gte: thisMonth } } },
          { $group: { _id: null, total: { $sum: '$payment_amount' } } },
        ]),
      ]);
      metrics = { pending, approvedMTD, released, totalMTD: totalMTD[0]?.total || 0 };
    }

    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get recent activity for dashboard
// @route   GET /api/workflow/recent-activity
exports.getRecentActivity = async (req, res) => {
  try {
    const userRole = req.user.role;
    const upperRole = userRole.toUpperCase();
    const limit = 10;
    let activities = [];

    if (userRole === 'system_admin') {
      // All audit logs
      const logs = await AuditLog.find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('user', 'email role');
      activities = logs.map(l => ({
        id: l._id,
        actor: l.userEmail || l.user?.email || 'System',
        actorRole: l.userRole || l.user?.role || 'system',
        action: l.action,
        resource: l.resource,
        resourceId: l.resourceId || l.resource_id,
        timestamp: l.timestamp || l.createdAt,
      }));
    } else if (['vendor', 'vendor_sub_user'].includes(userRole)) {
      // Vendor: audit logs scoped to their invoices
      const vendorInvoiceIds = await Invoice.distinct('_id', { vendorCode: req.user.vendorCode });
      const logs = await AuditLog.find({
        resource: 'Invoice',
        resource_id: { $in: vendorInvoiceIds },
      }).sort({ timestamp: -1 }).limit(limit);
      // Also get invoice numbers for display
      const invoiceMap = {};
      const invoices = await Invoice.find({ _id: { $in: vendorInvoiceIds } }).select('invoiceNumber status');
      invoices.forEach(inv => { invoiceMap[inv._id.toString()] = inv; });
      activities = logs.map(l => {
        const inv = invoiceMap[l.resource_id?.toString()] || {};
        return {
          id: l._id,
          invoiceNumber: inv.invoiceNumber || l.resourceId || '-',
          action: l.action,
          status: l.new_state?.status || inv.status,
          timestamp: l.timestamp || l.createdAt,
        };
      });
    } else {
      // Internal roles: workflow tasks for their role
      const tasks = await WorkflowTask.find({ assigned_role: upperRole, status: 'COMPLETED' })
        .sort({ completed_at: -1 })
        .limit(limit)
        .populate('invoice_id', 'invoiceNumber vendorName netAmount')
        .populate('actor_user_id', 'email');
      activities = tasks.map(t => ({
        id: t._id,
        invoiceNumber: t.invoice_id?.invoiceNumber || '-',
        vendorName: t.invoice_id?.vendorName,
        netAmount: t.invoice_id?.netAmount,
        action: t.action_taken,
        comments: t.comments,
        timestamp: t.completed_at || t.updatedAt,
      }));
    }

    res.json({ success: true, data: activities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get combined Finance inbox (invoices from VPG + travel claims from HR)
// @route   GET /api/workflow/finance-inbox
exports.getFinanceInbox = async (req, res) => {
  try {
    const { tab = 'inbox' } = req.query;
    const { TravelClaim } = require('../models');

    let invoiceItems = [];
    let hrItems = [];

    if (tab === 'inbox') {
      // Invoices forwarded to Finance (current_role = FINANCE)
      const invoices = await Invoice.find({
        current_role: 'FINANCE',
        status: { $nin: ['Draft', 'Rejected', 'Paid'] },
      }).sort({ updatedAt: -1 }).limit(100);

      invoiceItems = invoices.map(inv => ({
        _id: inv._id,
        from: 'VPG',
        type: 'Invoice',
        name: inv.vendorName || 'Unknown',
        code: inv.vendorCode || '',
        plant: inv.plant || '',
        amount: inv.grossAmount || inv.netAmount || 0,
        status: inv.status,
        date: inv.updatedAt || inv.submittedAt,
        itemType: 'invoice',
        invoiceNumber: inv.invoiceNumber,
      }));

      // Travel claims submitted/manager-approved awaiting Finance
      const claims = await TravelClaim.find({
        status: { $in: ['Submitted', 'Manager Approved'] },
      }).populate('employee', 'email vendorName vendorCode plant').sort({ createdAt: -1 }).limit(100);

      hrItems = claims.map(c => ({
        _id: c._id,
        from: 'HR',
        type: 'Travel & Reimbursement',
        name: c.employeeName || c.employee?.vendorName || 'Unknown',
        code: c.employeeCode || c.employee?.vendorCode || '',
        plant: c.plant || c.employee?.plant || '',
        amount: c.totalAmount || 0,
        status: c.status,
        date: c.createdAt,
        itemType: 'travel_claim',
      }));
    } else if (tab === 'pending') {
      // Invoices Finance has approved but not yet paid
      const actedIds = await WorkflowTask.distinct('invoice_id', {
        assigned_role: 'FINANCE', status: 'COMPLETED',
      });
      const invoices = await Invoice.find({
        _id: { $in: actedIds },
        current_role: { $ne: 'FINANCE' },
        status: { $nin: ['Paid', 'Rejected'] },
      }).sort({ updatedAt: -1 });

      invoiceItems = invoices.map(inv => ({
        _id: inv._id,
        from: 'VPG',
        type: 'Invoice',
        name: inv.vendorName || 'Unknown',
        code: inv.vendorCode || '',
        plant: inv.plant || '',
        amount: inv.grossAmount || inv.netAmount || 0,
        status: inv.status,
        date: inv.updatedAt,
        itemType: 'invoice',
        invoiceNumber: inv.invoiceNumber,
      }));
    } else if (tab === 'completed') {
      const actedIds = await WorkflowTask.distinct('invoice_id', {
        assigned_role: 'FINANCE', status: 'COMPLETED',
      });
      const invoices = await Invoice.find({
        _id: { $in: actedIds },
        status: { $in: ['Paid', 'Rejected'] },
      }).sort({ updatedAt: -1 });

      invoiceItems = invoices.map(inv => ({
        _id: inv._id,
        from: 'VPG',
        type: 'Invoice',
        name: inv.vendorName || 'Unknown',
        code: inv.vendorCode || '',
        plant: inv.plant || '',
        amount: inv.grossAmount || inv.netAmount || 0,
        status: inv.status,
        date: inv.updatedAt,
        itemType: 'invoice',
        invoiceNumber: inv.invoiceNumber,
      }));

      // Processed travel claims
      const claims = await TravelClaim.find({
        status: { $in: ['Paid', 'Rejected', 'Finance Processed'] },
      }).populate('employee', 'email vendorName vendorCode plant').sort({ createdAt: -1 });

      hrItems = claims.map(c => ({
        _id: c._id,
        from: 'HR',
        type: 'Travel & Reimbursement',
        name: c.employeeName || c.employee?.vendorName || 'Unknown',
        code: c.employeeCode || c.employee?.vendorCode || '',
        plant: c.plant || c.employee?.plant || '',
        amount: c.totalAmount || 0,
        status: c.status,
        date: c.financeProcessedAt || c.createdAt,
        itemType: 'travel_claim',
      }));
    } else if (tab === 'exceptions') {
      const invoices = await Invoice.find({
        current_role: 'FINANCE',
        status: 'ON_HOLD',
      }).sort({ updatedAt: -1 });

      invoiceItems = invoices.map(inv => ({
        _id: inv._id,
        from: 'VPG',
        type: 'Invoice',
        name: inv.vendorName || 'Unknown',
        code: inv.vendorCode || '',
        plant: inv.plant || '',
        amount: inv.grossAmount || inv.netAmount || 0,
        status: inv.status,
        date: inv.updatedAt,
        itemType: 'invoice',
        invoiceNumber: inv.invoiceNumber,
      }));
    }

    const combined = [...invoiceItems, ...hrItems].sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ success: true, data: combined, count: combined.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
