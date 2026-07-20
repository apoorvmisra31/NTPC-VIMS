const DPDocument = require('../models/DPDocument');
const { Notification } = require('../models');
const User = require('../models/User');

exports.createDPDocument = async (invoice) => {
  try {
    const dpId = `DP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const dpDoc = await DPDocument.create({
      dpId,
      invoiceRef: invoice._id,
      ingestionChannel: 'Flipper',
      basicData: {
        vendorCode: invoice.vendorCode,
        vendorName: invoice.vendorName,
        poNumber: invoice.poNumber,
        companyCode: invoice.companyCode,
        gstin: invoice.gstDetails?.gstin,
        grossAmount: invoice.grossAmount,
        currency: invoice.documentCurrency,
      },
      lineItems: {
        poReference: invoice.lineItems || [],
      },
      accounting: {
        baselineDate: invoice.baselineDate,
        paymentTerms: 'Net 30',
      },
      taxData: {
        cgst: invoice.gstDetails?.cgst || 0,
        sgst: invoice.gstDetails?.sgst || 0,
        igst: invoice.gstDetails?.igst || 0,
      },
      workflow: {
        currentStage: 'VPD',
      },
      status: 'In Progress',
      exceptionFlags: [],
    });

    // Assign to a VPD user
    const vpdUser = await User.findOne({ role: 'vpd', isActive: true });
    if (vpdUser) {
      dpDoc.workflow.currentAssignee = vpdUser._id;
      dpDoc.workflow.history.push({
        stage: 'VPD',
        action: 'Received',
        user: vpdUser._id,
        userName: vpdUser.email,
        comments: 'DP Document created from Flipper submission',
      });
      
      // Create notification
      await Notification.create({
        recipient: vpdUser._id,
        recipientRef: vpdUser._id.toString(),
        type: 'invoice',
        title: 'New Invoice for Review',
        message: `Invoice ${invoice.invoiceNumber} from ${invoice.vendorName} is ready for review`,
        link: `/vim/dp-document/${dpDoc._id}`,
      });
    }

    await dpDoc.save();

    // Update invoice with DP reference
    invoice.dpDocumentId = dpDoc._id;
    await invoice.save();

    return dpDoc;
  } catch (error) {
    console.error('DP Document creation error:', error);
    throw error;
  }
};
