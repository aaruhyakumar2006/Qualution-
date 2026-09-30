import { chromium } from 'playwright';

async function testLearnLaunch() {
  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: 'msedge' });
  } catch (e) {
    browser = await chromium.launch({ headless: true, channel: 'chrome' });
  }
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', (err) => {
    console.error('💥 PAGEERROR:', err.message, '\nStack:', err.stack);
    errors.push({ type: 'pageerror', message: err.message, stack: err.stack });
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error('🚨 CONSOLE ERROR:', msg.text());
      errors.push({ type: 'console.error', message: msg.text() });
    }
  });

  console.log('Navigating to http://localhost:5173/workspace#learn ...');
  await page.goto('http://localhost:5173/workspace#learn', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // Find and click "Apply on Workbench" or "Practice Lab" or "Start Guided Lesson"
  console.log('\n--- Clicking "Start Guided Lesson" ---');
  const guidedBtn = page.locator('button:has-text("Start Guided Lesson"), [data-testid="hud-launch-guided-lesson-btn"]').first();
  if (await guidedBtn.count() > 0) {
    await guidedBtn.click();
    console.log('Clicked "Start Guided Lesson"');
    await page.waitForTimeout(2000);
  }

  console.log('Current URL after click:', page.url());

  // Try placing a gate on qubit 0
  console.log('\n--- Placing H gate on q[0], col 1 ---');
  const hGate = page.locator('[data-testid="palette-gate-h"]');
  if (await hGate.count() > 0) {
    await page.dragAndDrop('[data-testid="palette-gate-h"]', '[data-testid="slot-0-1"]');
    await page.waitForTimeout(1000);
  }

  // Try placing a gate on qubit 1
  console.log('\n--- Placing X gate on q[1], col 1 ---');
  const xGate = page.locator('[data-testid="palette-gate-x"]');
  if (await xGate.count() > 0) {
    await page.dragAndDrop('[data-testid="palette-gate-x"]', '[data-testid="slot-1-1"]');
    await page.waitForTimeout(1000);
  }

  // Also try clicking "Apply on Workbench" or "Practice Lab"
  console.log('\n=== ERRORS AFTER GUIDED LESSON TEST ===');
  console.log('Count:', errors.length);
  errors.forEach((e, idx) => console.log(`[Error ${idx + 1}]:`, e));

  await browser.close();
}

testLearnLaunch().catch(err => {
  console.error('Fatal script error:', err);
  process.exit(1);
});
