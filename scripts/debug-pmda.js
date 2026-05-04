#!/usr/bin/env node
const puppeteer = require('puppeteer');

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setDefaultTimeout(60000);
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

    console.log('访问PMDA搜索页...');
    await page.goto('https://www.pmda.go.jp/PmdaSearch/kikiSearch/', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await sleep(5000);

    // Inspect the page structure
    const pageInfo = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input')).map(el => ({
        id: el.id,
        name: el.name,
        type: el.type,
        value: el.value?.substring(0, 50),
        className: el.className?.substring(0, 50),
        placeholder: el.placeholder,
      }));

      const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]')).map(el => ({
        tag: el.tagName,
        id: el.id,
        name: el.name,
        type: el.type,
        value: el.value?.substring(0, 50),
        text: el.textContent?.trim().substring(0, 50),
        className: el.className?.substring(0, 50),
        onclick: el.getAttribute('onclick')?.substring(0, 100),
      }));

      const selects = Array.from(document.querySelectorAll('select')).map(el => ({
        id: el.id,
        name: el.name,
        options: Array.from(el.options).map(o => o.value?.substring(0, 30)).slice(0, 10),
      }));

      const forms = Array.from(document.querySelectorAll('form')).map(el => ({
        id: el.id,
        action: el.action?.substring(0, 100),
        method: el.method,
      }));

      return { inputs, buttons, selects, forms };
    });

    console.log('\n=== Forms ===');
    console.log(JSON.stringify(pageInfo.forms, null, 2));

    console.log('\n=== Inputs ===');
    console.log(JSON.stringify(pageInfo.inputs, null, 2));

    console.log('\n=== Buttons ===');
    console.log(JSON.stringify(pageInfo.buttons, null, 2));

    console.log('\n=== Selects ===');
    console.log(JSON.stringify(pageInfo.selects, null, 2));

    // Check for iframes
    const frames = page.frames();
    console.log(`\n=== Frames: ${frames.length} ===`);
    for (const frame of frames) {
      console.log(`  Frame URL: ${frame.url()}`);
    }

    // Try to search with マスク
    console.log('\n=== 尝试搜索 マスク ===');

    // Find the search input
    const searchInputSelector = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="text"]');
      for (const input of inputs) {
        if (input.id) return '#' + input.id;
        if (input.name) return 'input[name="' + input.name + '"]';
      }
      return null;
    });

    console.log('Search input selector:', searchInputSelector);

    if (searchInputSelector) {
      await page.focus(searchInputSelector);
      await page.keyboard.type('マスク', { delay: 30 });
      await sleep(500);

      // Find and click the search button
      const searchButtonClicked = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button, input[type="submit"], input[type="button"]');
        for (const btn of buttons) {
          const text = btn.textContent?.trim() || btn.value?.trim() || '';
          if (text.includes('検索') || text.includes('search') || text.includes('Search')) {
            btn.click();
            return text;
          }
        }
        // Try image buttons
        const imgBtns = document.querySelectorAll('input[type="image"]');
        for (const btn of imgBtns) {
          btn.click();
          return 'image:' + (btn.alt || btn.name || '');
        }
        return null;
      });

      console.log('Clicked button:', searchButtonClicked);
      await sleep(15000);

      // Check results
      const resultInfo = await page.evaluate(() => {
        const tables = document.querySelectorAll('table');
        const tableInfo = [];
        tables.forEach((table, i) => {
          const rows = table.querySelectorAll('tr');
          tableInfo.push({
            index: i,
            rows: rows.length,
            firstRowCells: rows[0] ? rows[0].querySelectorAll('td, th').length : 0,
          });
        });

        const bodyText = document.body.innerText;
        const lines = bodyText.split('\n').filter(l => l.trim().length > 3);
        const maskLines = lines.filter(l => /マスク|mask/i.test(l)).slice(0, 10);

        return { tableInfo, maskLines, totalLines: lines.length };
      });

      console.log('\n=== Results ===');
      console.log('Tables:', JSON.stringify(resultInfo.tableInfo, null, 2));
      console.log('Mask-related lines:', resultInfo.maskLines);
      console.log('Total text lines:', resultInfo.totalLines);

      // Check URL after search
      console.log('Current URL:', page.url());
    }

    await page.close();
  } finally {
    await browser.close();
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

main().catch(console.error);
