const mongoose = require('mongoose');

// Approval Model
const approvalSchema = new mongoose.Schema({
  invoiceRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  dpDocumentRef: { type: mongoose.Schema.Types.ObjectId, ref: 'DPDocument' },
  stage: { type: String, required: true },
  approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, enum: ['Approved', 'Rejected', 'Referred', 'Returned'], required: true },
  comments: String,
  referredTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referReason: String,
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

approvalSchema.index({ invoiceRef: 1 });
approvalSchema.index({ approver: 1 });

// Message Model
const messageSchema = new mongoose.Schema({
  invoiceRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, required: true },
  recipientRole: { type: String },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  readAt: Date,
}, { timestamps: true });

messageSchema.index({ invoiceRef: 1 });
messageSchema.index({ sender: 1 });

// Notification Model
const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientRef: { type: String, required: true },
  type: { type: String, enum: ['invoice', 'approval', 'message', 'alert', 'system'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: String,
  metadata: mongoose.Schema.Types.Mixed,
  isRead: { type: Boolean, default: false },
  readAt: Date,
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

// TTL index for auto-delete after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

// Audit Log Model
const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userEmail: String,
  userRole: String,
  action: { type: String, required: true },
  resource: { type: String, required: true },
  resourceId: String,
  resource_id: { type: mongoose.Schema.Types.ObjectId },
  details: mongoose.Schema.Types.Mixed,
  old_state: mongoose.Schema.Types.Mixed,
  new_state: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

auditLogSchema.index({ user: 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ resource: 1 });

// TTL index for auto-delete after 90 days
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

// HR Leave Model
const hrLeaveSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employeeName: { type: String, trim: true },
  employeeCode: { type: String, trim: true },
  plant: { type: String, trim: true },
  leaveType: { type: String, enum: ['Earned Leave', 'Casual Leave', 'Medical Leave', 'Compensatory Off'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  numberOfDays: { type: Number, required: true },
  reason: String,
  status: { type: String, enum: ['Draft', 'Submitted', 'Approved', 'Rejected'], default: 'Draft' },
  approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approverComments: String,
  approvedAt: Date,
}, { timestamps: true });

hrLeaveSchema.index({ employee: 1 });
hrLeaveSchema.index({ status: 1 });

// Travel Claim Model
const travelClaimSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employeeName: { type: String, trim: true },
  employeeCode: { type: String, trim: true },
  plant: { type: String, trim: true },
  travelDates: {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
  },
  destination: { type: String, required: true },
  purpose: String,
  modeOfTravel: { type: String, enum: ['Air', 'Rail', 'Road', 'Other'] },
  expenses: [{
    category: { type: String, enum: ['Transport', 'Lodging', 'Meals', 'Other'] },
    amount: Number,
    description: String,
    receiptPath: String,
  }],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['Draft', 'Submitted', 'Manager Approved', 'Finance Processed', 'Paid', 'Rejected'], default: 'Draft' },
  managerApprover: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  managerComments: String,
  managerApprovedAt: Date,
  financeApprover: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  financeComments: String,
  financeProcessedAt: Date,
}, { timestamps: true });

travelClaimSchema.index({ employee: 1 });
travelClaimSchema.index({ status: 1 });

// Import standalone models
const Vendor = require('./Vendor');
const Payment = require('./Payment');
const InvoiceDocument = require('./Document');
const Comment = require('./Comment');
const WorkflowTask = require('./WorkflowTask');

// Export all models
module.exports = {
  Approval: mongoose.model('Approval', approvalSchema),
  Message: mongoose.model('Message', messageSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  AuditLog: mongoose.model('AuditLog', auditLogSchema),
  HRLeave: mongoose.model('HRLeave', hrLeaveSchema),
  TravelClaim: mongoose.model('TravelClaim', travelClaimSchema),
  Vendor,
  Payment,
  InvoiceDocument,
  Comment,
  WorkflowTask,
};
