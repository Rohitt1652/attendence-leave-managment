const LeaveType = require('../models/LeaveType');
const LeaveAllocation = require('../models/LeaveAllocation');
const LeaveRequest = require('../models/LeaveRequest');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const LeaveCalculationService = require('../services/LeaveCalculationService');
const AuditService = require('../services/AuditService');
const NotificationService = require('../services/NotificationService');
const { LEAVE_STATUS, ATTENDANCE_STATUS } = require('../constants/statuses');

// --- LEAVE TYPES ---
const getLeaveTypes = async (req, res, next) => {
  try {
    const types = await LeaveType.find().sort({ name: 1 });
    res.status(200).json({ success: true, data: types });
  } catch (error) {
    next(error);
  }
};

const createLeaveType = async (req, res, next) => {
  try {
    const leaveType = await LeaveType.create(req.body);
    await AuditService.log({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'LEAVE_TYPE_CREATED',
      module: 'Leave',
      recordId: leaveType._id,
      newData: leaveType,
      req,
    });
    res.status(201).json({ success: true, message: 'Leave type created', data: leaveType });
  } catch (error) {
    next(error);
  }
};

const updateLeaveType = async (req, res, next) => {
  try {
    const oldData = await LeaveType.findById(req.params.id);
    const updated = await LeaveType.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    await AuditService.log({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'LEAVE_TYPE_UPDATED',
      module: 'Leave',
      recordId: req.params.id,
      oldData,
      newData: updated,
      req,
    });
    res.status(200).json({ success: true, message: 'Leave type updated', data: updated });
  } catch (error) {
    next(error);
  }
};

const deleteLeaveType = async (req, res, next) => {
  try {
    const lt = await LeaveType.findByIdAndDelete(req.params.id);
    await AuditService.log({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'LEAVE_TYPE_DELETED',
      module: 'Leave',
      recordId: req.params.id,
      oldData: lt,
      req,
    });
    res.status(200).json({ success: true, message: 'Leave type deleted' });
  } catch (error) {
    next(error);
  }
};

// --- LEAVE ALLOCATIONS ---
const allocateLeave = async (req, res, next) => {
  try {
    const { employeeId, leaveTypeId, year, allocatedDays } = req.body;
    const currentYear = year || new Date().getFullYear();

    let allocation = await LeaveAllocation.findOne({
      employeeId,
      leaveTypeId,
      year: currentYear,
    });

    if (!allocation) {
      allocation = await LeaveAllocation.create({
        employeeId,
        leaveTypeId,
        year: currentYear,
        allocatedDays: Number(allocatedDays),
      });
    } else {
      allocation.allocatedDays = Number(allocatedDays);
      await allocation.save();
    }

    res.status(200).json({
      success: true,
      message: 'Leave allocated successfully',
      data: allocation,
    });
  } catch (error) {
    next(error);
  }
};

// Bulk allocation by department or employment type
const bulkAllocateLeave = async (req, res, next) => {
  try {
    const { leaveTypeId, year, allocatedDays, departmentId, employmentType } = req.body;
    const currentYear = year || new Date().getFullYear();

    const empQuery = { status: 'Active' };
    if (departmentId) empQuery.departmentId = departmentId;
    if (employmentType) empQuery.employmentType = employmentType;

    const employees = await Employee.find(empQuery).select('_id');

    let count = 0;
    for (const emp of employees) {
      await LeaveAllocation.findOneAndUpdate(
        { employeeId: emp._id, leaveTypeId, year: currentYear },
        { $set: { allocatedDays: Number(allocatedDays) } },
        { upsert: true, new: true }
      );
      count++;
    }

    await AuditService.log({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'LEAVE_BULK_ALLOCATED',
      module: 'Leave',
      recordId: leaveTypeId,
      newData: { targetCount: count, allocatedDays, year: currentYear },
      req,
    });

    res.status(200).json({
      success: true,
      message: `Successfully allocated leaves to ${count} employees.`,
    });
  } catch (error) {
    next(error);
  }
};

const getLeaveAllocations = async (req, res, next) => {
  try {
    const { employeeId, year } = req.query;
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const query = { year: targetYear };
    if (employeeId) query.employeeId = employeeId;

    const allocations = await LeaveAllocation.find(query)
      .populate('employeeId', 'firstName lastName employeeCode')
      .populate('leaveTypeId', 'name code paid');

    res.status(200).json({ success: true, data: allocations });
  } catch (error) {
    next(error);
  }
};

// --- LEAVE BALANCES ---
const getLeaveBalances = async (req, res, next) => {
  try {
    const targetEmployeeId = req.params.employeeId || req.employee?._id;
    if (!targetEmployeeId) {
      return res.status(400).json({ success: false, message: 'Employee not found.' });
    }

    const currentYear = new Date().getFullYear();
    const leaveTypes = await LeaveType.find({ status: 'Active' });
    const allocations = await LeaveAllocation.find({
      employeeId: targetEmployeeId,
      year: currentYear,
    }).populate('leaveTypeId');

    const balances = leaveTypes.map((lt) => {
      const alloc = allocations.find((a) => String(a.leaveTypeId?._id) === String(lt._id));
      const allocated = alloc ? alloc.allocatedDays : lt.annualLimit;
      const carried = alloc ? alloc.carriedForwardDays : 0;
      const used = alloc ? alloc.usedDays : 0;
      const pending = alloc ? alloc.pendingDays : 0;
      const available = Math.max(0, allocated + carried - used - pending);

      return {
        leaveTypeId: lt._id,
        name: lt.name,
        code: lt.code,
        paid: lt.paid,
        allocated,
        used,
        pending,
        available,
      };
    });

    res.status(200).json({ success: true, data: balances });
  } catch (error) {
    next(error);
  }
};

// --- LEAVE REQUESTS ---
const applyLeave = async (req, res, next) => {
  try {
    const employee = req.employee;
    if (!employee) {
      return res.status(400).json({ success: false, message: 'No employee record linked.' });
    }

    const {
      leaveTypeId,
      startDate,
      endDate,
      isHalfDay = false,
      halfDaySession = 'None',
      reason,
      emergencyContact,
    } = req.body;

    if (!leaveTypeId || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Leave type, start date, end date, and reason are required.',
      });
    }

    const leaveType = await LeaveType.findById(leaveTypeId);
    if (!leaveType) {
      return res.status(404).json({ success: false, message: 'Leave type not found.' });
    }

    // Calculate duration in working days excluding holidays & weekly offs
    const shift = employee.shiftId ? await require('../models/Shift').findById(employee.shiftId) : null;
    const { requestedDays, workingDays } = await LeaveCalculationService.calculateLeaveDays({
      startDate,
      endDate,
      isHalfDay,
      shift,
    });

    if (workingDays <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Selected date range contains no working days (all dates fall on weekends or holidays).',
      });
    }

    // Check balance
    const currentYear = new Date(startDate).getFullYear();
    let allocation = await LeaveAllocation.findOne({
      employeeId: employee._id,
      leaveTypeId,
      year: currentYear,
    });

    if (!allocation) {
      allocation = await LeaveAllocation.create({
        employeeId: employee._id,
        leaveTypeId,
        year: currentYear,
        allocatedDays: leaveType.annualLimit,
      });
    }

    const available = allocation.availableDays;
    if (leaveType.paid && available < workingDays) {
      return res.status(400).json({
        success: false,
        message: `Insufficient leave balance. Available: ${available} days, Requested: ${workingDays} days.`,
      });
    }

    // Create leave request
    const leaveRequest = await LeaveRequest.create({
      employeeId: employee._id,
      leaveTypeId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isHalfDay,
      halfDaySession,
      numberOfDays: workingDays,
      reason,
      emergencyContact,
      status: LEAVE_STATUS.PENDING,
    });

    // Update pending days in allocation
    allocation.pendingDays += workingDays;
    await allocation.save();

    // Notify Reporting Manager
    if (employee.reportingManagerId) {
      const manager = await Employee.findById(employee.reportingManagerId);
      if (manager && manager.userId) {
        await NotificationService.send({
          recipientId: manager.userId,
          title: 'New Leave Request',
          message: `${employee.firstName} ${employee.lastName} requested ${workingDays} days ${leaveType.name}.`,
          link: '/leaves',
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Leave applied successfully and submitted for approval.',
      data: leaveRequest,
    });
  } catch (error) {
    next(error);
  }
};

const getLeaveRequests = async (req, res, next) => {
  try {
    const { status, employeeId, departmentId, page = 1, limit = 15 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (employeeId) query.employeeId = employeeId;

    // If standard employee, restrict to self
    const userRole = req.user.roleId?.code || '';
    if (userRole === 'employee' && req.employee) {
      query.employeeId = req.employee._id;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await LeaveRequest.countDocuments(query);
    const requests = await LeaveRequest.find(query)
      .populate({
        path: 'employeeId',
        select: 'firstName lastName employeeCode departmentId',
        populate: { path: 'departmentId', select: 'name' },
      })
      .populate('leaveTypeId', 'name code paid')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

const handleLeaveAction = async (req, res, next) => {
  try {
    const { status, comment, rejectionReason } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be Approved or Rejected.',
      });
    }

    const leaveRequest = await LeaveRequest.findById(req.params.id)
      .populate('employeeId')
      .populate('leaveTypeId');

    if (!leaveRequest) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    if (leaveRequest.status !== LEAVE_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        message: `This leave request is already ${leaveRequest.status}.`,
      });
    }

    const currentYear = new Date(leaveRequest.startDate).getFullYear();
    const allocation = await LeaveAllocation.findOne({
      employeeId: leaveRequest.employeeId._id,
      leaveTypeId: leaveRequest.leaveTypeId._id,
      year: currentYear,
    });

    if (status === 'Approved') {
      leaveRequest.status = LEAVE_STATUS.APPROVED;
      if (allocation) {
        allocation.pendingDays = Math.max(0, allocation.pendingDays - leaveRequest.numberOfDays);
        allocation.usedDays += leaveRequest.numberOfDays;
        await allocation.save();
      }

      // Automatically update attendance records in range
      let curr = new Date(leaveRequest.startDate);
      const end = new Date(leaveRequest.endDate);
      const attStatus = leaveRequest.leaveTypeId?.paid ? ATTENDANCE_STATUS.PAID_LEAVE : ATTENDANCE_STATUS.UNPAID_LEAVE;

      while (curr <= end) {
        const dStr = curr.toISOString().split('T')[0];
        await Attendance.findOneAndUpdate(
          { employeeId: leaveRequest.employeeId._id, date: dStr },
          {
            $set: {
              attendanceStatus: attStatus,
              remarks: `Approved ${leaveRequest.leaveTypeId?.name}`,
              updatedBy: req.user._id,
            },
          },
          { upsert: true }
        );
        curr.setDate(curr.getDate() + 1);
      }
    } else if (status === 'Rejected') {
      leaveRequest.status = LEAVE_STATUS.REJECTED;
      leaveRequest.rejectionReason = rejectionReason || comment || '';
      if (allocation) {
        allocation.pendingDays = Math.max(0, allocation.pendingDays - leaveRequest.numberOfDays);
        await allocation.save();
      }
    }

    leaveRequest.approvalHistory.push({
      level: leaveRequest.currentApprovalLevel,
      approverId: req.employee?._id || null,
      status,
      comment: comment || rejectionReason || '',
      updatedAt: new Date(),
    });

    await leaveRequest.save();

    // Notify employee
    if (leaveRequest.employeeId.userId) {
      await NotificationService.send({
        recipientId: leaveRequest.employeeId.userId,
        title: `Leave Request ${status}`,
        message: `Your leave request for ${leaveRequest.numberOfDays} days has been ${status.toLowerCase()}.`,
        link: '/leaves',
      });
    }

    res.status(200).json({
      success: true,
      message: `Leave request ${status.toLowerCase()} successfully.`,
      data: leaveRequest,
    });
  } catch (error) {
    next(error);
  }
};

// --- LEAVE ANALYTICS ---
const getLeaveAnalytics = async (req, res, next) => {
  try {
    const currentYear = new Date().getFullYear();

    // 1. Leave Requests by Status
    const statusCounts = await LeaveRequest.aggregate([
      {
        $match: {
          startDate: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`),
          },
        },
      },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // 2. Leaves by Leave Type
    const typeCounts = await LeaveRequest.aggregate([
      {
        $match: {
          status: 'Approved',
          startDate: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`),
          },
        },
      },
      {
        $lookup: {
          from: 'leavetypes',
          localField: 'leaveTypeId',
          foreignField: '_id',
          as: 'type',
        },
      },
      { $unwind: '$type' },
      { $group: { _id: '$type.name', totalDays: { $sum: '$numberOfDays' } } },
      { $sort: { totalDays: -1 } },
    ]);

    // 3. Monthly Leave Trend
    const monthlyTrend = await LeaveRequest.aggregate([
      {
        $match: {
          status: 'Approved',
          startDate: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDate' },
          totalDays: { $sum: '$numberOfDays' },
          requestCount: { $sum: 1 },
        },
      },
      { $sort: { '_id': 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        statusCounts,
        typeCounts,
        monthlyTrend,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
  allocateLeave,
  bulkAllocateLeave,
  getLeaveAllocations,
  getLeaveBalances,
  applyLeave,
  getLeaveRequests,
  handleLeaveAction,
  getLeaveAnalytics,
};
