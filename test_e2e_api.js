const http = require('http');

async function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- 🧪 HRMS & Attendance System Full E2E Verification ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${detail}`);
      failed++;
    }
  }

  try {
    // 1. Admin Login
    const adminLoginRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { identifier: 'admin@company.com', password: 'Admin@123' }
    );
    assert(
      adminLoginRes.status === 200 && adminLoginRes.body.success,
      'Super Admin Login via Email',
      JSON.stringify(adminLoginRes.body)
    );

    const adminToken = adminLoginRes.body.data.accessToken;
    const refreshToken = adminLoginRes.body.data.refreshToken;
    const adminHeaders = {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    };

    // 2. Employee Login by Code (EMP-005)
    const empLoginRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { identifier: 'EMP-005', password: 'Employee@123' }
    );
    assert(
      empLoginRes.status === 200 && empLoginRes.body.success,
      'Employee Login via Employee Code (EMP-005)'
    );

    const empToken = empLoginRes.body.data?.accessToken;
    const empHeaders = {
      Authorization: `Bearer ${empToken}`,
      'Content-Type': 'application/json',
    };

    // 3. Refresh Token Validation
    const refreshRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/auth/refresh-token',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { refreshToken }
    );
    assert(
      refreshRes.status === 200 && refreshRes.body.data?.accessToken,
      'JWT Refresh Token Flow'
    );

    // 4. Auth Profile (/me)
    const meRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/me',
      method: 'GET',
      headers: adminHeaders,
    });
    assert(
      meRes.status === 200 && meRes.body.data?.user?.email === 'admin@company.com',
      'Authenticated User Profile (/me)'
    );

    // 5. Employees List (Pagination & Filters)
    const empListRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/employees?page=1&limit=10',
      method: 'GET',
      headers: adminHeaders,
    });
    assert(
      empListRes.status === 200 && empListRes.body.data?.length > 0,
      `Employee Directory List (Count: ${empListRes.body.data?.length})`
    );

    // 6. Organization Units (Departments, Designations, Teams, Shifts)
    const deptRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/departments',
      method: 'GET',
      headers: adminHeaders,
    });
    assert(deptRes.status === 200 && deptRes.body.data?.length > 0, 'Departments List API');

    const desigRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/designations',
      method: 'GET',
      headers: adminHeaders,
    });
    assert(desigRes.status === 200 && desigRes.body.data?.length > 0, 'Designations List API');

    const teamRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/teams',
      method: 'GET',
      headers: adminHeaders,
    });
    assert(teamRes.status === 200 && teamRes.body.data?.length > 0, 'Teams List API');

    const shiftRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/shifts',
      method: 'GET',
      headers: adminHeaders,
    });
    assert(shiftRes.status === 200 && shiftRes.body.data?.length > 0, 'Shifts List API');

    // 7. Daily Attendance
    const today = new Date().toISOString().split('T')[0];
    const dailyAttRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1/attendance/daily?date=${today}`,
      method: 'GET',
      headers: adminHeaders,
    });
    assert(dailyAttRes.status === 200 && dailyAttRes.body.success, 'Daily Attendance Log');

    // 8. Employee Punch Widget (Web Check-In)
    const punchCheckinRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/attendance/punch',
        method: 'POST',
        headers: empHeaders,
      },
      { type: 'check-in', location: 'Office Desk' }
    );
    assert(
      punchCheckinRes.status === 200 || punchCheckinRes.status === 400, // 400 if already punched today
      'Employee Attendance Punch Check-In'
    );

    // 9. Monthly Matrix
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    const matrixRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1/attendance/monthly-matrix?month=${month}&year=${year}`,
      method: 'GET',
      headers: adminHeaders,
    });
    assert(
      matrixRes.status === 200 && matrixRes.body.data?.matrix,
      'Monthly Attendance Matrix Grid'
    );

    // 10. Leave Types & Allocations
    const leaveTypesRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/leave-types',
      method: 'GET',
      headers: adminHeaders,
    });
    assert(leaveTypesRes.status === 200 && leaveTypesRes.body.data?.length > 0, 'Leave Types API');

    const leaveBalRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1/leaves/balances?year=${year}`,
      method: 'GET',
      headers: adminHeaders,
    });
    assert(leaveBalRes.status === 200 && leaveBalRes.body.success, 'Leave Balances Calculation API');

    // 11. Calendar Feed & Celebrations
    const calRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1/calendar/feed?year=${year}`,
      method: 'GET',
      headers: adminHeaders,
    });
    assert(
      calRes.status === 200 && Array.isArray(calRes.body.data),
      'HR Unified Calendar Feed'
    );

    const celebRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/calendar/celebrations',
      method: 'GET',
      headers: adminHeaders,
    });
    assert(
      celebRes.status === 200 && celebRes.body.data,
      'Birthdays & Work Anniversaries Celebrations API'
    );

    // 12. Office Tasks
    const tasksRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/tasks',
      method: 'GET',
      headers: adminHeaders,
    });
    assert(tasksRes.status === 200 && tasksRes.body.success, 'Office Tasks Management API');

    // 13. Performance Reviews
    const perfRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/performance',
      method: 'GET',
      headers: adminHeaders,
    });
    assert(perfRes.status === 200 && perfRes.body.success, 'Performance Reviews API');

    // 14. Company Policies
    const policiesRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/policies',
      method: 'GET',
      headers: adminHeaders,
    });
    assert(policiesRes.status === 200 && policiesRes.body.success, 'HR Company Policies API');

    // 15. Reports Payroll Summary (Payable Days & Loss of Pay Calculations)
    const reportRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1/reports/payroll-summary?month=${month}&year=${year}`,
      method: 'GET',
      headers: adminHeaders,
    });
    assert(
      reportRes.status === 200 && Array.isArray(reportRes.body.data?.summary),
      'Monthly Payroll & LOP Summary Calculation'
    );

    // 16. Roles & Granular Permissions
    const rolesRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/roles',
      method: 'GET',
      headers: adminHeaders,
    });
    assert(rolesRes.status === 200 && rolesRes.body.data?.length > 0, 'Roles Management API');

    const permsRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/permissions',
      method: 'GET',
      headers: adminHeaders,
    });
    assert(permsRes.status === 200 && permsRes.body.data?.length > 0, 'Granular Permissions API');

    // 17. Organization Settings
    const settingsRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/settings',
      method: 'GET',
      headers: adminHeaders,
    });
    assert(settingsRes.status === 200 && settingsRes.body.data, 'Organization Settings API');

    // 18. Security Audit Logs
    const auditRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/audit-logs',
      method: 'GET',
      headers: adminHeaders,
    });
    assert(auditRes.status === 200 && auditRes.body.data?.length > 0, 'Security Audit Logs Trail');

    // 19. Notifications System
    const notifRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/notifications',
      method: 'GET',
      headers: adminHeaders,
    });
    assert(notifRes.status === 200 && Array.isArray(notifRes.body.data), 'User Notifications API');

    // 20. Dashboard Analytics Aggregations
    const dashRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/dashboard/stats',
      method: 'GET',
      headers: adminHeaders,
    });
    assert(
      dashRes.status === 200 && dashRes.body.data?.metrics?.totalEmployees > 0,
      'Executive Dashboard Analytics Aggregations'
    );

    console.log(`\n========================================`);
    console.log(`TOTAL TESTS: ${passed + failed}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
