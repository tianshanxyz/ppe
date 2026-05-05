const puppeteer = require('puppeteer');
(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-crashpad-for-testing'] });
  const p = await b.newPage();
  await p.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

  // Capture all downloads/navigation
  const urls = [];
  p.on('response', r => {
    const u = r.url();
    if (u.includes('UDID') || u.includes('.zip')) urls.push(u);
  });

  await p.goto('https://udi.nmpa.gov.cn/download.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 5000));

  // Log all download-related elements
  const links = await p.evaluate(() => {
    const results = [];
    document.querySelectorAll('a, button, [onclick]').forEach(el => {
      const href = el.getAttribute('href') || '';
      const onclick = el.getAttribute('onclick') || '';
      const text = (el.textContent || '').trim().substring(0, 100);
      if (href.includes('zip') || href.includes('UDID') || href.includes('download') || onclick.includes('download') || text.includes('.zip')) {
        results.push({ tag: el.tagName, href, onclick, text });
      }
    });
    return results;
  });

  console.log('下载链接:', JSON.stringify(links, null, 2));
  console.log('捕获的URLs:', urls);

  // Try clicking the monthly download
  const clicked = await p.evaluate(() => {
    const all = document.querySelectorAll('a, button, div[onclick], span[onclick]');
    for (const el of all) {
      const txt = (el.textContent || '').trim();
      if (txt.includes('月更新') || txt.includes('MONTH')) {
        el.click();
        return true;
      }
    }
    return false;
  });
  console.log('点击月更新:', clicked);

  await new Promise(r => setTimeout(r, 3000));
  console.log('点击后URLs:', urls);

  await b.close();
})();
