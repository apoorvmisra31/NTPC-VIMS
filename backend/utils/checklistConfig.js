/**
 * Document Checklist Configuration
 * Mandatory supporting documents per invoice type + subtype combination
 */

const CHECKLIST_CONFIG = {
    'PO Invoice': {
        Standard: [
            { item: 'Invoice Copy (Digitally Signed)', isMandatory: true },
            { item: 'Purchase Order Copy', isMandatory: true },
            { item: 'Delivery Challan / GRN', isMandatory: true },
            { item: 'Test/Inspection Certificate', isMandatory: false },
            { item: 'Warranty Certificate', isMandatory: false },
            { item: 'Bank Details Confirmation', isMandatory: true },
        ],
        RAB: [
            { item: 'Invoice Copy (Digitally Signed)', isMandatory: true },
            { item: 'Purchase Order Copy', isMandatory: true },
            { item: 'Running Account Bill Statement', isMandatory: true },
            { item: 'Measurement Book Extract', isMandatory: true },
            { item: 'Work Completion Certificate', isMandatory: false },
            { item: 'Bank Details Confirmation', isMandatory: true },
        ],
        'Final Bill': [
            { item: 'Invoice Copy (Digitally Signed)', isMandatory: true },
            { item: 'Purchase Order Copy', isMandatory: true },
            { item: 'Final Bill Statement', isMandatory: true },
            { item: 'Measurement Book Extract', isMandatory: true },
            { item: 'Work Completion Certificate', isMandatory: true },
            { item: 'No Claim Certificate', isMandatory: true },
            { item: 'Bank Details Confirmation', isMandatory: true },
        ],
        'O&M Civil': [
            { item: 'Invoice Copy (Digitally Signed)', isMandatory: true },
            { item: 'Purchase Order Copy', isMandatory: true },
            { item: 'O&M Civil Work Report', isMandatory: true },
            { item: 'Measurement Book Extract', isMandatory: true },
            { item: 'Bank Details Confirmation', isMandatory: true },
        ],
        'Package Civil': [
            { item: 'Invoice Copy (Digitally Signed)', isMandatory: true },
            { item: 'Purchase Order Copy', isMandatory: true },
            { item: 'Package Civil Work Report', isMandatory: true },
            { item: 'Measurement Book Extract', isMandatory: true },
            { item: 'Milestone Completion Report', isMandatory: true },
            { item: 'Bank Details Confirmation', isMandatory: true },
        ],
    },
    'Advance Payment': {
        Standard: [
            { item: 'Invoice / Proforma Invoice (Digitally Signed)', isMandatory: true },
            { item: 'Purchase Order Copy', isMandatory: true },
            { item: 'Bank Guarantee (if applicable)', isMandatory: false },
            { item: 'Bank Details Confirmation', isMandatory: true },
        ],
    },
    'Credit Memo': {
        Standard: [
            { item: 'Credit Note (Digitally Signed)', isMandatory: true },
            { item: 'Original Invoice Reference', isMandatory: true },
            { item: 'Reason for Credit', isMandatory: true },
        ],
    },
    'Retention Release': {
        Standard: [
            { item: 'Retention Release Request (Digitally Signed)', isMandatory: true },
            { item: 'Purchase Order Copy', isMandatory: true },
            { item: 'Work Completion Certificate', isMandatory: true },
            { item: 'Performance Bank Guarantee (if applicable)', isMandatory: false },
            { item: 'Bank Details Confirmation', isMandatory: true },
        ],
    },
    'Subsequent Debit': {
        Standard: [
            { item: 'Debit Note (Digitally Signed)', isMandatory: true },
            { item: 'Purchase Order Copy', isMandatory: true },
            { item: 'Supporting Documentation', isMandatory: true },
        ],
    },
    'Dispatch Payment': {
        Standard: [
            { item: 'Invoice Copy (Digitally Signed)', isMandatory: true },
            { item: 'Purchase Order Copy', isMandatory: true },
            { item: 'Dispatch Advice / LR Copy', isMandatory: true },
            { item: 'Packing List', isMandatory: true },
            { item: 'Insurance Certificate', isMandatory: false },
            { item: 'Bank Details Confirmation', isMandatory: true },
        ],
    },
    'Custom Duty': {
        Standard: [
            { item: 'Custom Duty Invoice (Digitally Signed)', isMandatory: true },
            { item: 'Purchase Order Copy', isMandatory: true },
            { item: 'Bill of Entry', isMandatory: true },
            { item: 'Custom Duty Assessment Order', isMandatory: true },
            { item: 'Bank Details Confirmation', isMandatory: true },
        ],
    },
};

/**
 * Get checklist items for a given invoice type and subtype
 */
const getChecklist = (invoiceType, subtype = 'Standard') => {
    const typeConfig = CHECKLIST_CONFIG[invoiceType];
    if (!typeConfig) return [];

    const items = typeConfig[subtype] || typeConfig['Standard'] || [];
    return items.map(item => ({
        ...item,
        isChecked: false,
    }));
};

module.exports = { CHECKLIST_CONFIG, getChecklist };
