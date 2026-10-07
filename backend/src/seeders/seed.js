require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

// Models
const User = require('../models/User');
const Employee = require('../models/Employee');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const Department = require('../models/Department');
const Designation = require('../models/Designation');
const Team = require('../models/Team');
const Shift = require('../models/Shift');
const Attendance = require('../models/Attendance');
const AttendanceRegularization = require('../models/AttendanceRegularization');
const LeaveType = require('../models/LeaveType');
const LeaveAllocation = require('../models/LeaveAllocation');
const LeaveRequest = require('../models/LeaveRequest');
const Holiday = require('../models/Holiday');
const Event = require('../models/Event');
const Task = require('../models/Task');
const Policy = require('../models/Policy');
const Setting = require('../models/Setting');
const { ALL_PERMISSIONS, PERMISSIONS } = require('../constants/permissions');
const { ROLES, ROLE_CODES } = require('../constants/roles');
const { ATTENDANCE_STATUS, LEAVE_STATUS, REGULARIZATION_STATUS, TASK_STATUS, TASK_PRIORITY } = require('../constants/statuses');

async function seed() {
  try {
    console.log('🌱 Starting HRMS & Attendance Database Seeding...');
    await connectDB();

    console.log('🧹 Clearing existing collections in hrms_attendance...');
    await Promise.all([
      User.deleteMany({}),
      Employee.deleteMany({}),
      Role.deleteMany({}),
      Permission.deleteMany({}),
      Department.deleteMany({}),
      Designation.deleteMany({}),
      Team.deleteMany({}),
      Shift.deleteMany({}),
      Attendance.deleteMany({}),
      AttendanceRegularization.deleteMany({}),
      LeaveType.deleteMany({}),
      LeaveAllocation.deleteMany({}),
      LeaveRequest.deleteMany({}),
      Holiday.deleteMany({}),
      Event.deleteMany({}),
      Task.deleteMany({}),
      Policy.deleteMany({}),
      Setting.deleteMany({}),
    ]);

    // 1. Permissions
    console.log('➡️ Seeding Permissions...');
    const permissionDocs = ALL_PERMISSIONS.map((pCode) => {
      const [module, action] = pCode.split('.');
      return {
        name: `${action.toUpperCase()} ${module.toUpperCase()}`,
        code: pCode,
        module: module.charAt(0).toUpperCase() + module.slice(1),
        description: `Allows user to ${action} ${module}`,
      };
    });
    await Permission.insertMany(permissionDocs);

    // 2. Roles
    console.log('➡️ Seeding Roles...');
    const superAdminRole = await Role.create({
      name: ROLES.SUPER_ADMIN,
      code: ROLE_CODES.SUPER_ADMIN,
      description: 'Full unhindered system control and administrative powers.',
      permissions: ALL_PERMISSIONS,
      isSystemRole: true,
    });

    const hrAdminRole = await Role.create({
      name: ROLES.HR_ADMIN,
      code: ROLE_CODES.HR_ADMIN,
      description: 'Human Resources administration with full employee, leave, and attendance rights.',
      permissions: ALL_PERMISSIONS.filter(p => !['roles.manage'].includes(p)),
      isSystemRole: true,
    });

    const hrManagerRole = await Role.create({
      name: ROLES.HR_MANAGER,
      code: ROLE_CODES.HR_MANAGER,
      description: 'HR manager managing workforce operations and leave approvals.',
      permissions: [
        PERMISSIONS.EMPLOYEE_VIEW,
        PERMISSIONS.EMPLOYEE_CREATE,
        PERMISSIONS.EMPLOYEE_EDIT,
        PERMISSIONS.ATTENDANCE_VIEW,
        PERMISSIONS.ATTENDANCE_EDIT,
        PERMISSIONS.ATTENDANCE_APPROVE,
        PERMISSIONS.LEAVE_VIEW,
        PERMISSIONS.LEAVE_APPROVE,
        PERMISSIONS.LEAVE_REJECT,
        PERMISSIONS.LEAVE_ALLOCATE,
        PERMISSIONS.TASK_VIEW,
        PERMISSIONS.TASK_MANAGE,
        PERMISSIONS.POLICY_VIEW,
        PERMISSIONS.POLICY_MANAGE,
        PERMISSIONS.REPORTS_VIEW,
        PERMISSIONS.REPORTS_EXPORT,
      ],
      isSystemRole: true,
    });

    const deptManagerRole = await Role.create({
      name: ROLES.DEPT_MANAGER,
      code: ROLE_CODES.DEPT_MANAGER,
      description: 'Department head managing departmental hierarchy, teams, and approvals.',
      permissions: [
        PERMISSIONS.EMPLOYEE_VIEW,
        PERMISSIONS.ATTENDANCE_VIEW,
        PERMISSIONS.ATTENDANCE_APPROVE,
        PERMISSIONS.LEAVE_VIEW,
        PERMISSIONS.LEAVE_APPROVE,
        PERMISSIONS.LEAVE_REJECT,
        PERMISSIONS.TASK_VIEW,
        PERMISSIONS.TASK_MANAGE,
        PERMISSIONS.PERFORMANCE_VIEW,
        PERMISSIONS.PERFORMANCE_MANAGE,
        PERMISSIONS.POLICY_VIEW,
        PERMISSIONS.REPORTS_VIEW,
      ],
      isSystemRole: true,
    });

    const teamLeadRole = await Role.create({
      name: ROLES.TEAM_LEAD,
      code: ROLE_CODES.TEAM_LEAD,
      description: 'Team lead managing assigned team members and daily deliverables.',
      permissions: [
        PERMISSIONS.EMPLOYEE_VIEW,
        PERMISSIONS.ATTENDANCE_VIEW,
        PERMISSIONS.ATTENDANCE_APPROVE,
        PERMISSIONS.LEAVE_VIEW,
        PERMISSIONS.LEAVE_APPROVE,
        PERMISSIONS.LEAVE_REQUEST,
        PERMISSIONS.TASK_VIEW,
        PERMISSIONS.TASK_MANAGE,
        PERMISSIONS.POLICY_VIEW,
      ],
      isSystemRole: true,
    });

    const employeeRole = await Role.create({
      name: ROLES.EMPLOYEE,
      code: ROLE_CODES.EMPLOYEE,
      description: 'Regular company employee with self-service attendance and leave actions.',
      permissions: [
        PERMISSIONS.EMPLOYEE_VIEW,
        PERMISSIONS.ATTENDANCE_VIEW,
        PERMISSIONS.LEAVE_VIEW,
        PERMISSIONS.LEAVE_REQUEST,
        PERMISSIONS.TASK_VIEW,
        PERMISSIONS.POLICY_VIEW,
      ],
      isSystemRole: true,
    });

    // 3. Settings
    console.log('➡️ Seeding Settings...');
    await Setting.insertMany([
      {
        key: 'company_info',
        value: {
          companyName: 'Apex Innovations Technologies',
          companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
          email: 'contact@apexinnovations.com',
          phone: '+91 98765 43210',
          address: 'Block B, Sector 62, Electronic City, Bengaluru, Karnataka 560100',
          website: 'https://apexinnovations.com',
          timezone: 'Asia/Kolkata',
          currency: 'INR (₹)',
          dateFormat: 'DD/MM/YYYY',
          timeFormat: '12-Hour (AM/PM)',
        },
        category: 'company',
        description: 'General organization information',
      },
      {
        key: 'attendance_rules',
        value: {
          defaultOfficeStart: '09:30',
          defaultOfficeEnd: '18:30',
          graceMinutes: 15,
          fullDayMinutes: 480, // 8 hours
          halfDayMinutes: 240, // 4 hours
          breakMinutes: 60,
          latePenaltyRule: 'Count as Late after grace window',
        },
        category: 'attendance',
        description: 'Office timings, grace period, and duration thresholds',
      },
      {
        key: 'leave_rules',
        value: {
          excludeWeekends: true,
          excludeHolidays: true,
          allowHalfDay: true,
          leaveApprovalWorkflow: ['Team Lead', 'Department Manager', 'HR Admin'],
        },
        category: 'leave',
        description: 'Leave calculation rules and approval stages',
      },
      {
        key: 'employee_id_config',
        value: {
          prefix: 'EMP',
          startingNumber: 1,
          padding: 3,
        },
        category: 'employeeId',
        description: 'Automatic sequential Employee ID generator format',
      },
    ]);

    // 4. Shifts
    console.log('➡️ Seeding Shifts...');
    const generalShift = await Shift.create({
      name: 'General Shift',
      code: 'GEN-01',
      startTime: '09:30',
      endTime: '18:30',
      graceMinutes: 15,
      breakMinutes: 60,
      fullDayMinutes: 480,
      halfDayMinutes: 240,
      weeklyOffDays: [0, 6], // Saturday & Sunday
      status: 'Active',
    });

    const morningShift = await Shift.create({
      name: 'Early Morning Shift',
      code: 'MOR-01',
      startTime: '08:00',
      endTime: '17:00',
      graceMinutes: 15,
      breakMinutes: 60,
      fullDayMinutes: 480,
      halfDayMinutes: 240,
      weeklyOffDays: [0, 6],
      status: 'Active',
    });

    // 5. Departments
    console.log('➡️ Seeding Departments...');
    const deptEngineering = await Department.create({
      name: 'Engineering',
      code: 'ENG',
      description: 'Software Engineering, DevOps, Cloud Infrastructure, and QA.',
      status: 'Active',
    });

    const deptHR = await Department.create({
      name: 'Human Resources',
      code: 'HR',
      description: 'People Operations, Talent Acquisition, Culture & Payroll.',
      status: 'Active',
    });

    const deptProduct = await Department.create({
      name: 'Product & Design',
      code: 'PD',
      description: 'Product Strategy, UI/UX Design, and Customer Experience.',
      status: 'Active',
    });

    const deptSales = await Department.create({
      name: 'Sales & Marketing',
      code: 'SM',
      description: 'Enterprise Growth, Brand Strategy, and Customer Success.',
      status: 'Active',
    });

    // 6. Designations
    console.log('➡️ Seeding Designations...');
    const desigTechLead = await Designation.create({
      name: 'Technical Lead',
      code: 'TL-ENG',
      departmentId: deptEngineering._id,
    });
    const desigSrDev = await Designation.create({
      name: 'Senior Full Stack Developer',
      code: 'SR-DEV',
      departmentId: deptEngineering._id,
    });
    const desigDev = await Designation.create({
      name: 'Software Engineer',
      code: 'SWE',
      departmentId: deptEngineering._id,
    });
    const desigHRManager = await Designation.create({
      name: 'HR Operations Manager',
      code: 'HR-MGR',
      departmentId: deptHR._id,
    });
    const desigHRExecutive = await Designation.create({
      name: 'HR Executive',
      code: 'HR-EXEC',
      departmentId: deptHR._id,
    });
    const desigProductMgr = await Designation.create({
      name: 'Senior Product Manager',
      code: 'PM-SR',
      departmentId: deptProduct._id,
    });
    const desigUIDesigner = await Designation.create({
      name: 'UI/UX Designer',
      code: 'UIUX',
      departmentId: deptProduct._id,
    });

    // 7. Users & Employees
    console.log('➡️ Seeding Users & Employees...');

    // 1. Super Admin
    const userAdmin = await User.create({
      employeeId: 'EMP-001',
      email: 'admin@company.com',
      password: 'Admin@123',
      roleId: superAdminRole._id,
      status: 'Active',
    });
    const empAdmin = await Employee.create({
      userId: userAdmin._id,
      employeeCode: 'EMP-001',
      firstName: 'Rajesh',
      lastName: 'Sharma',
      email: 'admin@company.com',
      phone: '+91 98200 11223',
      dateOfBirth: new Date('1985-04-12'),
      gender: 'Male',
      joiningDate: new Date('2020-01-15'),
      departmentId: deptEngineering._id,
      designationId: desigTechLead._id,
      shiftId: generalShift._id,
      employmentType: 'Permanent',
      officeLocation: 'Headquarters - Bengaluru',
      status: 'Active',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    });

    // 2. HR Admin
    const userHR = await User.create({
      employeeId: 'EMP-002',
      email: 'hr@company.com',
      password: 'HR@123',
      roleId: hrAdminRole._id,
      status: 'Active',
    });
    const empHR = await Employee.create({
      userId: userHR._id,
      employeeCode: 'EMP-002',
      firstName: 'Priya',
      lastName: 'Verma',
      email: 'hr@company.com',
      phone: '+91 98300 22334',
      dateOfBirth: new Date('1990-07-22'),
      gender: 'Female',
      joiningDate: new Date('2021-03-01'),
      departmentId: deptHR._id,
      designationId: desigHRManager._id,
      shiftId: generalShift._id,
      employmentType: 'Permanent',
      officeLocation: 'Headquarters - Bengaluru',
      status: 'Active',
      profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    });

    // Update Department managers
    deptEngineering.managerId = empAdmin._id;
    await deptEngineering.save();
    deptHR.managerId = empHR._id;
    await deptHR.save();

    // 3. Department Manager / Engineering Lead
    const userManager = await User.create({
      employeeId: 'EMP-003',
      email: 'manager@company.com',
      password: 'Manager@123',
      roleId: deptManagerRole._id,
      status: 'Active',
    });
    const empManager = await Employee.create({
      userId: userManager._id,
      employeeCode: 'EMP-003',
      firstName: 'Amit',
      lastName: 'Patel',
      email: 'manager@company.com',
      phone: '+91 98400 33445',
      dateOfBirth: new Date('1988-10-18'),
      gender: 'Male',
      joiningDate: new Date('2021-06-15'),
      departmentId: deptEngineering._id,
      designationId: desigSrDev._id,
      reportingManagerId: empAdmin._id,
      shiftId: generalShift._id,
      employmentType: 'Permanent',
      status: 'Active',
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    });

    // 4. Team Lead
    const userTeamLead = await User.create({
      employeeId: 'EMP-004',
      email: 'rohit.lead@company.com',
      password: 'Password@123',
      roleId: teamLeadRole._id,
      status: 'Active',
    });
    const empTeamLead = await Employee.create({
      userId: userTeamLead._id,
      employeeCode: 'EMP-004',
      firstName: 'Rohit',
      lastName: 'Kumar',
      email: 'rohit.lead@company.com',
      phone: '+91 98500 44556',
      dateOfBirth: new Date('1992-12-05'),
      gender: 'Male',
      joiningDate: new Date('2022-01-10'),
      departmentId: deptEngineering._id,
      designationId: desigTechLead._id,
      reportingManagerId: empManager._id,
      shiftId: generalShift._id,
      employmentType: 'Permanent',
      status: 'Active',
      profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    });

    // 5. Employee (Demo Account)
    const userEmployee = await User.create({
      employeeId: 'EMP-005',
      email: 'employee@company.com',
      password: 'Employee@123',
      roleId: employeeRole._id,
      status: 'Active',
    });
    const empEmployee = await Employee.create({
      userId: userEmployee._id,
      employeeCode: 'EMP-005',
      firstName: 'Ananya',
      lastName: 'Singh',
      email: 'employee@company.com',
      phone: '+91 98600 55667',
      dateOfBirth: new Date('1995-03-14'),
      gender: 'Female',
      joiningDate: new Date('2023-04-01'),
      departmentId: deptEngineering._id,
      designationId: desigDev._id,
      reportingManagerId: empManager._id,
      teamLeadId: empTeamLead._id,
      shiftId: generalShift._id,
      employmentType: 'Permanent',
      status: 'Active',
      profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    });

    // 6. Additional Employees for realistic company feeling
    const empVikram = await Employee.create({
      employeeCode: 'EMP-006',
      firstName: 'Vikram',
      lastName: 'Malhotra',
      email: 'vikram@company.com',
      phone: '+91 98700 66778',
      dateOfBirth: new Date('1993-08-29'),
      gender: 'Male',
      joiningDate: new Date('2022-08-15'),
      departmentId: deptEngineering._id,
      designationId: desigDev._id,
      reportingManagerId: empManager._id,
      teamLeadId: empTeamLead._id,
      shiftId: generalShift._id,
      employmentType: 'Permanent',
      status: 'Active',
    });

    const empSneha = await Employee.create({
      employeeCode: 'EMP-007',
      firstName: 'Sneha',
      lastName: 'Gupta',
      email: 'sneha@company.com',
      phone: '+91 98800 77889',
      dateOfBirth: new Date('1996-01-20'),
      gender: 'Female',
      joiningDate: new Date('2023-10-01'),
      departmentId: deptProduct._id,
      designationId: desigUIDesigner._id,
      reportingManagerId: empAdmin._id,
      shiftId: generalShift._id,
      employmentType: 'Permanent',
      status: 'Active',
    });

    const allEmps = [empAdmin, empHR, empManager, empTeamLead, empEmployee, empVikram, empSneha];

    // 8. Teams
    console.log('➡️ Seeding Teams...');
    const frontendTeam = await Team.create({
      name: 'Frontend Core Team',
      departmentId: deptEngineering._id,
      teamLeadId: empTeamLead._id,
      memberIds: [empEmployee._id, empSneha._id],
      description: 'Web applications, Design system, and User Experiences.',
      status: 'Active',
    });

    const backendTeam = await Team.create({
      name: 'Backend & Services Team',
      departmentId: deptEngineering._id,
      teamLeadId: empManager._id,
      memberIds: [empVikram._id],
      description: 'REST APIs, Microservices, MongoDB Atlas, and System Architecture.',
      status: 'Active',
    });

    empEmployee.teamId = frontendTeam._id;
    await empEmployee.save();
    empTeamLead.teamId = frontendTeam._id;
    await empTeamLead.save();
    empVikram.teamId = backendTeam._id;
    await empVikram.save();

    // 9. Leave Types
    console.log('➡️ Seeding Leave Types...');
    const ltCL = await LeaveType.create({
      name: 'Casual Leave',
      code: 'CL',
      paid: true,
      annualLimit: 12,
      carryForwardAllowed: false,
      halfDayAllowed: true,
    });
    const ltSL = await LeaveType.create({
      name: 'Sick Leave',
      code: 'SL',
      paid: true,
      annualLimit: 10,
      carryForwardAllowed: true,
      maxCarryForward: 5,
      halfDayAllowed: true,
    });
    const ltEL = await LeaveType.create({
      name: 'Earned Leave',
      code: 'EL',
      paid: true,
      annualLimit: 15,
      carryForwardAllowed: true,
      maxCarryForward: 15,
      halfDayAllowed: false,
    });
    const ltWFH = await LeaveType.create({
      name: 'Work From Home',
      code: 'WFH',
      paid: true,
      annualLimit: 24,
      halfDayAllowed: true,
    });
    const ltLOP = await LeaveType.create({
      name: 'Loss of Pay (Unpaid)',
      code: 'LOP',
      paid: false,
      annualLimit: 30,
      halfDayAllowed: true,
    });

    // 10. Leave Allocations
    console.log('➡️ Seeding Leave Allocations...');
    const currentYear = new Date().getFullYear();
    for (const emp of allEmps) {
      await LeaveAllocation.create({
        employeeId: emp._id,
        leaveTypeId: ltCL._id,
        year: currentYear,
        allocatedDays: 12,
        usedDays: 2,
        pendingDays: 1,
      });
      await LeaveAllocation.create({
        employeeId: emp._id,
        leaveTypeId: ltSL._id,
        year: currentYear,
        allocatedDays: 10,
        usedDays: 1,
        pendingDays: 0,
      });
      await LeaveAllocation.create({
        employeeId: emp._id,
        leaveTypeId: ltEL._id,
        year: currentYear,
        allocatedDays: 15,
        usedDays: 3,
        pendingDays: 0,
      });
      await LeaveAllocation.create({
        employeeId: emp._id,
        leaveTypeId: ltWFH._id,
        year: currentYear,
        allocatedDays: 24,
        usedDays: 4,
        pendingDays: 0,
      });
    }

    // 11. Leave Requests
    console.log('➡️ Seeding Leave Requests...');
    await LeaveRequest.create({
      employeeId: empEmployee._id,
      leaveTypeId: ltCL._id,
      startDate: new Date('2026-10-15'),
      endDate: new Date('2026-10-16'),
      numberOfDays: 2,
      reason: 'Attending family wedding ceremony',
      emergencyContact: '+91 99988 77665',
      status: LEAVE_STATUS.PENDING,
    });
    await LeaveRequest.create({
      employeeId: empVikram._id,
      leaveTypeId: ltSL._id,
      startDate: new Date('2026-09-20'),
      endDate: new Date('2026-09-21'),
      numberOfDays: 2,
      reason: 'Viral fever and prescribed medical rest',
      status: LEAVE_STATUS.APPROVED,
    });

    // 12. Attendance Records (Realistic Past 14 Days)
    console.log('➡️ Seeding Attendance Records...');
    for (let i = 14; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      for (const emp of allEmps) {
        if (isWeekend) {
          await Attendance.create({
            employeeId: emp._id,
            date: dateStr,
            attendanceStatus: ATTENDANCE_STATUS.WEEK_OFF,
            source: 'System',
          });
        } else {
          // Normal weekday
          // Add some variety (Present, Late, Half Day)
          const isLate = Math.random() < 0.2; // 20% late
          const isHalfDay = Math.random() < 0.05; // 5% half day
          
          let inHour = isLate ? 10 : 9;
          let inMin = isLate ? 15 : Math.floor(Math.random() * 25) + 15; // 09:15 - 09:40
          let outHour = 18;
          let outMin = Math.floor(Math.random() * 30) + 30; // 18:30 - 19:00

          const checkIn = new Date(`${dateStr}T${String(inHour).padStart(2, '0')}:${String(inMin).padStart(2, '0')}:00.000Z`);
          const checkOut = new Date(`${dateStr}T${String(outHour).padStart(2, '0')}:${String(outMin).padStart(2, '0')}:00.000Z`);

          const workingMins = isHalfDay ? 240 : 495;
          const lateMins = isLate ? 45 : 0;
          let status = ATTENDANCE_STATUS.PRESENT;
          if (isHalfDay) status = ATTENDANCE_STATUS.HALF_DAY;
          else if (isLate) status = ATTENDANCE_STATUS.LATE;

          await Attendance.create({
            employeeId: emp._id,
            date: dateStr,
            checkIn,
            checkOut,
            totalWorkingMinutes: workingMins,
            breakMinutes: 60,
            lateMinutes: lateMins,
            overtimeMinutes: workingMins > 480 ? workingMins - 480 : 0,
            attendanceStatus: status,
            source: 'Web',
          });
        }
      }
    }

    // 13. Regularization Request
    console.log('➡️ Seeding Attendance Regularization...');
    await AttendanceRegularization.create({
      employeeId: empEmployee._id,
      attendanceDate: '2026-10-02',
      originalCheckIn: new Date('2026-10-02T10:15:00.000Z'),
      requestedCheckIn: new Date('2026-10-02T09:25:00.000Z'),
      originalCheckOut: new Date('2026-10-02T18:30:00.000Z'),
      requestedCheckOut: new Date('2026-10-02T18:30:00.000Z'),
      reason: 'Biometric Problem',
      employeeComment: 'Punch scanner reader was unresponsive at reception gate.',
      status: REGULARIZATION_STATUS.PENDING,
    });

    // 14. Holidays
    console.log('➡️ Seeding Holidays...');
    await Holiday.insertMany([
      { name: 'Republic Day', date: new Date('2026-01-26'), type: 'Public Holiday', description: 'National Republic Day Celebration' },
      { name: 'Holi Festival of Colours', date: new Date('2026-03-04'), type: 'Public Holiday', description: 'Spring festival holiday' },
      { name: 'Independence Day', date: new Date('2026-08-15'), type: 'Public Holiday', description: 'National Independence Day' },
      { name: 'Gandhi Jayanti', date: new Date('2026-10-02'), type: 'Public Holiday', description: 'Mahatma Gandhi Birthday' },
      { name: 'Diwali Festive Holiday', date: new Date('2026-11-08'), type: 'Public Holiday', description: 'Deepavali festival celebration' },
      { name: 'Christmas Day', date: new Date('2026-12-25'), type: 'Public Holiday', description: 'Christmas celebration' },
    ]);

    // 15. Events
    console.log('➡️ Seeding Events...');
    await Event.insertMany([
      {
        title: 'All-Hands Q4 Vision & Strategy Town Hall',
        date: new Date('2026-10-20'),
        startTime: '16:00',
        endTime: '17:30',
        location: 'Main Auditorium & Zoom Live',
        description: 'Quarterly review, company performance highlights, and employee recognition.',
        audience: 'Everyone',
      },
      {
        title: 'Full Stack Engineering Hackathon 2026',
        date: new Date('2026-10-28'),
        startTime: '10:00',
        endTime: '19:00',
        location: 'Tech Innovation Hub',
        description: 'Collaborative development marathon building agentic developer tools.',
        audience: 'Department',
        departmentId: deptEngineering._id,
      },
    ]);

    // 16. Tasks
    console.log('➡️ Seeding Tasks...');
    await Task.insertMany([
      {
        title: 'Refactor Attendance Real-Time Validation',
        description: 'Optimize MongoDB compound queries and implement grace threshold recalculations.',
        assignedTo: empEmployee._id,
        assignedBy: empTeamLead._id,
        departmentId: deptEngineering._id,
        priority: TASK_PRIORITY.HIGH,
        status: TASK_STATUS.IN_PROGRESS,
        dueDate: new Date('2026-10-18'),
      },
      {
        title: 'Finalize Monthly Payroll Ready Excel Export',
        description: 'Test Loss of Pay (LOP) formulas and verify overtime hours calculation in reports.',
        assignedTo: empEmployee._id,
        assignedBy: empManager._id,
        departmentId: deptEngineering._id,
        priority: TASK_PRIORITY.URGENT,
        status: TASK_STATUS.PENDING,
        dueDate: new Date('2026-10-12'),
      },
      {
        title: 'Publish Annual Leave Policy Updates',
        description: 'Upload latest HR leave rollover policies and notify all active employees.',
        assignedTo: empHR._id,
        assignedBy: empAdmin._id,
        departmentId: deptHR._id,
        priority: TASK_PRIORITY.MEDIUM,
        status: TASK_STATUS.COMPLETED,
        dueDate: new Date('2026-10-05'),
      },
    ]);

    // 17. Policies
    console.log('➡️ Seeding Policies...');
    await Policy.insertMany([
      {
        title: 'Attendance & Punctuality Policy 2026',
        category: 'Attendance Policy',
        description: 'Guidelines on office working hours (09:30 AM to 06:30 PM), grace limits (15 minutes), half-day thresholds (4 hours), and regularization procedures.',
        version: '2.1',
        publishedBy: userAdmin._id,
        status: 'Published',
      },
      {
        title: 'Hybrid & Remote Work (WFH) Guidelines',
        category: 'WFH Policy',
        description: 'Guidelines for eligible employees applying for Work From Home, mandatory check-in/check-out expectations, and secure VPN connections.',
        version: '1.4',
        publishedBy: userAdmin._id,
        status: 'Published',
      },
      {
        title: 'Annual Leave & Time Off Policy',
        category: 'Leave Policy',
        description: 'Details on Casual Leave (12), Sick Leave (10), Earned Leave (15), carry-forward rules, and multi-level approval hierarchies.',
        version: '3.0',
        publishedBy: userHR._id,
        status: 'Published',
      },
      {
        title: 'Employee Code of Conduct & Information Security',
        category: 'Code of Conduct',
        description: 'Professional workplace standards, data privacy, device security, and anti-harassment policies.',
        version: '1.0',
        publishedBy: userAdmin._id,
        status: 'Published',
      },
    ]);

    console.log('✅ Database seeded successfully with realistic HRMS data!');
    console.log('------------------------------------------------------------');
    console.log('🔑 Demo User Accounts:');
    console.log('  1. Super Admin: admin@company.com    | Password: Admin@123');
    console.log('  2. HR Admin:    hr@company.com       | Password: HR@123');
    console.log('  3. Manager:     manager@company.com  | Password: Manager@123');
    console.log('  4. Employee:    employee@company.com | Password: Employee@123');
    console.log('------------------------------------------------------------');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  }
}

seed();
