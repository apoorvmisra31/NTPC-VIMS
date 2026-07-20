const PurchaseOrder = require('../models/PurchaseOrder');

/**
 * Validate PO Number and return plant/company details
 */
exports.validatePO = async (poNumber, vendorCode) => {
    const po = await PurchaseOrder.findOne({ poNumber });
    if (!po) {
        return { isValid: false, error: 'Purchase Order not found' };
    }
    if (po.vendorCode !== vendorCode) {
        return { isValid: false, error: 'PO does not belong to this vendor' };
    }
    if (po.status === 'Closed') {
        return { isValid: false, error: 'Purchase Order is closed' };
    }
    return {
        isValid: true,
        data: {
            poNumber: po.poNumber,
            poType: po.poType,
            plant: po.plant,
            companyCode: po.companyCode,
            vendorName: po.vendorName,
            vendorCode: po.vendorCode,
            totalAmount: po.totalAmount,
            grossAmount: po.grossAmount,
            currency: po.currency,
            status: po.status,
            isMaterial: po.isMaterial,
            lineItems: po.lineItems,
            paymentTerms: po.paymentTerms,
            capexOpex: po.capexOpex || 'OPEX',
        },
    };
};

/**
 * Get line item proposal for EIC (Get Proposal feature)
 */
exports.getProposal = async (poNumber) => {
    const po = await PurchaseOrder.findOne({ poNumber });
    if (!po) return null;

    return po.lineItems.map(item => ({
        lineNumber: item.lineNumber,
        material: item.material,
        description: item.description,
        quantity: item.balanceQuantity || item.quantity,
        unit: item.unit,
        rate: item.rate,
        amount: (item.balanceQuantity || item.quantity) * item.rate,
        taxCode: item.taxCode,
        grQuantity: item.grQuantity,
        sesQuantity: item.sesQuantity,
        invoicedQuantity: item.invoicedQuantity,
    }));
};
