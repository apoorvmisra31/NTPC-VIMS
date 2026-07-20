const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  referenceNumber: {
    type: String,
    unique: true,
    sparse: true,
  },
  invoiceNumber: {
    type: String,
    required: [true, 'Invoice number is required'],
    trim: true,
  },
  channel: {
    type: String,
    enum: ['Flipper', 'EIC', 'DAK'],
    default: 'Flipper',
  },
  invoiceType: {
    type: String,
    enum: [
      'PO Invoice',
      'Advance Payment',
      'Credit Memo',
      'Retention Release',
      'Subsequent Debit',
      'Dispatch Payment',
      'Custom Duty'
    ],
    required: true,
  },
  subtype: {
    type: String,
    enum: ['RAB', 'Final Bill', 'O&M Civil', 'Package Civil', 'Standard'],
  },
  vendorCode: {
    type: String,
    required: true,
    ref: 'User',
  },
  vendorName: {
    type: String,
    required: true,
  },
  vendor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
  },
  po_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder',
  },
  poNumber: {
    type: String,
    ref: 'PurchaseOrder',
  },
  companyCode: {
    type: String,
    required: true,
    default: '1000',
  },
  plant: {
    type: String,
    required: true,
  },
  invoiceDate: {
    type: Date,
    required: true,
  },
  postingDate: {
    type: Date,
    default: Date.now,
  },
  baselineDate: Date,
  documentCurrency: {
    type: String,
    default: 'INR',
  },
  grossAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  taxAmount: {
    type: Number,
    default: 0,
  },
  netAmount: {
    type: Number,
    required: true,
  },
  gstDetails: {
    gstin: String,
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    cessAmount: { type: Number, default: 0 },
  },
  lineItems: [{
    lineNumber: Number,
    poLineNumber: Number,
    description: String,
    quantity: Number,
    rate: Number,
    amount: Number,
    taxCode: String,
    accountAssignment: String,
  }],
  retentionDetails: {
    retentionType: {
      type: String,
      enum: ['SD', 'Safety', 'MRC', 'COF', 'PGT', 'EIC Ret'],
    },
    retentionAmount: { type: Number, default: 0 },
    releaseAmount: { type: Number, default: 0 },
  },
  deductionDetails: [{
    deductionType: String,
    deductionCode: String,
    amount: Number,
    remarks: String,
  }],
  bankDetails: {
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    branchName: String,
  },
  invoiceDocument: {
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    uploadDate: Date,
    isDigitallySigned: Boolean,
  },
  supportingDocuments: [{
    name: String,
    filename: String,
    path: String,
    size: Number,
    uploadDate: Date,
    documentType: String,
  }],
  documentChecklist: [{
    item: String,
    isUploaded: Boolean,
    isMandatory: Boolean,
  }],
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Under Review', 'Approved', 'Posted', 'Paid', 'Rejected', 'Returned', 'Obsolete',
           'VPD_APPROVED', 'EIC_APPROVED', 'VPG_PROCESSED', 'FINANCE_APPROVED', 'ON_HOLD'],
    default: 'Draft',
  },
  current_role: {
    type: String,
    enum: ['VENDOR', 'VPD', 'EIC', 'VPG', 'FINANCE', 'SYSTEM'],
    default: 'VENDOR',
  },
  workflowStage: {
    type: String,
    enum: ['Vendor', 'VPD', 'EIC', 'VPG', 'Finance', 'Completed'],
    default: 'Vendor',
  },
  retention_pct: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  advance_adj: {
    type: Number,
    default: 0,
    min: 0,
  },
  penalty_deduction: {
    type: Number,
    default: 0,
    min: 0,
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  submittedAt: Date,
  dpDocumentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DPDocument',
  },
  paymentAdvice: {
    documentNumber: String,
    paymentDate: Date,
    paymentAmount: Number,
    paymentMethod: String,
    filename: String,
    path: String,
  },
  sesDocument: {
    sesNumber: String,
    filename: String,
    path: String,
  },
  referenceInvoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
  },
  isPriorityPayment: {
    type: Boolean,
    default: false,
  },
  isMSME: {
    type: Boolean,
    default: false,
  },
  isTReDS: {
    type: Boolean,
    default: false,
  },
  isGeM: {
    type: Boolean,
    default: false,
  },
  gemOrderId: String,
  coverInvoice: {
    isEnabled: Boolean,
    excelFilePath: String,
  },
  thirdPartyPayment: {
    isEnabled: Boolean,
    payeeCode: String,
    payeeName: String,
  },
  rejectionReason: String,
  remarks: String,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual: computed net_payable
invoiceSchema.virtual('net_payable').get(function () {
  const gross = this.grossAmount || 0;
  const tax = this.taxAmount || 0;
  const retention = gross * ((this.retention_pct || 0) / 100);
  const advance = this.advance_adj || 0;
  const penalty = this.penalty_deduction || 0;
  return Math.max(0, gross - tax - retention - advance - penalty);
});

// Indexes
invoiceSchema.index({ invoiceNumber: 1, vendorCode: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ workflowStage: 1 });
invoiceSchema.index({ vendorCode: 1 });
invoiceSchema.index({ poNumber: 1 });
invoiceSchema.index({ submittedAt: -1 });

// Auto-generate referenceNumber on save if not set
invoiceSchema.pre('save', function (next) {
  if (!this.referenceNumber) {
    this.referenceNumber = `INV-${this._id.toString().substr(-8).toUpperCase()}`;
  }
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
