const Setting = require('../models/Setting');
const Holiday = require('../models/Holiday');
const LeaveRequest = require('../models/LeaveRequest');
const { ATTENDANCE_STATUS } = require('../constants/statuses');

class AttendanceCalculationService {
  /**
   * Helper to parse "HH:mm" time string into minutes from midnight
   */
  static timeStringToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  }

  /**
   * Get attendance settings (with robust fallbacks)
   */
  static async getAttendanceRules() {
    const settingDoc = await Setting.findOne({ key: 'attendance_rules' }).lean();
    return {
      defaultOfficeStart: settingDoc?.value?.defaultOfficeStart || '09:30',
      defaultOfficeEnd: settingDoc?.value?.defaultOfficeEnd || '18:30',
      graceMinutes: settingDoc?.value?.graceMinutes !== undefined ? Number(settingDoc.value.graceMinutes) : 15,
      fullDayMinutes: settingDoc?.value?.fullDayMinutes ? Number(settingDoc.value.fullDayMinutes) : 480, // 8 hours
      halfDayMinutes: settingDoc?.value?.halfDayMinutes ? Number(settingDoc.value.halfDayMinutes) : 240, // 4 hours
      breakMinutes: settingDoc?.value?.breakMinutes !== undefined ? Number(settingDoc.value.breakMinutes) : 60,
    };
  }

  /**
   * Calculate attendance record metrics given checkIn, checkOut, and shift details
   */
  static async calculateMetrics({ checkIn, checkOut, shift, dateStr, employeeId }) {
    const rules = await this.getAttendanceRules();

    const shiftStart = shift?.startTime || rules.defaultOfficeStart;
    const shiftEnd = shift?.endTime || rules.defaultOfficeEnd;
    const graceMinutes = shift?.graceMinutes !== undefined ? shift.graceMinutes : rules.graceMinutes;
    const breakMinutes = shift?.breakMinutes !== undefined ? shift.breakMinutes : rules.breakMinutes;
    const fullDayThreshold = shift?.fullDayMinutes || rules.fullDayMinutes;
    const halfDayThreshold = shift?.halfDayMinutes || rules.halfDayMinutes;

    let totalWorkingMinutes = 0;
    let lateMinutes = 0;
    let earlyExitMinutes = 0;
    let overtimeMinutes = 0;
    let status = ATTENDANCE_STATUS.PRESENT;

    // If both checkIn and checkOut are provided
    if (checkIn && checkOut) {
      const inDate = new Date(checkIn);
      const outDate = new Date(checkOut);

      // Duration in minutes
      const rawDurationMinutes = Math.max(0, Math.round((outDate - inDate) / (1000 * 60)));
      totalWorkingMinutes = Math.max(0, rawDurationMinutes - breakMinutes);

      // Shift start in minutes
      const shiftStartMins = this.timeStringToMinutes(shiftStart);
      const checkInMins = inDate.getHours() * 60 + inDate.getMinutes();
      const allowedLateThreshold = shiftStartMins + graceMinutes;

      if (checkInMins > allowedLateThreshold) {
        lateMinutes = checkInMins - shiftStartMins;
      }

      // Shift end in minutes
      const shiftEndMins = this.timeStringToMinutes(shiftEnd);
      const checkOutMins = outDate.getHours() * 60 + outDate.getMinutes();

      if (checkOutMins < shiftEndMins) {
        earlyExitMinutes = shiftEndMins - checkOutMins;
      }

      // Overtime
      if (totalWorkingMinutes > fullDayThreshold) {
        overtimeMinutes = totalWorkingMinutes - fullDayThreshold;
      }

      // Determine attendance status based on duration
      if (totalWorkingMinutes < halfDayThreshold) {
        status = ATTENDANCE_STATUS.ABSENT;
      } else if (totalWorkingMinutes < fullDayThreshold) {
        status = ATTENDANCE_STATUS.HALF_DAY;
      } else if (lateMinutes > 0) {
        status = ATTENDANCE_STATUS.LATE;
      } else {
        status = ATTENDANCE_STATUS.PRESENT;
      }
    } else if (checkIn && !checkOut) {
      // Checked in but not checked out yet
      const inDate = new Date(checkIn);
      const shiftStartMins = this.timeStringToMinutes(shiftStart);
      const checkInMins = inDate.getHours() * 60 + inDate.getMinutes();

      if (checkInMins > shiftStartMins + graceMinutes) {
        lateMinutes = checkInMins - shiftStartMins;
        status = ATTENDANCE_STATUS.LATE;
      } else {
        status = ATTENDANCE_STATUS.PRESENT;
      }
    } else if (!checkIn) {
      // Check if holiday, weekly off, or approved leave
      if (dateStr && employeeId) {
        const targetDate = new Date(dateStr);
        const dayOfWeek = targetDate.getDay(); // 0 is Sunday, 6 is Saturday
        const weeklyOffs = shift?.weeklyOffDays || [0, 6];

        // 1. Check Holiday
        const holiday = await Holiday.findOne({
          date: {
            $gte: new Date(`${dateStr}T00:00:00.000Z`),
            $lte: new Date(`${dateStr}T23:59:59.999Z`),
          },
          status: 'Active',
        });

        if (holiday) {
          status = ATTENDANCE_STATUS.HOLIDAY;
        } else if (weeklyOffs.includes(dayOfWeek)) {
          // 2. Check Weekly Off
          status = ATTENDANCE_STATUS.WEEK_OFF;
        } else {
          // 3. Check approved leave
          const leave = await LeaveRequest.findOne({
            employeeId,
            status: 'Approved',
            startDate: { $lte: new Date(`${dateStr}T23:59:59.999Z`) },
            endDate: { $gte: new Date(`${dateStr}T00:00:00.000Z`) },
          }).populate('leaveTypeId');

          if (leave) {
            status = leave.leaveTypeId?.paid ? ATTENDANCE_STATUS.PAID_LEAVE : ATTENDANCE_STATUS.UNPAID_LEAVE;
          } else {
            status = ATTENDANCE_STATUS.ABSENT;
          }
        }
      } else {
        status = ATTENDANCE_STATUS.ABSENT;
      }
    }

    return {
      totalWorkingMinutes,
      breakMinutes,
      lateMinutes,
      earlyExitMinutes,
      overtimeMinutes,
      attendanceStatus: status,
    };
  }
}

module.exports = AttendanceCalculationService;
