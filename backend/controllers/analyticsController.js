const Invoice = require('../models/Invoice');
const DPDocument = require('../models/DPDocument');

// @desc    Get VIM Summary (aggregate counts)
// @route   GET /api/analytics/vim-summary
exports.getVIMSummary = async (req, res) => {
    try {
        const { plant, startDate, endDate, tredsFlag, msmeFlag, gemFlag } = req.query;

        const matchStage = {};
        if (plant) matchStage.plant = plant;
        if (startDate || endDate) {
            matchStage.submittedAt = {};
            if (startDate) matchStage.submittedAt.$gte = new Date(startDate);
            if (endDate) matchStage.submittedAt.$lte = new Date(endDate);
        }
        if (tredsFlag === 'true') matchStage.isTReDS = true;
        if (msmeFlag === 'true') matchStage.isMSME = true;
        if (gemFlag === 'true') matchStage.isGeM = true;

        const [statusCounts, plantCounts, typeCounts, totalStats] = await Promise.all([
            Invoice.aggregate([{ $match: matchStage }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
            Invoice.aggregate([{ $match: matchStage }, { $group: { _id: '$plant', count: { $sum: 1 }, totalAmount: { $sum: '$grossAmount' } } }]),
            Invoice.aggregate([{ $match: matchStage }, { $group: { _id: '$invoiceType', count: { $sum: 1 } } }]),
            Invoice.aggregate([{ $match: matchStage }, { $group: { _id: null, total: { $sum: 1 }, totalAmount: { $sum: '$grossAmount' }, avgAmount: { $avg: '$grossAmount' } } }]),
        ]);

        res.json({
            success: true,
            data: {
                byStatus: statusCounts,
                byPlant: plantCounts,
                byType: typeCounts,
                summary: totalStats[0] || { total: 0, totalAmount: 0, avgAmount: 0 },
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Invoice Trends (time-series)
// @route   GET /api/analytics/invoice-trends
exports.getInvoiceTrends = async (req, res) => {
    try {
        const { months = 12, plant, startDate, endDate } = req.query;

        const matchStage = {};

        // Apply date filters
        if (startDate || endDate) {
            matchStage.submittedAt = {};
            if (startDate) matchStage.submittedAt.$gte = new Date(startDate);
            if (endDate) matchStage.submittedAt.$lte = new Date(endDate);
        } else {
            const calcStart = new Date();
            calcStart.setMonth(calcStart.getMonth() - parseInt(months));
            matchStage.submittedAt = { $gte: calcStart };
        }

        // Apply plant filter
        if (plant) matchStage.plant = plant;

        const trends = await Invoice.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { year: { $year: '$submittedAt' }, month: { $month: '$submittedAt' } },
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$grossAmount' },
                    paidCount: { $sum: { $cond: [{ $eq: ['$status', 'Paid'] }, 1, 0] } },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        res.json({ success: true, data: trends });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Exception Report
// @route   GET /api/analytics/exception-report
exports.getExceptionReport = async (req, res) => {
    try {
        const { plant } = req.query;

        const matchStage = {};
        if (plant) matchStage.plant = plant;

        const pipeline = [];
        if (Object.keys(matchStage).length > 0) {
            pipeline.push({ $match: matchStage });
        }
        pipeline.push(
            { $unwind: '$exceptionFlags' },
            {
                $group: {
                    _id: '$exceptionFlags.ruleCode',
                    ruleName: { $first: '$exceptionFlags.ruleName' },
                    count: { $sum: 1 },
                    resolvedCount: { $sum: { $cond: ['$exceptionFlags.isResolved', 1, 0] } },
                    unresolvedCount: { $sum: { $cond: ['$exceptionFlags.isResolved', 0, 1] } },
                },
            },
            { $sort: { count: -1 } },
        );

        const exceptions = await DPDocument.aggregate(pipeline);

        res.json({ success: true, data: exceptions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Payment Status breakdown
// @route   GET /api/analytics/payment-status
exports.getPaymentStatus = async (req, res) => {
    try {
        const vendorCode = req.user.role === 'vendor' ? req.user.vendorCode : undefined;
        const matchStage = {};
        if (vendorCode) matchStage.vendorCode = vendorCode;

        const [byCapexOpex, byTReDS, byMSME, byPaymentMethod] = await Promise.all([
            Invoice.aggregate([
                { $match: matchStage },
                {
                    $lookup: { from: 'purchaseorders', localField: 'poNumber', foreignField: 'poNumber', as: 'po' },
                },
                { $unwind: { path: '$po', preserveNullAndEmptyArrays: true } },
                { $group: { _id: '$po.capexOpex', count: { $sum: 1 }, totalAmount: { $sum: '$grossAmount' }, paidAmount: { $sum: { $cond: [{ $eq: ['$status', 'Paid'] }, '$grossAmount', 0] } } } },
            ]),
            Invoice.aggregate([
                { $match: { ...matchStage, isTReDS: true } },
                { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$grossAmount' } } },
            ]),
            Invoice.aggregate([
                { $match: { ...matchStage, isMSME: true } },
                { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$grossAmount' } } },
            ]),
            DPDocument.aggregate([
                { $group: { _id: '$accounting.paymentMethod', count: { $sum: 1 } } },
            ]),
        ]);

        res.json({
            success: true,
            data: { byCapexOpex, byTReDS, byMSME, byPaymentMethod },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
