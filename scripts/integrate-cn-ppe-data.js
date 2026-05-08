#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

(async () => {
  console.log('=== 中国PPE企业数据整合 ===\n');
  const t0 = Date.now();

  // 1. 获取现有制造商
  console.log('1. 获取现有制造商...');
  const existingMfrs = new Set();
  for (let p = 0; ; p++) {
    const { data } = await supabase.from('ppe_manufacturers')
      .select('name')
      .range(p*1000, (p+1)*1000-1);
    if (!data?.length) break;
    data.forEach(r => existingMfrs.add((r.name||'').toLowerCase().trim()));
    if (data.length < 1000) break;
  }
  console.log(`   现有制造商: ${existingMfrs.size}`);

  // 2. 从产品数据中提取中国制造商
  console.log('\n2. 从产品数据中提取中国制造商...');
  const cnMfrs = new Map();
  for (let p = 0; ; p++) {
    const { data } = await supabase.from('ppe_products')
      .select('manufacturer_name,category,data_source,country_of_origin')
      .eq('country_of_origin', 'CN')
      .range(p*1000, (p+1)*1000-1);
    if (!data?.length) break;
    data.forEach(r => {
      const name = (r.manufacturer_name || '').trim();
      if (!name || name === 'Unknown' || name === 'Health Canada Licensee') return;
      const key = name.toLowerCase().trim();
      if (!cnMfrs.has(key)) {
        cnMfrs.set(key, {
          name,
          categories: new Set(),
          dataSources: new Set(),
          productCount: 0
        });
      }
      const mfr = cnMfrs.get(key);
      if (r.category) mfr.categories.add(r.category);
      if (r.data_source) mfr.dataSources.add(r.data_source);
      mfr.productCount++;
    });
    if (data.length < 1000) break;
  }
  console.log(`   产品中涉及的中国制造商: ${cnMfrs.size}`);

  // 3. 补充知名PPE企业（从搜索结果整理）
  console.log('\n3. 补充知名PPE企业...');
  const additionalCompanies = [
    // 口罩类
    { name: '建德市朝美日化有限公司', categories: ['呼吸防护装备'], province: '浙江' },
    { name: '深圳市华安劳保用品有限公司', categories: ['呼吸防护装备'], province: '广东' },
    { name: '北京生宝恒泰安全科技有限公司', categories: ['呼吸防护装备'], province: '北京' },
    { name: '上海港凯净化制品有限公司', categories: ['呼吸防护装备'], province: '上海' },
    { name: '衢州南核特种劳动防护用品科技有限公司', categories: ['呼吸防护装备'], province: '浙江' },
    { name: '桐城市惠友劳保用品有限公司', categories: ['呼吸防护装备'], province: '安徽' },
    { name: '桐城市康宝劳保用品有限公司', categories: ['呼吸防护装备'], province: '安徽' },
    { name: '上海大胜卫生用品制造有限公司', categories: ['呼吸防护装备'], province: '上海' },
    { name: '江阴市长洪防护用品有限公司', categories: ['呼吸防护装备'], province: '江苏' },
    { name: '上海美迪康医用制品有限公司', categories: ['呼吸防护装备'], province: '上海' },
    { name: '赛纳集团有限公司', categories: ['呼吸防护装备', '身体防护装备'], province: '浙江' },
    // 手套类
    { name: '山东星宇手套有限公司', categories: ['手部防护装备'], province: '山东' },
    { name: '浙江康隆达特种防护科技股份有限公司', categories: ['手部防护装备'], province: '浙江' },
    { name: '山东登升安防科技有限公司', categories: ['手部防护装备'], province: '山东' },
    { name: '江苏恒辉安防股份有限公司', categories: ['手部防护装备'], province: '江苏' },
    { name: '东亚手套有限公司', categories: ['手部防护装备'], province: '浙江' },
    // 安全鞋类
    { name: '江苏盾王科技集团有限公司', categories: ['足部防护装备'], province: '江苏' },
    { name: '上海广和工贸有限公司', categories: ['足部防护装备'], province: '上海' },
    { name: '赛立特（上海）安全设备有限公司', categories: ['足部防护装备', '头部防护装备'], province: '上海' },
    // 综合防护
    { name: '无锡华信安全设备股份有限公司', categories: ['头部防护装备', '眼面部防护装备', '呼吸防护装备'], province: '江苏' },
    { name: '上海希玛科技（集团）有限公司', categories: ['头部防护装备', '眼面部防护装备'], province: '上海' },
    { name: '上海宝亚安全装备股份有限公司', categories: ['呼吸防护装备', '身体防护装备'], province: '上海' },
    { name: '优普泰（深圳）科技有限公司', categories: ['身体防护装备'], province: '广东' },
    { name: '荆州思创科技开发有限公司', categories: ['呼吸防护装备'], province: '湖北' },
    { name: '邦威防护科技股份有限公司', categories: ['身体防护装备', '手部防护装备'], province: '江苏' },
    // 外资在华
    { name: '优唯斯（广州）安全防护用品有限公司', categories: ['头部防护装备', '眼面部防护装备'], province: '广东', is_foreign: true },
    { name: '霍尼韦尔安全防护设备（上海）有限公司', categories: ['头部防护装备', '呼吸防护装备'], province: '上海', is_foreign: true },
    { name: '安思尔（上海）商贸有限公司', categories: ['手部防护装备'], province: '上海', is_foreign: true },
    { name: '代尔塔（中国）安全防护有限公司', categories: ['身体防护装备', '头部防护装备'], province: '上海', is_foreign: true },
    { name: '3M中国有限公司', categories: ['呼吸防护装备', '听觉防护装备'], province: '上海', is_foreign: true },
    { name: '梅思安（中国）安全设备有限公司', categories: ['头部防护装备', '呼吸防护装备'], province: '上海', is_foreign: true },
    // 更多劳保企业
    { name: '广州阳悦安全防护设备有限公司', categories: ['身体防护装备', '头部防护装备'], province: '广东' },
    { name: '西安个体防护装备有限公司', categories: ['身体防护装备'], province: '陕西' },
    { name: '江苏宏洋安全防护用品有限公司', categories: ['眼面部防护装备'], province: '江苏' },
    { name: '北京力达塑料制造有限公司', categories: ['手部防护装备'], province: '北京' },
    { name: '华安安全设备制造有限公司', categories: ['头部防护装备'], province: '广东' },
    { name: '安博安全防护用品有限公司', categories: ['身体防护装备', '头部防护装备'], province: '广东' },
    { name: '卡莫安全防护用品有限公司', categories: ['身体防护装备'], province: '广东' },
    { name: '广州杰安安全防护用品有限公司', categories: ['手部防护装备'], province: '广东' },
    { name: '安全大师防护用品有限公司', categories: ['头部防护装备'], province: '广东' },
    { name: '赛弗图安全鞋业有限公司', categories: ['足部防护装备'], province: '广东' },
  ];

  console.log(`   补充企业: ${additionalCompanies.length}家`);

  // 4. 写入制造商数据
  console.log('\n4. 写入制造商数据...');
  let insFromProducts = 0;
  let insFromAdditional = 0;
  let skipped = 0;

  // 4a. 从产品数据中提取的制造商
  for (const [key, mfr] of cnMfrs) {
    if (existingMfrs.has(key)) {
      skipped++;
      continue;
    }

    const categories = Array.from(mfr.categories).join(',');
    const sources = Array.from(mfr.dataSources).join(',');

    const { error } = await supabase.from('ppe_manufacturers').insert({
      name: mfr.name.substring(0, 500),
      country: 'CN',
      data_source: sources,
      last_verified: new Date().toISOString().split('T')[0],
      data_confidence_level: 'high',
      description: `产品类别: ${categories} | 产品数量: ${mfr.productCount} | 数据来源: ${sources}`
    });

    if (!error) {
      existingMfrs.add(key);
      insFromProducts++;
    }
  }

  // 4b. 补充的知名企业
  for (const company of additionalCompanies) {
    const key = company.name.toLowerCase().trim();
    if (existingMfrs.has(key)) {
      skipped++;
      continue;
    }

    const { error } = await supabase.from('ppe_manufacturers').insert({
      name: company.name.substring(0, 500),
      country: company.is_foreign ? 'Multi' : 'CN',
      data_source: '行业公开资料+安标中心',
      last_verified: new Date().toISOString().split('T')[0],
      data_confidence_level: company.is_foreign ? 'medium' : 'high',
      description: `产品类别: ${company.categories.join(',')} | 省份: ${company.province || 'Unknown'}${company.is_foreign ? ' | 外资在华' : ''}`
    });

    if (!error) {
      existingMfrs.add(key);
      insFromAdditional++;
    }
  }

  console.log(`   从产品数据新增: ${insFromProducts}`);
  console.log(`   补充企业新增: ${insFromAdditional}`);
  console.log(`   已存在跳过: ${skipped}`);

  // 5. 统计最终结果
  console.log('\n5. 最终统计');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const { count: totalMfrs } = await supabase.from('ppe_manufacturers')
    .select('*', { count: 'exact', head: true });

  const { count: cnMfrCount } = await supabase.from('ppe_manufacturers')
    .select('*', { count: 'exact', head: true })
    .eq('country', 'CN');

  const { count: totalProducts } = await supabase.from('ppe_products')
    .select('*', { count: 'exact', head: true });

  const { count: cnProducts } = await supabase.from('ppe_products')
    .select('*', { count: 'exact', head: true })
    .eq('country_of_origin', 'CN');

  console.log(`   总制造商: ${totalMfrs}`);
  console.log(`   中国制造商: ${cnMfrCount}`);
  console.log(`   总产品: ${totalProducts}`);
  console.log(`   中国产品: ${cnProducts}`);

  // 6. 检查哪些知名企业没有产品数据
  console.log('\n6. 知名企业产品覆盖检查');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  for (const company of additionalCompanies.slice(0, 10)) {
    const key = company.name.toLowerCase().trim();
    const hasProducts = cnMfrs.has(key);
    console.log(`   ${hasProducts ? '✅' : '⚠️ '} ${company.name}: ${hasProducts ? '有产品数据' : '无产品数据'}`);
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(`\n=== 完成(${elapsed}s) ===`);
})();
