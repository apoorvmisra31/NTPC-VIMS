const Invoice = require('../models/Invoice');
const PurchaseOrder = require('../models/PurchaseOrder');
const { createDPDocument } = require('../services/dpService');
const { Notification, AuditLog, WorkflowTask } = require('../models');
const { validateInvoice } = require('../utils/exceptionRules');
const { getChecklist } = require('../utils/checklistConfig');
const { generatePaymentAdvice } = require('../services/pdfService');
const Vendor = require('../models/Vendor');

// Helper: create invoice with DP document + workflow task
const createInvoice = async (invoiceData, req) => {
  const invoice = await Invoice.create(invoiceData);

  // Create WorkflowTask for VPD
  await WorkflowTask.create({
    invoice_id: invoice._id,
    assigned_role: 'VPD',
    status: 'PENDING',
  });

  // Write audit log
  await AuditLog.create({
    user: req.user._id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'INVOICE_SUBMITTED',
    resource: 'Invoice',
    resource_id: invoice._id,
    new_state: { status: invoice.status, current_role: invoice.current_role, invoiceNumber: invoice.invoiceNumber },
    timestamp: new Date(),
  });

  // Try to create DP document (backward compat)
  try {
    const dpDoc = await createDPDocument(invoice);
    const po = await PurchaseOrder.findOne({ poNumber: invoice.poNumber });
    if (dpDoc && po) {
      const exceptions = validateInvoice(invoice, po);
      if (exceptions.length > 0) {
        const DPDocument = require('../models/DPDocument');
        await DPDocument.findByIdAndUpdate(dpDoc._id, { $set: { exceptionFlags: exceptions } });
      }
    }
  } catch (err) {
    console.log('DPDocument creation skipped:', err.message);
  }

  return invoice;
};

// @desc    Submit PO Invoice
// @route   POST /api/invoices/submit/po
exports.submitPOInvoice = async (req, res) => {
  try {
    const { invoiceNumber, poNumber, invoiceDate, grossAmount, taxAmount, netAmount,
      lineItems, gstDetails, bankDetails, subtype } = req.body;

    const po = await PurchaseOrder.findOne({ poNumber });
    if (!po) return res.status(404).json({ success: false, message: 'Purchase Order not found' });
    if (po.vendorCode !== req.user.vendorCode) {
      return res.status(403).json({ success: false, message: 'Not authorized for this PO' });
    }

    // Validate PO is OPEN
    if (!['Open', 'Partially Invoiced'].includes(po.status)) {
      return res.status(400).json({ success: false, message: `PO status is ${po.status}. Only OPEN POs are allowed.` });
    }

    // Validate net_amount <= remaining_amount
    const invoiceNet = netAmount || grossAmount;
    const remaining = po.remaining_amount !== undefined ? po.remaining_amount : po.totalAmount;
    if (invoiceNet > remaining) {
      return res.status(400).json({
        success: false,
        message: `Invoice amount (₹${invoiceNet}) exceeds PO remaining amount (₹${remaining})`,
      });
    }

    const vendor = await Vendor.findOne({ vendor_code: req.user.vendorCode });
    const checklist = getChecklist('PO Invoice', subtype || 'Standard');

    const invoice = await createInvoice({
      invoiceNumber,
      invoiceType: 'PO Invoice',
      subtype: subtype || 'Standard',
      vendorCode: req.user.vendorCode,
      vendorName: req.user.vendorName,
      vendor_id: vendor?._id,
      po_id: po._id,
      poNumber,
      companyCode: po.companyCode,
      plant: po.plant,
      invoiceDate,
      grossAmount,
      taxAmount: taxAmount || 0,
      netAmount: invoiceNet,
      lineItems,
      gstDetails,
      bankDetails,
      documentChecklist: checklist,
      channel: 'Flipper',
      invoiceDocument: req.files?.invoiceDocument?.[0] ? {
        filename: req.files.invoiceDocument[0].filename,
        originalName: req.files.invoiceDocument[0].originalname,
        path: req.files.invoiceDocument[0].path,
        size: req.files.invoiceDocument[0].size,
        uploadDate: new Date(),
        isDigitallySigned: false,
      } : undefined,
      status: 'Submitted',
      current_role: 'VPD',
      workflowStage: 'VPD',
      submittedBy: req.user._id,
      submittedAt: new Date(),
    }, req);

    // Deduct remaining_amount from PO
    po.remaining_amount = remaining - invoiceNet;
    po.status = po.remaining_amount <= 0 ? 'Fully Invoiced' : 'Partially Invoiced';
    await po.save();

    res.status(201).json({ success: true, data: invoice, message: 'PO Invoice submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit Advance Payment
// @route   POST /api/invoices/submit/advance
exports.submitAdvancePayment = async (req, res) => {
  try {
    const { invoiceNumber, poNumber, invoiceDate, grossAmount, bankDetails } = req.body;
    const po = await PurchaseOrder.findOne({ poNumber });
    if (!po) return res.status(400).json({ success: false, message: 'PO not found' });
    if (!po.isMaterial) return res.status(400).json({ success: false, message: 'Advance Payment requires Material PO' });

    const invoice = await createInvoice({
      invoiceNumber,
      invoiceType: 'Advance Payment',
      vendorCode: req.user.vendorCode,
      vendorName: req.user.vendorName,
      poNumber, companyCode: po.companyCode, plant: po.plant,
      invoiceDate, grossAmount, netAmount: grossAmount,
      bankDetails, channel: 'Flipper',
      documentChecklist: getChecklist('Advance Payment'),
      status: 'Submitted', current_role: 'VPD', workflowStage: 'VPD',
      submittedBy: req.user._id, submittedAt: new Date(),
    }, req);

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit Credit Memo
// @route   POST /api/invoices/submit/credit-memo
exports.submitCreditMemo = async (req, res) => {
  try {
    const { invoiceNumber, poNumber, invoiceDate, grossAmount, referenceInvoiceId, bankDetails } = req.body;
    const po = await PurchaseOrder.findOne({ poNumber });
    if (!po) return res.status(400).json({ success: false, message: 'PO not found' });

    const invoice = await createInvoice({
      invoiceNumber, invoiceType: 'Credit Memo',
      vendorCode: req.user.vendorCode, vendorName: req.user.vendorName,
      poNumber, companyCode: po.companyCode, plant: po.plant,
      invoiceDate, grossAmount, netAmount: grossAmount,
      referenceInvoice: referenceInvoiceId, bankDetails, channel: 'Flipper',
      documentChecklist: getChecklist('Credit Memo'),
      status: 'Submitted', current_role: 'VPD', workflowStage: 'VPD',
      submittedBy: req.user._id, submittedAt: new Date(),
    }, req);

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit Retention Release
// @route   POST /api/invoices/submit/retention-release
exports.submitRetentionRelease = async (req, res) => {
  try {
    const { invoiceNumber, poNumber, invoiceDate, grossAmount, retentionType, bankDetails } = req.body;
    const po = await PurchaseOrder.findOne({ poNumber });
    if (!po) return res.status(400).json({ success: false, message: 'PO not found' });

    const invoice = await createInvoice({
      invoiceNumber, invoiceType: 'Retention Release',
      vendorCode: req.user.vendorCode, vendorName: req.user.vendorName,
      poNumber, companyCode: po.companyCode, plant: po.plant,
      invoiceDate, grossAmount, netAmount: grossAmount,
      retentionDetails: { retentionType, retentionAmount: grossAmount },
      bankDetails, channel: 'Flipper',
      documentChecklist: getChecklist('Retention Release'),
      status: 'Submitted', current_role: 'VPD', workflowStage: 'VPD',
      submittedBy: req.user._id, submittedAt: new Date(),
    }, req);

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit Subsequent Debit
// @route   POST /api/invoices/submit/subsequent-debit
exports.submitSubsequentDebit = async (req, res) => {
  try {
    const { invoiceNumber, poNumber, invoiceDate, grossAmount, reasonCode, bankDetails } = req.body;
    const po = await PurchaseOrder.findOne({ poNumber });
    if (!po) return res.status(400).json({ success: false, message: 'PO not found' });

    const invoice = await createInvoice({
      invoiceNumber, invoiceType: 'Subsequent Debit',
      vendorCode: req.user.vendorCode, vendorName: req.user.vendorName,
      poNumber, companyCode: po.companyCode, plant: po.plant,
      invoiceDate, grossAmount, netAmount: grossAmount,
      remarks: reasonCode, bankDetails, channel: 'Flipper',
      documentChecklist: getChecklist('Subsequent Debit'),
      status: 'Submitted', current_role: 'VPD', workflowStage: 'VPD',
      submittedBy: req.user._id, submittedAt: new Date(),
    }, req);

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit Dispatch Payment
// @route   POST /api/invoices/submit/dispatch
exports.submitDispatchPayment = async (req, res) => {
  try {
    const { invoiceNumber, poNumber, invoiceDate, grossAmount, bankDetails } = req.body;
    const po = await PurchaseOrder.findOne({ poNumber });
    if (!po) return res.status(400).json({ success: false, message: 'PO not found' });
    if (!po.isMaterial) return res.status(400).json({ success: false, message: 'Dispatch Payment requires Material PO' });

    const invoice = await createInvoice({
      invoiceNumber, invoiceType: 'Dispatch Payment',
      vendorCode: req.user.vendorCode, vendorName: req.user.vendorName,
      poNumber, companyCode: po.companyCode, plant: po.plant,
      invoiceDate, grossAmount, netAmount: grossAmount,
      bankDetails, channel: 'Flipper',
      documentChecklist: getChecklist('Dispatch Payment'),
      status: 'Submitted', current_role: 'VPD', workflowStage: 'VPD',
      submittedBy: req.user._id, submittedAt: new Date(),
    }, req);

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit Custom Duty
// @route   POST /api/invoices/submit/custom-duty
exports.submitCustomDuty = async (req, res) => {
  try {
    const { invoiceNumber, poNumber, invoiceDate, grossAmount, bankDetails } = req.body;
    const po = await PurchaseOrder.findOne({ poNumber });
    if (!po) return res.status(400).json({ success: false, message: 'PO not found' });

    const invoice = await createInvoice({
      invoiceNumber, invoiceType: 'Custom Duty',
      vendorCode: req.user.vendorCode, vendorName: req.user.vendorName,
      poNumber, companyCode: po.companyCode, plant: po.plant,
      invoiceDate, grossAmount, netAmount: grossAmount,
      bankDetails, channel: 'Flipper',
      documentChecklist: getChecklist('Custom Duty'),
      status: 'Submitted', current_role: 'VPD', workflowStage: 'VPD',
      submittedBy: req.user._id, submittedAt: new Date(),
    }, req);

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get invoices (with role isolation)
// @route   GET /api/invoices
exports.getInvoices = async (req, res) => {
  try {
    const { status, startDate, endDate, poNumber, invoiceType } = req.query;
    let query = {};
    const userRole = req.user.role;

    if (['vendor', 'vendor_sub_user'].includes(userRole)) {
      // Vendors see only their own invoices
      query.vendorCode = req.user.vendorCode;
    } else if (userRole === 'system_admin') {
      // Admin sees all
    } else {
      // Internal roles: enforce role isolation — only show invoices where current_role matches
      const upperRole = userRole.toUpperCase();
      query.current_role = upperRole;
    }

    if (status) query.status = status;
    if (poNumber) query.poNumber = poNumber;
    if (invoiceType) query.invoiceType = invoiceType;
    if (startDate || endDate) {
      query.submittedAt = {};
      if (startDate) query.submittedAt.$gte = new Date(startDate);
      if (endDate) query.submittedAt.$lte = new Date(endDate);
    }

    const invoices = await Invoice.find(query)
      .sort({ submittedAt: -1 })
      .populate('submittedBy', 'email vendorName');

    res.json({ success: true, count: invoices.length, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('submittedBy', 'email vendorName')
      .populate('dpDocumentId');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (req.user.role === 'vendor' && invoice.vendorCode !== req.user.vendorCode) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Download Payment Advice PDF
// @route   GET /api/invoices/:id/payment-advice
exports.getPaymentAdvice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (!invoice.paymentAdvice?.path) {
      return res.status(404).json({ success: false, message: 'Payment advice not available' });
    }
    res.json({ success: true, data: { url: invoice.paymentAdvice.path } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Download SES Document
// @route   GET /api/invoices/:id/ses-document
exports.getSESDocument = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (!invoice.sesDocument?.path) {
      return res.status(404).json({ success: false, message: 'SES document not available' });
    }
    res.json({ success: true, data: { url: invoice.sesDocument.path } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Save invoice as draft
// @route   PATCH /api/invoices/:id/save-draft
exports.saveDraft = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, vendorCode: req.user.vendorCode, status: 'Draft' },
      { $set: req.body },
      { new: true }
    );
    if (!invoice) return res.status(404).json({ success: false, message: 'Draft not found' });
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get checklist for invoice type
// @route   GET /api/invoices/checklist/:type
exports.getChecklistForType = async (req, res) => {
  try {
    const checklist = getChecklist(req.params.type, req.query.subtype);
    res.json({ success: true, data: checklist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
