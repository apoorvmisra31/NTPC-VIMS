const mongoose = require('mongoose');

const exceptionFlagSchema = new mongoose.Schema({
  ruleCode: String,
  ruleName: String,
  severity: { type: String, enum: ['Red', 'Yellow', 'Green'], default: 'Yellow' },
  message: String,
  procType: Number,
  isResolved: { type: Boolean, default: false },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: Date,
  bypassable: { type: Boolean, default: false },
});

const dpDocumentSchema = new mongoose.Schema({
  dpId: {
    type: String,
    required: true,
    unique: true,
  },
  invoiceRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true,
  },
  ingestionChannel: {
    type: String,
    enum: ['Flipper', 'EIC/DAK'],
    required: true,
  },
  basicData: {
    vendorCode: String,
    vendorName: String,
    poNumber: String,
    companyCode: String,
    partnerBank: String,
    gstPartner: String,
    gstin: String,
    grossAmount: Number,
    currency: String,
  },
  lineItems: {
    poReference: [{
      lineNumber: Number,
      poLineNumber: Number,
      material: String,
      description: String,
      quantity: Number,
      unit: String,
      rate: Number,
      amount: Number,
      taxCode: String,
      grQuantity: Number,
      sesQuantity: Number,
    }],
    glAccount: [{
      glCode: String,
      description: String,
      amount: Number,
      costCenter: String,
      wbsElement: String,
    }],
  },
  accounting: {
    baselineDate: Date,
    paymentTerms: String,
    businessArea: String,
    businessPlace: String,
    sectionCode: String,
    paymentMethod: { type: String, enum: ['Q', 'A', 'D', 'C', 'T', '3', 'L'] },
  },
  taxData: {
    cgst: Number,
    sgst: Number,
    igst: Number,
    cessAmount: Number,
    withholdingTax: Number,
  },
  processData: {
    isDuplicate: Boolean,
    duplicateCheckResult: String,
    priority: { type: String, enum: ['Normal', 'High', 'Urgent'], default: 'Normal' },
    technicalMetadata: mongoose.Schema.Types.Mixed,
  },
  otherData: {
    paymentGroup: { type: String, enum: ['V', 'F', 'E'] },
    paymentType: { type: String, enum: ['Running Bill', 'PVC Bill', 'Final Bill', 'Others'] },
    bgDisplay: String,
    gemPoIndicator: Boolean,
    gemOrderId: String,
    coverInvoice: Boolean,
    ecmApprovalNumber: String,
    dopClause: String,
    dopSection: String,
    tredsLsc: { type: String, enum: ['TReDS', 'LSC', 'None'], default: 'None' },
    sesDisplay: String,
    poRemarks: String,
    certificationByEIC: Boolean,
    thirdPartyPaymentReq: String,
  },
  cumulativePayOrder: {
    retentionItems: [{
      retentionCode: String,
      retentionType: String,
      amount: Number,
    }],
    deductionItems: [{
      deductionCode: String,
      deductionType: String,
      amount: Number,
    }],
    cumulativeGrossAmount: Number,
    cumulativeRetentionAmount: Number,
    cumulativeDeductionAmount: Number,
  },
  exceptionFlags: [exceptionFlagSchema],
  workflow: {
    currentStage: {
      type: String,
      enum: ['VPD', 'EIC L1', 'VPG L1', 'Finance', 'Completed'],
      default: 'VPD',
    },
    currentAssignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    history: [{
      stage: String,
      action: { type: String, enum: ['Received', 'Approved', 'Referred', 'Returned', 'Posted'] },
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      userName: String,
      timestamp: { type: Date, default: Date.now },
      comments: String,
      referredTo: String,
      referReason: String,
    }],
  },
  status: {
    type: String,
    enum: ['In Progress', 'Awaiting Approval', 'Approved', 'Posted', 'Obsolete', 'Returned to Vendor'],
    default: 'In Progress',
  },
  postedInvoiceNumber: String,
  postedDate: Date,
  isObsolete: {
    type: Boolean,
    default: false,
  },
  rtvDetails: {
    reason: String,
    reasonCode: String,
    returnedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    returnedAt: Date,
  },
  ocrExtractedData: mongoose.Schema.Types.Mixed,
  validationResults: mongoose.Schema.Types.Mixed,
}, {
  timestamps: true,
});

// Indexes
dpDocumentSchema.index({ dpId: 1 });
dpDocumentSchema.index({ 'invoiceRef': 1 });
dpDocumentSchema.index({ 'workflow.currentAssignee': 1 });
dpDocumentSchema.index({ 'workflow.currentStage': 1 });
dpDocumentSchema.index({ status: 1 });
dpDocumentSchema.index({ 'basicData.vendorCode': 1 });

module.exports = mongoose.model('DPDocument', dpDocumentSchema);
