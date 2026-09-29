import { chromium } from 'playwright';

async function testCrash() {
  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: 'msedge' });
  } catch (e) {
    browser = await chromium.launch({ headless: true, channel: 'chrome' });
  }
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  const logs = [];

  page.on('pageerror', (err) => {
    console.error('💥 PAGEERROR:', err.message, '\nStack:', err.stack);
    errors.push({ type: 'pageerror', message: err.message, stack: err.stack });
  });

  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') {
      console.error('🚨 CONSOLE ERROR:', text);
      errors.push({ type: 'console.error', message: text });
    } else {
      logs.push({ type: msg.type(), text });
    }
  });

  console.log('Navigating to http://localhost:5173/#ide ...');
  await page.goto('http://localhost:5173/#ide', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="palette-gate-h"]', { timeout: 10000 });
  await page.waitForTimeout(1500);

  console.log('\n--- Step 1: Placing H gate on Qubit 0, Column 1 ---');
  await page.dragAndDrop('[data-testid="palette-gate-h"]', '[data-testid="slot-0-1"]');
  await page.waitForTimeout(800);

  console.log('\n--- Step 2: Placing X gate on Qubit 1, Column 1 ---');
  await page.dragAndDrop('[data-testid="palette-gate-x"]', '[data-testid="slot-1-1"]');
  await page.waitForTimeout(800);

  console.log('\n--- Step 3: Placing CX gate (controls q[0], targets q[1]) on Column 2 ---');
  await page.dragAndDrop('[data-testid="palette-gate-cx"]', '[data-testid="slot-0-2"]');
  await page.waitForTimeout(800);

  console.log('\n--- Step 4: Clicking "Set up and run" button ---');
  const runBtn = page.locator('button[title*="Set up and run"], button:has-text("Set up and run")').first();
  if (await runBtn.count() > 0) {
    await runBtn.click();
    console.log('Clicked "Set up and run" button');
    await page.waitForTimeout(2000);
  } else {
    console.warn('Could not find "Set up and run" button');
  }

  console.log('\n--- Step 5: Switching to "Circuit Analyzer" mode ---');
  const modeSelect = page.locator('[data-testid="statevector-mode-select"]');
  if (await modeSelect.count() > 0) {
    await modeSelect.selectOption('metrics');
    console.log('Selected Circuit Analyzer mode');
    await page.waitForTimeout(1500);
  }

  console.log('\n--- Step 6: Switching to "MathBridge" mode ---');
  if (await modeSelect.count() > 0) {
    await modeSelect.selectOption('math');
    console.log('Selected MathBridge mode');
    await page.waitForTimeout(1000);
  }

  console.log('\n--- Step 7: Switching back to "Statevector" mode ---');
  if (await modeSelect.count() > 0) {
    await modeSelect.selectOption('state');
    console.log('Selected Statevector mode');
    await page.waitForTimeout(1000);
  }

  // Check state of the page: is ErrorBoundary visible?
  const pageState = await page.evaluate(() => {
    const errorBoundary = document.querySelector('.error-boundary-container, [data-testid="error-boundary"]');
    const crashedElements = Array.from(document.querySelectorAll('.error-state, .crash, .component-error')).map(el => el.textContent);
    const placedGates = Array.from(document.querySelectorAll('[data-testid^="placed-gate-"]')).map(el => el.getAttribute('data-testid'));
    const simCards = Array.from(document.querySelectorAll('.ibm-sim-card')).map(el => ({
      className: el.className,
      textSnippet: el.textContent?.slice(0, 100)
    }));

    return {
      hasErrorBoundary: !!errorBoundary,
      errorBoundaryText: errorBoundary?.textContent?.slice(0, 300),
      crashedElements,
      placedGates,
      simCardCount: simCards.length,
      simCards
    };
  });

  console.log('\n=== PAGE STATE AFTER ADDING GATES ===');
  console.log(JSON.stringify(pageState, null, 2));

  console.log('\n=== TOTAL ERRORS CAPTURED ===');
  console.log('Count:', errors.length);
  errors.forEach((e, idx) => {
    console.log(`\n[Error ${idx + 1}]:`, e);
  });

  await browser.close();
}

testCrash().catch(err => {
  console.error('Fatal script error:', err);
  process.exit(1);
});
