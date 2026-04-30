#!/usr/bin/env node

/**
 * 回填manufacturer_name字段
 * 通过多种方式匹配和填充制造商名称
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fillManufacturerName() {
  console.log('============================================================');
  console.log('  回填 manufacturer_name 字段');
  console.log('============================================================\n');

  // 1. 统计当前状态
  console.log('一、当前状态统计');
  console.log('────────────────────────────────────────────────────');
  
  const { count: totalProducts } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true });
  
  const { count: withMfr } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .not('manufacturer_name', 'is', null);
  
  const { count: withoutMfr } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .is('manufacturer_name', null);
  
  console.log(`  总产品数:     ${totalProducts?.toLocaleString()} 条`);
  console.log(`  有制造商:     ${withMfr?.toLocaleString()} 条 (${(withMfr / totalProducts * 100).toFixed(1)}%)`);
  console.log(`  无制造商:     ${withoutMfr?.toLocaleString()} 条 (${(withoutMfr / totalProducts * 100).toFixed(1)}%)\n`);

  let totalFilled = 0;

  // 2. 方法1: 从description中提取制造商信息
  console.log('二、从description中提取制造商');
  console.log('────────────────────────────────────────────────────');
  
  const { data: descProducts } = await supabase
    .from('ppe_products')
    .select('id, description')
    .is('manufacturer_name', null)
    .not('description', 'is', null)
    .limit(5000);

  let filledFromDesc = 0;
  for (const p of (descProducts || [])) {
    const desc = p.description || '';
    
    // 尝试匹配"由...生产"、"Manufacturer:"等模式
    const patterns = [
      /由([^，。]+)生产/,
      /Manufacturer:\s*([^,\n]+)/i,
      /生产商[：:]\s*([^,\n]+)/,
      /生产企业[：:]\s*([^,\n]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = desc.match(pattern);
      if (match && match[1] && match[1].trim().length > 2) {
        const mfrName = match[1].trim();
        
        const { error } = await supabase
          .from('ppe_products')
          .update({ manufacturer_name: mfrName })
          .eq('id', p.id);
        
        if (!error) {
          filledFromDesc++;
        }
        break;
      }
    }
  }
  
  console.log(`  ✅ 从description填充: ${filledFromDesc} 条\n`);
  totalFilled += filledFromDesc;

  // 3. 方法2: 从certifications中提取制造商
  console.log('三、从certifications中提取制造商');
  console.log('────────────────────────────────────────────────────');
  
  const { data: certProducts } = await supabase
    .from('ppe_products')
    .select('id, certifications')
    .is('manufacturer_name', null)
    .not('certifications', 'is', null)
    .limit(5000);

  let filledFromCert = 0;
  for (const p of (certProducts || [])) {
    try {
      const certs = typeof p.certifications === 'string' 
        ? JSON.parse(p.certifications) 
        : p.certifications;
      
      if (Array.isArray(certs) && certs.length > 0) {
        // 查找包含制造商信息的认证
        for (const cert of certs) {
          if (cert.manufacturer || cert.applicant || cert.company) {
            const mfrName = cert.manufacturer || cert.applicant || cert.company;
            
            const { error } = await supabase
              .from('ppe_products')
              .update({ manufacturer_name: mfrName })
              .eq('id', p.id);
            
            if (!error) {
              filledFromCert++;
            }
            break;
          }
        }
      }
    } catch (e) {
      // 解析失败，跳过
    }
  }
  
  console.log(`  ✅ 从certifications填充: ${filledFromCert} 条\n`);
  totalFilled += filledFromCert;

  // 4. 方法3: 基于产品名称和型号匹配制造商表
  console.log('四、从制造商表匹配');
  console.log('────────────────────────────────────────────────────');
  
  // 获取所有制造商名称
  const { data: manufacturers } = await supabase
    .from('ppe_manufacturers')
    .select('name');

  const mfrNames = (manufacturers || []).map(m => m.name).filter(n => n && n.length > 2);
  
  const { data: unmatchedProducts } = await supabase
    .from('ppe_products')
    .select('id, name, description')
    .is('manufacturer_name', null)
    .limit(5000);

  let filledFromMfrTable = 0;
  for (const p of (unmatchedProducts || [])) {
    const text = `${p.name || ''} ${p.description || ''}`.toLowerCase();
    
    for (const mfrName of mfrNames) {
      if (text.includes(mfrName.toLowerCase())) {
        const { error } = await supabase
          .from('ppe_products')
          .update({ manufacturer_name: mfrName })
          .eq('id', p.id);
        
        if (!error) {
          filledFromMfrTable++;
        }
        break;
      }
    }
  }
  
  console.log(`  ✅ 从制造商表匹配填充: ${filledFromMfrTable} 条\n`);
  totalFilled += filledFromMfrTable;

  // 5. 方法4: 基于data_source特定规则
  console.log('五、基于数据源规则填充');
  console.log('────────────────────────────────────────────────────');
  
  // NMPA数据通常有明确的制造商信息在description中
  const { data: nmpaProducts } = await supabase
    .from('ppe_products')
    .select('id, description')
    .eq('data_source', 'NMPA')
    .is('manufacturer_name', null)
    .limit(5000);

  let filledFromNMPA = 0;
  for (const p of (nmpaProducts || [])) {
    const desc = p.description || '';
    // 匹配"由...生产"模式
    const match = desc.match(/由([^，。]+)生产/);
    if (match && match[1]) {
      const { error } = await supabase
        .from('ppe_products')
        .update({ manufacturer_name: match[1].trim() })
        .eq('id', p.id);
      
      if (!error) {
        filledFromNMPA++;
      }
    }
  }
  
  console.log(`  ✅ NMPA数据填充: ${filledFromNMPA} 条\n`);
  totalFilled += filledFromNMPA;

  // 6. 统计结果
  console.log('六、填充结果统计');
  console.log('────────────────────────────────────────────────────');
  
  const { count: withMfrAfter } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .not('manufacturer_name', 'is', null);
  
  const { count: withoutMfrAfter } = await supabase
    .from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .is('manufacturer_name', null);
  
  console.log(`  填充前: ${withMfr?.toLocaleString()} 条 (${(withMfr / totalProducts * 100).toFixed(1)}%)`);
  console.log(`  填充后: ${withMfrAfter?.toLocaleString()} 条 (${(withMfrAfter / totalProducts * 100).toFixed(1)}%)`);
  console.log(`  本次填充: ${totalFilled} 条`);
  console.log(`  剩余缺失: ${withoutMfrAfter?.toLocaleString()} 条 (${(withoutMfrAfter / totalProducts * 100).toFixed(1)}%)\n`);

  console.log('============================================================');
  console.log('  任务完成');
  console.log('============================================================');
}

fillManufacturerName().catch(e => {
  console.error('执行失败:', e);
  process.exit(1);
});
