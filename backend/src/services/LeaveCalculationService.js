const Holiday = require('../models/Holiday');
const Setting = require('../models/Setting');

class LeaveCalculationService {
  /**
   * Calculate leave days between startDate and endDate
   * Excludes weekends and company holidays if configured in Settings
   */
  static async calculateLeaveDays({ startDate, endDate, isHalfDay, shift }) {
    if (isHalfDay) {
      return {
        requestedDays: 0.5,
        workingDays: 0.5,
        weekendDays: 0,
        holidayDays: 0,
      };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get settings
    const leaveRuleDoc = await Setting.findOne({ key: 'leave_rules' }).lean();
    const excludeWeekends = leaveRuleDoc?.value?.excludeWeekends !== false; // default true
    const excludeHolidays = leaveRuleDoc?.value?.excludeHolidays !== false; // default true

    const weeklyOffDays = shift?.weeklyOffDays || [0, 6];

    // Fetch active holidays in date range
    let holidays = [];
    if (excludeHolidays) {
      holidays = await Holiday.find({
        date: {
          $gte: new Date(start.toISOString().split('T')[0] + 'T00:00:00.000Z'),
          $lte: new Date(end.toISOString().split('T')[0] + 'T23:59:59.999Z'),
        },
        status: 'Active',
      }).lean();
    }

    const holidayDateStrings = new Set(
      holidays.map((h) => new Date(h.date).toISOString().split('T')[0])
    );

    let currentDate = new Date(start);
    let requestedDays = 0;
    let workingDays = 0;
    let weekendDays = 0;
    let holidayDays = 0;

    while (currentDate <= end) {
      requestedDays++;
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();

      const isWeekend = weeklyOffDays.includes(dayOfWeek);
      const isHoliday = holidayDateStrings.has(dateStr);

      if (excludeWeekends && isWeekend) {
        weekendDays++;
      } else if (excludeHolidays && isHoliday) {
        holidayDays++;
      } else {
        workingDays++;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      requestedDays,
      workingDays: workingDays || 0,
      weekendDays,
      holidayDays,
    };
  }
}

module.exports = LeaveCalculationService;
