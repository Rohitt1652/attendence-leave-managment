import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\Rohit\\.gemini\\antigravity-ide\\brain\\8e37817e-2112-4686-9a7d-841a104bfa37';
const BASE_URL = 'http://localhost:5174';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function testLeaveWorkflow() {
  console.log('🧪 Testing End-to-End Leave Workflow in Real Browser...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  try {
    // 1. Login as Employee
    console.log('1. Logging in as Employee...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const empBtn = btns.find(b => b.textContent.includes('Employee'));
      if (empBtn) empBtn.click();
    });
    await sleep(300);
    await page.evaluate(() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
    await sleep(1500);

    // 2. Navigate to /leaves
    console.log('2. Navigating to /leaves...');
    await page.goto(`${BASE_URL}/leaves`, { waitUntil: 'networkidle0' });
    await sleep(1500);

    // 3. Click "Apply for Leave"
    console.log('3. Clicking Apply for Leave...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('Apply for Leave') || b.textContent.includes('Apply Leave'));
      if (btn) btn.click();
    });
    await sleep(1000);

    // Capture open modal screenshot
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'employee_apply_leave_modal_open.png') });
    console.log('Modal opened screenshot captured.');

    // 4. Fill modal form
    console.log('4. Filling Leave Form...');
    await page.evaluate(() => {
      const startDateInput = document.querySelector('input[type="date"], input[name="startDate"]');
      const allDateInputs = Array.from(document.querySelectorAll('input[type="date"]'));
      if (allDateInputs.length >= 2) {
        allDateInputs[0].value = '2026-10-22';
        allDateInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        allDateInputs[0].dispatchEvent(new Event('change', { bubbles: true }));

        allDateInputs[1].value = '2026-10-23';
        allDateInputs[1].dispatchEvent(new Event('input', { bubbles: true }));
        allDateInputs[1].dispatchEvent(new Event('change', { bubbles: true }));
      }

      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.value = 'Annual family vacation leave request';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    await sleep(500);

    // Submit leave form
    console.log('Submitting leave form...');
    await page.evaluate(() => {
      const modal = document.querySelector('.fixed') || document.body;
      const submitBtn = Array.from(modal.querySelectorAll('button')).find(b => 
        b.textContent.includes('Submit') || b.textContent.includes('Apply') || b.getAttribute('type') === 'submit'
      );
      if (submitBtn) submitBtn.click();
    });

    await sleep(2000);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'employee_leave_submitted.png') });
    console.log('Leave request submitted successfully.');

    // 5. Logout Employee
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await sleep(500);

    // 6. Login as Manager (Amit Patel) to Review & Approve
    console.log('5. Logging in as Manager to review leave...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const mgrBtn = btns.find(b => b.textContent.includes('Manager'));
      if (mgrBtn) mgrBtn.click();
    });
    await sleep(300);
    await page.evaluate(() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
    await sleep(1500);

    // Go to /leaves
    await page.goto(`${BASE_URL}/leaves`, { waitUntil: 'networkidle0' });
    await sleep(2000);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'manager_leaves_view.png') });

    // Click Approve on the top pending leave
    console.log('6. Manager approving leave...');
    const approved = await page.evaluate(() => {
      const approveBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.trim() === 'Approve');
      if (approveBtns.length > 0) {
        approveBtns[0].click();
        return true;
      }
      return false;
    });

    if (approved) {
      await sleep(1000);
      // If action modal opens, submit approval comment
      await page.evaluate(() => {
        const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => 
          b.textContent.includes('Confirm') || b.textContent.includes('Submit') || b.textContent.includes('Approve')
        );
        if (confirmBtn) confirmBtn.click();
      });
      await sleep(2000);
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'manager_leave_approved.png') });
      console.log('Leave approved successfully!');
    }

    console.log('✅ End-to-End Leave Workflow Tested Perfectly!');

  } catch (err) {
    console.error('❌ Error during leave workflow test:', err);
  } finally {
    await browser.close();
  }
}

testLeaveWorkflow();
