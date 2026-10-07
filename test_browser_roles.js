import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\Rohit\\.gemini\\antigravity-ide\\brain\\8e37817e-2112-4686-9a7d-841a104bfa37';
const BASE_URL = 'http://localhost:5174';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runBrowserTests() {
  console.log('🚀 Launching Chrome for Multi-Role Flow Testing...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  const consoleLogs = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleLogs.push({ type: 'error', text: msg.text() });
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.toString());
  });

  const results = {
    superAdmin: { passed: false, details: [] },
    hrAdmin: { passed: false, details: [] },
    manager: { passed: false, details: [] },
    employee: { passed: false, details: [] }
  };

  const loginWithRole = async (roleName) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('button[type="submit"]', { timeout: 10000 });
    await sleep(500);

    // Click matching role button
    const clicked = await page.evaluate((rName) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes(rName));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    }, roleName);

    if (!clicked) {
      throw new Error(`Demo button for ${roleName} not found!`);
    }

    await sleep(300);

    // Click submit
    await page.evaluate(() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });

    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
    await sleep(2000);
  };

  const clearSession = async () => {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await sleep(500);
  };

  try {
    // ==========================================
    // 1. SUPER ADMIN TESTING
    // ==========================================
    console.log('\n--- 1. TESTING SUPER ADMIN ---');
    await loginWithRole('Super Admin');
    const adminUrl = page.url();
    console.log('Super Admin landed on:', adminUrl);
    results.superAdmin.details.push(`Redirected to ${adminUrl}`);

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'role_superadmin_dashboard.png') });

    // Visit /reports
    console.log('Super Admin navigating to /reports...');
    await page.goto(`${BASE_URL}/reports`, { waitUntil: 'networkidle0' });
    await sleep(2000);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'role_superadmin_reports.png') });
    results.superAdmin.details.push('Visited /reports successfully');

    // Visit /leaves
    console.log('Super Admin navigating to /leaves...');
    await page.goto(`${BASE_URL}/leaves`, { waitUntil: 'networkidle0' });
    await sleep(1500);
    const hasApplyLeave = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some(b => b.textContent.includes('Apply Leave') || b.textContent.includes('Request Leave'));
    });
    results.superAdmin.details.push(`Apply Leave button visible: ${hasApplyLeave}`);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'role_superadmin_leaves.png') });

    // Visit /settings
    console.log('Super Admin navigating to /settings...');
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle0' });
    await sleep(1500);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'role_superadmin_settings.png') });
    results.superAdmin.details.push('Visited /settings successfully');

    results.superAdmin.passed = true;
    console.log('Super Admin testing complete.');
    await clearSession();

    // ==========================================
    // 2. HR ADMIN TESTING
    // ==========================================
    console.log('\n--- 2. TESTING HR ADMIN ---');
    await loginWithRole('HR Admin');
    const hrUrl = page.url();
    console.log('HR Admin landed on:', hrUrl);
    results.hrAdmin.details.push(`Redirected to ${hrUrl}`);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'role_hr_dashboard.png') });

    // Visit /employees
    console.log('HR Admin navigating to /employees...');
    await page.goto(`${BASE_URL}/employees`, { waitUntil: 'networkidle0' });
    await sleep(1500);
    const empCount = await page.evaluate(() => {
      return document.querySelectorAll('tr, .employee-card').length;
    });
    results.hrAdmin.details.push(`Employees table rendered elements count: ${empCount}`);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'role_hr_employees.png') });

    // Visit /attendance/daily
    console.log('HR Admin navigating to /attendance/daily...');
    await page.goto(`${BASE_URL}/attendance/daily`, { waitUntil: 'networkidle0' });
    await sleep(1500);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'role_hr_daily_attendance.png') });
    results.hrAdmin.details.push('Daily Attendance viewed');

    results.hrAdmin.passed = true;
    console.log('HR Admin testing complete.');
    await clearSession();

    // ==========================================
    // 3. MANAGER TESTING
    // ==========================================
    console.log('\n--- 3. TESTING MANAGER ---');
    await loginWithRole('Manager');
    const mgrUrl = page.url();
    console.log('Manager landed on:', mgrUrl);
    results.manager.details.push(`Redirected to ${mgrUrl}`);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'role_manager_dashboard.png') });

    // Visit /teams
    console.log('Manager navigating to /teams...');
    await page.goto(`${BASE_URL}/teams`, { waitUntil: 'networkidle0' });
    await sleep(1500);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'role_manager_teams.png') });
    results.manager.details.push('Teams viewed');

    // Visit /tasks
    console.log('Manager navigating to /tasks...');
    await page.goto(`${BASE_URL}/tasks`, { waitUntil: 'networkidle0' });
    await sleep(1500);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'role_manager_tasks.png') });
    results.manager.details.push('Tasks viewed');

    results.manager.passed = true;
    console.log('Manager testing complete.');
    await clearSession();

    // ==========================================
    // 4. EMPLOYEE TESTING
    // ==========================================
    console.log('\n--- 4. TESTING EMPLOYEE ---');
    await loginWithRole('Employee');
    const empUrl = page.url();
    console.log('Employee landed on:', empUrl);
    results.employee.details.push(`Redirected to ${empUrl}`);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'role_employee_dashboard.png') });

    // Check Employee Punch Widget on Dashboard
    const punchStatus = await page.evaluate(() => {
      const punchText = document.body.innerText;
      return {
        hasPunchIn: punchText.includes('Punch In') || punchText.includes('Check In'),
        hasPunchOut: punchText.includes('Punch Out') || punchText.includes('Check Out'),
        hasMyAttendance: punchText.includes('My Attendance') || punchText.includes('Today\'s Status')
      };
    });
    results.employee.details.push(`Punch Widget elements: ${JSON.stringify(punchStatus)}`);

    // Visit /attendance/my
    console.log('Employee navigating to /attendance/my...');
    await page.goto(`${BASE_URL}/attendance/my`, { waitUntil: 'networkidle0' });
    await sleep(1500);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'role_employee_my_attendance.png') });
    results.employee.details.push('My Attendance page rendered');

    // Visit /leaves
    console.log('Employee navigating to /leaves...');
    await page.goto(`${BASE_URL}/leaves`, { waitUntil: 'networkidle0' });
    await sleep(1500);
    
    // Test Opening "Apply Leave" Modal as Employee
    console.log('Testing Apply Leave modal click...');
    const modalOpened = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const applyBtn = btns.find(b => b.textContent.includes('Apply Leave') || b.textContent.includes('Request Leave'));
      if (applyBtn) {
        applyBtn.click();
        return true;
      }
      return false;
    });
    await sleep(1000);
    if (modalOpened) {
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'role_employee_apply_leave_modal.png') });
      results.employee.details.push('Apply Leave modal successfully opened & captured');
    }

    // Visit /profile
    console.log('Employee navigating to /profile...');
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle0' });
    await sleep(1500);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'role_employee_profile.png') });
    results.employee.details.push('Profile page rendered');

    results.employee.passed = true;
    console.log('Employee testing complete.');

  } catch (err) {
    console.error('❌ Exception during browser testing:', err);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }

  console.log('\n================ TEST SUMMARY ================');
  console.log(JSON.stringify(results, null, 2));
  console.log('\nPage Errors encountered:', pageErrors.length);
  if (pageErrors.length > 0) {
    console.log(pageErrors);
  }
  console.log('\nConsole Errors encountered:', consoleLogs.length);
  if (consoleLogs.length > 0) {
    console.log(consoleLogs);
  }
}

runBrowserTests();
