const Holiday = require('../models/Holiday');
const Event = require('../models/Event');
const Employee = require('../models/Employee');
const LeaveRequest = require('../models/LeaveRequest');
const AuditService = require('../services/AuditService');

// --- HOLIDAYS ---
const getHolidays = async (req, res, next) => {
  try {
    const { year } = req.query;
    const currentYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const holidays = await Holiday.find({
      date: {
        $gte: new Date(`${currentYear}-01-01`),
        $lte: new Date(`${currentYear}-12-31`),
      },
    }).sort({ date: 1 });
    res.status(200).json({ success: true, data: holidays });
  } catch (error) {
    next(error);
  }
};

const createHoliday = async (req, res, next) => {
  try {
    const holiday = await Holiday.create(req.body);
    await AuditService.log({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'HOLIDAY_CREATED',
      module: 'Holiday',
      recordId: holiday._id,
      newData: holiday,
      req,
    });
    res.status(201).json({ success: true, message: 'Holiday created', data: holiday });
  } catch (error) {
    next(error);
  }
};

const updateHoliday = async (req, res, next) => {
  try {
    const updated = await Holiday.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.status(200).json({ success: true, message: 'Holiday updated', data: updated });
  } catch (error) {
    next(error);
  }
};

const deleteHoliday = async (req, res, next) => {
  try {
    await Holiday.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Holiday deleted' });
  } catch (error) {
    next(error);
  }
};

// --- EVENTS ---
const getEvents = async (req, res, next) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.status(200).json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
};

const createEvent = async (req, res, next) => {
  try {
    const event = await Event.create(req.body);
    res.status(201).json({ success: true, message: 'Event created', data: event });
  } catch (error) {
    next(error);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const updated = await Event.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.status(200).json({ success: true, message: 'Event updated', data: updated });
  } catch (error) {
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Event deleted' });
  } catch (error) {
    next(error);
  }
};

// --- CALENDAR FEED ---
// Aggregates Holidays, Events, Birthdays, Anniversaries, and Approved Leaves
const getCalendarFeed = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const targetMonth = month ? parseInt(month, 10) : new Date().getMonth() + 1;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    // 1. Holidays
    const holidays = await Holiday.find({
      date: { $gte: startDate, $lte: endDate },
      status: 'Active',
    }).lean();

    // 2. Events
    const events = await Event.find({
      date: { $gte: startDate, $lte: endDate },
    }).lean();

    // 3. Approved Leaves
    const leaves = await LeaveRequest.find({
      status: 'Approved',
      $or: [
        { startDate: { $gte: startDate, $lte: endDate } },
        { endDate: { $gte: startDate, $lte: endDate } },
      ],
    })
      .populate('employeeId', 'firstName lastName employeeCode')
      .populate('leaveTypeId', 'name')
      .lean();

    // 4. Employees for Birthdays & Anniversaries in this month
    const employees = await Employee.find({ status: 'Active' })
      .select('firstName lastName employeeCode dateOfBirth joiningDate departmentId')
      .populate('departmentId', 'name')
      .lean();

    const birthdays = [];
    const anniversaries = [];

    employees.forEach((emp) => {
      // Birthday check
      if (emp.dateOfBirth) {
        const dob = new Date(emp.dateOfBirth);
        if (dob.getMonth() + 1 === targetMonth) {
          const birthdayDate = new Date(targetYear, targetMonth - 1, dob.getDate());
          birthdays.push({
            id: `bday-${emp._id}-${dob.getDate()}`,
            title: `🎂 ${emp.firstName} ${emp.lastName}'s Birthday`,
            date: birthdayDate,
            type: 'Birthday',
            employee: emp,
          });
        }
      }

      // Work Anniversary check
      if (emp.joiningDate) {
        const jd = new Date(emp.joiningDate);
        if (jd.getMonth() + 1 === targetMonth && jd.getFullYear() < targetYear) {
          const anniversaryDate = new Date(targetYear, targetMonth - 1, jd.getDate());
          const years = targetYear - jd.getFullYear();
          anniversaries.push({
            id: `anni-${emp._id}-${jd.getDate()}`,
            title: `🎉 ${emp.firstName} ${emp.lastName} - ${years} Year${years > 1 ? 's' : ''} Anniversary`,
            date: anniversaryDate,
            type: 'Anniversary',
            years,
            employee: emp,
          });
        }
      }
    });

    const feed = [
      ...holidays.map((h) => ({ id: `hol-${h._id}`, title: `🏖️ ${h.name}`, date: h.date, type: 'Holiday', details: h })),
      ...events.map((e) => ({ id: `evt-${e._id}`, title: `📅 ${e.title}`, date: e.date, type: 'Event', details: e })),
      ...leaves.map((l) => ({
        id: `leave-${l._id}`,
        title: `🌴 ${l.employeeId?.firstName} ${l.employeeId?.lastName} on ${l.leaveTypeId?.name}`,
        date: l.startDate,
        endDate: l.endDate,
        type: 'Leave',
        details: l,
      })),
      ...birthdays,
      ...anniversaries,
    ];

    res.status(200).json({ success: true, data: feed });
  } catch (error) {
    next(error);
  }
};

// --- UPCOMING CELEBRATIONS ---
const getCelebrations = async (req, res, next) => {
  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    const employees = await Employee.find({ status: 'Active' })
      .select('firstName lastName employeeCode dateOfBirth joiningDate departmentId profileImage')
      .populate('departmentId', 'name')
      .lean();

    const todayBirthdays = [];
    const upcomingBirthdays = [];
    const todayAnniversaries = [];
    const upcomingAnniversaries = [];

    employees.forEach((emp) => {
      if (emp.dateOfBirth) {
        const dob = new Date(emp.dateOfBirth);
        const m = dob.getMonth() + 1;
        const d = dob.getDate();
        if (m === currentMonth && d === currentDay) {
          todayBirthdays.push(emp);
        } else if (
          (m === currentMonth && d > currentDay) ||
          (m === (currentMonth % 12) + 1 && d <= 15)
        ) {
          upcomingBirthdays.push({ ...emp, day: d, month: m });
        }
      }

      if (emp.joiningDate) {
        const jd = new Date(emp.joiningDate);
        const m = jd.getMonth() + 1;
        const d = jd.getDate();
        const years = today.getFullYear() - jd.getFullYear();
        if (years > 0) {
          if (m === currentMonth && d === currentDay) {
            todayAnniversaries.push({ ...emp, years });
          } else if (
            (m === currentMonth && d > currentDay) ||
            (m === (currentMonth % 12) + 1 && d <= 15)
          ) {
            upcomingAnniversaries.push({ ...emp, day: d, month: m, years });
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: {
        todayBirthdays,
        upcomingBirthdays,
        todayAnniversaries,
        upcomingAnniversaries,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getCalendarFeed,
  getCelebrations,
};
