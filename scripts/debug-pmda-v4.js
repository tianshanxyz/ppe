#!/usr/bin/env node
const puppeteer = require('puppeteer');
const fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const searchPage = await browser.newPage();
    await searchPage.setDefaultTimeout(60000);
    await searchPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

    await searchPage.goto('https://www.pmda.go.jp/PmdaSearch/kikiSearch/', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });
    await sleep(3000);

    await searchPage.evaluate(() => {
      const form = document.getElementById('kikiSearchForm');
      if (form) form.removeAttribute('onsubmit');
      form.target = '_blank';
    });

    await searchPage.focus('#txtName');
    await searchPage.keyboard.type('マスク', { delay: 30 });
    await sleep(300);

    await searchPage.evaluate(() => {
      const listRows = document.getElementById('ListRows');
      if (listRows) listRows.value = '100';
    });

    const newPagePromise = new Promise((resolve) => {
      browser.once('targetcreated', async (target) => {
        if (target.type() === 'page') {
          const newPage = await target.page();
          resolve(newPage);
        }
      });
    });

    await searchPage.evaluate(() => {
      const form = document.getElementById('kikiSearchForm');
      if (form) form.submit();
    });

    const resultPage = await Promise.race([
      newPagePromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 30000)),
    ]).catch(() => null);

    if (resultPage) {
      await resultPage.waitForSelector('body', { timeout: 30000 });
      await sleep(5000);

      console.log('Result page URL:', resultPage.url());

      const html = await resultPage.evaluate(() => document.documentElement.outerHTML);
      fs.writeFileSync('/tmp/pmda-result.html', html);
      console.log('HTML saved, length:', html.length);

      const bodyText = await resultPage.evaluate(() => document.body.innerText);
      console.log('\n=== Body text (first 5000 chars) ===');
      console.log(bodyText.substring(0, 5000));

      const tables = await resultPage.evaluate(() => {
        return Array.from(document.querySelectorAll('table')).map((t, i) => ({
          index: i,
          rows: t.querySelectorAll('tr').length,
          className: t.className,
          id: t.id,
          sampleRows: Array.from(t.querySelectorAll('tr')).slice(0, 5).map(row =>
            Array.from(row.querySelectorAll('td, th')).map(c => c.textContent.trim().substring(0, 100))
          ),
        }));
      });

      console.log('\n=== Tables ===');
      tables.forEach(t => {
        console.log(`Table ${t.index}: id=${t.id}, class=${t.className}, rows=${t.rows}`);
        t.sampleRows.forEach((row, i) => {
          console.log(`  Row ${i}: ${JSON.stringify(row)}`);
        });
      });

      await resultPage.close();
    } else {
      console.log('No new page detected');
    }

    await searchPage.close();
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
