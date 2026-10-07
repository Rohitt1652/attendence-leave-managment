const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const AttendanceRegularization = require('../models/AttendanceRegularization');
const Department = require('../models/Department');
const Holiday = require('../models/Holiday');
const Event = require('../models/Event');
const Task = require('../models/Task');
const { ATTENDANCE_STATUS, LEAVE_STATUS, REGULARIZATION_STATUS } = require('../constants/statuses');

const getTodayDateString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// @route   GET /api/v1/dashboard/stats
const getDashboardStats = async (req, res, next) => {
  try {
    const todayStr = getTodayDateString();
    const isEmployee = req.user.roleId?.code === 'employee';

    if (isEmployee && req.employee) {
      // Employee Dashboard Specific Stats
      const todayAtt = await Attendance.findOne({
        employeeId: req.employee._id,
        date: todayStr,
      });

      const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM
      const monthlyAttendances = await Attendance.find({
        employeeId: req.employee._id,
        date: new RegExp(`^${currentMonthStr}`),
      });

      let monthPresent = 0;
      let monthLate = 0;
      let monthHalfDay = 0;
      let monthHours = 0;

      monthlyAttendances.forEach((a) => {
        if (a.attendanceStatus === ATTENDANCE_STATUS.PRESENT || a.attendanceStatus === ATTENDANCE_STATUS.LATE) {
          monthPresent++;
        }
        if (a.attendanceStatus === ATTENDANCE_STATUS.LATE) monthLate++;
        if (a.attendanceStatus === ATTENDANCE_STATUS.HALF_DAY) monthHalfDay++;
        monthHours += (a.totalWorkingMinutes || 0) / 60;
      });

      const pendingTasks = await Task.countDocuments({
        assignedTo: req.employee._id,
        status: { $in: ['Pending', 'In Progress'] },
      });

      const pendingLeaves = await LeaveRequest.countDocuments({
        employeeId: req.employee._id,
        status: LEAVE_STATUS.PENDING,
      });

      const upcomingHolidays = await Holiday.find({
        date: { $gte: new Date() },
        status: 'Active',
      })
        .sort({ date: 1 })
        .limit(3);

      return res.status(200).json({
        success: true,
        data: {
          role: 'Employee',
          todayAttendance: todayAtt,
          monthlySummary: {
            present: monthPresent,
            late: monthLate,
            halfDay: monthHalfDay,
            totalHours: monthHours.toFixed(1),
          },
          pendingTasks,
          pendingLeaves,
          upcomingHolidays,
        },
      });
    }

    // Admin / HR / Manager Dashboard Stats
    const totalEmployees = await Employee.countDocuments({ status: 'Active' });
    const todayAttendances = await Attendance.find({ date: todayStr }).populate({
      path: 'employeeId',
      select: 'departmentId',
    });

    let presentToday = 0;
    let lateToday = 0;
    let halfDayToday = 0;
    let wfhToday = 0;
    let leaveToday = 0;

    todayAttendances.forEach((a) => {
      if (a.attendanceStatus === ATTENDANCE_STATUS.PRESENT || a.attendanceStatus === ATTENDANCE_STATUS.LATE) {
        presentToday++;
      }
      if (a.attendanceStatus === ATTENDANCE_STATUS.LATE) lateToday++;
      if (a.attendanceStatus === ATTENDANCE_STATUS.HALF_DAY) halfDayToday++;
      if (a.attendanceStatus === ATTENDANCE_STATUS.WORK_FROM_HOME) wfhToday++;
      if (a.attendanceStatus === ATTENDANCE_STATUS.PAID_LEAVE || a.attendanceStatus === ATTENDANCE_STATUS.UNPAID_LEAVE) {
        leaveToday++;
      }
    });

    const absentToday = Math.max(0, totalEmployees - (presentToday + halfDayToday + leaveToday));

    const pendingLeaveRequests = await LeaveRequest.countDocuments({ status: LEAVE_STATUS.PENDING });
    const pendingRegularizations = await AttendanceRegularization.countDocuments({
      status: REGULARIZATION_STATUS.PENDING,
    });

    // 7-day attendance trend
    const trendDays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      trendDays.push(dStr);
    }

    const pastWeekAttendances = await Attendance.find({
      date: { $in: trendDays },
    });

    const weeklyTrend = trendDays.map((dStr) => {
      const dayRecords = pastWeekAttendances.filter((a) => a.date === dStr);
      const presentCount = dayRecords.filter(
        (a) => a.attendanceStatus === ATTENDANCE_STATUS.PRESENT || a.attendanceStatus === ATTENDANCE_STATUS.LATE
      ).length;
      const lateCount = dayRecords.filter((a) => a.attendanceStatus === ATTENDANCE_STATUS.LATE).length;
      return {
        date: dStr.substring(5), // MM-DD
        present: presentCount,
        late: lateCount,
        absent: Math.max(0, totalEmployees - presentCount),
      };
    });

    // Department Distribution
    const departments = await Department.find({ status: 'Active' }).select('name');
    const departmentDistribution = await Promise.all(
      departments.map(async (dept) => {
        const count = await Employee.countDocuments({ departmentId: dept._id, status: 'Active' });
        return {
          name: dept.name,
          employeeCount: count,
        };
      })
    );

    // Recent pending approvals
    const recentLeaves = await LeaveRequest.find({ status: LEAVE_STATUS.PENDING })
      .populate('employeeId', 'firstName lastName employeeCode')
      .populate('leaveTypeId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const upcomingHolidays = await Holiday.find({
      date: { $gte: new Date() },
      status: 'Active',
    })
      .sort({ date: 1 })
      .limit(4);

    const upcomingEvents = await Event.find({
      date: { $gte: new Date() },
    })
      .sort({ date: 1 })
      .limit(4);

    res.status(200).json({
      success: true,
      data: {
        role: req.user.roleId?.name || 'Admin',
        metrics: {
          totalEmployees,
          presentToday,
          absentToday,
          lateToday,
          halfDayToday,
          wfhToday,
          leaveToday,
          pendingLeaveRequests,
          pendingRegularizations,
        },
        weeklyTrend,
        departmentDistribution,
        recentLeaves,
        upcomingHolidays,
        upcomingEvents,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};
