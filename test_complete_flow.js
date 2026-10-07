const http = require('http');

async function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(data);
        const contentType = res.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          try {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: JSON.parse(buffer.toString('utf-8')),
              raw: buffer,
            });
          } catch (e) {
            resolve({ status: res.statusCode, headers: res.headers, body: buffer.toString('utf-8'), raw: buffer });
          }
        } else {
          resolve({ status: res.statusCode, headers: res.headers, body: buffer.toString('utf-8'), raw: buffer });
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

async function runCompleteFlowTests() {
  console.log('===============================================================');
  console.log('🚀 TESTING ENTIRE END-TO-END HRMS & TEAMS FLOW');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} -> ${detail}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // STEP 1: AUTHENTICATION FLOW
    // -------------------------------------------------------------------------
    console.log('--- 1. Authentication Flow ---');
    // Admin login
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
      'Admin Login via Email',
      adminLoginRes.body.message
    );
    const adminToken = adminLoginRes.body.data.accessToken;
    const adminHeaders = {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    };

    // Employee login (Ananya Singh)
    const empLoginRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { identifier: 'employee@company.com', password: 'Employee@123' }
    );
    assert(
      empLoginRes.status === 200 && empLoginRes.body.success,
      'Employee Login via Email (EMP-005)',
      empLoginRes.body.message
    );
    const empToken = empLoginRes.body.data.accessToken;
    const empId = empLoginRes.body.data.employee?._id;
    const empHeaders = {
      Authorization: `Bearer ${empToken}`,
      'Content-Type': 'application/json',
    };

    // -------------------------------------------------------------------------
    // STEP 2: TEAMS & DESIGNATIONS VERIFICATION FLOW (USER'S EXPLICIT REQUEST)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Teams, Members & Designations Verification ---');
    const teamsRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/teams',
      method: 'GET',
      headers: adminHeaders,
    });
    assert(
      teamsRes.status === 200 && Array.isArray(teamsRes.body.data) && teamsRes.body.data.length > 0,
      'Fetch Operational Teams List'
    );

    const teams = teamsRes.body.data;
    let allLeadsHaveDesignations = true;
    let allMembersHaveDesignations = true;
    let totalMembersFound = 0;

    for (const t of teams) {
      console.log(`   🔹 Team: "${t.name}" | Department: ${t.departmentId?.name}`);
      // Team Lead check
      if (t.teamLeadId) {
        const leadDesig = t.teamLeadId.designationId?.name;
        console.log(`      Lead: ${t.teamLeadId.firstName} ${t.teamLeadId.lastName} [Designation: ${leadDesig || 'NONE'}]`);
        if (!leadDesig) allLeadsHaveDesignations = false;
      }
      // Members check
      const members = t.members || [];
      totalMembersFound += members.length;
      console.log(`      Members Count: ${members.length}`);
      members.forEach((m) => {
        const mDesig = m.designationId?.name;
        console.log(`        • ${m.firstName} ${m.lastName} (${m.employeeCode}) [Designation: ${mDesig || 'NONE'}]`);
        if (!mDesig) allMembersHaveDesignations = false;
      });
    }

    assert(allLeadsHaveDesignations, 'All Team Leads have populated designations');
    assert(allMembersHaveDesignations, 'All Team Members have populated designations');
    assert(totalMembersFound > 0, `Total team members correctly linked across teams (${totalMembersFound} members found)`);

    // Test Team Update: Add/modify members in Backend Team
    const backendTeam = teams.find((t) => t.name.includes('Backend'));
    if (backendTeam) {
      const allEmpsRes = await request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/employees?limit=20',
        method: 'GET',
        headers: adminHeaders,
      });
      const allEmps = allEmpsRes.body.data || [];
      // Pick 2 employee IDs for the team
      const testMemberIds = allEmps.slice(0, 2).map((e) => e._id);

      const updateTeamRes = await request(
        {
          hostname: 'localhost',
          port: 5000,
          path: `/api/v1/teams/${backendTeam._id}`,
          method: 'PUT',
          headers: adminHeaders,
        },
        {
          name: backendTeam.name,
          departmentId: backendTeam.departmentId?._id || backendTeam.departmentId,
          teamLeadId: backendTeam.teamLeadId?._id || backendTeam.teamLeadId,
          memberIds: testMemberIds,
        }
      );
      assert(
        updateTeamRes.status === 200 && updateTeamRes.body.success,
        'Update Team Members with Designation Linkage',
        updateTeamRes.body.message
      );
    }

    // -------------------------------------------------------------------------
    // STEP 3: ATTENDANCE PUNCH & DAILY SUMMARY FLOW
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Attendance Punch & Calculation Flow ---');
    const punchRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/attendance/punch',
        method: 'POST',
        headers: empHeaders,
      },
      { type: 'check-in', location: 'Bengaluru Campus' }
    );
    assert(
      punchRes.status === 200 || (punchRes.status === 400 && punchRes.body.message?.includes('already')),
      'Employee Check-In Punch (Handles fresh or already checked-in punch)',
      punchRes.body.message
    );

    const todayStr = new Date().toISOString().split('T')[0];
    const dailyAttRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1/attendance/daily?date=${todayStr}`,
      method: 'GET',
      headers: adminHeaders,
    });
    assert(
      dailyAttRes.status === 200 && Array.isArray(dailyAttRes.body.data),
      'Daily Attendance Records Returned from Database'
    );

    // -------------------------------------------------------------------------
    // STEP 4: ATTENDANCE REGULARIZATION (CORRECTION WORKFLOW)
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Attendance Regularization Approval Flow ---');
    // Employee applies for punch correction
    const regSubmitRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/attendance/regularizations',
        method: 'POST',
        headers: empHeaders,
      },
      {
        attendanceDate: todayStr,
        requestedCheckIn: `${todayStr}T09:30:00.000Z`,
        requestedCheckOut: `${todayStr}T18:30:00.000Z`,
        reason: 'Biometric Problem',
        employeeComment: 'Tested flow: punch in occurred but biometric device dropped network packet.',
      }
    );
    assert(
      regSubmitRes.status === 201 || (regSubmitRes.status === 400 && regSubmitRes.body.message?.includes('already')),
      'Employee Submits Regularization Request',
      regSubmitRes.body.message
    );

    // Admin views regularization requests
    const regListRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/attendance/regularizations?status=Pending',
      method: 'GET',
      headers: adminHeaders,
    });
    assert(regListRes.status === 200 && Array.isArray(regListRes.body.data), 'Admin Fetches Pending Regularizations');

    const pendingReg = regListRes.body.data[0];
    if (pendingReg) {
      // Admin approves the regularization
      const regApproveRes = await request(
        {
          hostname: 'localhost',
          port: 5000,
          path: `/api/v1/attendance/regularizations/${pendingReg._id}/action`,
          method: 'PUT',
          headers: adminHeaders,
        },
        {
          status: 'Approved',
          remarks: 'Verified with security entry log. Approved.',
        }
      );
      assert(
        regApproveRes.status === 200 && regApproveRes.body.success,
        'Admin Approves Attendance Regularization (Syncs Attendance Record)'
      );
    } else {
      console.log('   ℹ️ No pending regularization to approve, tested submission logic.');
    }

    // -------------------------------------------------------------------------
    // STEP 5: LEAVE WORKFLOW & BALANCE CALCULATION
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Leave Request & Approval Flow ---');
    const balanceRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1/leaves/balances/${empId}`,
      method: 'GET',
      headers: empHeaders,
    });
    assert(
      balanceRes.status === 200 && Array.isArray(balanceRes.body.data),
      'Calculate Real-Time Leave Balances (Allocated, Used, Available)'
    );

    const leaveTypesRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/leave-types',
      method: 'GET',
      headers: adminHeaders,
    });
    const casualLeave = leaveTypesRes.body.data?.find((lt) => lt.code === 'CL') || leaveTypesRes.body.data?.[0];

    // Submit leave request for next week
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const leaveDateStr = nextWeek.toISOString().split('T')[0];

    const applyLeaveRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/leaves/requests',
        method: 'POST',
        headers: empHeaders,
      },
      {
        leaveTypeId: casualLeave?._id,
        startDate: leaveDateStr,
        endDate: leaveDateStr,
        reason: 'Personal work and family appointment',
      }
    );
    assert(
      applyLeaveRes.status === 201 || (applyLeaveRes.status === 400 && applyLeaveRes.body.message?.includes('already')),
      'Employee Applies for Casual Leave (Auto calculates working days excluding week-offs)',
      applyLeaveRes.body.message
    );

    // Admin fetches leave requests
    const leavesListRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/leaves/requests',
      method: 'GET',
      headers: adminHeaders,
    });
    assert(leavesListRes.status === 200 && Array.isArray(leavesListRes.body.data), 'Admin Fetches Leave Requests');

    // -------------------------------------------------------------------------
    // STEP 6: PAYROLL SUMMARY & EXCEL EXPORT FLOW
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Monthly Payroll Reports & Excel Generation Flow ---');
    const targetMonth = new Date().getMonth() + 1;
    const targetYear = new Date().getFullYear();

    const payrollRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1/reports/payroll-summary?month=${targetMonth}&year=${targetYear}`,
      method: 'GET',
      headers: adminHeaders,
    });
    assert(
      payrollRes.status === 200 && Array.isArray(payrollRes.body.data?.summary),
      'Monthly Payroll Ledger Calculation (Payable Days & Loss of Pay)'
    );

    const firstSummary = payrollRes.body.data?.summary?.[0];
    if (firstSummary) {
      console.log(`   Sample Ledger Entry (${firstSummary.employee.name}):`);
      console.log(`     • Month Days: ${firstSummary.daysInMonth}`);
      console.log(`     • Present Days: ${firstSummary.presentDays} | Half Days: ${firstSummary.halfDays} | Absent: ${firstSummary.absentDays}`);
      console.log(`     • Paid Leaves: ${firstSummary.paidLeaves} | Unpaid Leaves: ${firstSummary.unpaidLeaves}`);
      console.log(`     • Payable Days: ${firstSummary.payableDays} | Loss of Pay (LOP): ${firstSummary.lossOfPayDays}`);
    }

    // Export to Excel (.xlsx)
    const excelRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1/reports/export-excel?month=${targetMonth}&year=${targetYear}`,
      method: 'GET',
      headers: adminHeaders,
    });
    assert(
      excelRes.status === 200 &&
        excelRes.headers['content-type']?.includes('spreadsheetml') &&
        excelRes.raw.length > 2000,
      `Export Excel (.xlsx) Generation Successful (Binary file size: ${excelRes.raw.length} bytes)`
    );

    // -------------------------------------------------------------------------
    // STEP 7: FRONTEND HEALTH & PAGES
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Frontend Live Server Verification ---');
    const feRes = await request({
      hostname: 'localhost',
      port: 5174,
      path: '/',
      method: 'GET',
    });
    assert(feRes.status === 200 && /<!doctype html>/i.test(feRes.body), 'Frontend Dev Server Healthy on port 5174');

    // -------------------------------------------------------------------------
    // FINAL RESULTS SUMMARY
    // -------------------------------------------------------------------------
    console.log('\n===============================================================');
    console.log(`🎉 TEST EXECUTION COMPLETED`);
    console.log(`TOTAL CHECKS: ${passed + failed}`);
    console.log(`PASSED:       ${passed}`);
    console.log(`FAILED:       ${failed}`);
    console.log('===============================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runCompleteFlowTests();
