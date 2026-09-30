import { chromium } from 'playwright';

async function inspectLearn() {
  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: 'msedge' });
  } catch (e) {
    browser = await chromium.launch({ headless: true, channel: 'chrome' });
  }
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('pageerror', (err) => {
    console.error('💥 PAGEERROR:', err.message, '\nStack:', err.stack);
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error('🚨 CONSOLE ERROR:', msg.text());
    } else {
      console.log(`[CONSOLE ${msg.type()}]:`, msg.text());
    }
  });

  console.log('Navigating to http://localhost:5173/workspace#learn ...');
  await page.goto('http://localhost:5173/workspace#learn', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const viewData = await page.evaluate(() => {
    return {
      url: window.location.href,
      title: document.title,
      buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(Boolean).slice(0, 30),
      cards: Array.from(document.querySelectorAll('.lesson-card, .curriculum-card, .module-card, [data-testid]')).map(el => ({
        testId: el.getAttribute('data-testid'),
        className: el.className,
        text: el.textContent?.slice(0, 80)
      })).slice(0, 20)
    };
  });

  console.log('View Data:', JSON.stringify(viewData, null, 2));

  await browser.close();
}

inspectLearn().catch(err => {
  console.error('Fatal inspect error:', err);
  process.exit(1);
});
