const User = require('../models/User');
const { AuditLog } = require('../models');
const { generateExcelReport, generatePDFReport } = require('../services/reportService');
const Invoice = require('../models/Invoice');

// ===== USER MANAGEMENT =====

// @desc    Get all users with filters
// @route   GET /api/admin/users
exports.getUsers = async (req, res) => {
    try {
        const { role, isActive, search } = req.query;
        let query = {};
        if (role) query.role = role;
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { vendorName: { $regex: search, $options: 'i' } },
                { vendorCode: { $regex: search, $options: 'i' } },
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: users.length, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update user role
// @route   PATCH /api/admin/users/:id/role
exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!role) {
            return res.status(400).json({ success: false, message: 'Role is required' });
        }
        const validRoles = ['vendor', 'vpd', 'eic', 'vpg', 'finance', 'hr_admin', 'system_admin', 'vendor_sub_user'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ success: false, message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const oldRole = user.role;
        user.role = role;
        await user.save();

        // Audit log
        await AuditLog.create({
            user: req.user._id,
            userEmail: req.user.email,
            userRole: req.user.role,
            action: 'ROLE_CHANGED',
            resource: 'User',
            resource_id: user._id,
            old_state: { role: oldRole },
            new_state: { role },
            timestamp: new Date(),
        });

        res.json({ success: true, data: user, message: `Role updated from ${oldRole} to ${role}` });
    } catch (error) {
        console.error('updateUserRole error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to update role' });
    }
};

// ===== WORKFLOW CONFIGURATION =====

// In-memory workflow config (could be moved to a collection)
let workflowConfig = {
    'PO Invoice': ['VPD', 'EIC L1', 'VPG L1', 'Finance'],
    'Advance Payment': ['VPD', 'EIC L1', 'VPG L1', 'Finance'],
    'Credit Memo': ['VPD', 'VPG L1', 'Finance'],
    'Retention Release': ['VPD', 'EIC L1', 'VPG L1', 'Finance'],
    'Subsequent Debit': ['VPD', 'VPG L1', 'Finance'],
    'Dispatch Payment': ['VPD', 'EIC L1', 'VPG L1', 'Finance'],
    'Custom Duty': ['VPD', 'VPG L1', 'Finance'],
};

// @desc    Get workflow configuration
// @route   GET /api/admin/workflow-config
exports.getWorkflowConfig = async (req, res) => {
    res.json({ success: true, data: workflowConfig });
};

// @desc    Update workflow configuration
// @route   PUT /api/admin/workflow-config
exports.updateWorkflowConfig = async (req, res) => {
    try {
        workflowConfig = { ...workflowConfig, ...req.body };
        res.json({ success: true, data: workflowConfig, message: 'Workflow configuration updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ===== CHECKLIST CONFIGURATION =====

const { CHECKLIST_CONFIG } = require('../utils/checklistConfig');
let checklistConfig = { ...CHECKLIST_CONFIG };

// @desc    Get checklist configuration
// @route   GET /api/admin/checklist-config
exports.getChecklistConfig = async (req, res) => {
    res.json({ success: true, data: checklistConfig });
};

// @desc    Update checklist configuration
// @route   PUT /api/admin/checklist-config
exports.updateChecklistConfig = async (req, res) => {
    try {
        checklistConfig = { ...checklistConfig, ...req.body };
        res.json({ success: true, data: checklistConfig, message: 'Checklist configuration updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ===== AUDIT LOGS =====

// @desc    Get audit logs with pagination
// @route   GET /api/admin/audit-logs
exports.getAuditLogs = async (req, res) => {
    try {
        const { page = 1, limit = 50, action, resource, userId, startDate, endDate } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        let query = {};

        if (action) query.action = { $regex: action, $options: 'i' };
        if (resource) query.resource = resource;
        if (userId) query.user = userId;
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        const [logs, total] = await Promise.all([
            AuditLog.find(query)
                .populate('user', 'email role')
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            AuditLog.countDocuments(query),
        ]);

        res.json({
            success: true,
            data: logs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ===== REPORT GENERATION =====

// @desc    Generate cross-module report
// @route   GET /api/admin/reports/generate
exports.generateReport = async (req, res) => {
    try {
        const { reportType = 'invoices', format = 'xlsx', startDate, endDate, status, role } = req.query;

        let data = [];
        let columns = [];

        const dateFilter = {};
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) dateFilter.$lte = new Date(endDate);

        switch (reportType) {
            case 'invoices': {
                const query = {};
                if (status) query.status = status;
                if (Object.keys(dateFilter).length) query.submittedAt = dateFilter;

                const invoices = await Invoice.find(query).lean();
                data = invoices.map(inv => ({
                    invoiceNumber: inv.invoiceNumber,
                    type: inv.invoiceType,
                    vendor: inv.vendorName,
                    vendorCode: inv.vendorCode,
                    plant: inv.plant,
                    amount: inv.grossAmount,
                    status: inv.status,
                    submittedAt: inv.submittedAt ? new Date(inv.submittedAt).toLocaleDateString() : '',
                }));
                columns = [
                    { header: 'Invoice #', key: 'invoiceNumber', width: 20 },
                    { header: 'Type', key: 'type', width: 18 },
                    { header: 'Vendor', key: 'vendor', width: 25 },
                    { header: 'Vendor Code', key: 'vendorCode', width: 12 },
                    { header: 'Plant', key: 'plant', width: 12 },
                    { header: 'Amount (₹)', key: 'amount', width: 15 },
                    { header: 'Status', key: 'status', width: 12 },
                    { header: 'Submitted', key: 'submittedAt', width: 15 },
                ];
                break;
            }
            case 'users': {
                const query = {};
                if (role) query.role = role;
                const users = await User.find(query).select('-password').lean();
                data = users.map(u => ({
                    email: u.email,
                    role: u.role,
                    vendorCode: u.vendorCode || '',
                    plant: u.plant || '',
                    active: u.isActive ? 'Yes' : 'No',
                    lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never',
                }));
                columns = [
                    { header: 'Email', key: 'email', width: 30 },
                    { header: 'Role', key: 'role', width: 15 },
                    { header: 'Vendor Code', key: 'vendorCode', width: 12 },
                    { header: 'Plant', key: 'plant', width: 12 },
                    { header: 'Active', key: 'active', width: 8 },
                    { header: 'Last Login', key: 'lastLogin', width: 15 },
                ];
                break;
            }
            default:
                return res.status(400).json({ success: false, message: 'Invalid report type' });
        }

        let result;
        if (format === 'pdf') {
            result = await generatePDFReport(data, columns, `NTPC_${reportType}_Report`);
        } else {
            result = await generateExcelReport(data, columns, `NTPC_${reportType}_Report`);
        }

        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ===== PURCHASE ORDER MANAGEMENT =====

const PurchaseOrder = require('../models/PurchaseOrder');
const Vendor = require('../models/Vendor');

// @desc    Create a new Purchase Order
// @route   POST /api/admin/purchase-orders
exports.createPO = async (req, res) => {
    try {
        const { poNumber, vendorCode, plant, poType, totalAmount, currency, startDate, endDate,
                companyCode, purchasingOrg, purchasingGroup, lineItems, isMaterial, remarks } = req.body;

        // Validate uniqueness
        const existing = await PurchaseOrder.findOne({ poNumber });
        if (existing) return res.status(400).json({ success: false, message: 'PO Number already exists' });

        // vendorCode is optional — POs are visible to all vendors
        let vendorName = 'NA';
        let vendorId = null;
        const effectiveVendorCode = vendorCode || 'NA';

        if (effectiveVendorCode !== 'NA') {
            // Find vendor
            const vendor = await Vendor.findOne({ vendor_code: effectiveVendorCode });
            // Also look up User for vendorName
            const vendorUser = await User.findOne({ vendorCode: effectiveVendorCode, role: 'vendor' });
            vendorName = vendor?.vendor_name || vendorUser?.vendorName || effectiveVendorCode;
            vendorId = vendor?._id || null;
        }

        const po = await PurchaseOrder.create({
            poNumber,
            poType: poType || 'Standard',
            vendorCode: effectiveVendorCode,
            vendorName: vendorName,
            vendor_id: vendorId,
            companyCode: companyCode || '1000',
            plant: plant || '',
            purchasingOrg: purchasingOrg || '1000',
            purchasingGroup: purchasingGroup || '001',
            documentDate: startDate || new Date(),
            validityDate: endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            currency: currency || 'INR',
            totalAmount: totalAmount || 0,
            grossAmount: totalAmount || 0,
            remaining_amount: totalAmount || 0,
            status: 'Open',
            isMaterial: isMaterial !== undefined ? isMaterial : true,
            lineItems: lineItems || [],
            createdBy: req.user._id,
            remarks,
        });

        // Audit log
        await AuditLog.create({
            user: req.user._id,
            userEmail: req.user.email,
            userRole: req.user.role,
            action: 'PO_CREATED',
            resource: 'PurchaseOrder',
            resource_id: po._id,
            new_state: { poNumber, vendorCode: effectiveVendorCode, totalAmount, status: 'Open' },
            timestamp: new Date(),
        });

        res.status(201).json({ success: true, data: po, message: 'Purchase Order created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all Purchase Orders with filters
// @route   GET /api/admin/purchase-orders
exports.getPurchaseOrders = async (req, res) => {
    try {
        const { plant, vendorCode, status, startDate, endDate, search } = req.query;
        let query = {};

        if (plant) query.plant = plant;
        if (vendorCode) query.vendorCode = vendorCode;
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { poNumber: { $regex: search, $options: 'i' } },
                { vendorName: { $regex: search, $options: 'i' } },
            ];
        }
        if (startDate || endDate) {
            query.documentDate = {};
            if (startDate) query.documentDate.$gte = new Date(startDate);
            if (endDate) query.documentDate.$lte = new Date(endDate);
        }

        const pos = await PurchaseOrder.find(query).sort({ createdAt: -1 });
        res.json({ success: true, count: pos.length, data: pos });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single PO by ID
// @route   GET /api/admin/purchase-orders/:id
exports.getPurchaseOrderById = async (req, res) => {
    try {
        const po = await PurchaseOrder.findById(req.params.id);
        if (!po) return res.status(404).json({ success: false, message: 'Purchase Order not found' });
        res.json({ success: true, data: po });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update PO
// @route   PUT /api/admin/purchase-orders/:id
exports.updatePO = async (req, res) => {
    try {
        const po = await PurchaseOrder.findById(req.params.id);
        if (!po) return res.status(404).json({ success: false, message: 'Purchase Order not found' });

        const oldState = { status: po.status, totalAmount: po.totalAmount };
        const allowedFields = ['plant', 'poType', 'totalAmount', 'currency', 'remarks',
                               'validityDate', 'isMaterial', 'lineItems', 'purchasingOrg', 'purchasingGroup'];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) po[field] = req.body[field];
        });

        // Recalculate remaining if total changed
        if (req.body.totalAmount !== undefined) {
            const invoicedAmount = (oldState.totalAmount || 0) - (po.remaining_amount || oldState.totalAmount || 0);
            po.remaining_amount = Math.max(0, req.body.totalAmount - invoicedAmount);
            po.grossAmount = req.body.totalAmount;
        }

        await po.save();

        await AuditLog.create({
            user: req.user._id,
            action: 'PO_UPDATED',
            resource: 'PurchaseOrder',
            resource_id: po._id,
            old_state: oldState,
            new_state: { totalAmount: po.totalAmount, status: po.status },
            timestamp: new Date(),
        });

        res.json({ success: true, data: po, message: 'Purchase Order updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Change PO status (Close / Cancel)
// @route   PATCH /api/admin/purchase-orders/:id/status
exports.changePOStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['Open', 'Closed', 'Cancelled'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status. Use: Open, Closed, Cancelled' });
        }

        const po = await PurchaseOrder.findById(req.params.id);
        if (!po) return res.status(404).json({ success: false, message: 'PO not found' });

        const oldStatus = po.status;
        po.status = status;
        await po.save();

        await AuditLog.create({
            user: req.user._id,
            action: `PO_${status.toUpperCase()}`,
            resource: 'PurchaseOrder',
            resource_id: po._id,
            old_state: { status: oldStatus },
            new_state: { status },
            timestamp: new Date(),
        });

        res.json({ success: true, data: po, message: `PO status changed to ${status}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
