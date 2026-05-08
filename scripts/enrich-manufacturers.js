#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { parseString } = require('xml2js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const UDID_DIR = '/Users/maxiaoha/Desktop/mdlooker/mdlooker/UDID_FULL_RELEASE_20260501';

const PPE_KEYWORDS = [
  '口罩', '手套', '防护服', '隔离衣', '手术衣', '防护面屏', '护目镜',
  '防护帽', '防护鞋', '鞋套', '头套', '面罩', '呼吸器', '防毒面具',
  '防尘', 'N95', 'KN95', 'FFP', '医用防护', '外科口罩', '检查手套',
  '外科手套', '医用手套', '防护眼镜', '防护面罩', '安全帽'
];

const PPE_CATEGORY_CODES = [
  '14-14-01', '14-14-02', '14-14-03', '14-14-04', '14-14-05',
  '14-14-06', '14-14-07', '14-13-04', '14-13-05', '14-13-06',
];

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
  console.log('Step 1: 创建缺失制造商基础记录');
  console.log('========================================');

  const manufacturers = await fetchAll('ppe_manufacturers', '*');
  const products = await fetchAll('ppe_products', 'id,manufacturer_name,country_of_origin,data_source');

  const existingMfrNames = new Set();
  manufacturers.forEach(m => {
    if (m.name) existingMfrNames.add(m.name.trim().toLowerCase());
  });
  console.log(`已有制造商: ${existingMfrNames.size}`);

  const mfrMap = new Map();
  products.forEach(p => {
    if (!p.manufacturer_name) return;
    const name = p.manufacturer_name.trim();
    if (!name || name === 'Unknown') return;
    const key = name.toLowerCase();
    if (!mfrMap.has(key)) {
      mfrMap.set(key, {
        name,
        country: p.country_of_origin || 'Unknown',
        data_source: p.data_source || 'Unknown',
        product_count: 0,
      });
    }
    mfrMap.get(key).product_count++;
  });
  console.log(`产品中的制造商: ${mfrMap.size}`);

  const missingMfrs = [];
  mfrMap.forEach((info, key) => {
    if (!existingMfrNames.has(key)) {
      missingMfrs.push(info);
    }
  });
  console.log(`缺失制造商: ${missingMfrs.length}`);

  let inserted = 0;
  let errors = 0;
  for (let i = 0; i < missingMfrs.length; i += 100) {
    const batch = missingMfrs.slice(i, i + 100).map(m => ({
      name: m.name.substring(0, 500),
      country: m.country,
      data_source: m.data_source,
      last_verified: new Date().toISOString().split('T')[0],
      data_confidence_level: 'low',
    }));
    const { error } = await supabase.from('ppe_manufacturers').insert(batch);
    if (error) {
      console.error(`  插入错误: ${error.message}`);
      errors += batch.length;
    } else {
      inserted += batch.length;
    }
    await new Promise(r => setTimeout(r, 100));
  }
  console.log(`  成功: ${inserted}, 错误: ${errors}`);

  console.log('\n========================================');
  console.log('Step 2: 从UDID XML提取中国制造商详细信息');
  console.log('========================================');

  const xmlFiles = fs.readdirSync(UDID_DIR).filter(f => f.endsWith('.xml')).sort();
  console.log(`XML文件数: ${xmlFiles.length}`);

  const cnMfrDetails = new Map();

  for (let i = 0; i < xmlFiles.length; i++) {
    const filePath = path.join(UDID_DIR, xmlFiles[i]);
    try {
      const xmlData = fs.readFileSync(filePath, 'utf-8');
      await new Promise((resolve, reject) => {
        parseString(xmlData, { explicitArray: true }, (err, result) => {
          if (err) { resolve(); return; }
          const devices = result?.udid?.devices?.[0]?.device || [];
          for (const device of devices) {
            const name = device.cpmctymc?.[0] || '';
            const categoryCode = device.flbm?.[0] || '';
            const isPPE = PPE_CATEGORY_CODES.includes(categoryCode) || PPE_KEYWORDS.some(kw => name.includes(kw));
            if (!isPPE) continue;

            const mfrName = device.ylqxzcrbarmc?.[0]?.trim() || '';
            const mfrNameEn = device.ylqxzcrbarywmc?.[0]?.trim() || '';
            const tyshxydm = device.tyshxydm?.[0]?.trim() || '';
            const regNumber = device.zczbhhzbapzbh?.[0] || '';
            const contactList = device.contactList?.[0]?.contact || [];

            if (!mfrName) continue;

            const key = mfrName.toLowerCase();
            if (!cnMfrDetails.has(key)) {
              const contacts = contactList.map(c => ({
                email: c.qylxryx?.[0] || '',
                phone: c.qylxrdh?.[0] || '',
              })).filter(c => c.email || c.phone);

              cnMfrDetails.set(key, {
                name: mfrName,
                name_en: mfrNameEn,
                uscc: tyshxydm,
                country: 'CN',
                contacts,
                reg_numbers: [regNumber],
                product_count: 1,
              });
            } else {
              const existing = cnMfrDetails.get(key);
              if (mfrNameEn && !existing.name_en) existing.name_en = mfrNameEn;
              if (tyshxydm && !existing.uscc) existing.uscc = tyshxydm;
              if (regNumber && !existing.reg_numbers.includes(regNumber)) {
                existing.reg_numbers.push(regNumber);
              }
              for (const c of contactList) {
                const email = c.qylxryx?.[0] || '';
                const phone = c.qylxrdh?.[0] || '';
                if ((email || phone) && !existing.contacts.some(ec => ec.email === email && ec.phone === phone)) {
                  existing.contacts.push({ email, phone });
                }
              }
              existing.product_count++;
            }
          }
          resolve();
        });
      });
    } catch (err) {
      // skip
    }
    if ((i + 1) % 200 === 0) {
      console.log(`  已处理 ${i + 1}/${xmlFiles.length} 个文件, 累计制造商: ${cnMfrDetails.size}`);
    }
  }

  console.log(`\n从UDID提取的中国制造商: ${cnMfrDetails.size}`);
  let withUscc = 0;
  let withContact = 0;
  let withNameEn = 0;
  cnMfrDetails.forEach(m => {
    if (m.uscc) withUscc++;
    if (m.contacts.length > 0) withContact++;
    if (m.name_en) withNameEn++;
  });
  console.log(`  有统一社会信用代码: ${withUscc}`);
  console.log(`  有联系方式: ${withContact}`);
  console.log(`  有英文名称: ${withNameEn}`);

  console.log('\n========================================');
  console.log('Step 2b: 更新中国制造商详细信息到数据库');
  console.log('========================================');

  let updated = 0;
  let updateErrors = 0;
  const allMfrs = await fetchAll('ppe_manufacturers', 'id,name,country');

  for (const [key, detail] of cnMfrDetails) {
    const mfr = allMfrs.find(m => m.name && m.name.trim().toLowerCase() === key);
    if (!mfr) continue;

    const updateData = {};
    if (detail.uscc) {
      updateData.certifications = JSON.stringify({ uscc: detail.uscc });
    }
    if (detail.contacts.length > 0) {
      updateData.contact_info = JSON.stringify(detail.contacts);
    }
    if (detail.name_en) {
      updateData.company_profile = JSON.stringify({ name_en: detail.name_en });
    }
    if (detail.product_count > 0) {
      updateData.data_confidence_level = 'high';
    }

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase.from('ppe_manufacturers').update(updateData).eq('id', mfr.id);
      if (error) {
        updateErrors++;
      } else {
        updated++;
      }
    }
  }
  console.log(`  更新成功: ${updated}, 错误: ${updateErrors}`);

  console.log('\n========================================');
  console.log('Step 3: 保存中国制造商详细数据');
  console.log('========================================');

  const reportDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

  const cnMfrArray = Array.from(cnMfrDetails.values());
  const outputFile = path.join(reportDir, 'cn_manufacturers_udid_details.json');
  fs.writeFileSync(outputFile, JSON.stringify({
    total: cnMfrArray.length,
    with_uscc: withUscc,
    with_contact: withContact,
    with_name_en: withNameEn,
    manufacturers: cnMfrArray,
  }, null, 2));
  console.log(`  保存到: ${outputFile}`);

  console.log('\n========================================');
  console.log('执行完成');
  console.log('========================================');
  console.log(`  新增制造商: ${inserted}`);
  console.log(`  更新制造商详情: ${updated}`);
  console.log(`  中国制造商(有UDID数据): ${cnMfrDetails.size}`);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
