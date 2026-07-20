const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  lineNumber: { type: Number, required: true },
  material: { type: String, trim: true },
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true },
  rate: { type: Number, required: true, min: 0 },
  amount: { type: Number, required: true, min: 0 },
  taxCode: String,
  deliveryDate: Date,
  plant: String,
  storageLocation: String,
  grQuantity: { type: Number, default: 0 },
  sesQuantity: { type: Number, default: 0 },
  invoicedQuantity: { type: Number, default: 0 },
  balanceQuantity: { type: Number, default: 0 },
  accountAssignment: {
    type: String,
    enum: ['Cost Center', 'WBS Element', 'Asset', 'Order'],
  },
  accountAssignmentValue: String,
});

const purchaseOrderSchema = new mongoose.Schema({
  poNumber: {
    type: String,
    required: [true, 'PO Number is required'],
    unique: true,
    trim: true,
  },
  poType: {
    type: String,
    enum: ['Standard', 'Subcontracting', 'Service', 'Consignment'],
    required: true,
  },
  vendorCode: {
    type: String,
    default: 'NA',
    ref: 'User',
  },
  vendorName: {
    type: String,
    default: 'NA',
  },
  vendor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
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
  purchasingOrg: {
    type: String,
    required: true,
  },
  purchasingGroup: {
    type: String,
    required: true,
  },
  documentDate: {
    type: Date,
    required: true,
  },
  validityDate: {
    type: Date,
    required: true,
  },
  paymentTerms: {
    type: String,
    default: 'Net 30 days',
  },
  incoterms: String,
  currency: {
    type: String,
    default: 'INR',
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  taxAmount: {
    type: Number,
    default: 0,
  },
  grossAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Draft', 'Open', 'Partially Invoiced', 'Fully Invoiced', 'Closed', 'Cancelled'],
    default: 'Open',
  },
  isMaterial: {
    type: Boolean,
    default: true,
  },
  lineItems: [lineItemSchema],
  procurementType: {
    type: Number,
    default: 800,
  },
  releaseStatus: {
    type: String,
    enum: ['Not Released', 'Released', 'Blocked'],
    default: 'Released',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  remaining_amount: {
    type: Number,
    min: 0,
  },
  remarks: String,
}, {
  timestamps: true,
});

// Indexes
purchaseOrderSchema.index({ poNumber: 1 });
purchaseOrderSchema.index({ vendorCode: 1 });
purchaseOrderSchema.index({ status: 1 });
purchaseOrderSchema.index({ plant: 1 });

// Calculate balance quantities before saving
purchaseOrderSchema.pre('save', function(next) {
  this.lineItems.forEach(item => {
    item.balanceQuantity = item.quantity - item.invoicedQuantity;
  });
  next();
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
