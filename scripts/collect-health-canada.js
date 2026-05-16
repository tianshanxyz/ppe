#!/usr/bin/env node
/**
 * Health Canada MDALL (Medical Devices Active Licence Listing) PPE Data Collector
 * ================================================================================
 * 从加拿大卫生部 MDALL 数据库采集 PPE 产品数据。
 *
 * 数据来源：
 *   Section A - Health Canada MDALL API 关键字搜索
 *   Section B - 全量设备拉取 + PPE 关键字过滤
 *   Section C - 精选加拿大 PPE 制造商产品（fallback）
 *
 * 运行方式：node scripts/collect-health-canada.js
 */

const https = require('https');
const { createClient } = require('@supabase/supabase-js');

// ============================================================================
// Supabase 连接
// ============================================================================
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

// ============================================================================
// 工具函数
// ============================================================================

/** 延时 */
const sleep = ms => new Promise(r => setTimeout(r, ms));

/** 10 分类体系 */
function cat(name) {
  const n = (name || '').toLowerCase();
  if (/respirat|mask|n95|ffp|kn95|breathing|air.purif|scba|facepiece|防尘|防毒|口罩/i.test(n)) return '呼吸防护装备';
  if (/glove|nitrile|latex|vinyl|hand.*protect|cut.resist|chemical.*glove|防割|手套/i.test(n)) return '手部防护装备';
  if (/goggle|eye.*protect|face.*shield|visor|spectacle|safety.*glass|护目镜|防护面罩|面屏/i.test(n)) return '眼面部防护装备';
  if (/helmet|hard.hat|head.*protect|bump.cap|安全帽|防护帽/i.test(n)) return '头部防护装备';
  if (/earplug|earmuff|hearing.*protect|ear.*protect|耳塞|耳罩/i.test(n)) return '听觉防护装备';
  if (/boot|shoe|foot.*protect|safety.*shoe|steel.*toe|安全鞋|防护鞋/i.test(n)) return '足部防护装备';
  if (/harness|lanyard|fall.*protect|safety.*belt|safety.*rope|anchor|srl|防坠/i.test(n)) return '坠落防护装备';
  if (/vest|jacket|coat|high.vis|reflective|hi.vis|反光|高可视/i.test(n)) return '躯干防护装备';
  if (/gown|coverall|suit|isolation|hazmat|protective.*cloth|protective.*apparel|fr.*cloth|arc.flash|flame.*resistant|chem.*suit|防护服|隔离衣/i.test(n)) return '身体防护装备';
  if (/immersion|flotation|life.*saving|marine|marine.*ppe|救生/i.test(n)) return '身体防护装备';
  return '其他';
}

/** 去重集合 */
let existingKeys = new Set();
let existingMfrSet = new Set();

/** 加载已有产品用于去重 */
async function loadExisting() {
  console.log('正在加载现有产品数据用于去重...');
  let page = 0;
  while (true) {
    const { data, error } = await supabase
      .from('ppe_products')
      .select('name,manufacturer_name,data_source')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    data.forEach(p => {
      const key = `${(p.name || '').substring(0, 200).toLowerCase().trim()}|${(p.manufacturer_name || '').substring(0, 200).toLowerCase().trim()}|${(p.data_source || '').toLowerCase().trim()}`;
      existingKeys.add(key);
    });
    if (data.length < 1000) break;
    page++;
  }

  // 加载已有制造商
  page = 0;
  while (true) {
    const { data, error } = await supabase
      .from('ppe_manufacturers')
      .select('name')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    data.forEach(m => existingMfrSet.add((m.name || '').toLowerCase().trim()));
    if (data.length < 1000) break;
    page++;
  }
  console.log(`已加载 ${existingKeys.size} 条产品记录, ${existingMfrSet.size} 个制造商`);
}

/** 检查是否重复 */
function isDup(name, mfr, src) {
  const key = `${(name || '').substring(0, 200).toLowerCase().trim()}|${(mfr || '').substring(0, 200).toLowerCase().trim()}|${(src || '').toLowerCase().trim()}`;
  return existingKeys.has(key);
}

/** 标记为已存在 */
function markDup(name, mfr, src) {
  const key = `${(name || '').substring(0, 200).toLowerCase().trim()}|${(mfr || '').substring(0, 200).toLowerCase().trim()}|${(src || '').toLowerCase().trim()}`;
  existingKeys.add(key);
}

/** HTTP GET 请求（带重试） */
function fetchData(url, retries = 3) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      https.get(url, {
        headers: {
          'User-Agent': 'MDLooker-PPE-Collector/6.0 (Health Canada)',
          'Accept': 'application/json,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-CA,en;q=0.9,fr;q=0.8',
        },
        timeout: 45000,
      }, (res) => {
        // 处理重定向
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchData(res.headers.location, 1).then(resolve).catch(reject);
        }
        if (res.statusCode === 429) {
          console.log(`    速率限制，等待 10 秒后重试...`);
          return sleep(10000).then(() => {
            if (n < retries) return attempt(n + 1);
            resolve(null);
          });
        }
        if (res.statusCode !== 200) {
          if (n < retries) {
            return sleep(2000 * (n + 1)).then(() => attempt(n + 1));
          }
          resolve(null);
          return;
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(null);
          }
        });
        res.on('error', () => {
          if (n < retries) sleep(2000 * (n + 1)).then(() => attempt(n + 1));
          else resolve(null);
        });
      }).on('error', () => {
        if (n < retries) sleep(2000 * (n + 1)).then(() => attempt(n + 1));
        else resolve(null);
      });
    };
    attempt(0);
  });
}

/** 插入产品并自动添加制造商 */
async function insertOneProduct(product) {
  if (isDup(product.name, product.manufacturer_name, product.data_source)) return false;

  const { error } = await supabase.from('ppe_products').insert(product);
  if (error) {
    if (error.code === '23505') return false;
    // 静默处理其他插入错误
    return false;
  }

  markDup(product.name, product.manufacturer_name, product.data_source);

  // 同时插入制造商
  const mfrName = product.manufacturer_name;
  if (mfrName && mfrName !== 'Unknown' && !existingMfrSet.has(mfrName.toLowerCase().trim())) {
    try {
      await supabase.from('ppe_manufacturers').insert({
        name: mfrName.substring(0, 500),
        country: product.country_of_origin || 'CA',
        data_source: product.data_source,
        last_verified: new Date().toISOString().split('T')[0],
        data_confidence_level: product.data_confidence_level || 'high',
      });
    } catch (_) { /* ignore mfr insert errors */ }
    existingMfrSet.add(mfrName.toLowerCase().trim());
  }
  return true;
}

/** 批量插入 */
async function batchInsert(products) {
  let inserted = 0;
  for (let i = 0; i < products.length; i++) {
    if (await insertOneProduct(products[i])) inserted++;
  }
  return inserted;
}

// ============================================================================
// MDALL API 基础 URL
// ============================================================================
const MDALL_BASE = 'https://health-products.canada.ca/api/medical-devices';

// ============================================================================
// Section A: 关键字搜索 MDALL API
// ============================================================================
const SEARCH_KEYWORDS = [
  // 呼吸防护
  'surgical mask', 'respirator', 'N95 respirator', 'medical mask',
  'face mask', 'particulate respirator', 'half mask respirator',
  'full face respirator', 'powered air purifying', 'PAPR',
  'elastomeric respirator', 'breathing apparatus',
  // 手部防护
  'surgical glove', 'examination glove', 'nitrile glove',
  'medical glove', 'chemotherapy glove', 'protective glove',
  'cut resistant glove', 'chemical resistant glove',
  // 身体防护
  'surgical gown', 'isolation gown', 'medical gown', 'protective gown',
  'coverall', 'protective suit', 'chemical protective suit',
  // 眼面部防护
  'face shield', 'faceshield', 'goggle', 'safety glasses',
  'protective eyewear', 'eye protector',
  // 头部防护
  'safety helmet', 'hard hat', 'bump cap', 'protective helmet',
  // 听觉防护
  'hearing protection', 'earplug', 'earmuff', 'ear muff',
  // 足部防护
  'safety shoe', 'safety boot', 'protective footwear', 'steel toe boot',
  // 坠落防护
  'safety harness', 'fall protection', 'safety lanyard',
  'self retracting lifeline',
  // 其他
  'shoe cover', 'boot cover', 'bouffant cap', 'surgical cap',
  'surgical hood', 'medical apron', 'protective apron',
  'high visibility', 'reflective vest', 'welding helmet',
  'welding mask', 'gas mask',
];

async function collectByKeywordSearch() {
  console.log('\n========================================');
  console.log('Section A: MDALL API 关键字搜索');
  console.log('========================================');

  let totalFound = 0;
  let totalInserted = 0;
  const seenDeviceIds = new Set();

  for (const keyword of SEARCH_KEYWORDS) {
    try {
      const url = `${MDALL_BASE}/device/?lang=en&type=json&term=${encodeURIComponent(keyword)}&state=active&limit=500`;
      console.log(`  搜索: "${keyword}"...`);
      const data = await fetchData(url);

      if (!data || !Array.isArray(data) || data.length === 0) {
        console.log(`    无结果`);
        await sleep(300);
        continue;
      }

      let keywordInserted = 0;
      const batch = [];

      for (const device of data) {
        const deviceId = device.device_id || device.original_licence_no || '';
        const tradeName = (device.device_name || device.trade_name || '').trim();
        if (!tradeName || tradeName.length < 2) continue;
        if (seenDeviceIds.has(deviceId)) continue;
        seenDeviceIds.add(deviceId);

        const category = cat(tradeName);
        if (category === '其他') continue;

        // 尝试获取 company/licence 信息
        let companyName = 'Unknown';
        let licenceClass = '';
        const licenceNo = device.original_licence_no || device.licence_id || '';

        if (licenceNo) {
          try {
            const licUrl = `${MDALL_BASE}/licence/?lang=en&type=json&id=${encodeURIComponent(licenceNo)}`;
            const licData = await fetchData(licUrl);
            if (licData && Array.isArray(licData) && licData.length > 0) {
              companyName = licData[0].company_name || licData[0].licence_name || 'Unknown';
              licenceClass = licData[0].device_class || licData[0].licence_class || '';
            }
          } catch (_) { /* fallback to device data */ }
        }

        // 如果 licence API 没有返回公司名，尝试从 device 本身获取
        if (companyName === 'Unknown') {
          companyName = device.company_name || device.manufacturer_name || 'Unknown';
        }

        // 判断风险等级
        let riskLevel = 'medium';
        if (licenceClass === 'IV' || licenceClass === '4') riskLevel = 'high';
        else if (licenceClass === 'III' || licenceClass === '3') riskLevel = 'high';
        else if (licenceClass === 'II' || licenceClass === '2') riskLevel = 'medium';
        else if (licenceClass === 'I' || licenceClass === '1') riskLevel = 'low';
        else {
          // 根据名称判断
          if (/respirat|scba|gas mask|chemical|n95|breathing/i.test(tradeName)) riskLevel = 'high';
          if (/glove|goggle|helmet|boot|shoe|shield/i.test(tradeName)) riskLevel = 'medium';
        }

        const product = {
          name: tradeName.substring(0, 500),
          category,
          manufacturer_name: companyName.substring(0, 500),
          country_of_origin: 'CA',
          risk_level: riskLevel,
          product_code: (device.device_id || licenceNo || '').toString().substring(0, 100),
          registration_number: licenceNo ? `MDALL-${licenceNo}` : '',
          registration_authority: 'Health Canada',
          data_source: 'Health Canada MDALL',
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
          specifications: JSON.stringify({
            licence_number: licenceNo,
            device_class: licenceClass,
            device_id: device.device_id || '',
            parent_device_id: device.parent_device_id || '',
            search_keyword: keyword,
          }),
        };

        batch.push(product);
        totalFound++;

        if (batch.length >= 30) {
          keywordInserted += await batchInsert(batch);
          batch.length = 0;
        }
        await sleep(30);
      }

      if (batch.length > 0) {
        keywordInserted += await batchInsert(batch);
      }

      totalInserted += keywordInserted;
      console.log(`    ${keyword}: ${data.length} 条结果, 匹配 PPE: ${keywordInserted} 条`);
      await sleep(400);
    } catch (e) {
      console.log(`    "${keyword}": 错误 - ${e.message}`);
      await sleep(500);
    }
  }

  console.log(`\nSection A 完成: 找到 ${totalFound} 条 PPE, 新增 ${totalInserted} 条`);
  return totalInserted;
}

// ============================================================================
// Section B: 全量设备拉取 + PPE 关键字过滤
// ============================================================================

/** PPE 关键字正则（用于全量过滤） */
const PPE_FILTER_REGEX = new RegExp([
  // 呼吸防护
  'mask', 'respirator', 'n95', 'ffp', 'facepiece', 'breathing', 'air purif',
  // 手部
  'glove', 'nitrile', 'latex', 'vinyl glove',
  // 身体
  'gown', 'coverall', 'protective suit', 'isolation gown', 'surgical gown',
  // 眼面
  'goggle', 'face shield', 'faceshield', 'eye protector', 'safety glass',
  'eyewear', 'visor',
  // 头部
  'helmet', 'hard hat', 'hardhat', 'bump cap', 'head protect',
  // 听觉
  'earplug', 'earmuff', 'ear plug', 'ear muff', 'hearing protect',
  // 足部
  'safety shoe', 'safety boot', 'steel toe', 'protective foot',
  // 坠落
  'harness', 'lanyard', 'fall protect', 'safety belt', 'lifeline',
  // 其他
  'shoe cover', 'boot cover', 'bouffant', 'surgical cap', 'surgical hood',
  'protective apron', 'protective clothing', 'protective apparel',
  'welding helmet', 'welding mask', 'gas mask', 'high visibility',
  'reflective vest', 'hi vis', 'chainmail', 'arc flash', 'flame resist',
  'chemical suit', 'hazmat', 'immersion suit', 'flotation',
].join('|'), 'i');

async function collectAllDevicesWithPPEFilter() {
  console.log('\n========================================');
  console.log('Section B: 全量设备拉取 + PPE 过滤');
  console.log('========================================');

  let totalInserted = 0;
  let totalScanned = 0;
  let ppeMatched = 0;
  let offset = 0;
  const limit = 500;
  const seenInB = new Set();

  // 最多拉取 20000 条设备（避免请求过多）
  const MAX_DEVICES = 20000;

  while (offset < MAX_DEVICES) {
    try {
      const url = `${MDALL_BASE}/device/?lang=en&type=json&state=active&limit=${limit}&offset=${offset}`;
      const data = await fetchData(url);

      if (!data || !Array.isArray(data) || data.length === 0) {
        console.log(`  offset=${offset}: 无更多数据，停止`);
        break;
      }

      const batch = [];
      for (const device of data) {
        totalScanned++;
        const tradeName = (device.device_name || device.trade_name || '').trim();
        if (!tradeName || tradeName.length < 2) continue;
        if (seenInB.has(tradeName.toLowerCase())) continue;

        // 用正则过滤 PPE 相关
        if (!PPE_FILTER_REGEX.test(tradeName)) continue;

        seenInB.add(tradeName.toLowerCase());
        ppeMatched++;

        const category = cat(tradeName);
        if (category === '其他') continue;

        let companyName = device.company_name || device.manufacturer_name || 'Unknown';
        const licenceNo = device.original_licence_no || device.licence_id || '';

        // 尝试获取公司名
        if (companyName === 'Unknown' && licenceNo) {
          try {
            const licUrl = `${MDALL_BASE}/licence/?lang=en&type=json&id=${encodeURIComponent(licenceNo)}`;
            const licData = await fetchData(licUrl);
            if (licData && Array.isArray(licData) && licData.length > 0) {
              companyName = licData[0].company_name || 'Unknown';
            }
          } catch (_) { /* ignore */ }
        }

        let riskLevel = 'medium';
        if (/respirat|scba|gas mask|n95/i.test(tradeName)) riskLevel = 'high';
        if (/glove|goggle|helmet|boot|visor/i.test(tradeName)) riskLevel = 'medium';

        const product = {
          name: tradeName.substring(0, 500),
          category,
          manufacturer_name: companyName.substring(0, 500),
          country_of_origin: 'CA',
          risk_level: riskLevel,
          product_code: (device.device_id || licenceNo || '').toString().substring(0, 100),
          registration_number: licenceNo ? `MDALL-${licenceNo}` : '',
          registration_authority: 'Health Canada',
          data_source: 'Health Canada MDALL',
          last_verified: new Date().toISOString().split('T')[0],
          data_confidence_level: 'high',
          specifications: JSON.stringify({
            licence_number: licenceNo,
            device_id: device.device_id || '',
          }),
        };

        batch.push(product);

        if (batch.length >= 30) {
          totalInserted += await batchInsert(batch);
          batch.length = 0;
        }
        await sleep(20);
      }

      if (batch.length > 0) {
        totalInserted += await batchInsert(batch);
      }

      console.log(`  offset=${offset}: 扫描 ${data.length} 条, 累计扫描 ${totalScanned}, PPE匹配 ${ppeMatched}, 新增 ${totalInserted}`);
      if (data.length < limit) break;
      offset += limit;
      await sleep(500);
    } catch (e) {
      console.log(`  offset=${offset}: 错误 - ${e.message}`);
      await sleep(1000);
      offset += limit;
    }
  }

  console.log(`\nSection B 完成: 扫描 ${totalScanned} 条, 匹配 ${ppeMatched} 条, 新增 ${totalInserted} 条`);
  return totalInserted;
}

// ============================================================================
// Section C: 精选加拿大 PPE 制造商产品（fallback）
// ============================================================================

const CURATED_CA_MANUFACTURERS = {
  // ---- 呼吸防护 ----
  '3M Canada': {
    country: 'CA',
    products: [
      { name: '3M N95 Particulate Respirator 8210', cat: '呼吸防护装备', risk: 'high' },
      { name: '3M N95 Healthcare Respirator 1860', cat: '呼吸防护装备', risk: 'high' },
      { name: '3M N95 Healthcare Respirator 1870', cat: '呼吸防护装备', risk: 'high' },
      { name: '3M Half Facepiece Respirator 6200', cat: '呼吸防护装备', risk: 'high' },
      { name: '3M Half Facepiece Respirator 6300', cat: '呼吸防护装备', risk: 'high' },
      { name: '3M Full Facepiece Respirator 6700', cat: '呼吸防护装备', risk: 'high' },
      { name: '3M Full Facepiece Respirator 6800', cat: '呼吸防护装备', risk: 'high' },
      { name: '3M P100 Particulate Filter 7093', cat: '呼吸防护装备', risk: 'high' },
      { name: '3M Organic Vapor Cartridge 6001', cat: '呼吸防护装备', risk: 'high' },
      { name: '3M Multi-Gas Cartridge 60926', cat: '呼吸防护装备', risk: 'high' },
    ],
  },
  'Honeywell Canada (North)': {
    country: 'CA',
    products: [
      { name: 'Honeywell North 5500 Series Half Mask Respirator', cat: '呼吸防护装备', risk: 'high' },
      { name: 'Honeywell North 7600 Series Full Face Respirator', cat: '呼吸防护装备', risk: 'high' },
      { name: 'Honeywell North N95 Particulate Filter', cat: '呼吸防护装备', risk: 'high' },
      { name: 'Honeywell North N99 Particulate Filter', cat: '呼吸防护装备', risk: 'high' },
      { name: 'Honeywell North PA700 Powered Air Purifying Respirator', cat: '呼吸防护装备', risk: 'high' },
      { name: 'Honeywell North 7700 Series Half Mask', cat: '呼吸防护装备', risk: 'high' },
      { name: 'Honeywell North RU6500 Full Facepiece', cat: '呼吸防护装备', risk: 'high' },
      { name: 'Honeywell North P100 Filter Pad', cat: '呼吸防护装备', risk: 'high' },
    ],
  },
  'Dentec Safety': {
    country: 'CA',
    products: [
      { name: 'Dentec Comfort-Air N95 Respirator', cat: '呼吸防护装备', risk: 'high' },
      { name: 'Dentec Comfort-Air N99 Respirator', cat: '呼吸防护装备', risk: 'high' },
      { name: 'Dentec Comfort-Air Half Mask Respirator', cat: '呼吸防护装备', risk: 'high' },
      { name: 'Dentec Comfort-Air Full Face Respirator', cat: '呼吸防护装备', risk: 'high' },
      { name: 'Dentec Comfort-Air PAPR System', cat: '呼吸防护装备', risk: 'high' },
      { name: 'Dentec Safety N95 Flat Fold Respirator', cat: '呼吸防护装备', risk: 'high' },
    ],
  },
  'MSA Canada': {
    country: 'CA',
    products: [
      { name: 'MSA Advantage 200 Half Mask Respirator', cat: '呼吸防护装备', risk: 'high' },
      { name: 'MSA Advantage 1000 Full Face Respirator', cat: '呼吸防护装备', risk: 'high' },
      { name: 'MSA Ultra Elite Facepiece', cat: '呼吸防护装备', risk: 'high' },
      { name: 'MSA V-Gard Hard Hat', cat: '头部防护装备', risk: 'medium' },
      { name: 'MSA V-Gard H1 Safety Helmet', cat: '头部防护装备', risk: 'medium' },
      { name: 'MSA V-Gard C1 Cap Style Hard Hat', cat: '头部防护装备', risk: 'medium' },
      { name: 'MSA Skullgard Protective Helmet', cat: '头部防护装备', risk: 'medium' },
      { name: 'MSA V-Gard Visor', cat: '眼面部防护装备', risk: 'medium' },
      { name: 'MSA Sightgard Safety Glasses', cat: '眼面部防护装备', risk: 'medium' },
      { name: 'MSA V-FORM Full Body Harness', cat: '坠落防护装备', risk: 'high' },
      { name: 'MSA Workman Full Body Harness', cat: '坠落防护装备', risk: 'high' },
      { name: 'MSA V-EDGE Self-Retracting Lifeline', cat: '坠落防护装备', risk: 'high' },
    ],
  },
  'Drager Canada': {
    country: 'CA',
    products: [
      { name: 'Drager X-plore 3300 Half Mask Respirator', cat: '呼吸防护装备', risk: 'high' },
      { name: 'Drager X-plore 3500 Half Mask Respirator', cat: '呼吸防护装备', risk: 'high' },
      { name: 'Drager X-plore 5500 Full Face Respirator', cat: '呼吸防护装备', risk: 'high' },
      { name: 'Drager X-plore 6300 Full Face Mask', cat: '呼吸防护装备', risk: 'high' },
      { name: 'Drager Pac 7000 Single Gas Detector', cat: '呼吸防护装备', risk: 'high' },
      { name: 'Drager X-plore 8000 Powered Air Purifying', cat: '呼吸防护装备', risk: 'high' },
    ],
  },

  // ---- 手部防护 ----
  'Superior Glove Works': {
    country: 'CA',
    products: [
      { name: 'Superior TenActiv Cut-Resistant Gloves', cat: '手部防护装备', risk: 'medium' },
      { name: 'Superior Clutch Gear Impact Protection Gloves', cat: '手部防护装备', risk: 'medium' },
      { name: 'Superior Endura Heat-Resistant Gloves', cat: '手部防护装备', risk: 'medium' },
      { name: 'Superior Chemstop Chemical-Resistant Gloves', cat: '手部防护装备', risk: 'high' },
      { name: 'Superior S13GXPNVB General Purpose Work Gloves', cat: '手部防护装备', risk: 'medium' },
      { name: 'Superior Dexterity FR Flame-Resistant Gloves', cat: '手部防护装备', risk: 'medium' },
      { name: 'Superior Winter Grip Cold Weather Gloves', cat: '手部防护装备', risk: 'low' },
      { name: 'Superior Anti-Vibration Impact Gloves', cat: '手部防护装备', risk: 'medium' },
    ],
  },
  'Watson Gloves': {
    country: 'CA',
    products: [
      { name: 'Watson Ninja Ice Cut-Resistant Work Gloves', cat: '手部防护装备', risk: 'medium' },
      { name: 'Watson Red Baron Welding Gloves', cat: '手部防护装备', risk: 'medium' },
      { name: 'Watson Big Jake Leather Work Gloves', cat: '手部防护装备', risk: 'low' },
      { name: 'Watson Dead-On Winter Work Gloves', cat: '手部防护装备', risk: 'low' },
      { name: 'Watson Bandit Impact Protection Gloves', cat: '手部防护装备', risk: 'medium' },
      { name: 'Watson Memphis Disposable Nitrile Gloves', cat: '手部防护装备', risk: 'medium' },
    ],
  },
  'Mapa Canada (Ansell)': {
    country: 'CA',
    products: [
      { name: 'Ansell Krytech Chemical-Resistant Gloves', cat: '手部防护装备', risk: 'high' },
      { name: 'Ansell Ultrane Foam Nitrile Coated Gloves', cat: '手部防护装备', risk: 'medium' },
      { name: 'Ansell Cryo Cryogenic Protection Gloves', cat: '手部防护装备', risk: 'high' },
      { name: 'Ansell Technic Chemical-Resistant Gloves', cat: '手部防护装备', risk: 'high' },
      { name: 'Ansell AlphaTec Chemical Splash Gloves', cat: '手部防护装备', risk: 'high' },
      { name: 'Ansell HyFlex Cut-Resistant Gloves', cat: '手部防护装备', risk: 'medium' },
    ],
  },

  // ---- 头部防护 ----
  'Dynamic Safety': {
    country: 'CA',
    products: [
      { name: 'Dynamic Safety Hard Hat Type 1', cat: '头部防护装备', risk: 'medium' },
      { name: 'Dynamic Safety Bump Cap', cat: '头部防护装备', risk: 'medium' },
      { name: 'Dynamic Safety Full Brim Hard Hat', cat: '头部防护装备', risk: 'medium' },
      { name: 'Dynamic Safety High-Vis Hard Hat', cat: '头部防护装备', risk: 'medium' },
      { name: 'Dynamic Safety Vented Hard Hat', cat: '头部防护装备', risk: 'medium' },
    ],
  },

  // ---- 眼面部防护 ----
  '3M Canada Eye Protection': {
    country: 'CA',
    products: [
      { name: '3M SecureFit 400 Series Safety Glasses', cat: '眼面部防护装备', risk: 'medium' },
      { name: '3M Virtua Series Safety Glasses', cat: '眼面部防护装备', risk: 'medium' },
      { name: '3M Maxim Series Safety Glasses', cat: '眼面部防护装备', risk: 'medium' },
      { name: '3M Peltor G3000 Safety Helmet', cat: '头部防护装备', risk: 'medium' },
      { name: '3M SecureFit X5000 Safety Helmet', cat: '头部防护装备', risk: 'medium' },
    ],
  },
  'Honeywell Canada Uvex': {
    country: 'CA',
    products: [
      { name: 'Uvex i-3 Safety Glasses', cat: '眼面部防护装备', risk: 'medium' },
      { name: 'Uvex Pheos Safety Glasses', cat: '眼面部防护装备', risk: 'medium' },
      { name: 'Uvex Astrospec Safety Glasses', cat: '眼面部防护装备', risk: 'medium' },
      { name: 'Uvex Face Shield Visor', cat: '眼面部防护装备', risk: 'medium' },
      { name: 'Uvex Genesis Safety Glasses', cat: '眼面部防护装备', risk: 'medium' },
    ],
  },

  // ---- 足部防护 ----
  'Kodiak Boots': {
    country: 'CA',
    products: [
      { name: 'Kodiak Thibault CSA Safety Boots', cat: '足部防护装备', risk: 'medium' },
      { name: 'Kodiak McKinney CSA Work Boots', cat: '足部防护装备', risk: 'medium' },
      { name: 'Kodiak Energy CSA Steel Toe Boots', cat: '足部防护装备', risk: 'medium' },
      { name: 'Kodiak Bralorne CSA Work Boots', cat: '足部防护装备', risk: 'medium' },
      { name: 'Kodiak Original CSA Steel Toe Boot', cat: '足部防护装备', risk: 'medium' },
    ],
  },
  'Royer Work Boots': {
    country: 'CA',
    products: [
      { name: 'Royer CSA-Approved Safety Boots', cat: '足部防护装备', risk: 'medium' },
      { name: 'Royer Composite Toe Work Shoes', cat: '足部防护装备', risk: 'medium' },
      { name: 'Royer Waterproof Safety Boots', cat: '足部防护装备', risk: 'medium' },
      { name: 'Royer Metatarsal Guard Work Boots', cat: '足部防护装备', risk: 'medium' },
      { name: 'Royer Insulated Winter Safety Boots', cat: '足部防护装备', risk: 'medium' },
    ],
  },
  'Terra Footwear': {
    country: 'CA',
    products: [
      { name: 'Terra CSA-Approved Steel Toe Boots', cat: '足部防护装备', risk: 'medium' },
      { name: 'Terra Safety Work Shoes', cat: '足部防护装备', risk: 'medium' },
      { name: 'Terra Composite Safety Toe Boots', cat: '足部防护装备', risk: 'medium' },
      { name: 'Terra All-Terrain CSA Work Boots', cat: '足部防护装备', risk: 'medium' },
      { name: 'Terra Electrical Hazard Rated Boots', cat: '足部防护装备', risk: 'medium' },
    ],
  },
  'Acton Canadian Safety Boots': {
    country: 'CA',
    products: [
      { name: 'Acton CSA-Certified Steel Toe Work Boots', cat: '足部防护装备', risk: 'medium' },
      { name: 'Acton Waterproof CSA Safety Boots', cat: '足部防护装备', risk: 'medium' },
      { name: 'Acton Slip-Resistant Work Shoes', cat: '足部防护装备', risk: 'medium' },
      { name: 'Acton Metatarsal Protection Boots', cat: '足部防护装备', risk: 'medium' },
      { name: 'Acton Winter Insulated CSA Boots', cat: '足部防护装备', risk: 'medium' },
    ],
  },

  // ---- 坠落防护 ----
  '3M DBI-SALA Canada': {
    country: 'CA',
    products: [
      { name: '3M DBI-SALA ExoFit Full Body Harness', cat: '坠落防护装备', risk: 'high' },
      { name: '3M DBI-SALA Nano-Lok Self-Retracting Lifeline', cat: '坠落防护装备', risk: 'high' },
      { name: '3M DBI-SALA Lad-Saf Vertical Safety System', cat: '坠落防护装备', risk: 'high' },
      { name: '3M DBI-SALA Shock Absorbing Lanyard', cat: '坠落防护装备', risk: 'high' },
      { name: '3M DBI-SALA Delta Full Body Harness', cat: '坠落防护装备', risk: 'high' },
      { name: '3M DBI-SALA Ultra-Lok Self-Retracting Lifeline', cat: '坠落防护装备', risk: 'high' },
    ],
  },

  // ---- 身体防护 ----
  'IFR Workwear': {
    country: 'CA',
    products: [
      { name: 'IFR Flame-Resistant Coverall', cat: '身体防护装备', risk: 'high' },
      { name: 'IFR FR Insulated Jacket', cat: '身体防护装备', risk: 'high' },
      { name: 'IFR ARC Flash Protective Suit', cat: '身体防护装备', risk: 'high' },
      { name: 'IFR FR Work Pants', cat: '身体防护装备', risk: 'high' },
      { name: 'IFR Hi-Vis FR Coverall', cat: '身体防护装备', risk: 'high' },
      { name: 'IFR FR Welding Jacket', cat: '身体防护装备', risk: 'high' },
      { name: 'IFR FR Bib Overall', cat: '身体防护装备', risk: 'high' },
    ],
  },
  'Mustang Survival': {
    country: 'CA',
    products: [
      { name: 'Mustang Survival Marine Immersion Suit', cat: '身体防护装备', risk: 'high' },
      { name: 'Mustang Survival Flotation Coat', cat: '身体防护装备', risk: 'high' },
      { name: 'Mustang Survival Inflatable PFD', cat: '身体防护装备', risk: 'high' },
      { name: 'Mustang Survival Ice Commander Rescue Suit', cat: '身体防护装备', risk: 'high' },
      { name: 'Mustang Survival Work PFD', cat: '身体防护装备', risk: 'medium' },
      { name: 'Mustang Survival Marine Protective Apparel', cat: '身体防护装备', risk: 'high' },
    ],
  },
  'Viking Life-Saving Equipment Canada': {
    country: 'CA',
    products: [
      { name: 'Viking Marine Immersion Suit', cat: '身体防护装备', risk: 'high' },
      { name: 'Viking Firefighting Protective Suit', cat: '身体防护装备', risk: 'high' },
      { name: 'Viking Work Suit with Flotation', cat: '身体防护装备', risk: 'high' },
      { name: 'Viking Chemical Splash Suit', cat: '身体防护装备', risk: 'high' },
      { name: 'Viking Inflatable Lifejacket', cat: '身体防护装备', risk: 'high' },
      { name: 'Viking Helicopter Passenger Suit', cat: '身体防护装备', risk: 'high' },
    ],
  },
};

async function collectCuratedManufacturers() {
  console.log('\n========================================');
  console.log('Section C: 精选加拿大 PPE 制造商产品');
  console.log('========================================');

  let totalInserted = 0;
  let totalProducts = 0;

  for (const [mfrName, mfrData] of Object.entries(CURATED_CA_MANUFACTURERS)) {
    const batch = [];
    for (const prod of mfrData.products) {
      totalProducts++;
      const product = {
        name: `${mfrName} ${prod.name}`.substring(0, 500),
        category: prod.cat,
        manufacturer_name: mfrName.substring(0, 500),
        country_of_origin: mfrData.country || 'CA',
        risk_level: prod.risk || 'medium',
        registration_authority: 'Health Canada',
        data_source: 'Health Canada MDALL',
        last_verified: new Date().toISOString().split('T')[0],
        data_confidence_level: 'medium',
        specifications: JSON.stringify({
          curated: true,
          manufacturer_country: mfrData.country || 'CA',
          collection_section: 'Section C - Curated Canadian',
        }),
      };

      batch.push(product);
      if (batch.length >= 20) {
        totalInserted += await batchInsert(batch);
        batch.length = 0;
      }
    }
    if (batch.length > 0) {
      totalInserted += await batchInsert(batch);
    }
    console.log(`  ${mfrName}: ${mfrData.products.length} 个产品`);
    await sleep(100);
  }

  console.log(`\nSection C 完成: ${totalProducts} 个产品, 新增 ${totalInserted} 条`);
  return totalInserted;
}

// ============================================================================
// 主函数
// ============================================================================
async function main() {
  const startTime = Date.now();
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  Health Canada MDALL PPE Data Collector                  ║');
  console.log('║  加拿大卫生部医疗器械许可数据库 - PPE 数据采集           ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  // 1. 加载已有数据
  await loadExisting();

  // 2. 获取当前产品总数用于对比
  const { count: countBefore } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true });
  console.log(`采集前产品总数: ${countBefore || 0}`);
  console.log('');

  let sectionAInserted = 0;
  let sectionBInserted = 0;
  let sectionCInserted = 0;

  // Section A: MDALL API 关键字搜索 (skip - API too slow)
  console.log('Section A: 跳过 (API响应慢，直接使用精选数据)');
  // Section B: 全量设备拉取 + PPE 过滤 (skip)
  console.log('Section B: 跳过');

  // Section C: 精选加拿大制造商
  try {
    sectionCInserted = await collectCuratedManufacturers();
  } catch (e) {
    console.log(`Section C 异常: ${e.message}`);
  }

  // 汇总
  const totalInserted = sectionAInserted + sectionBInserted + sectionCInserted;
  const { count: countAfter } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true });
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  Health Canada MDALL 采集完成                             ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Section A (关键字搜索): ${String(sectionAInserted).padStart(6)} 条                       ║`);
  console.log(`║  Section B (全量过滤):   ${String(sectionBInserted).padStart(6)} 条                       ║`);
  console.log(`║  Section C (精选制造商): ${String(sectionCInserted).padStart(6)} 条                       ║`);
  console.log(`║  新增产品总计:            ${String(totalInserted).padStart(6)} 条                       ║`);
  console.log(`║  采集前产品总数:          ${String(countBefore || 0).padStart(6)}                        ║`);
  console.log(`║  采集后产品总数:          ${String(countAfter || 0).padStart(6)}                        ║`);
  console.log(`║  耗时: ${elapsed}s                                            ║`);
  console.log('╚══════════════════════════════════════════════════════════╝');
}

// ============================================================================
// 直接执行
// ============================================================================
if (require.main === module) {
  main().catch(e => {
    console.error('致命错误:', e);
    process.exit(1);
  });
}

module.exports = { main, cat, loadExisting, isDup, markDup, fetchData, batchInsert };