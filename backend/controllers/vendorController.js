const Invoice = require('../models/Invoice');
const PurchaseOrder = require('../models/PurchaseOrder');
const User = require('../models/User');

// @desc    Get vendor dashboard summary
// @route   GET /api/vendor/dashboard
exports.getDashboard = async (req, res) => {
    try {
        const vendorCode = req.user.vendorCode;
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

        const [openPOs, draftInvoices, submittedUnpaid, recentActivity] = await Promise.all([
            PurchaseOrder.countDocuments({ vendorCode, status: { $in: ['Open', 'Partially Invoiced'] } }),
            Invoice.countDocuments({ vendorCode, status: 'Draft' }),
            Invoice.countDocuments({ vendorCode, status: { $in: ['Submitted', 'Under Review', 'Approved', 'Posted'] } }),
            Invoice.countDocuments({ vendorCode, submittedAt: { $gte: ninetyDaysAgo } }),
        ]);

        res.json({
            success: true,
            data: {
                openPurchaseOrders: openPOs,
                draftInvoices,
                submittedUnpaidInvoices: submittedUnpaid,
                last90DaysActivity: recentActivity,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get sub-users
// @route   GET /api/vendor/sub-users
exports.getSubUsers = async (req, res) => {
    try {
        const subUsers = await User.find({ parentVendor: req.user._id })
            .select('-password');
        res.json({ success: true, data: subUsers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Add sub-user
// @route   POST /api/vendor/sub-users
exports.addSubUser = async (req, res) => {
    try {
        const existingSubUsers = await User.countDocuments({ parentVendor: req.user._id });
        if (existingSubUsers >= 4) {
            return res.status(400).json({ success: false, message: 'Maximum 4 sub-users allowed' });
        }

        const { email, name } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const tempPassword = Math.random().toString(36).slice(-8);
        const subUser = await User.create({
            email,
            password: tempPassword,
            role: 'vendor_sub_user',
            vendorCode: req.user.vendorCode,
            vendorName: req.user.vendorName,
            companyName: req.user.companyName,
            parentVendor: req.user._id,
            isActive: true,
            contactPerson: { name },
        });

        res.status(201).json({
            success: true,
            data: { id: subUser._id, email: subUser.email },
            message: 'Sub-user created successfully',
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Enable/disable sub-user
// @route   PATCH /api/vendor/sub-users/:id/toggle
exports.toggleSubUser = async (req, res) => {
    try {
        const subUser = await User.findOne({ _id: req.params.id, parentVendor: req.user._id });
        if (!subUser) {
            return res.status(404).json({ success: false, message: 'Sub-user not found' });
        }

        subUser.isActive = !subUser.isActive;
        await subUser.save();

        res.json({ success: true, data: subUser, message: `Sub-user ${subUser.isActive ? 'enabled' : 'disabled'}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get vendor reports
// @route   GET /api/vendor/reports
exports.getReports = async (req, res) => {
    try {
        const vendorCode = req.user.vendorCode;
        const { reportType, startDate, endDate } = req.query;
        const dateFilter = {};
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) dateFilter.$lte = new Date(endDate);

        let result;
        switch (reportType) {
            case 'invoices-posted': {
                const query = { vendorCode, status: 'Posted' };
                if (Object.keys(dateFilter).length) query.submittedAt = dateFilter;
                result = await Invoice.countDocuments(query);
                break;
            }
            case 'invoice-status': {
                const query = { vendorCode };
                if (Object.keys(dateFilter).length) query.submittedAt = dateFilter;
                result = await Invoice.aggregate([
                    { $match: query },
                    { $group: { _id: '$status', count: { $sum: 1 } } },
                ]);
                break;
            }
            case 'payment-status': {
                result = await Invoice.aggregate([
                    { $match: { vendorCode } },
                    { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$grossAmount' } } },
                ]);
                break;
            }
            case 'invoice-vs-paid': {
                const year = new Date().getFullYear();
                result = await Invoice.aggregate([
                    { $match: { vendorCode, submittedAt: { $gte: new Date(`${year}-01-01`) } } },
                    { $group: { _id: { $month: '$submittedAt' }, count: { $sum: 1 }, paidAmount: { $sum: { $cond: [{ $eq: ['$status', 'Paid'] }, '$grossAmount', 0] } } } },
                    { $sort: { '_id': 1 } },
                ]);
                break;
            }
            case 'login-count': {
                result = { loginCount: req.user.loginCount || 0 };
                break;
            }
            case 'login-status': {
                const subUsers = await User.find({ parentVendor: req.user._id }).select('email lastLogin loginCount isActive');
                result = [{ email: req.user.email, lastLogin: req.user.lastLogin, loginCount: req.user.loginCount, isActive: true }, ...subUsers];
                break;
            }
            default:
                result = {};
        }

        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
