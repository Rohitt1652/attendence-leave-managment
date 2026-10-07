const Attendance = require('../models/Attendance');
const AttendanceRegularization = require('../models/AttendanceRegularization');
const AttendanceLock = require('../models/AttendanceLock');
const Employee = require('../models/Employee');
const Shift = require('../models/Shift');
const AttendanceCalculationService = require('../services/AttendanceCalculationService');
const AuditService = require('../services/AuditService');
const NotificationService = require('../services/NotificationService');
const { ATTENDANCE_STATUS, REGULARIZATION_STATUS } = require('../constants/statuses');
const ExcelJS = require('exceljs');

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Check if a given date string (YYYY-MM-DD) falls in a locked month
const checkIsMonthLocked = async (dateStr) => {
  const [year, month] = dateStr.split('-').map(Number);
  const lock = await AttendanceLock.findOne({ year, month, isLocked: true });
  return !!lock;
};

// @route   POST /api/v1/attendance/punch
// @desc    Self punch in / punch out for logged-in employee
const punch = async (req, res, next) => {
  try {
    const employee = req.employee;
    if (!employee) {
      return res.status(400).json({
        success: false,
        message: 'No employee record associated with this user account.',
      });
    }

    const todayStr = getTodayDateString();

    // Check lock
    const isLocked = await checkIsMonthLocked(todayStr);
    if (isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Attendance for this month is locked by HR for payroll processing.',
      });
    }

    let record = await Attendance.findOne({
      employeeId: employee._id,
      date: todayStr,
    });

    const shift = employee.shiftId ? await Shift.findById(employee.shiftId) : null;

    if (!record) {
      // First punch of the day: Check In
      const checkInTime = new Date();
      const metrics = await AttendanceCalculationService.calculateMetrics({
        checkIn: checkInTime,
        shift,
        dateStr: todayStr,
        employeeId: employee._id,
      });

      record = await Attendance.create({
        employeeId: employee._id,
        date: todayStr,
        checkIn: checkInTime,
        lateMinutes: metrics.lateMinutes,
        attendanceStatus: metrics.attendanceStatus,
        source: 'Web',
        createdBy: req.user._id,
      });

      return res.status(200).json({
        success: true,
        message: `Punched in successfully at ${checkInTime.toLocaleTimeString()}`,
        data: record,
      });
    }

    // Already checked in. If not checked out yet, punch out
    if (!record.checkOut) {
      const checkOutTime = new Date();
      const metrics = await AttendanceCalculationService.calculateMetrics({
        checkIn: record.checkIn,
        checkOut: checkOutTime,
        shift,
        dateStr: todayStr,
        employeeId: employee._id,
      });

      record.checkOut = checkOutTime;
      record.totalWorkingMinutes = metrics.totalWorkingMinutes;
      record.breakMinutes = metrics.breakMinutes;
      record.lateMinutes = metrics.lateMinutes;
      record.earlyExitMinutes = metrics.earlyExitMinutes;
      record.overtimeMinutes = metrics.overtimeMinutes;
      record.attendanceStatus = metrics.attendanceStatus;
      record.updatedBy = req.user._id;

      await record.save();

      return res.status(200).json({
        success: true,
        message: `Punched out successfully at ${checkOutTime.toLocaleTimeString()}`,
        data: record,
      });
    }

    // Already checked out
    return res.status(400).json({
      success: false,
      message: 'You have already completed check-in and check-out for today.',
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/attendance/today
// @desc    Get current employee's today attendance status
const getTodayStatus = async (req, res, next) => {
  try {
    const employee = req.employee;
    if (!employee) {
      return res.status(200).json({ success: true, data: null });
    }

    const todayStr = getTodayDateString();
    const record = await Attendance.findOne({
      employeeId: employee._id,
      date: todayStr,
    });

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/attendance/my
// @desc    Get logged in employee's attendance history
const getMyAttendance = async (req, res, next) => {
  try {
    const employee = req.employee;
    if (!employee) {
      return res.status(400).json({
        success: false,
        message: 'No employee record associated with this user account.',
      });
    }

    const { month, year } = req.query;
    const currentYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month, 10) : new Date().getMonth() + 1;

    const monthStr = String(currentMonth).padStart(2, '0');
    const regex = new RegExp(`^${currentYear}-${monthStr}`);

    const records = await Attendance.find({
      employeeId: employee._id,
      date: regex,
    }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/attendance/daily
// @desc    Get all employees attendance for a specific date (Admin / HR / Manager)
const getDailyAttendance = async (req, res, next) => {
  try {
    const {
      date = getTodayDateString(),
      departmentId,
      status,
      page = 1,
      limit = 20,
      search = '',
    } = req.query;

    const empQuery = { status: 'Active' };
    if (departmentId) empQuery.departmentId = departmentId;
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      empQuery.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { employeeCode: searchRegex },
      ];
    }

    const employees = await Employee.find(empQuery)
      .populate('departmentId', 'name')
      .populate('designationId', 'name')
      .populate('shiftId', 'name startTime endTime')
      .lean();

    const empIds = employees.map((e) => e._id);

    const attendances = await Attendance.find({
      employeeId: { $in: empIds },
      date,
    }).lean();

    const attendanceMap = {};
    attendances.forEach((att) => {
      attendanceMap[String(att.employeeId)] = att;
    });

    let combined = employees.map((emp) => {
      const att = attendanceMap[String(emp._id)];
      return {
        employee: emp,
        attendance: att || {
          date,
          attendanceStatus: ATTENDANCE_STATUS.ABSENT,
          checkIn: null,
          checkOut: null,
          totalWorkingMinutes: 0,
        },
      };
    });

    if (status) {
      combined = combined.filter((c) => c.attendance.attendanceStatus === status);
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const total = combined.length;
    const paginated = combined.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.status(200).json({
      success: true,
      data: paginated,
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

// @route   GET /api/v1/attendance/monthly-matrix
// @desc    Get monthly calendar grid matrix (days 1..31 for each employee)
const getMonthlyMatrix = async (req, res, next) => {
  try {
    const { month, year, departmentId } = req.query;
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const targetMonth = month ? parseInt(month, 10) : new Date().getMonth() + 1;

    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    const monthStr = String(targetMonth).padStart(2, '0');
    const dateRegex = new RegExp(`^${targetYear}-${monthStr}`);

    const empQuery = { status: 'Active' };
    if (departmentId) empQuery.departmentId = departmentId;

    const employees = await Employee.find(empQuery)
      .select('firstName lastName employeeCode departmentId')
      .populate('departmentId', 'name')
      .sort({ firstName: 1 })
      .lean();

    const empIds = employees.map((e) => e._id);
    const attendances = await Attendance.find({
      employeeId: { $in: empIds },
      date: dateRegex,
    }).lean();

    const matrix = employees.map((emp) => {
      const empAttendances = attendances.filter(
        (a) => String(a.employeeId) === String(emp._id)
      );
      const days = {};
      for (let d = 1; d <= daysInMonth; d++) {
        const dStr = `${targetYear}-${monthStr}-${String(d).padStart(2, '0')}`;
        const record = empAttendances.find((a) => a.date === dStr);
        days[d] = record ? record.attendanceStatus : null;
      }
      return {
        employee: emp,
        days,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        year: targetYear,
        month: targetMonth,
        daysInMonth,
        matrix,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/attendance/manual
// @desc    Create or update attendance manually (HR / Admin) with audit
const manualAttendance = async (req, res, next) => {
  try {
    const { employeeId, date, checkIn, checkOut, attendanceStatus, remarks } = req.body;

    if (!employeeId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID and date are required.',
      });
    }

    // Check lock
    const isLocked = await checkIsMonthLocked(date);
    if (isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify attendance for a locked month.',
      });
    }

    const employee = await Employee.findById(employeeId).populate('shiftId');
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    let existing = await Attendance.findOne({ employeeId, date });
    const oldData = existing ? existing.toObject() : null;

    let metrics = {};
    if (checkIn && checkOut) {
      metrics = await AttendanceCalculationService.calculateMetrics({
        checkIn,
        checkOut,
        shift: employee.shiftId,
        dateStr: date,
        employeeId,
      });
    }

    const updateDoc = {
      employeeId,
      date,
      checkIn: checkIn ? new Date(checkIn) : null,
      checkOut: checkOut ? new Date(checkOut) : null,
      totalWorkingMinutes: metrics.totalWorkingMinutes || 0,
      breakMinutes: metrics.breakMinutes || 0,
      lateMinutes: metrics.lateMinutes || 0,
      earlyExitMinutes: metrics.earlyExitMinutes || 0,
      overtimeMinutes: metrics.overtimeMinutes || 0,
      attendanceStatus: attendanceStatus || metrics.attendanceStatus || ATTENDANCE_STATUS.PRESENT,
      source: 'Manual',
      remarks: remarks || 'Manually updated by Admin/HR',
      updatedBy: req.user._id,
    };

    if (!existing) {
      updateDoc.createdBy = req.user._id;
      existing = await Attendance.create(updateDoc);
    } else {
      Object.assign(existing, updateDoc);
      await existing.save();
    }

    await AuditService.log({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'ATTENDANCE_MANUAL_MODIFIED',
      module: 'Attendance',
      recordId: existing._id,
      oldData,
      newData: existing,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Attendance record saved successfully.',
      data: existing,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/attendance/lock
// @desc    Lock monthly attendance for payroll
const lockAttendance = async (req, res, next) => {
  try {
    const { month, year, reason } = req.body;
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required.',
      });
    }

    let lock = await AttendanceLock.findOne({ month, year });
    if (lock && lock.isLocked) {
      return res.status(400).json({
        success: false,
        message: `Attendance for ${month}/${year} is already locked.`,
      });
    }

    if (!lock) {
      lock = await AttendanceLock.create({
        month,
        year,
        isLocked: true,
        lockedBy: req.user._id,
        lockedAt: new Date(),
        reason: reason || 'Monthly payroll finalization',
      });
    } else {
      lock.isLocked = true;
      lock.lockedBy = req.user._id;
      lock.lockedAt = new Date();
      lock.unlockedBy = null;
      lock.unlockedAt = null;
      lock.reason = reason || lock.reason;
      await lock.save();
    }

    await AuditService.log({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'ATTENDANCE_LOCKED',
      module: 'Attendance',
      recordId: lock._id,
      newData: lock,
      req,
    });

    res.status(200).json({
      success: true,
      message: `Attendance for ${month}/${year} locked successfully.`,
      data: lock,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/attendance/unlock
// @desc    Unlock monthly attendance (Authorized HR / Admin)
const unlockAttendance = async (req, res, next) => {
  try {
    const { month, year, reason } = req.body;
    const lock = await AttendanceLock.findOne({ month, year });

    if (!lock || !lock.isLocked) {
      return res.status(400).json({
        success: false,
        message: `Attendance for ${month}/${year} is not locked.`,
      });
    }

    lock.isLocked = false;
    lock.unlockedBy = req.user._id;
    lock.unlockedAt = new Date();
    lock.reason = reason || 'Unlocked by authorized administrator';
    await lock.save();

    await AuditService.log({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'ATTENDANCE_UNLOCKED',
      module: 'Attendance',
      recordId: lock._id,
      newData: lock,
      req,
    });

    res.status(200).json({
      success: true,
      message: `Attendance for ${month}/${year} unlocked successfully.`,
      data: lock,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/attendance/locks
// @desc    Get all attendance locks
const getLocks = async (req, res, next) => {
  try {
    const locks = await AttendanceLock.find()
      .populate('lockedBy', 'email')
      .populate('unlockedBy', 'email')
      .sort({ year: -1, month: -1 });

    res.status(200).json({ success: true, data: locks });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/attendance/regularizations
// @desc    Submit attendance reconciliation / regularization request
const requestRegularization = async (req, res, next) => {
  try {
    const employee = req.employee;
    if (!employee) {
      return res.status(400).json({
        success: false,
        message: 'No employee linked to this account.',
      });
    }

    const {
      attendanceDate,
      requestedCheckIn,
      requestedCheckOut,
      reason,
      employeeComment,
    } = req.body;

    if (!attendanceDate || !requestedCheckIn || !requestedCheckOut || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Date, requested in/out times, and reason are required.',
      });
    }

    // Check lock
    const isLocked = await checkIsMonthLocked(attendanceDate);
    if (isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Cannot regularize attendance for a locked month.',
      });
    }

    const existingAtt = await Attendance.findOne({
      employeeId: employee._id,
      date: attendanceDate,
    });

    const reg = await AttendanceRegularization.create({
      employeeId: employee._id,
      attendanceDate,
      originalCheckIn: existingAtt?.checkIn || null,
      originalCheckOut: existingAtt?.checkOut || null,
      requestedCheckIn: new Date(requestedCheckIn),
      requestedCheckOut: new Date(requestedCheckOut),
      reason,
      employeeComment,
      status: REGULARIZATION_STATUS.PENDING,
    });

    // Notify manager if exists
    if (employee.reportingManagerId) {
      const managerUser = await require('../models/User').findOne({
        employeeId: employee.reportingManagerId.employeeCode,
      });
      if (managerUser) {
        await NotificationService.send({
          recipientId: managerUser._id,
          title: 'New Attendance Regularization Request',
          message: `${employee.firstName} ${employee.lastName} requested regularization for ${attendanceDate}`,
          link: '/attendance/regularizations',
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Regularization request submitted successfully.',
      data: reg,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/attendance/regularizations
// @desc    Get regularization requests with filter
const getRegularizations = async (req, res, next) => {
  try {
    const { status, employeeId } = req.query;
    const query = {};

    if (status) query.status = status;
    if (employeeId) query.employeeId = employeeId;

    // If regular employee, only show their own
    const userRole = req.user.roleId?.code || '';
    if (userRole === 'employee' && req.employee) {
      query.employeeId = req.employee._id;
    }

    const requests = await AttendanceRegularization.find(query)
      .populate({
        path: 'employeeId',
        select: 'firstName lastName employeeCode departmentId',
        populate: { path: 'departmentId', select: 'name' },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/v1/attendance/regularizations/:id/action
// @desc    Approve or reject regularization request
const handleRegularizationAction = async (req, res, next) => {
  try {
    const { status, approverComment } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be Approved or Rejected.',
      });
    }

    const reg = await AttendanceRegularization.findById(req.params.id).populate('employeeId');
    if (!reg) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    if (reg.status !== REGULARIZATION_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        message: `This request is already ${reg.status}.`,
      });
    }

    reg.status = status;
    reg.approverComment = approverComment || '';
    reg.approvalHistory.push({
      level: reg.currentApprovalLevel,
      approverId: req.employee?._id || null,
      status,
      comment: approverComment || '',
      updatedAt: new Date(),
    });

    await reg.save();

    // If approved, update or create Attendance record with requested checkIn and checkOut!
    if (status === 'Approved') {
      const shift = reg.employeeId.shiftId ? await Shift.findById(reg.employeeId.shiftId) : null;
      const metrics = await AttendanceCalculationService.calculateMetrics({
        checkIn: reg.requestedCheckIn,
        checkOut: reg.requestedCheckOut,
        shift,
        dateStr: reg.attendanceDate,
        employeeId: reg.employeeId._id,
      });

      let att = await Attendance.findOne({
        employeeId: reg.employeeId._id,
        date: reg.attendanceDate,
      });

      const attData = {
        employeeId: reg.employeeId._id,
        date: reg.attendanceDate,
        checkIn: reg.requestedCheckIn,
        checkOut: reg.requestedCheckOut,
        totalWorkingMinutes: metrics.totalWorkingMinutes,
        breakMinutes: metrics.breakMinutes,
        lateMinutes: metrics.lateMinutes,
        earlyExitMinutes: metrics.earlyExitMinutes,
        overtimeMinutes: metrics.overtimeMinutes,
        attendanceStatus: metrics.attendanceStatus,
        source: 'Manual',
        isRegularized: true,
        remarks: `Regularized: ${reg.reason}`,
        updatedBy: req.user._id,
      };

      if (att) {
        Object.assign(att, attData);
        await att.save();
      } else {
        attData.createdBy = req.user._id;
        att = await Attendance.create(attData);
      }
    }

    // Notify employee
    if (reg.employeeId.userId) {
      await NotificationService.send({
        recipientId: reg.employeeId.userId,
        title: `Attendance Regularization ${status}`,
        message: `Your regularization request for ${reg.attendanceDate} has been ${status.toLowerCase()}.`,
        link: '/attendance/my',
      });
    }

    res.status(200).json({
      success: true,
      message: `Regularization request ${status.toLowerCase()} successfully.`,
      data: reg,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/attendance/import
// @desc    Import attendance from Excel / CSV with verification and dry-run preview
const importAttendance = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an Excel or CSV file.',
      });
    }

    const { commit = 'false' } = req.body;
    const isCommit = commit === 'true' || commit === true;

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const worksheet = workbook.worksheets[0];

    const rows = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // skip headers
      // Columns: [1: EmpCode, 2: Date (YYYY-MM-DD), 3: Punch In (HH:mm or ISO), 4: Punch Out (HH:mm or ISO)]
      rows.push({
        rowNumber,
        empCode: String(row.getCell(1).value || '').trim(),
        dateStr: String(row.getCell(2).value || '').trim(),
        punchIn: row.getCell(3).value,
        punchOut: row.getCell(4).value,
      });
    });

    const employees = await Employee.find().populate('shiftId').lean();
    const empMap = {};
    employees.forEach((emp) => {
      empMap[emp.employeeCode.toUpperCase()] = emp;
    });

    let validRows = 0;
    let invalidRows = 0;
    let duplicateRows = 0;
    const failedRecords = [];
    const validRecords = [];

    for (const r of rows) {
      const emp = empMap[r.empCode.toUpperCase()];
      if (!emp) {
        invalidRows++;
        failedRecords.push({ ...r, error: 'Unknown Employee Code' });
        continue;
      }

      if (!r.dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(r.dateStr)) {
        invalidRows++;
        failedRecords.push({ ...r, error: 'Invalid Date format (required YYYY-MM-DD)' });
        continue;
      }

      // Check existing in DB
      const existing = await Attendance.findOne({
        employeeId: emp._id,
        date: r.dateStr,
      });

      if (existing) {
        duplicateRows++;
        failedRecords.push({ ...r, error: 'Attendance already exists for this date' });
        continue;
      }

      validRows++;
      validRecords.push({
        employee: emp,
        date: r.dateStr,
        checkIn: r.punchIn ? new Date(`${r.dateStr}T${r.punchIn}`) : null,
        checkOut: r.punchOut ? new Date(`${r.dateStr}T${r.punchOut}`) : null,
      });
    }

    if (isCommit && validRecords.length > 0) {
      for (const item of validRecords) {
        const metrics = await AttendanceCalculationService.calculateMetrics({
          checkIn: item.checkIn,
          checkOut: item.checkOut,
          shift: item.employee.shiftId,
          dateStr: item.date,
          employeeId: item.employee._id,
        });

        await Attendance.create({
          employeeId: item.employee._id,
          date: item.date,
          checkIn: item.checkIn,
          checkOut: item.checkOut,
          totalWorkingMinutes: metrics.totalWorkingMinutes,
          breakMinutes: metrics.breakMinutes,
          lateMinutes: metrics.lateMinutes,
          earlyExitMinutes: metrics.earlyExitMinutes,
          overtimeMinutes: metrics.overtimeMinutes,
          attendanceStatus: metrics.attendanceStatus,
          source: 'Import',
          createdBy: req.user._id,
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        totalRows: rows.length,
        validRows,
        invalidRows,
        duplicateRows,
        failedRecords,
        isCommitted: isCommit,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  punch,
  getTodayStatus,
  getMyAttendance,
  getDailyAttendance,
  getMonthlyMatrix,
  manualAttendance,
  lockAttendance,
  unlockAttendance,
  getLocks,
  requestRegularization,
  getRegularizations,
  handleRegularizationAction,
  importAttendance,
};
