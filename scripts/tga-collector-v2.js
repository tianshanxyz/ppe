#!/usr/bin/env node
const puppeteer = require('puppeteer');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const sleep = ms => new Promise(r => setTimeout(r, ms));

function categorizePPE(name) {
  const n = (name || '').toLowerCase();
  if (/respirat|mask|n95|ffp|kn95|breathing|air.purif|scba|呼吸|防尘|防毒|口罩/i.test(n)) return '呼吸防护装备';
  if (/glove|nitrile|hand.*protect|手套/i.test(n)) return '手部防护装备';
  if (/goggle|eye.*protect|face.*shield|visor|护目镜|防护面罩|面屏/i.test(n)) return '眼面部防护装备';
  if (/helmet|hard.hat|head.*protect|安全帽|防护帽/i.test(n)) return '头部防护装备';
  if (/earplug|earmuff|hearing.*protect|耳塞|耳罩|防噪/i.test(n)) return '听觉防护装备';
  if (/boot|shoe|foot.*protect|安全鞋|防护鞋|足部/i.test(n)) return '足部防护装备';
  if (/vest|jacket|coat|apron|high.vis|反光/i.test(n)) return '躯干防护装备';
  if (/gown|coverall|suit|isolation|hazmat|防护服|隔离衣|手术衣|防护围裙/i.test(n)) return '身体防护装备';
  return '其他';
}

function determineRiskLevel(name) {
  const n = (name || '').toLowerCase();
  if (/respirat|scba|breathing|gas mask|chemical/i.test(n)) return 'high';
  if (/n95|kn95|ffp/i.test(n)) return 'high';
  if (/helmet|goggle|glasses|glove|boot|footwear/i.test(n)) return 'medium';
  return 'low';
}

async function fetchAll(table, columns, batchSize = 1000) {
  const all = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase.from(table).select(columns).range(page * batchSize, (page + 1) * batchSize - 1);
    if (error) break;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < batchSize) break;
    page++;
  }
  return all;
}

async function main() {
  console.log('========================================');
  console.log('TGA Australia ARTG PPE数据采集 v2');
  console.log('========================================');

  const existingProducts = await fetchAll('ppe_products', 'id,name,manufacturer_name,product_code');
  const existingKeys = new Set();
  existingProducts.forEach(p => {
    const key = `${(p.name || '').toLowerCase().trim()}|${(p.manufacturer_name || '').toLowerCase().trim()}|${(p.product_code || '').toLowerCase().trim()}`;
    existingKeys.add(key);
  });
  console.log(`现有产品: ${existingProducts.length}`);

  const existingMfrs = await fetchAll('ppe_manufacturers', 'id,name');
  const existingMfrNames = new Set(existingMfrs.map(m => (m.name || '').toLowerCase().trim()));

  let totalInserted = 0;
  let totalMfrInserted = 0;

  async function insertProduct(product) {
    const key = `${product.name.toLowerCase()}|${(product.manufacturer_name || '').toLowerCase()}|${(product.product_code || '').toLowerCase()}`;
    if (existingKeys.has(key)) return false;
    const { error } = await supabase.from('ppe_products').insert(product);
    if (!error) {
      existingKeys.add(key); totalInserted++;
      const mfrName = product.manufacturer_name;
      if (mfrName && mfrName !== 'Unknown' && !existingMfrNames.has(mfrName.toLowerCase().trim())) {
        const { error: mfrErr } = await supabase.from('ppe_manufacturers').insert({
          name: mfrName.substring(0, 500),
          country: product.country_of_origin || 'AU',
          data_source: product.data_source,
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: product.data_confidence_level || 'medium',
        });
        if (!mfrErr) { existingMfrNames.add(mfrName.toLowerCase().trim()); totalMfrInserted++; }
      }
      return true;
    }
    return false;
  }

  // ---- PART 1: Try TGA via axios first (if server-rendered) ----
  console.log('\n--- 检查TGA搜索是否返回静态HTML ---');
  await checkStaticRendering();

  async function checkStaticRendering() {
    try {
      const testResp = await axios.get('https://www.tga.gov.au/resources/australian-register-therapeutic-goods-artg?search_api_fulltext=mask', {
        timeout: 30000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
        maxRedirects: 5,
        validateStatus: () => true,
      });
      console.log(`  HTTP状态: ${testResp.status}`);
      const html = typeof testResp.data === 'string' ? testResp.data : JSON.stringify(testResp.data);

      // Check if search results are in the HTML
      const hasResults = /artg.*result|search.*result|views-row|field--name-title/gi.test(html);
      const hasRedirect = /<html.*redirect|meta.*refresh|window\.location/gi.test(html);
      console.log(`  含搜索结果: ${hasResults}`);
      console.log(`  含重定向: ${hasRedirect}`);
      console.log(`  HTML长度: ${html.length}`);

      // If there are results in static HTML, we can use axios efficiently
      if (hasResults && !hasRedirect) {
        console.log(`  >> 可静态采集！将同时使用axios批量获取`);
      } else {
        console.log(`  >> 需用Puppeteer处理动态内容`);
      }
    } catch (e) {
      console.log(`  axios测试失败: ${e.message?.substring(0, 80)}`);
    }
  }

  // ---- PART 2: TGA via Puppeteer ----
  console.log('\n========================================');
  console.log('TGA Puppeteer采集');
  console.log('========================================');

  const browser = await puppeteer.launch({
    headless: 'new',
    protocolTimeout: 300000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--disable-crashpad-for-testing', '--disable-breakpad'],
  });

  let tgaInserted = 0;
  const seenProducts = new Set();

  const ppeTerms = [
    'respirator', 'surgical mask', 'face mask medical', 'N95 mask', 'P2 mask',
    'face shield', 'safety glasses', 'eye protection', 'goggle',
    'protective glove', 'surgical glove', 'examination glove', 'nitrile glove',
    'protective gown', 'isolation gown', 'surgical gown', 'protective clothing',
    'coverall', 'protective suit', 'helmet', 'safety helmet', 'hard hat',
    'earmuff', 'earplug', 'hearing protection',
    'safety boot', 'safety footwear', 'protective footwear',
    'visor', 'shield', 'protective eyewear'
  ];

  try {
    const page = await browser.newPage();
    await page.setDefaultTimeout(60000);
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

    // TGA ARTG base URL (corrected)
    const tgaBase = 'https://www.tga.gov.au/resources/australian-register-therapeutic-goods-artg';

    for (let ti = 0; ti < ppeTerms.length; ti++) {
      const term = ppeTerms[ti];
      console.log(`\n  TGA搜索[${ti+1}/${ppeTerms.length}]: ${term}`);

      try {
        // Intercept XHR/fetch responses
        const apiResponses = [];
        const respHandler = async (res) => {
          try {
            const url = res.url();
            const ct = res.headers()['content-type'] || '';
            if (ct.includes('json') || url.includes('/views/ajax') || url.includes('/api/') || url.includes('_format=json')) {
              let body;
              try { body = await res.json(); } catch (e2) { body = null; }
              if (body) apiResponses.push({ url: url.substring(0, 200), data: body });
            }
          } catch (e) {}
        };
        page.on('response', respHandler);

        // Navigate with search param
        const searchUrl = `${tgaBase}?search_api_fulltext=${encodeURIComponent(term)}`;
        console.log(`    URL: ${searchUrl.substring(0, 120)}`);

        if (ti === 0) {
          await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        } else {
          await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        }
        await sleep(8000);

        // Extract results from rendered DOM
        const results = await page.evaluate(() => {
          const items = [];

          // Try Drupal views row selectors
          document.querySelectorAll('.views-row, .search-result, .artg-result, .views-view-responsive-grid__item, .node--view-mode-search-result').forEach(el => {
            const titleEl = el.querySelector('h2, h3, .field--name-title, .title, a[href*="artg"]');
            const title = titleEl?.textContent?.trim() || '';
            const link = titleEl?.href || el.querySelector('a[href*="artg"]')?.href || '';

            const sponsorEl = el.querySelector('.field--name-field-sponsor, .sponsor, [class*="sponsor"]');
            const sponsor = sponsorEl?.textContent?.trim() || '';

            const artgEl = el.querySelector('.field--name-field-artg-id, .artg-id, [class*="artg-id"]');
            const artgId = artgEl?.textContent?.trim() || '';

            if (title.length > 3 && /mask|glove|gown|respir|shield|goggle|visor|helmet|boot|earplug|earmuff|protective|safety|surgical|coverall|clothing|garment|protection/i.test(title)) {
              items.push({ title, sponsor, artgId });
            }
          });

          // Generic fallback: all links with artg in URL
          if (items.length === 0) {
            document.querySelectorAll('a[href*="artg"]').forEach(a => {
              const text = a.textContent?.trim() || '';
              const container = a.closest('article, .views-row, .search-result, tr, .item, .result');
              const containerText = container?.textContent?.trim() || '';
              if (text.length > 3 && /mask|glove|gown|respir|shield|goggle|visor|helmet|boot|earplug|earmuff|protective|safety|surgical|coverall/i.test(text + ' ' + containerText)) {
                items.push({ title: text, link: a.href });
              }
            });
          }

          return items.slice(0, 150);
        });

        // Process API responses
        for (const cap of apiResponses) {
          if (!cap.data) continue;
          // Drupal Views AJAX returns HTML/JSON commands
          const cmds = cap.data?.commands || cap.data;
          if (Array.isArray(cmds)) {
            cmds.forEach(cmd => {
              if (cmd.insert && typeof cmd.insert === 'object') {
                // Flatten insert objects
                const vals = Object.values(cmd.insert);
                vals.forEach(v => {
                  if (typeof v === 'string') {
                    // Extract text from HTML
                    const text = v.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                    if (text.length > 10) results.push({ title: text.substring(0, 500) });
                  }
                });
              }
            });
          }
        }

        // Full body text fallback
        if (results.length === 0) {
          const bodyText = await page.evaluate(() => document.body.innerText);
          const lines = bodyText.split('\n').filter(l => l.trim().length > 10);
          const ppeLines = lines.filter(l => /mask|glove|gown|respir|shield|goggle|visor|helmet|boot|earplug|earmuff|protective|safety|surgical/i.test(l));
          ppeLines.slice(0, 100).forEach(l => results.push({ title: l.trim().substring(0, 500) }));
        }

        console.log(`    结果: ${results.length}条 (API: ${apiResponses.length}个响应)`);

        let keywordInserted = 0;
        for (const item of results) {
          let name = (item.title || item.name || '').trim();
          let mfr = (item.sponsor || item.sponsorName || item.manufacturer || '').trim();
          let code = (item.artgId || item.artg_id || item.product_code || '').trim();

          if (!name || name.length < 3) continue;

          const category = categorizePPE(name);
          if (category === '其他') continue;

          // Prefer code if it looks like an ARTG ID (numeric)
          if (!code || code.length < 3) {
            const m = name.match(/\b(\d{4,7})\b/);
            if (m) code = m[1];
          }

          const dedupKey = `${name.toLowerCase()}|${mfr.toLowerCase()}`;
          if (seenProducts.has(dedupKey)) continue;
          seenProducts.add(dedupKey);

          const product = {
            name: name.substring(0, 500),
            category,
            manufacturer_name: (mfr || 'Unknown').substring(0, 500),
            product_code: code.substring(0, 50),
            country_of_origin: 'AU',
            risk_level: determineRiskLevel(name),
            data_source: 'TGA Australia ARTG',
            registration_authority: 'TGA',
            last_verified: new Date().toISOString().split('T')[0],
            data_confidence_level: 'high',
          };

          if (await insertProduct(product)) {
            keywordInserted++;
            tgaInserted++;
          }
        }

        console.log(`    ${term}: 新增${keywordInserted}条 (累计${tgaInserted})`);

        page.removeListener('response', respHandler);
        await sleep(3000);
      } catch (e) {
        console.log(`    ${term}: 错误 - ${e.message?.substring(0, 120)}`);
        page.removeAllListeners('response');
      }
    }

    console.log(`\n  TGA总计插入: ${tgaInserted}`);
    await page.close();
  } finally {
    await browser.close();
  }

  // ---- PART 3: TGA via axios static rendering (if available) ----
  // Use axios to fetch multiple pages in parallel if TGA provides static HTML
  console.log('\n========================================');
  console.log('TGA axios批量采集（静态HTML模式）');
  console.log('========================================');

  let axiosInserted = 0;

  const axiosTerms = [
    'respirator', 'surgical mask', 'N95 mask', 'face shield', 'protective glove',
    'surgical glove', 'protective gown', 'isolation gown', 'surgical gown',
    'coverall', 'safety helmet', 'earmuff', 'earplug', 'visor', 'goggle',
    'safety boot', 'safety glasses', 'protective eyewear'
  ];

  async function fetchTgaPage(searchTerm, pageNum = 0) {
    const params = new URLSearchParams({
      search_api_fulltext: searchTerm,
      page: String(pageNum),
    });
    const url = `https://www.tga.gov.au/resources/australian-register-therapeutic-goods-artg?${params.toString()}`;
    try {
      const resp = await axios.get(url, {
        timeout: 30000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
        validateStatus: () => true,
      });
      if (resp.status !== 200) return [];
      return extractFromHtml(resp.data);
    } catch (e) {
      return [];
    }
  }

  function extractFromHtml(html) {
    if (typeof html !== 'string') return [];
    const results = [];

    // Pattern 1: Look for title/heading followed by sponsor info
    // Common Drupal view markup patterns
    const titleRegex = /<h[23][^>]*>(.*?)<\/h[23]>/gi;
    let m;
    while ((m = titleRegex.exec(html)) !== null) {
      const title = m[1].replace(/<[^>]+>/g, '').trim();
      if (title.length > 5 && /mask|glove|gown|respir|shield|goggle|visor|helmet|boot|earplug|earmuff|protective|safety|surgical/i.test(title)) {
        results.push({ title, source: 'title-tag' });
      }
    }

    // Pattern 2: Look for <a> tags with artg in href and PPE-relevant text
    const linkRegex = /<a\s[^>]*href="([^"]*artg[^"]*)"[^>]*>(.*?)<\/a>/gi;
    while ((m = linkRegex.exec(html)) !== null) {
      const text = m[2].replace(/<[^>]+>/g, '').trim();
      if (text.length > 5 && /mask|glove|gown|respir|shield|goggle|visor|helmet|boot|earplug|earmuff|protective|safety|surgical/i.test(text)) {
        results.push({ title: text, link: m[1], source: 'artg-link' });
      }
    }

    // Pattern 3: Look for ARTG ID pattern (5-7 digit numbers near PPE terms)
    const artgIdRegex = /(\d{5,7})\s*[-–]\s*([A-Za-z][^<]{3,200}?(?:mask|glove|gown|respir|shield|goggle|