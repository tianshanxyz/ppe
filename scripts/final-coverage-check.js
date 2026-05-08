#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

(async () => {
  console.log('=== PPE五大品类最终覆盖度验证 ===\n');

  // 1. 总体统计
  const { count: totalProducts } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: totalMfrs } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });

  console.log('总体数据量');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   总产品: ${totalProducts}`);
  console.log(`   总制造商: ${totalMfrs}`);

  // 2. 制造商按品类分布
  console.log('\n制造商按防护品类分布（企业数据）');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const allMfrs = [];
  for (let p = 0; ; p++) {
    const { data } = await supabase.from('ppe_manufacturers')
      .select('name, business_scope, company_profile, country')
      .range(p * 1000, (p + 1) * 1000 - 1);
    if (!data || data.length === 0) break;
    allMfrs.push(...data);
    if (data.length < 1000) break;
  }

  const categoryCount = {
    '头面部防护': 0,
    '呼吸防护': 0,
    '躯体防护': 0,
    '手足部防护': 0,
    '坠落防护': 0,
    '综合': 0
  };

  allMfrs.forEach(m => {
    const scope = (m.business_scope || '').toLowerCase();
    const profile = (m.company_profile || '').toLowerCase();
    const text = scope + ' ' + profile;

    if (text.includes('头面部') || text.includes('安全帽') || text.includes('焊接面罩') || text.includes('护目镜') || text.includes('耳塞')) {
      categoryCount['头面部防护']++;
    } else if (text.includes('呼吸') || text.includes('口罩') || text.includes('防毒面具') || text.includes('呼吸器')) {
      categoryCount['呼吸防护']++;
    } else if (text.includes('躯体') || text.includes('防护服') || text.includes('消防服') || text.includes('反光背心') || text.includes('焊接服')) {
      categoryCount['躯体防护']++;
    } else if (text.includes('手足') || text.includes('手套') || text.includes('安全鞋') || text.includes('防护鞋') || text.includes('绝缘鞋')) {
      categoryCount['手足部防护']++;
    } else if (text.includes('坠落') || text.includes('安全带') || text.includes('救生衣') || text.includes('护膝')) {
      categoryCount['坠落防护']++;
    } else if (text.includes('综合')) {
      categoryCount['综合']++;
    }
  });

  Object.entries(categoryCount).forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count}家`);
  });

  // 3. 检查五大品类企业覆盖
  console.log('\n五大品类企业覆盖检查');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const checks = [
    { name: '焊接面罩', keywords: ['焊接面罩', '焊帽', '焊接防护'] },
    { name: '安全帽', keywords: ['安全帽', '防护帽'] },
    { name: '防毒面具', keywords: ['防毒面具', '防毒面罩'] },
    { name: '自给式呼吸器', keywords: ['自给式', '正压呼吸器', 'scba'] },
    { name: '逃生呼吸器', keywords: ['逃生呼吸器', '逃生'] },
    { name: '消防服', keywords: ['消防服', '阻燃服'] },
    { name: '防电弧服', keywords: ['防电弧', 'arc'] },
    { name: '焊接服', keywords: ['焊接服', '焊工服'] },
    { name: '反光背心', keywords: ['反光背心', '反光衣'] },
    { name: '安全鞋/防护鞋', keywords: ['安全鞋', '防护鞋', '劳保鞋'] },
    { name: '防砸鞋', keywords: ['防砸', '钢头'] },
    { name: '绝缘鞋/靴', keywords: ['绝缘鞋', '绝缘靴'] },
    { name: '耐酸碱手套', keywords: ['耐酸碱手套'] },
    { name: '防切割手套', keywords: ['防切割', '防刺'] },
    { name: '焊工手套', keywords: ['焊工手套', '焊接手套'] },
    { name: '安全带', keywords: ['安全带', '安全绳'] },
    { name: '防坠器', keywords: ['防坠器'] },
    { name: '救生衣', keywords: ['救生衣'] },
  ];

  checks.forEach(check => {
    const found = allMfrs.some(m => {
      const text = (m.name + ' ' + m.business_scope + ' ' + m.company_profile).toLowerCase();
      return check.keywords.some(kw => text.includes(kw.toLowerCase()));
    });
    console.log(`   ${found ? '✅' : '❌'} ${check.name}`);
  });

  // 4. 中国PPE企业统计
  console.log('\n中国PPE企业统计');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const cnMfrs = allMfrs.filter(m => m.country === 'CN' || m.country === 'Multi');
  console.log(`   中国相关企业: ${cnMfrs.length}`);

  // 按省份统计
  const provinceCount = {};
  cnMfrs.forEach(m => {
    const match = (m.company_profile || '').match(/省份:\s*([^|]+)/);
    const prov = match ? match[1].trim() : 'Unknown';
    provinceCount[prov] = (provinceCount[prov] || 0) + 1;
  });

  console.log('\n   按省份分布（Top 10）:');
  Object.entries(provinceCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([prov, count]) => {
      console.log(`      ${prov}: ${count}`);
    });

  // 5. 产品数据 vs 企业数据对比
  console.log('\n产品数据 vs 企业数据对比');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const { count: cnProducts } = await supabase.from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('country_of_origin', 'CN');

  console.log(`   中国产品数据: ${cnProducts}条`);
  console.log(`   中国企业数据: ${cnMfrs.length}家`);
  console.log(`   平均每家中国企业产品数: ${(cnProducts / cnMfrs.length).toFixed(1)}`);

  console.log('\n=== 验证完成 ===');
})();
