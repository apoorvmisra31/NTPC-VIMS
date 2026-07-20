const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { auditLog } = require('../middleware/auditMiddleware');
const inv = require('../controllers/invoiceController');

// Invoice submission — all 7 types
const uploadFields = upload.fields([
  { name: 'invoiceDocument', maxCount: 1 },
  { name: 'supportingDocuments', maxCount: 10 },
]);

router.post('/submit/po', protect, authorize('vendor', 'vendor_sub_user', 'eic'), uploadFields,
  auditLog('INVOICE_SUBMITTED', 'Invoice'), inv.submitPOInvoice);
router.post('/submit/advance', protect, authorize('vendor', 'vendor_sub_user', 'eic'), uploadFields,
  auditLog('INVOICE_SUBMITTED', 'Invoice'), inv.submitAdvancePayment);
router.post('/submit/credit-memo', protect, authorize('vendor', 'vendor_sub_user', 'eic'), uploadFields,
  auditLog('INVOICE_SUBMITTED', 'Invoice'), inv.submitCreditMemo);
router.post('/submit/retention-release', protect, authorize('vendor', 'vendor_sub_user', 'eic'), uploadFields,
  auditLog('INVOICE_SUBMITTED', 'Invoice'), inv.submitRetentionRelease);
router.post('/submit/subsequent-debit', protect, authorize('vendor', 'vendor_sub_user', 'eic'), uploadFields,
  auditLog('INVOICE_SUBMITTED', 'Invoice'), inv.submitSubsequentDebit);
router.post('/submit/dispatch', protect, authorize('vendor', 'vendor_sub_user', 'eic'), uploadFields,
  auditLog('INVOICE_SUBMITTED', 'Invoice'), inv.submitDispatchPayment);
router.post('/submit/custom-duty', protect, authorize('vendor', 'vendor_sub_user', 'eic'), uploadFields,
  auditLog('INVOICE_SUBMITTED', 'Invoice'), inv.submitCustomDuty);

// Invoice queries
router.get('/', protect, inv.getInvoices);
router.get('/checklist/:type', protect, inv.getChecklistForType);
router.get('/:id', protect, inv.getInvoice);
router.get('/:id/payment-advice', protect, authorize('vendor', 'finance'), inv.getPaymentAdvice);
router.get('/:id/ses-document', protect, authorize('vendor'), inv.getSESDocument);
router.patch('/:id/save-draft', protect, authorize('vendor'), inv.saveDraft);

module.exports = router;
