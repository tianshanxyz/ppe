const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push('PageError: ' + error.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('ConsoleError: ' + msg.text());
  });
  try {
    await page.goto('http://localhost:3099/ppe/manufacturers', { waitUntil: 'networkidle', timeout: 30000 });
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('PAGE_TEXT_START');
    console.log(bodyText.substring(0, 1000));
    console.log('PAGE_TEXT_END');
    console.log('ERRORS_START');
    if (errors.length > 0) {
      errors.forEach(e => console.log(e));
    } else {
      console.log('NO_ERRORS');
    }
    console.log('ERRORS_END');
  } catch (e) {
    console.log('NAV_ERROR: ' + e.message);
  }
  await browser.close();
})();
