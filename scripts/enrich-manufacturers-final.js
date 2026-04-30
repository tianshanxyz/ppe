#!/usr/bin/env node

/**
 * 增强制造商数据 - 从FDA 510k API批量回填manufacturer_name
 * 使用多种策略最大化数据完整性
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xtqhjyiyjhxfdzyypfqq.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU';
const FDA_API_KEY = 'GWvNICRXtNxXFoEL6dnbGRXJlmOHZdurEmAuSZtQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

async function getStats() {
  const { count: total } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: withMfr } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).not('manufacturer_name', 'is', null);
  const { count: withoutMfr } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true }).is('manufacturer_name', null);
  const { count: totalMfrs } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  
  return { total, withMfr, withoutMfr, totalMfrs };
}

async function enrichFromFDA510k() {
  console.log('\n=== 从FDA 510k API批量回填制造商 ===\n');
  
  const keywords = [
    'surgical mask', 'n95 respirator', 'examination glove', 'surgical gown',
    'face shield', 'isolation gown', 'protective goggle', 'nitrile glove',
    'latex glove', 'surgical cap', 'protective clothing', 'coverall',
    'disposable mask', 'medical mask', 'surgical glove', 'procedure glove',
    'safety goggle', 'medical face shield', 'sterile glove', 'shoe cover',
    'kn95', 'ffp2 respirator', 'ffp3 respirator', 'half mask respirator',
    'patient examination glove', 'surgeon glove', 'chemotherapy glove',
    'protective garment', 'surgical drape', 'bouffant cap', 'head cover',
    'boot cover', 'overshoe', 'protective hood', 'lab coat', 'scrub suit',
    'apron', 'dust mask', 'particulate respirator', 'powered air purifying',
    'self-contained breathing', 'escape respirator', 'gas mask',
  ];

  let totalEnriched = 0;
  let totalNewMfrs = 0;
  let totalProcessed = 0;

  for (const keyword of keywords) {
    console.log(`  搜索: "${keyword}"`);
    const limit = 100;
    let skip = 0;
    let keywordEnriched = 0;
    let keywordNewMfrs = 0;

    for (let page = 0; page < 20; page++) {
      const url = `https://api.fda.gov/device/510k.json?api_key=${FDA_API_KEY}&search=device_name:"${encodeURIComponent(keyword)}"&limit=${limit}&skip=${skip}`;
      
      try {
        const data = await fetchJson(url);
        if (!data.results || data.results.length === 0) break;

        for (const item of data.results) {
          const applicant = item.openfda.manufacturer_name?.[0] || 
                           item.applicant || 
                           item.openfda.regulations?.[0] ||
                           '';
          const country = item.openfda.country_code?.[0] || 'US';
          const kNumber = item.k_number || '';
          const productCode = item.openfda.product_code?.[0] || '';

          if (!applicant || applicant.length < 2) continue;

          totalProcessed++;

          // 插入制造商
          const { error: mfrError } = await supabase
            .from('ppe_manufacturers')
            .insert({ 
              name: applicant, 
              country: country.substring(0, 2), 
              website: '' 
            }, { onConflict: 'name' });
          
          if (!mfrError) keywordNewMfrs++;

          // 更新产品
          if (kNumber) {
            const { data: existing } = await supabase
              .from('ppe_products')
              .select('id')
              .or(`model.ilike.%${kNumber}%,name.ilike.%${kNumber}%`)
              .is('manufacturer_name', null)
              .limit(1);

            if (existing && existing.length > 0) {
              const { error } = await supabase
                .from('ppe_products')
                .update({ 
                  manufacturer_name: applicant, 
                  product_code: productCode || undefined, 
                  country_of_origin: country.substring(0, 2) 
                })
                .eq('id', existing[0].id);
              
              if (!error) {
                keywordEnriched++;
              }
            }
          }
        }

        skip += limit;
        await sleep(300);
      } catch (e) {
        console.log(`    错误: ${e.message}`);
        break;
      }
    }

    console.log(`    ✅ 回填 ${keywordEnriched} 条, 新制造商 ${keywordNewMfrs} 个\n`);
    totalEnriched += keywordEnriched;
    totalNewMfrs += keywordNewMfrs;
  }

  console.log(`\n  📊 FDA 510k 总计:`);
  console.log(`    处理记录: ${totalProcessed.toLocaleString()}`);
  console.log(`    回填产品: ${totalEnriched.toLocaleString()}`);
  console.log(`    新增制造商: ${totalNewMfrs.toLocaleString()}`);
}

async function enrichFromDescription() {
  console.log('\n=== 从description字段提取制造商 ===\n');
  
  let enriched = 0;
  const batchSize = 1000;
  let offset = 0;

  const { count } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .is('manufacturer_name', null)
    .not('description', 'is', null);

  console.log(`  待处理产品: ${count?.toLocaleString() || 0} 条`);

  while (offset < (count || 0)) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, description')
      .is('manufacturer_name', null)
      .not('description', 'is', null)
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const p of data) {
      const desc = p.description || '';
      
      const patterns = [
        /(?:Owner|Applicant|Manufacturer|Company|Producer)[：:\s]+([^,\n;]+)/i,
        /(?:由|生产商|生产企业|制造商)[：:\s]+([^,\n;]+)/,
        /([^,\n]+)(?:\s+Co\.?,?\s+Ltd\.?)/i,
        /([^,\n]+)(?:\s+Inc\.?)/i,
        /([^,\n]+)(?:\s+LLC)/i,
        /([^,\n]+)(?:\s+Corp\.?)/i,
      ];

      for (const pattern of patterns) {
        const match = desc.match(pattern);
        if (match && match[1] && match[1].trim().length > 2 && match[1].trim().length < 100) {
          const mfrName = match[1].trim();
          
          if (!/^(product|device|equipment|system|model|type|class|category)/i.test(mfrName)) {
            const { error } = await supabase
              .from('ppe_products')
              .update({ manufacturer_name: mfrName })
              .eq('id', p.id);
            
            if (!error) enriched++;
            break;
          }
        }
      }
    }

    offset += batchSize;
    if (offset % 5000 === 0) {
      console.log(`  进度: ${offset.toLocaleString()}/${count?.toLocaleString()} - 已回填 ${enriched.toLocaleString()}`);
    }
  }

  console.log(`  ✅ 从description回填: ${enriched.toLocaleString()} 条`);
}

async function enrichFromCertifications() {
  console.log('\n=== 从certifications字段提取制造商 ===\n');
  
  let enriched = 0;
  const batchSize = 1000;
  let offset = 0;

  const { count } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .is('manufacturer_name', null)
    .not('certifications', 'is', null);

  console.log(`  待处理产品: ${count?.toLocaleString() || 0} 条`);

  while (offset < (count || 0)) {
    const { data } = await supabase
      .from('ppe_products')
      .select('id, certifications')
      .is('manufacturer_name', null)
      .not('certifications', 'is', null)
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;

    for (const p of data) {
      try {
        const certs = typeof p.certifications === 'string' 
          ? JSON.parse(p.certifications) 
          : p.certifications;
        
        if (Array.isArray(certs) && certs.length > 0) {
          for (const cert of certs) {
            const mfrName = cert.manufacturer || cert.applicant || cert.company || cert.holder;
            
            if (mfrName && typeof mfrName === 'string' && mfrName.length > 2) {
              const { error } = await supabase
                .from('ppe_products')
                .update({ manufacturer_name: mfrName.trim() })
                .eq('id', p.id);
              
              if (!error) {
                enriched++;
                break;
              }
            }
          }
        }
      } catch (e) {
        // 解析失败，跳过
      }
    }

    offset += batchSize;
  }

  console.log(`  ✅ 从certifications回填: ${enriched.toLocaleString()} 条`);
}

async function main() {
  console.log('============================================================');
  console.log('  制造商数据增强 - 多策略回填manufacturer_name');
  console.log('============================================================\n');

  const beforeStats = await getStats();
  console.log('📊 增强前状态:');
  console.log(`  总产品数: ${beforeStats.total.toLocaleString()}`);
  console.log(`  有制造商: ${beforeStats.withMfr.toLocaleString()} (${(beforeStats.withMfr / beforeStats.total * 100).toFixed(1)}%)`);
  console.log(`  无制造商: ${beforeStats.withoutMfr.toLocaleString()} (${(beforeStats.withoutMfr / beforeStats.total * 100).toFixed(1)}%)`);
  console.log(`  制造商总数: ${beforeStats.totalMfrs.toLocaleString()}`);

  // 策略1: FDA 510k API
  await enrichFromFDA510k();

  // 策略2: Description字段
  await enrichFromDescription();

  // 策略3: Certifications字段
  await enrichFromCertifications();

  const afterStats = await getStats();
  console.log('\n============================================================');
  console.log('  📊 增强后状态');
  console.log('============================================================\n');
  console.log(`  总产品数: ${afterStats.total.toLocaleString()}`);
  console.log(`  有制造商: ${afterStats.withMfr.toLocaleString()} (${(afterStats.withMfr / afterStats.total * 100).toFixed(1)}%)`);
  console.log(`  无制造商: ${afterStats.withoutMfr.toLocaleString()} (${(afterStats.withoutMfr / afterStats.total * 100).toFixed(1)}%)`);
  console.log(`  制造商总数: ${afterStats.totalMfrs.toLocaleString()}`);
  
  const improved = afterStats.withMfr - beforeStats.withMfr;
  console.log(`\n  ✅ 总计改善: +${improved.toLocaleString()} 条`);
}

main().catch(console.error);
