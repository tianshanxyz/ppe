#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const UDID_DIR = '/Users/maxiaoha/Desktop/mdlooker/mdlooker/UDID_FULL_RELEASE_20260501';

const PPE_KEYWORDS = ['口罩','手套','防护服','隔离衣','手术衣','防护面屏','护目镜','防护帽','防护鞋','鞋套','头套','面罩','呼吸器','防毒面具','防尘','N95','KN95','FFP','医用防护','外科口罩','检查手套','外科手套','医用手套','防护眼镜','防护面罩','安全帽'];
const PPE_CODES = new Set(['14-14-01','14-14-02','14-14-03','14-14-04','14-14-05','14-14-06','14-14-07','14-13-04','14-13-05','14-13-06']);

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

async function processFile(filePath) {
  return new Promise((resolve) => {
    const mfrs = [];
    let inDevice = false;
    let deviceLines = [];
    let braceDepth = 0;

    const rl = readline.createInterface({
      input: fs.createReadStream(filePath, { encoding: 'utf-8' }),
      crlfDelay: Infinity,
    });

    rl.on('line', (line) => {
      const trimmed = line.trim();

      if (trimmed === '<device>') {
        inDevice = true;
        deviceLines = [];
        return;
      }

      if (inDevice) {
        if (trimmed === '</device>') {
          inDevice = false;
          const block = deviceLines.join('\n');

          const flbmMatch = block.match(/<flbm>([^<]*)<\/flbm>/);
          const cpmctymcMatch = block.match(/<cpmctymc>([^<]*)<\/cpmctymc>/);
          const code = flbmMatch ? flbmMatch[1].trim() : '';
          const name = cpmctymcMatch ? cpmctymcMatch[1].trim() : '';

          const isPPEByCode = PPE_CODES.has(code);
          const isPPEByKw = PPE_KEYWORDS.some(kw => name.includes(kw));
          if (isPPEByCode || isPPEByKw) {
            const mfrMatch = block.match(/<ylqxzcrbarmc>([^<]*)<\/ylqxzcrbarmc>/);
            const mfrEnMatch = block.match(/<ylqxzcrbarywmc>([^<]*)<\/ylqxzcrbarywmc>/);
            const usccMatch = block.match(/<tyshxydm>([^<]*)<\/tyshxydm>/);

            const mfrName = mfrMatch ? mfrMatch[1].trim() : '';
            if (mfrName) {
              const contacts = [];
              const emailRe = /<qylxryx>([^<]*)<\/qylxryx>/g;
              const phoneRe = /<qylxrdh>([^<]*)<\/qylxrdh>/g;
              let em, pm;
              const emails = [], phones = [];
              while ((em = emailRe.exec(block)) !== null) { if (em[1].trim()) emails.push(em[1].trim()); }
              while ((pm = phoneRe.exec(block)) !== null) { if (pm[1].trim()) phones.push(pm[1].trim()); }
              for (let i = 0; i < Math.max(emails.length, phones.length); i++) {
                contacts.push({ email: emails[i] || '', phone: phones[i] || '' });
              }

              mfrs.push({
                name: mfrName,
                name_en: mfrEnMatch ? mfrEnMatch[1].trim() : '',
                uscc: usccMatch ? usccMatch[1].trim() : '',
                contacts: contacts.slice(0, 3),
              });
            }
          }
          deviceLines = [];
        } else {
          deviceLines.push(trimmed);
        }
      }
    });

    rl.on('close', () => resolve(mfrs));
  });
}

async function main() {
  console.log('========================================');
  console.log('从UDID XML提取中国制造商详细信息 (流式处理)');
  console.log('========================================');

  const xmlFiles = fs.readdirSync(UDID_DIR).filter(f => f.endsWith('.xml')).sort();
  console.log(`XML文件数: ${xmlFiles.length}`);

  const cnMfrDetails = new Map();

  for (let i = 0; i < xmlFiles.length; i++) {
    const filePath = path.join(UDID_DIR, xmlFiles[i]);
    try {
      const mfrs = await processFile(filePath);
      for (const m of mfrs) {
        const key = m.name.toLowerCase();
        if (!cnMfrDetails.has(key)) {
          cnMfrDetails.set(key, {
            name: m.name,
            name_en: m.name_en,
            uscc: m.uscc,
            country: 'CN',
            contacts: m.contacts,
            product_count: 1,
          });
        } else {
          const ex = cnMfrDetails.get(key);
          if (m.name_en && !ex.name_en) ex.name_en = m.name_en;
          if (m.uscc && !ex.uscc) ex.uscc = m.uscc;
          ex.product_count++;
          for (const c of m.contacts) {
            if (ex.contacts.length < 3 && !ex.contacts.some(ec => ec.email === c.email && ec.phone === c.phone)) {
              ex.contacts.push(c);
            }
          }
        }
      }
    } catch (err) {
      // skip
    }

    if ((i + 1) % 200 === 0) {
      console.log(`  已处理 ${i + 1}/${xmlFiles.length}, 累计制造商: ${cnMfrDetails.size}`);
    }
  }

  console.log(`\n提取的中国PPE制造商: ${cnMfrDetails.size}`);
  let withUscc = 0, withContact = 0, withNameEn = 0;
  cnMfrDetails.forEach(m => {
    if (m.uscc) withUscc++;
    if (m.contacts.length > 0) withContact++;
    if (m.name_en) withNameEn++;
  });
  console.log(`  有统一社会信用代码: ${withUscc}`);
  console.log(`  有联系方式: ${withContact}`);
  console.log(`  有英文名称: ${withNameEn}`);

  console.log('\n========================================');
  console.log('更新制造商信息到数据库');
  console.log('========================================');

  const allMfrs = await fetchAll('ppe_manufacturers', 'id,name,country');
  const mfrNameMap = new Map();
  allMfrs.forEach(m => { if (m.name) mfrNameMap.set(m.name.trim().toLowerCase(), m); });

  let updated = 0, updateErrors = 0;
  for (const [key, detail] of cnMfrDetails) {
    const mfr = mfrNameMap.get(key);
    if (!mfr) continue;

    const updateData = { data_confidence_level: 'high' };
    if (detail.uscc) updateData.certifications = JSON.stringify({ uscc: detail.uscc });
    if (detail.contacts.length > 0) updateData.contact_info = JSON.stringify(detail.contacts);
    if (detail.name_en) updateData.company_profile = JSON.stringify({ name_en: detail.name_en });

    const { error } = await supabase.from('ppe_manufacturers').update(updateData).eq('id', mfr.id);
    if (error) updateErrors++;
    else updated++;

    if ((updated + updateErrors) % 200 === 0) {
      console.log(`  进度: ${updated + updateErrors}`);
    }
  }
  console.log(`  更新成功: ${updated}, 错误: ${updateErrors}`);

  const reportDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  const cnMfrArray = Array.from(cnMfrDetails.values());
  const outputFile = path.join(reportDir, 'cn_manufacturers_udid_details.json');
  fs.writeFileSync(outputFile, JSON.stringify({
    total: cnMfrArray.length, with_uscc: withUscc, with_contact: withContact, with_name_en: withNameEn,
    manufacturers: cnMfrArray,
  }, null, 2));
  console.log(`\n详细数据已保存: ${outputFile}`);

  console.log('\n========================================');
  console.log('执行完成');
  console.log('========================================');
  console.log(`  中国PPE制造商: ${cnMfrDetails.size}`);
  console.log(`  更新成功: ${updated}`);
}

main().catch(e => { console.error('Fatal error:', e); process.exit(1); });
