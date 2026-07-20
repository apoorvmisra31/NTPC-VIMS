const { HRLeave, TravelClaim } = require('../models');
const User = require('../models/User');

// ===== LEAVE MANAGEMENT =====

// @desc    Get leave requests
// @route   GET /api/hr/leaves
exports.getLeaves = async (req, res) => {
    try {
        const { status, leaveType } = req.query;
        let query = {};

        if (req.user.role === 'hr_admin' || req.user.role === 'system_admin') {
            // HR admin and system admin see all
            if (status) query.status = status;
        } else {
            query.employee = req.user._id;
            if (status) query.status = status;
        }
        if (leaveType) query.leaveType = leaveType;

        const leaves = await HRLeave.find(query)
            .populate('employee', 'email contactPerson department designation plant vendorName vendorCode')
            .populate('approver', 'email contactPerson')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: leaves.length, data: leaves });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Submit leave request
// @route   POST /api/hr/leaves
exports.submitLeave = async (req, res) => {
    try {
        const { leaveType, startDate, endDate, reason, employeeName, employeeCode, plant } = req.body;

        // Calculate working days (simple)
        const start = new Date(startDate);
        const end = new Date(endDate);
        let days = 0;
        const current = new Date(start);
        while (current <= end) {
            const dayOfWeek = current.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) days++;
            current.setDate(current.getDate() + 1);
        }

        const leave = await HRLeave.create({
            employee: req.user._id,
            employeeName: employeeName || req.user.vendorName || '',
            employeeCode: employeeCode || req.user.vendorCode || '',
            plant: plant || req.user.plant || '',
            leaveType,
            startDate,
            endDate,
            numberOfDays: days,
            reason,
            status: 'Submitted',
        });

        res.status(201).json({ success: true, data: leave, message: 'Leave request submitted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Approve/reject leave
// @route   PATCH /api/hr/leaves/:id
exports.approveLeave = async (req, res) => {
    try {
        const { action, comments } = req.body;
        const leave = await HRLeave.findById(req.params.id);
        if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });

        leave.status = action === 'approve' ? 'Approved' : 'Rejected';
        leave.approver = req.user._id;
        leave.approverComments = comments;
        leave.approvedAt = new Date();
        await leave.save();

        res.json({ success: true, data: leave, message: `Leave ${leave.status.toLowerCase()}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get leave balance
// @route   GET /api/hr/leave-balance
exports.getLeaveBalance = async (req, res) => {
    try {
        const userId = req.user._id;
        const year = new Date().getFullYear();
        const startOfYear = new Date(`${year}-01-01`);

        const approved = await HRLeave.aggregate([
            { $match: { employee: userId, status: 'Approved', startDate: { $gte: startOfYear } } },
            { $group: { _id: '$leaveType', totalDays: { $sum: '$numberOfDays' } } },
        ]);

        const balance = {
            'Earned Leave': 30,
            'Casual Leave': 12,
            'Medical Leave': 15,
            'Compensatory Off': 5,
        };

        approved.forEach(item => {
            if (balance[item._id] !== undefined) {
                balance[item._id] = Math.max(0, balance[item._id] - item.totalDays);
            }
        });

        res.json({ success: true, data: balance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ===== TRAVEL CLAIMS =====

// @desc    Get travel claims
// @route   GET /api/hr/travel-claims
exports.getTravelClaims = async (req, res) => {
    try {
        let query = {};
        if (req.user.role !== 'hr_admin' && req.user.role !== 'finance' && req.user.role !== 'system_admin') {
            query.employee = req.user._id;
        }

        const claims = await TravelClaim.find(query)
            .populate('employee', 'email contactPerson department plant vendorName vendorCode')
            .populate('managerApprover', 'email')
            .populate('financeApprover', 'email')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: claims.length, data: claims });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Submit travel claim
// @route   POST /api/hr/travel-claims
exports.submitTravelClaim = async (req, res) => {
    try {
        const { startDate, endDate, destination, purpose, modeOfTravel, expenses,
                employeeName, employeeCode, plant } = req.body;

        // Fix amount bug: ensure numeric addition, not string concatenation
        const totalAmount = (expenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);

        const claim = await TravelClaim.create({
            employee: req.user._id,
            employeeName: employeeName || req.user.vendorName || '',
            employeeCode: employeeCode || req.user.vendorCode || '',
            plant: plant || req.user.plant || '',
            travelDates: { start: startDate, end: endDate },
            destination,
            purpose,
            modeOfTravel,
            expenses: (expenses || []).map(e => ({ ...e, amount: Number(e.amount || 0) })),
            totalAmount,
            status: 'Submitted',
        });

        res.status(201).json({ success: true, data: claim, message: 'Travel claim submitted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Manager approve travel claim
// @route   PATCH /api/hr/travel-claims/:id/approve
exports.approveTravelClaim = async (req, res) => {
    try {
        const { comments } = req.body;
        const claim = await TravelClaim.findById(req.params.id);
        if (!claim) return res.status(404).json({ success: false, message: 'Travel claim not found' });

        claim.status = 'Manager Approved';
        claim.managerApprover = req.user._id;
        claim.managerComments = comments;
        claim.managerApprovedAt = new Date();
        await claim.save();

        res.json({ success: true, data: claim, message: 'Travel claim approved by manager' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Finance process travel claim (accept → Paid, reject → Rejected)
// @route   PATCH /api/hr/travel-claims/:id/process
exports.processTravelClaim = async (req, res) => {
    try {
        const { action, comments } = req.body;
        const claim = await TravelClaim.findById(req.params.id);
        if (!claim) return res.status(404).json({ success: false, message: 'Travel claim not found' });

        if (action === 'reject') {
            claim.status = 'Rejected';
        } else {
            // accept or default behavior
            claim.status = 'Paid';
        }
        claim.financeApprover = req.user._id;
        claim.financeComments = comments;
        claim.financeProcessedAt = new Date();
        await claim.save();

        const statusMsg = claim.status === 'Paid' ? 'approved and paid' : 'rejected';
        res.json({ success: true, data: claim, message: `Travel claim ${statusMsg} by finance` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single leave by ID
// @route   GET /api/hr/leaves/:id
exports.getLeaveById = async (req, res) => {
    try {
        const leave = await HRLeave.findById(req.params.id)
            .populate('employee', 'email contactPerson department plant vendorName vendorCode')
            .populate('approver', 'email contactPerson');
        if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });
        res.json({ success: true, data: leave });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update leave request
// @route   PATCH /api/hr/leaves/:id/update
exports.updateLeave = async (req, res) => {
    try {
        const leave = await HRLeave.findById(req.params.id);
        if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });
        if (leave.status !== 'Submitted' && leave.status !== 'Draft') {
            return res.status(400).json({ success: false, message: 'Cannot update a processed leave' });
        }

        const { leaveType, startDate, endDate, reason, employeeName, employeeCode, plant } = req.body;
        if (leaveType) leave.leaveType = leaveType;
        if (startDate) leave.startDate = startDate;
        if (endDate) leave.endDate = endDate;
        if (reason !== undefined) leave.reason = reason;
        if (employeeName) leave.employeeName = employeeName;
        if (employeeCode) leave.employeeCode = employeeCode;
        if (plant) leave.plant = plant;

        // Recalculate days if dates changed
        if (startDate || endDate) {
            const start = new Date(leave.startDate);
            const end = new Date(leave.endDate);
            let days = 0;
            const current = new Date(start);
            while (current <= end) {
                if (current.getDay() !== 0 && current.getDay() !== 6) days++;
                current.setDate(current.getDate() + 1);
            }
            leave.numberOfDays = days;
        }

        await leave.save();
        res.json({ success: true, data: leave, message: 'Leave updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single travel claim by ID
// @route   GET /api/hr/travel-claims/:id
exports.getTravelClaimById = async (req, res) => {
    try {
        const claim = await TravelClaim.findById(req.params.id)
            .populate('employee', 'email contactPerson department plant vendorName vendorCode')
            .populate('managerApprover', 'email')
            .populate('financeApprover', 'email');
        if (!claim) return res.status(404).json({ success: false, message: 'Travel claim not found' });
        res.json({ success: true, data: claim });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update travel claim
// @route   PATCH /api/hr/travel-claims/:id/update
exports.updateTravelClaim = async (req, res) => {
    try {
        const claim = await TravelClaim.findById(req.params.id);
        if (!claim) return res.status(404).json({ success: false, message: 'Travel claim not found' });
        if (claim.status !== 'Submitted' && claim.status !== 'Draft') {
            return res.status(400).json({ success: false, message: 'Cannot update a processed claim' });
        }

        const { destination, purpose, modeOfTravel, expenses, employeeName, employeeCode, plant } = req.body;
        if (destination) claim.destination = destination;
        if (purpose !== undefined) claim.purpose = purpose;
        if (modeOfTravel) claim.modeOfTravel = modeOfTravel;
        if (employeeName) claim.employeeName = employeeName;
        if (employeeCode) claim.employeeCode = employeeCode;
        if (plant) claim.plant = plant;
        if (expenses) {
            claim.expenses = expenses.map(e => ({ ...e, amount: Number(e.amount || 0) }));
            claim.totalAmount = claim.expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
        }

        await claim.save();
        res.json({ success: true, data: claim, message: 'Travel claim updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
