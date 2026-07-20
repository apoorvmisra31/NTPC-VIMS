/**
 * Business Rules / Exception Flags System
 * Rules determined by Document Type. Rules at Proc Type ≤ 885 (MIR7 validation failures)
 * are flagged red and must be resolved by EIC L1 before approval.
 */

const EXCEPTION_RULES = [
  {
    ruleCode: 'BR001',
    ruleName: 'Missing GSTIN',
    description: 'Vendor GSTIN is not available or does not match PO vendor GSTIN',
    procType: 880,
    severity: 'Red',
    bypassable: false,
    category: 'Tax',
    applicableTo: ['PO Invoice', 'Advance Payment', 'Credit Memo', 'Retention Release', 'Subsequent Debit', 'Dispatch Payment', 'Custom Duty'],
  },
  {
    ruleCode: 'BR002',
    ruleName: 'GR/SES Quantity Mismatch',
    description: 'Invoice quantity exceeds Goods Receipt or Service Entry Sheet quantity',
    procType: 850,
    severity: 'Red',
    bypassable: false,
    category: 'Quantity',
    applicableTo: ['PO Invoice', 'Dispatch Payment'],
  },
  {
    ruleCode: 'BR003',
    ruleName: 'Duplicate Invoice Number',
    description: 'An invoice with the same number already exists for this vendor and PO',
    procType: 870,
    severity: 'Red',
    bypassable: false,
    category: 'Duplicate',
    applicableTo: ['PO Invoice', 'Advance Payment', 'Dispatch Payment', 'Custom Duty'],
  },
  {
    ruleCode: 'BR004',
    ruleName: 'Missing Mandatory Document',
    description: 'One or more mandatory documents from the checklist are not uploaded',
    procType: 860,
    severity: 'Red',
    bypassable: false,
    category: 'Document',
    applicableTo: ['PO Invoice', 'Advance Payment', 'Credit Memo', 'Retention Release', 'Subsequent Debit', 'Dispatch Payment', 'Custom Duty'],
  },
  {
    ruleCode: 'BR005',
    ruleName: 'PO Line Quantity Exceeded',
    description: 'Cumulative invoiced quantity exceeds PO line item quantity',
    procType: 840,
    severity: 'Red',
    bypassable: false,
    category: 'Quantity',
    applicableTo: ['PO Invoice', 'Dispatch Payment'],
  },
  {
    ruleCode: 'BR006',
    ruleName: 'Bank Detail Mismatch',
    description: 'Selected bank account does not match vendor registered bank details',
    procType: 885,
    severity: 'Red',
    bypassable: true,
    category: 'Bank',
    applicableTo: ['PO Invoice', 'Advance Payment', 'Credit Memo', 'Retention Release'],
  },
  {
    ruleCode: 'BR007',
    ruleName: 'Invoice Amount Exceeds PO Value',
    description: 'Gross invoice amount exceeds remaining PO value',
    procType: 830,
    severity: 'Red',
    bypassable: true,
    category: 'Amount',
    applicableTo: ['PO Invoice', 'Advance Payment'],
  },
  {
    ruleCode: 'BR008',
    ruleName: 'EIC Certification Missing',
    description: 'EIC certification is mandatory but has not been provided',
    procType: 820,
    severity: 'Red',
    bypassable: false,
    category: 'Certification',
    applicableTo: ['PO Invoice', 'Retention Release'],
  },
  {
    ruleCode: 'BR009',
    ruleName: 'GST Rate Mismatch',
    description: 'Applied GST rate does not match the rate configured for the material/service',
    procType: 890,
    severity: 'Yellow',
    bypassable: true,
    category: 'Tax',
    applicableTo: ['PO Invoice', 'Credit Memo', 'Subsequent Debit'],
  },
  {
    ruleCode: 'BR010',
    ruleName: 'Digital Signature Invalid',
    description: 'Uploaded invoice PDF does not contain valid digital signature metadata',
    procType: 900,
    severity: 'Yellow',
    bypassable: true,
    category: 'Document',
    applicableTo: ['PO Invoice', 'Advance Payment', 'Credit Memo', 'Retention Release', 'Custom Duty'],
  },
  {
    ruleCode: 'BR011',
    ruleName: 'PO Validity Expired',
    description: 'Purchase Order validity date has passed',
    procType: 910,
    severity: 'Yellow',
    bypassable: true,
    category: 'PO',
    applicableTo: ['PO Invoice', 'Advance Payment', 'Dispatch Payment'],
  },
  {
    ruleCode: 'BR012',
    ruleName: 'Advance Payment Limit Exceeded',
    description: 'Advance payment amount exceeds maximum allowed percentage of PO value',
    procType: 875,
    severity: 'Red',
    bypassable: false,
    category: 'Amount',
    applicableTo: ['Advance Payment'],
  },
];

/**
 * Validate an invoice against business rules and return applicable exceptions
 */
const validateInvoice = (invoice, purchaseOrder) => {
  const exceptions = [];

  for (const rule of EXCEPTION_RULES) {
    if (!rule.applicableTo.includes(invoice.invoiceType)) continue;

    let triggered = false;
    switch (rule.ruleCode) {
      case 'BR001':
        triggered = !invoice.gstDetails?.gstin;
        break;
      case 'BR002':
        if (purchaseOrder?.lineItems) {
          for (const li of invoice.lineItems || []) {
            const poLine = purchaseOrder.lineItems.find(p => p.lineNumber === li.poLineNumber);
            if (poLine && li.quantity > (poLine.grQuantity || poLine.quantity)) {
              triggered = true;
              break;
            }
          }
        }
        break;
      case 'BR003':
        // Duplicate check handled at controller level; flag if already detected
        triggered = invoice._duplicateDetected === true;
        break;
      case 'BR004':
        triggered = (invoice.documentChecklist || []).some(c => c.isMandatory && !c.isUploaded);
        break;
      case 'BR005':
        if (purchaseOrder?.lineItems) {
          for (const li of invoice.lineItems || []) {
            const poLine = purchaseOrder.lineItems.find(p => p.lineNumber === li.poLineNumber);
            if (poLine && (poLine.invoicedQuantity + li.quantity) > poLine.quantity) {
              triggered = true;
              break;
            }
          }
        }
        break;
      case 'BR006':
        triggered = !invoice.bankDetails?.accountNumber;
        break;
      case 'BR007':
        if (purchaseOrder) {
          triggered = invoice.grossAmount > purchaseOrder.grossAmount;
        }
        break;
      case 'BR008':
        // Checked during EIC stage
        triggered = false;
        break;
      case 'BR009':
        // Simplified: check if GST details are present
        triggered = invoice.gstDetails && !invoice.gstDetails.cgst && !invoice.gstDetails.igst;
        break;
      case 'BR010':
        triggered = invoice.invoiceDocument && !invoice.invoiceDocument.isDigitallySigned;
        break;
      case 'BR011':
        if (purchaseOrder) {
          triggered = new Date(purchaseOrder.validityDate) < new Date();
        }
        break;
      case 'BR012':
        if (purchaseOrder && invoice.invoiceType === 'Advance Payment') {
          triggered = invoice.grossAmount > (purchaseOrder.grossAmount * 0.3);
        }
        break;
    }

    if (triggered) {
      exceptions.push({
        ruleCode: rule.ruleCode,
        ruleName: rule.ruleName,
        severity: rule.procType <= 885 ? 'Red' : rule.severity,
        message: rule.description,
        procType: rule.procType,
        isResolved: false,
        bypassable: rule.bypassable,
      });
    }
  }

  return exceptions;
};

module.exports = { EXCEPTION_RULES, validateInvoice };
