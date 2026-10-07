const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const LeaveAllocation = require('../models/LeaveAllocation');
const LeaveRequest = require('../models/LeaveRequest');
const Holiday = require('../models/Holiday');
const ExcelJS = require('exceljs');
const { ATTENDANCE_STATUS } = require('../constants/statuses');

// @route   GET /api/v1/reports/monthly-payroll-summary
// @desc    Payroll-Ready summary of attendance metrics for a selected month
const getMonthlyPayrollSummary = async (req, res, next) => {
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
      .populate('departmentId', 'name')
      .populate('designationId', 'name')
      .populate('shiftId')
      .sort({ firstName: 1 })
      .lean();

    const empIds = employees.map((e) => e._id);
    const attendances = await Attendance.find({
      employeeId: { $in: empIds },
      date: dateRegex,
    }).lean();

    const summary = employees.map((emp) => {
      const records = attendances.filter((a) => String(a.employeeId) === String(emp._id));

      let presentDays = 0;
      let lateDays = 0;
      let halfDays = 0;
      let absentDays = 0;
      let paidLeaves = 0;
      let unpaidLeaves = 0;
      let weekOffDays = 0;
      let holidayDays = 0;
      let missingPunches = 0;
      let totalOvertimeMinutes = 0;
      let totalWorkingMinutes = 0;

      records.forEach((r) => {
        totalWorkingMinutes += r.totalWorkingMinutes || 0;
        totalOvertimeMinutes += r.overtimeMinutes || 0;

        switch (r.attendanceStatus) {
          case ATTENDANCE_STATUS.PRESENT:
            presentDays++;
            break;
          case ATTENDANCE_STATUS.LATE:
            presentDays++;
            lateDays++;
            break;
          case ATTENDANCE_STATUS.HALF_DAY:
            halfDays++;
            break;
          case ATTENDANCE_STATUS.PAID_LEAVE:
            paidLeaves++;
            break;
          case ATTENDANCE_STATUS.UNPAID_LEAVE:
            unpaidLeaves++;
            break;
          case ATTENDANCE_STATUS.WEEK_OFF:
            weekOffDays++;
            break;
          case ATTENDANCE_STATUS.HOLIDAY:
            holidayDays++;
            break;
          case ATTENDANCE_STATUS.MISSING_PUNCH:
            missingPunches++;
            break;
          case ATTENDANCE_STATUS.ABSENT:
          default:
            absentDays++;
            break;
        }
      });

      // Calculate missing unpunched days in the month as absent or weekoffs
      const recordedDays = records.length;
      const unrecordedDays = Math.max(0, daysInMonth - recordedDays);
      absentDays += unrecordedDays;

      // Payroll calculation:
      // Payable Days = Present + (Half Days * 0.5) + Paid Leaves + Holidays + Week Offs
      const payableDays =
        presentDays +
        halfDays * 0.5 +
        paidLeaves +
        holidayDays +
        weekOffDays;

      // Loss of Pay (LOP) Days = Absent Days + (Half Days * 0.5) + Unpaid Leaves
      const lossOfPayDays = absentDays + halfDays * 0.5 + unpaidLeaves;

      return {
        employee: {
          _id: emp._id,
          employeeCode: emp.employeeCode,
          name: `${emp.firstName} ${emp.lastName}`,
          department: emp.departmentId?.name || '-',
          designation: emp.designationId?.name || '-',
        },
        daysInMonth,
        presentDays,
        lateDays,
        halfDays,
        absentDays,
        paidLeaves,
        unpaidLeaves,
        weekOffDays,
        holidayDays,
        missingPunches,
        overtimeHours: (totalOvertimeMinutes / 60).toFixed(1),
        workingHours: (totalWorkingMinutes / 60).toFixed(1),
        payableDays: parseFloat(payableDays.toFixed(1)),
        lossOfPayDays: parseFloat(lossOfPayDays.toFixed(1)),
      };
    });

    res.status(200).json({
      success: true,
      data: {
        year: targetYear,
        month: targetMonth,
        daysInMonth,
        summary,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/v1/reports/export-excel
// @desc    Export attendance / payroll report to Excel
const exportPayrollExcel = async (req, res, next) => {
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
      .populate('departmentId', 'name')
      .populate('designationId', 'name')
      .sort({ firstName: 1 })
      .lean();

    const empIds = employees.map((e) => e._id);
    const attendances = await Attendance.find({
      employeeId: { $in: empIds },
      date: dateRegex,
    }).lean();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'HRMS Portal';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(`Attendance_${targetMonth}_${targetYear}`);

    // Headers
    worksheet.columns = [
      { header: 'Emp Code', key: 'code', width: 14 },
      { header: 'Name', key: 'name', width: 22 },
      { header: 'Department', key: 'dept', width: 18 },
      { header: 'Designation', key: 'desig', width: 20 },
      { header: 'Total Days', key: 'totalDays', width: 12 },
      { header: 'Present', key: 'present', width: 10 },
      { header: 'Late', key: 'late', width: 10 },
      { header: 'Half Day', key: 'half', width: 10 },
      { header: 'Paid Leave', key: 'paidLeave', width: 12 },
      { header: 'Unpaid Leave', key: 'unpaidLeave', width: 14 },
      { header: 'Absent', key: 'absent', width: 10 },
      { header: 'Weekly Off', key: 'weekOff', width: 12 },
      { header: 'Holiday', key: 'holiday', width: 10 },
      { header: 'OT Hours', key: 'ot', width: 12 },
      { header: 'Work Hours', key: 'workHours', width: 14 },
      { header: 'Payable Days', key: 'payableDays', width: 14 },
      { header: 'LOP Days', key: 'lop', width: 12 },
    ];

    // Styling header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' }, // indigo
    };

    employees.forEach((emp) => {
      const records = attendances.filter((a) => String(a.employeeId) === String(emp._id));

      let presentDays = 0;
      let lateDays = 0;
      let halfDays = 0;
      let absentDays = 0;
      let paidLeaves = 0;
      let unpaidLeaves = 0;
      let weekOffDays = 0;
      let holidayDays = 0;
      let totalOvertimeMinutes = 0;
      let totalWorkingMinutes = 0;

      records.forEach((r) => {
        totalWorkingMinutes += r.totalWorkingMinutes || 0;
        totalOvertimeMinutes += r.overtimeMinutes || 0;
        if (r.attendanceStatus === ATTENDANCE_STATUS.PRESENT) presentDays++;
        else if (r.attendanceStatus === ATTENDANCE_STATUS.LATE) { presentDays++; lateDays++; }
        else if (r.attendanceStatus === ATTENDANCE_STATUS.HALF_DAY) halfDays++;
        else if (r.attendanceStatus === ATTENDANCE_STATUS.PAID_LEAVE) paidLeaves++;
        else if (r.attendanceStatus === ATTENDANCE_STATUS.UNPAID_LEAVE) unpaidLeaves++;
        else if (r.attendanceStatus === ATTENDANCE_STATUS.WEEK_OFF) weekOffDays++;
        else if (r.attendanceStatus === ATTENDANCE_STATUS.HOLIDAY) holidayDays++;
        else absentDays++;
      });

      const unrecordedDays = Math.max(0, daysInMonth - records.length);
      absentDays += unrecordedDays;

      const payableDays = presentDays + halfDays * 0.5 + paidLeaves + holidayDays + weekOffDays;
      const lop = absentDays + halfDays * 0.5 + unpaidLeaves;

      worksheet.addRow({
        code: emp.employeeCode,
        name: `${emp.firstName} ${emp.lastName}`,
        dept: emp.departmentId?.name || '-',
        desig: emp.designationId?.name || '-',
        totalDays: daysInMonth,
        present: presentDays,
        late: lateDays,
        half: halfDays,
        paidLeave: paidLeaves,
        unpaidLeave: unpaidLeaves,
        absent: absentDays,
        weekOff: weekOffDays,
        holiday: holidayDays,
        ot: (totalOvertimeMinutes / 60).toFixed(1),
        workHours: (totalWorkingMinutes / 60).toFixed(1),
        payableDays: parseFloat(payableDays.toFixed(1)),
        lop: parseFloat(lop.toFixed(1)),
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Attendance_Summary_${targetMonth}_${targetYear}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMonthlyPayrollSummary,
  exportPayrollExcel,
};
