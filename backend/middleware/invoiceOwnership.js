const Invoice = require('../models/Invoice');
const WorkflowTask = require('../models/WorkflowTask');

/**
 * Middleware: Verify the requesting user's role matches the invoice's current_role.
 * Vendors can always read their own invoices. Admins have full access.
 * Internal roles can only access invoices currently assigned to them (or that they previously actioned).
 */
const invoiceOwnership = async (req, res, next) => {
  try {
    const invoiceId = req.params.invoiceId || req.params.id;
    if (!invoiceId) return next();

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const userRole = req.user.role;
    const isVendor = ['vendor', 'vendor_sub_user'].includes(userRole);
    const isAdmin = userRole === 'system_admin';

    if (isAdmin) {
      req.invoice = invoice;
      return next();
    }

    if (isVendor) {
      // Vendors can only see their own invoices
      if (invoice.vendorCode !== req.user.vendorCode) {
        return res.status(403).json({ success: false, message: 'Not authorized to access this invoice' });
      }
      req.invoice = invoice;
      return next();
    }

    // Internal roles: check current_role match
    const upperRole = userRole.toUpperCase();
    const isCurrentOwner = invoice.current_role === upperRole;
    const isPaidOrRejected = ['Paid', 'Rejected'].includes(invoice.status);
    const isOnHoldFinance = invoice.status === 'ON_HOLD' && upperRole === 'FINANCE';

    if (isCurrentOwner || isPaidOrRejected || isOnHoldFinance) {
      req.invoice = invoice;
      return next();
    }

    // Check if user previously actioned this invoice
    const previousTask = await WorkflowTask.findOne({
      invoice_id: invoice._id,
      assigned_role: upperRole,
      status: 'COMPLETED',
    });

    if (previousTask) {
      req.invoice = invoice;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Invoice is not assigned to your role (${userRole}). Current owner: ${invoice.current_role}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error checking invoice ownership' });
  }
};

module.exports = { invoiceOwnership };
