const DPDocument = require('../models/DPDocument');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const { Approval, Notification } = require('../models');
const { validateInvoice } = require('../utils/exceptionRules');
const { sendRTVEmail } = require('../services/emailService');
const { generatePaymentAdvice } = require('../services/pdfService');
const { createNotification } = require('../services/notificationService');

// @desc    Get VIM Workplace Inbox
// @route   GET /api/dp/workplace/inbox
exports.getWorkplaceInbox = async (req, res) => {
    try {
        const userId = req.user._id;
        const { tab = 'my-inbox', vendorCode, dpId, plant, invoiceType, startDate, endDate, limit = 500 } = req.query;

        let query = {};
        if (tab === 'my-inbox') {
            query['workflow.currentAssignee'] = userId;
            query.status = { $in: ['In Progress', 'Awaiting Approval'] };
        } else if (tab === 'my-pending') {
            query['workflow.history.user'] = userId;
            query['workflow.currentAssignee'] = { $ne: userId };
            query.status = { $in: ['In Progress', 'Awaiting Approval'] };
        } else if (tab === 'my-completed') {
            query['workflow.history.user'] = userId;
            query.status = { $in: ['Posted', 'Obsolete', 'Returned to Vendor'] };
        }

        // Filters
        if (vendorCode) query['basicData.vendorCode'] = vendorCode;
        if (dpId) query.dpId = { $regex: dpId, $options: 'i' };
        if (plant) query['basicData.plant'] = plant;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const dpDocuments = await DPDocument.find(query)
            .populate('invoiceRef', 'invoiceNumber invoiceType grossAmount vendorName')
            .populate('workflow.currentAssignee', 'email')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({ success: true, count: dpDocuments.length, data: dpDocuments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get DP Document by dpId
// @route   GET /api/dp/:dpId
exports.getDPDocument = async (req, res) => {
    try {
        const dpDoc = await DPDocument.findOne({ dpId: req.params.dpId })
            .populate('invoiceRef')
            .populate('workflow.currentAssignee', 'email role')
            .populate('workflow.history.user', 'email role')
            .populate('exceptionFlags.resolvedBy', 'email');

        if (!dpDoc) {
            return res.status(404).json({ success: false, message: 'DP Document not found' });
        }
        res.json({ success: true, data: dpDoc });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update Basic Data tab
// @route   PATCH /api/dp/:dpId/basic-data
exports.updateBasicData = async (req, res) => {
    try {
        const dpDoc = await DPDocument.findOneAndUpdate(
            { dpId: req.params.dpId },
            { $set: { basicData: { ...req.body } } },
            { new: true }
        );
        if (!dpDoc) return res.status(404).json({ success: false, message: 'DP Document not found' });
        res.json({ success: true, data: dpDoc });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update Line Items tab
// @route   PATCH /api/dp/:dpId/line-items
exports.updateLineItems = async (req, res) => {
    try {
        const dpDoc = await DPDocument.findOneAndUpdate(
            { dpId: req.params.dpId },
            { $set: { lineItems: req.body } },
            { new: true }
        );
        if (!dpDoc) return res.status(404).json({ success: false, message: 'DP Document not found' });
        res.json({ success: true, data: dpDoc });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update Accounting tab
// @route   PATCH /api/dp/:dpId/accounting
exports.updateAccounting = async (req, res) => {
    try {
        const dpDoc = await DPDocument.findOneAndUpdate(
            { dpId: req.params.dpId },
            { $set: { accounting: req.body } },
            { new: true }
        );
        if (!dpDoc) return res.status(404).json({ success: false, message: 'DP Document not found' });
        res.json({ success: true, data: dpDoc });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update Tax tab
// @route   PATCH /api/dp/:dpId/tax
exports.updateTax = async (req, res) => {
    try {
        const dpDoc = await DPDocument.findOneAndUpdate(
            { dpId: req.params.dpId },
            { $set: { taxData: req.body } },
            { new: true }
        );
        if (!dpDoc) return res.status(404).json({ success: false, message: 'DP Document not found' });
        res.json({ success: true, data: dpDoc });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update Other Data tab
// @route   PATCH /api/dp/:dpId/other-data
exports.updateOtherData = async (req, res) => {
    try {
        const dpDoc = await DPDocument.findOneAndUpdate(
            { dpId: req.params.dpId },
            { $set: { otherData: req.body } },
            { new: true }
        );
        if (!dpDoc) return res.status(404).json({ success: false, message: 'DP Document not found' });
        res.json({ success: true, data: dpDoc });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update Cumulative Pay Order tab
// @route   PATCH /api/dp/:dpId/cumulative
exports.updateCumulative = async (req, res) => {
    try {
        const dpDoc = await DPDocument.findOneAndUpdate(
            { dpId: req.params.dpId },
            { $set: { cumulativePayOrder: req.body } },
            { new: true }
        );
        if (!dpDoc) return res.status(404).json({ success: false, message: 'DP Document not found' });
        res.json({ success: true, data: dpDoc });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Resolve an exception flag
// @route   POST /api/dp/:dpId/resolve-exception
exports.resolveException = async (req, res) => {
    try {
        const { ruleCode } = req.body;
        const dpDoc = await DPDocument.findOne({ dpId: req.params.dpId });
        if (!dpDoc) return res.status(404).json({ success: false, message: 'DP Document not found' });

        const exception = dpDoc.exceptionFlags.find(e => e.ruleCode === ruleCode && !e.isResolved);
        if (!exception) return res.status(404).json({ success: false, message: 'Exception not found or already resolved' });

        exception.isResolved = true;
        exception.resolvedBy = req.user._id;
        exception.resolvedAt = new Date();

        dpDoc.workflow.history.push({
            stage: dpDoc.workflow.currentStage,
            action: 'Approved',
            user: req.user._id,
            userName: req.user.email,
            timestamp: new Date(),
            comments: `Exception ${ruleCode} resolved`,
        });

        await dpDoc.save();
        res.json({ success: true, data: dpDoc });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Refer document to another role
// @route   POST /api/dp/:dpId/refer
exports.referDocument = async (req, res) => {
    try {
        const { referTo, reason } = req.body;
        if (!referTo || !reason) {
            return res.status(400).json({ success: false, message: 'Refer-to role and reason are required' });
        }

        const dpDoc = await DPDocument.findOne({ dpId: req.params.dpId });
        if (!dpDoc) return res.status(404).json({ success: false, message: 'DP Document not found' });

        // Find a user in the referred role
        const targetUser = await User.findOne({ role: referTo, isActive: true });

        dpDoc.workflow.history.push({
            stage: dpDoc.workflow.currentStage,
            action: 'Referred',
            user: req.user._id,
            userName: req.user.email,
            timestamp: new Date(),
            comments: reason,
            referredTo: referTo,
            referReason: reason,
        });

        if (targetUser) {
            dpDoc.workflow.currentAssignee = targetUser._id;
            // Create notification for target
            const io = req.app.get('io');
            await createNotification(targetUser._id, 'approval', 'Document Referred to You',
                `DP Document ${dpDoc.dpId} has been referred to you. Reason: ${reason}`,
                `/vim/dp-document/${dpDoc.dpId}`, io);
        }

        // Map refer target to workflow stage
        const stageMap = { vpd: 'VPD', eic: 'EIC L1', vpg: 'VPG L1', finance: 'Finance', hr_admin: 'VPD' };
        dpDoc.workflow.currentStage = stageMap[referTo] || dpDoc.workflow.currentStage;

        await dpDoc.save();

        await Approval.create({
            invoiceRef: dpDoc.invoiceRef,
            dpDocumentRef: dpDoc._id,
            stage: dpDoc.workflow.currentStage,
            approver: req.user._id,
            action: 'Referred',
            comments: reason,
            referredTo: targetUser?._id,
            referReason: reason,
        });

        res.json({ success: true, data: dpDoc, message: `Document referred to ${referTo}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Return to Vendor
// @route   POST /api/dp/:dpId/return-to-vendor
exports.returnToVendor = async (req, res) => {
    try {
        const { reason, reasonCode } = req.body;
        const dpDoc = await DPDocument.findOne({ dpId: req.params.dpId }).populate('invoiceRef');
        if (!dpDoc) return res.status(404).json({ success: false, message: 'DP Document not found' });

        dpDoc.status = 'Returned to Vendor';
        dpDoc.isObsolete = true;
        dpDoc.rtvDetails = {
            reason,
            reasonCode,
            returnedBy: req.user._id,
            returnedAt: new Date(),
        };

        dpDoc.workflow.history.push({
            stage: dpDoc.workflow.currentStage,
            action: 'Returned',
            user: req.user._id,
            userName: req.user.email,
            timestamp: new Date(),
            comments: `RTV: ${reason}`,
        });

        await dpDoc.save();

        // Update invoice status
        if (dpDoc.invoiceRef) {
            await Invoice.findByIdAndUpdate(dpDoc.invoiceRef._id, { status: 'Returned', workflowStage: 'Vendor' });
        }

        // Send RTV email to vendor
        const vendor = await User.findOne({ vendorCode: dpDoc.basicData?.vendorCode });
        if (vendor) {
            await sendRTVEmail(vendor.email, dpDoc.invoiceRef?.invoiceNumber || dpDoc.dpId, reason);
            const io = req.app.get('io');
            await createNotification(vendor._id, 'invoice', 'Invoice Returned',
                `Your invoice has been returned. Reason: ${reason}`, `/invoices`, io);
        }

        await Approval.create({
            invoiceRef: dpDoc.invoiceRef?._id,
            dpDocumentRef: dpDoc._id,
            stage: dpDoc.workflow.currentStage,
            approver: req.user._id,
            action: 'Returned',
            comments: reason,
        });

        res.json({ success: true, data: dpDoc, message: 'Document returned to vendor' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Approve DP document at current stage
// @route   POST /api/dp/:dpId/approve
exports.approveDocument = async (req, res) => {
    try {
        const { comments } = req.body;
        const dpDoc = await DPDocument.findOne({ dpId: req.params.dpId });
        if (!dpDoc) return res.status(404).json({ success: false, message: 'DP Document not found' });

        // Check for unresolved red exceptions
        const unresolvedRed = dpDoc.exceptionFlags.filter(e => e.severity === 'Red' && !e.isResolved && !e.bypassable);
        if (unresolvedRed.length > 0) {
            return res.status(400).json({ success: false, message: 'Unresolved critical exceptions must be resolved before approval', exceptions: unresolvedRed });
        }

        const currentStage = dpDoc.workflow.currentStage;
        const stageOrder = ['VPD', 'EIC L1', 'VPG L1', 'Finance', 'Completed'];
        const nextStageIndex = stageOrder.indexOf(currentStage) + 1;
        const nextStage = stageOrder[nextStageIndex] || 'Completed';

        dpDoc.workflow.history.push({
            stage: currentStage,
            action: 'Approved',
            user: req.user._id,
            userName: req.user.email,
            timestamp: new Date(),
            comments: comments || 'Approved',
        });

        dpDoc.workflow.currentStage = nextStage;
        dpDoc.status = nextStage === 'Completed' ? 'Approved' : 'Awaiting Approval';

        // Find next stage assignee
        const roleMap = { 'EIC L1': 'eic', 'VPG L1': 'vpg', 'Finance': 'finance' };
        if (roleMap[nextStage]) {
            const nextUser = await User.findOne({ role: roleMap[nextStage], isActive: true });
            if (nextUser) {
                dpDoc.workflow.currentAssignee = nextUser._id;
                const io = req.app.get('io');
                await createNotification(nextUser._id, 'approval', 'Document Awaiting Your Approval',
                    `DP Document ${dpDoc.dpId} requires your approval at ${nextStage} stage.`,
                    `/vim/dp-document/${dpDoc.dpId}`, io);
            }
        }

        await dpDoc.save();

        await Approval.create({
            invoiceRef: dpDoc.invoiceRef,
            dpDocumentRef: dpDoc._id,
            stage: currentStage,
            approver: req.user._id,
            action: 'Approved',
            comments: comments || 'Approved',
        });

        // Update invoice workflow stage
        const invoiceStageMap = { 'EIC L1': 'EIC', 'VPG L1': 'VPG', 'Finance': 'Finance', 'Completed': 'Completed' };
        await Invoice.findByIdAndUpdate(dpDoc.invoiceRef, { workflowStage: invoiceStageMap[nextStage] || nextStage });

        res.json({ success: true, data: dpDoc, message: `Approved. Moved to ${nextStage}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Post invoice (Finance final action)
// @route   POST /api/dp/:dpId/post
exports.postInvoice = async (req, res) => {
    try {
        const dpDoc = await DPDocument.findOne({ dpId: req.params.dpId }).populate('invoiceRef');
        if (!dpDoc) return res.status(404).json({ success: false, message: 'DP Document not found' });

        dpDoc.status = 'Posted';
        dpDoc.postedDate = new Date();
        dpDoc.postedInvoiceNumber = `POST-${Date.now()}`;
        dpDoc.workflow.currentStage = 'Completed';
        dpDoc.workflow.history.push({
            stage: 'Finance',
            action: 'Posted',
            user: req.user._id,
            userName: req.user.email,
            timestamp: new Date(),
            comments: 'Invoice posted to SAP (simulated)',
        });

        await dpDoc.save();

        // Update invoice
        const invoice = await Invoice.findById(dpDoc.invoiceRef._id || dpDoc.invoiceRef);
        if (invoice) {
            invoice.status = 'Posted';
            invoice.workflowStage = 'Completed';

            // Generate payment advice
            const pa = await generatePaymentAdvice(invoice, dpDoc);
            invoice.paymentAdvice = {
                documentNumber: dpDoc.postedInvoiceNumber,
                paymentDate: new Date(),
                paymentAmount: invoice.netAmount || invoice.grossAmount,
                paymentMethod: dpDoc.accounting?.paymentMethod || 'Q',
                filename: pa.filename,
                path: pa.path,
            };

            // Simulate payment
            invoice.status = 'Paid';
            await invoice.save();

            // Notify vendor
            const vendor = await User.findOne({ vendorCode: invoice.vendorCode });
            if (vendor) {
                const io = req.app.get('io');
                await createNotification(vendor._id, 'invoice', 'Invoice Paid',
                    `Your invoice ${invoice.invoiceNumber} has been posted and paid. Payment advice is available.`,
                    `/invoices`, io);
            }
        }

        res.json({ success: true, data: dpDoc, message: 'Invoice posted and payment processed' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get DP Document history
// @route   GET /api/dp/:dpId/history
exports.getDPHistory = async (req, res) => {
    try {
        const dpDoc = await DPDocument.findOne({ dpId: req.params.dpId })
            .select('dpId workflow.history status')
            .populate('workflow.history.user', 'email role');

        if (!dpDoc) return res.status(404).json({ success: false, message: 'DP Document not found' });

        const approvals = await Approval.find({ dpDocumentRef: dpDoc._id })
            .populate('approver', 'email role')
            .sort({ timestamp: 1 });

        res.json({ success: true, data: { history: dpDoc.workflow.history, approvals } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
