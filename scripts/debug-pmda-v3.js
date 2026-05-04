#!/usr/bin/env node
const puppeteer = require('puppeteer');
const sleep = ms => new Promise(r => setTimeout(r, ms));

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
      waitUntil: 'networkidle2',
      timeout: 60000,
    });
    await sleep(5000);

    await page.focus('#txtName');
    await page.keyboard.type('マスク', { delay: 30 });
    await sleep(300);

    await page.evaluate(() => {
      const listRows = document.getElementById('ListRows');
      if (listRows) listRows.value = '100';
    });

    console.log('点击搜索按钮...');

    const btnA = await page.$('input[name="btnA"]');
    if (btnA) {
      console.log('找到btnA按钮，点击...');
      await btnA.click();
      await sleep(15000);
    } else {
      console.log('未找到btnA按钮');
    }

    console.log('当前URL:', page.url());

    const pageInfo = await page.evaluate(() => {
      const result = {};
      result.bodyText = document.body.innerText.substring(0, 5000);

      const tables = document.querySelectorAll('table');
      result.tableCount = tables.length;
      result.tableDetails = [];
      tables.forEach((table, i) => {
        const rows = table.querySelectorAll('tr');
        const detail = { index: i, rows: rows.length, sampleRows: [] };
        for (let r = 0; r < Math.min(rows.length, 10); r++) {
          const cells = Array.from(rows[r].querySelectorAll('td, th')).map(c => c.textContent.trim().substring(0, 100));
          detail.sampleRows.push(cells);
        }
        result.tableDetails.push(detail);
      });

      const links = Array.from(document.querySelectorAll('a')).slice(0, 30).map(l => ({
        text: l.textContent.trim().substring(0, 80),
        href: l.href?.substring(0, 120),
      }));

      result.links = links.filter(l => l.text.length > 2);

      return result;
    });

    console.log('\n=== Body Text (first 3000 chars) ===');
    console.log(pageInfo.bodyText.substring(0, 3000));

    console.log('\n=== Tables ===');
    console.log('Table count:', pageInfo.tableCount);
    pageInfo.tableDetails.forEach(t => {
      console.log(`\nTable ${t.index}: ${t.rows} rows`);
      t.sampleRows.forEach((row, i) => {
        console.log(`  Row ${i}: ${JSON.stringify(row)}`);
      });
    });

    console.log('\n=== Links ===');
    pageInfo.links.forEach(l => {
      console.log(`  ${l.text} -> ${l.href}`);
    });

    await page.close();
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
