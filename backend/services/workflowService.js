const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const WorkflowTask = require('../models/WorkflowTask');
const Comment = require('../models/Comment');
const Payment = require('../models/Payment');
const { AuditLog } = require('../models');

// Canonical workflow sequence
const WORKFLOW_SEQUENCE = ['VENDOR', 'VPD', 'EIC', 'VPG', 'FINANCE', 'SYSTEM'];

// Map current_role (uppercase) → workflowStage (title-case enum)
const ROLE_TO_STAGE = {
  VENDOR: 'Vendor',
  VPD: 'VPD',
  EIC: 'EIC',
  VPG: 'VPG',
  FINANCE: 'Finance',
  SYSTEM: 'Completed',
};

// Map current_role to the invoice status after that role approves
const APPROVAL_STATUS_MAP = {
  VPD: 'VPD_APPROVED',
  EIC: 'EIC_APPROVED',
  VPG: 'VPG_PROCESSED',
  FINANCE: 'FINANCE_APPROVED',
};

// Map current_role to the action name
const ACTION_MAP = {
  VPD: 'APPROVED',
  EIC: 'APPROVED',
  VPG: 'FORWARDED',
  FINANCE: 'APPROVED',
};

// Get next role in the sequence
function getNextRole(currentRole) {
  const idx = WORKFLOW_SEQUENCE.indexOf(currentRole);
  if (idx === -1 || idx >= WORKFLOW_SEQUENCE.length - 1) return null;
  return WORKFLOW_SEQUENCE[idx + 1];
}

// Get previous role in the sequence (for rejection returns)
function getPreviousRole(currentRole) {
  const idx = WORKFLOW_SEQUENCE.indexOf(currentRole);
  if (idx <= 1) return 'VENDOR'; // VPD rejects → back to vendor
  return WORKFLOW_SEQUENCE[idx - 1];
}

/**
 * Core atomic transition: Approve invoice at the current stage
 */
async function approveInvoice(invoiceId, actorUserId, actorRole, comments) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const invoice = await Invoice.findById(invoiceId).session(session);
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.current_role !== actorRole.toUpperCase()) {
      throw new Error(`Invoice is not assigned to ${actorRole}. Current owner: ${invoice.current_role}`);
    }

    const oldState = { status: invoice.status, current_role: invoice.current_role };
    const nextRole = getNextRole(invoice.current_role);
    const newStatus = APPROVAL_STATUS_MAP[invoice.current_role];

    if (!newStatus || !nextRole) throw new Error('Invalid workflow transition');

    // 1. Close current WorkflowTask
    await WorkflowTask.findOneAndUpdate(
      { invoice_id: invoiceId, assigned_role: invoice.current_role, status: 'PENDING' },
      { status: 'COMPLETED', action_taken: ACTION_MAP[invoice.current_role], comments, actor_user_id: actorUserId, completed_at: new Date() },
      { session }
    );

    // 2. Update invoice
    invoice.status = newStatus;
    invoice.current_role = nextRole;
    invoice.workflowStage = ROLE_TO_STAGE[nextRole] || nextRole;
    await invoice.save({ session });

    // 3. Create new WorkflowTask for next role (unless SYSTEM)
    if (nextRole !== 'SYSTEM') {
      await WorkflowTask.create([{
        invoice_id: invoiceId,
        assigned_role: nextRole,
        status: 'PENDING',
      }], { session });
    }

    // 4. Write AuditLog
    await AuditLog.create([{
      user: actorUserId,
      action: `INVOICE_${ACTION_MAP[invoice.current_role] || 'APPROVED'}`,
      resource: 'Invoice',
      resource_id: invoiceId,
      old_state: oldState,
      new_state: { status: newStatus, current_role: nextRole },
      timestamp: new Date(),
    }], { session });

    // 5. System comment
    await Comment.create([{
      invoice_id: invoiceId,
      user_id: actorUserId,
      role: actorRole,
      comment: comments || `Approved by ${actorRole}. Moved to ${nextRole}.`,
      is_system: true,
    }], { session });

    await session.commitTransaction();
    session.endSession();

    return { invoice: await Invoice.findById(invoiceId), nextRole };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

/**
 * Reject invoice — return to prior owner
 */
async function rejectInvoice(invoiceId, actorUserId, actorRole, reason) {
  if (!reason) throw new Error('Rejection reason is required');

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const invoice = await Invoice.findById(invoiceId).session(session);
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.current_role !== actorRole.toUpperCase()) {
      throw new Error(`Invoice is not assigned to ${actorRole}. Current owner: ${invoice.current_role}`);
    }

    const oldState = { status: invoice.status, current_role: invoice.current_role };
    const returnToRole = getPreviousRole(invoice.current_role);

    // Close current task
    await WorkflowTask.findOneAndUpdate(
      { invoice_id: invoiceId, assigned_role: invoice.current_role, status: 'PENDING' },
      { status: 'COMPLETED', action_taken: 'REJECTED', comments: reason, actor_user_id: actorUserId, completed_at: new Date() },
      { session }
    );

    // Update invoice
    invoice.status = 'Rejected';
    invoice.current_role = returnToRole;
    invoice.rejectionReason = reason;
    invoice.workflowStage = ROLE_TO_STAGE[returnToRole] || returnToRole;
    await invoice.save({ session });

    // Create task for return role (if not VENDOR)
    if (returnToRole !== 'VENDOR') {
      await WorkflowTask.create([{
        invoice_id: invoiceId,
        assigned_role: returnToRole,
        status: 'PENDING',
      }], { session });
    }

    // Audit log
    await AuditLog.create([{
      user: actorUserId,
      action: 'INVOICE_REJECTED',
      resource: 'Invoice',
      resource_id: invoiceId,
      old_state: oldState,
      new_state: { status: 'Rejected', current_role: returnToRole },
      timestamp: new Date(),
    }], { session });

    // System comment
    await Comment.create([{
      invoice_id: invoiceId,
      user_id: actorUserId,
      role: actorRole,
      comment: `Rejected by ${actorRole}. Reason: ${reason}. Returned to ${returnToRole}.`,
      is_system: true,
    }], { session });

    await session.commitTransaction();
    session.endSession();

    return { invoice: await Invoice.findById(invoiceId), returnedTo: returnToRole };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

/**
 * Request clarification — add comment, return to Vendor without full rejection
 */
async function requestClarification(invoiceId, actorUserId, actorRole, message) {
  if (!message) throw new Error('Clarification message is required');

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw new Error('Invoice not found');
  if (invoice.current_role !== actorRole.toUpperCase()) {
    throw new Error(`Invoice is not assigned to ${actorRole}`);
  }

  // Add clarification comment visible to vendor
  await Comment.create({
    invoice_id: invoiceId,
    user_id: actorUserId,
    role: actorRole,
    comment: `[CLARIFICATION REQUESTED] ${message}`,
    is_internal: false,
  });

  await AuditLog.create({
    user: actorUserId,
    action: 'CLARIFICATION_REQUESTED',
    resource: 'Invoice',
    resource_id: invoiceId,
    new_state: { message },
    timestamp: new Date(),
  });

  return { invoice, message: 'Clarification requested' };
}

/**
 * Hold invoice (Finance only)
 */
async function holdInvoice(invoiceId, actorUserId, actorRole, reason) {
  if (actorRole.toUpperCase() !== 'FINANCE') throw new Error('Only Finance can hold invoices');
  if (!reason) throw new Error('Hold reason is required');

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const invoice = await Invoice.findById(invoiceId).session(session);
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.current_role !== 'FINANCE') throw new Error('Invoice is not at Finance stage');

    const oldState = { status: invoice.status, current_role: invoice.current_role };

    await WorkflowTask.findOneAndUpdate(
      { invoice_id: invoiceId, assigned_role: 'FINANCE', status: 'PENDING' },
      { status: 'COMPLETED', action_taken: 'HELD', comments: reason, actor_user_id: actorUserId, completed_at: new Date() },
      { session }
    );

    invoice.status = 'ON_HOLD';
    await invoice.save({ session });

    await AuditLog.create([{
      user: actorUserId,
      action: 'INVOICE_HELD',
      resource: 'Invoice',
      resource_id: invoiceId,
      old_state: oldState,
      new_state: { status: 'ON_HOLD', current_role: 'FINANCE' },
      timestamp: new Date(),
    }], { session });

    await Comment.create([{
      invoice_id: invoiceId,
      user_id: actorUserId,
      role: actorRole,
      comment: `Invoice placed on hold. Reason: ${reason}`,
      is_system: true,
    }], { session });

    await session.commitTransaction();
    session.endSession();

    return { invoice: await Invoice.findById(invoiceId) };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

/**
 * Adjust payment fields (VPG only) — retention, advance, penalty
 */
async function adjustPayment(invoiceId, actorUserId, actorRole, adjustments) {
  if (actorRole.toUpperCase() !== 'VPG') throw new Error('Only VPG can adjust payments');

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw new Error('Invoice not found');
  if (invoice.current_role !== 'VPG') throw new Error('Invoice is not at VPG stage');

  const oldState = {
    retention_pct: invoice.retention_pct,
    advance_adj: invoice.advance_adj,
    penalty_deduction: invoice.penalty_deduction,
  };

  if (adjustments.retention_pct !== undefined) invoice.retention_pct = adjustments.retention_pct;
  if (adjustments.advance_adj !== undefined) invoice.advance_adj = adjustments.advance_adj;
  if (adjustments.penalty_deduction !== undefined) invoice.penalty_deduction = adjustments.penalty_deduction;

  await invoice.save();

  await AuditLog.create({
    user: actorUserId,
    action: 'PAYMENT_ADJUSTED',
    resource: 'Invoice',
    resource_id: invoiceId,
    old_state: oldState,
    new_state: {
      retention_pct: invoice.retention_pct,
      advance_adj: invoice.advance_adj,
      penalty_deduction: invoice.penalty_deduction,
      net_payable: invoice.net_payable,
    },
    timestamp: new Date(),
  });

  return { invoice };
}

/**
 * Approve payment (Finance) — create Payment record, mark PAID
 */
async function approvePayment(invoiceId, actorUserId, actorRole, paymentData) {
  if (actorRole.toUpperCase() !== 'FINANCE') throw new Error('Only Finance can approve payments');

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const invoice = await Invoice.findById(invoiceId).session(session);
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.current_role !== 'FINANCE') throw new Error('Invoice is not at Finance stage');

    const oldState = { status: invoice.status, current_role: invoice.current_role };

    // Close current task
    await WorkflowTask.findOneAndUpdate(
      { invoice_id: invoiceId, assigned_role: 'FINANCE', status: 'PENDING' },
      { status: 'COMPLETED', action_taken: 'APPROVED', comments: 'Payment approved', actor_user_id: actorUserId, completed_at: new Date() },
      { session }
    );

    // Create payment record
    const paymentRef = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const utr = paymentData.utr_number || `UTR${Date.now()}`;

    await Payment.create([{
      invoice_id: invoiceId,
      payment_reference: paymentRef,
      utr_number: utr,
      payment_date: paymentData.payment_date || new Date(),
      payment_amount: invoice.net_payable || invoice.netAmount || invoice.grossAmount,
      payment_method: paymentData.payment_method || 'NEFT',
      status: 'COMPLETED',
    }], { session });

    // Update invoice
    invoice.status = 'Paid';
    invoice.current_role = 'SYSTEM';
    invoice.workflowStage = 'Completed';
    invoice.paymentAdvice = {
      documentNumber: paymentRef,
      paymentDate: new Date(),
      paymentAmount: invoice.net_payable || invoice.netAmount || invoice.grossAmount,
      paymentMethod: paymentData.payment_method || 'NEFT',
    };
    await invoice.save({ session });

    // Audit
    await AuditLog.create([{
      user: actorUserId,
      action: 'PAYMENT_APPROVED',
      resource: 'Invoice',
      resource_id: invoiceId,
      old_state: oldState,
      new_state: { status: 'Paid', current_role: 'SYSTEM', payment_reference: paymentRef },
      timestamp: new Date(),
    }], { session });

    // System comment
    await Comment.create([{
      invoice_id: invoiceId,
      user_id: actorUserId,
      role: actorRole,
      comment: `Payment approved. Reference: ${paymentRef}, UTR: ${utr}. Invoice marked as PAID.`,
      is_system: true,
    }], { session });

    await session.commitTransaction();
    session.endSession();

    return { invoice: await Invoice.findById(invoiceId), payment_reference: paymentRef };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

/**
 * Get full workflow history for an invoice
 */
async function getWorkflowHistory(invoiceId) {
  const tasks = await WorkflowTask.find({ invoice_id: invoiceId })
    .populate('actor_user_id', 'email role vendorName')
    .sort({ createdAt: 1 });

  const comments = await Comment.find({ invoice_id: invoiceId })
    .populate('user_id', 'email role vendorName')
    .sort({ createdAt: 1 });

  return { tasks, comments };
}

module.exports = {
  approveInvoice,
  rejectInvoice,
  requestClarification,
  holdInvoice,
  adjustPayment,
  approvePayment,
  getWorkflowHistory,
  WORKFLOW_SEQUENCE,
};
