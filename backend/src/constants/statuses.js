const ATTENDANCE_STATUS = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  LATE: 'Late',
  HALF_DAY: 'Half Day',
  PAID_LEAVE: 'Paid Leave',
  UNPAID_LEAVE: 'Unpaid Leave',
  WORK_FROM_HOME: 'Work From Home',
  HOLIDAY: 'Holiday',
  WEEK_OFF: 'Week Off',
  ON_DUTY: 'On Duty',
  MISSING_PUNCH: 'Missing Punch',
};

const EMPLOYEE_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  RESIGNED: 'Resigned',
  TERMINATED: 'Terminated',
};

const EMPLOYMENT_TYPE = {
  PERMANENT: 'Permanent',
  CONTRACT: 'Contract',
  INTERN: 'Intern',
  PART_TIME: 'Part Time',
  TEMPORARY: 'Temporary',
};

const LEAVE_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

const REGULARIZATION_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

const TASK_STATUS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  ON_HOLD: 'On Hold',
  CANCELLED: 'Cancelled',
};

const TASK_PRIORITY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

const HOLIDAY_TYPE = {
  PUBLIC: 'Public Holiday',
  OPTIONAL: 'Optional Holiday',
  RESTRICTED: 'Restricted Holiday',
  COMPANY: 'Company Holiday',
};

module.exports = {
  ATTENDANCE_STATUS,
  EMPLOYEE_STATUS,
  EMPLOYMENT_TYPE,
  LEAVE_STATUS,
  REGULARIZATION_STATUS,
  TASK_STATUS,
  TASK_PRIORITY,
  HOLIDAY_TYPE,
};
