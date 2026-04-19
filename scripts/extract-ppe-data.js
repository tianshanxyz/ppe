// 提取PPE相关数据脚本
const { createClient } = require('@supabase/supabase-js');

// Supabase 客户端配置
const supabaseUrl = 'https://tiosujipxpvivdjmwtfa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpb3N1amlweHB2aXZkam13dGZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MDQ3MDEsImV4cCI6MjA4NTQ4MDcwMX0.u6_dYapbthkcTppJWONF91W6-MLMBR4DqymQXAxEyTQ';

const supabase = createClient(supabaseUrl, supabaseKey);

// PPE关键词列表
const ppeKeywords = [
  'PPE', 'personal protective equipment', '防护装备', '个人防护',
  '安全帽', '安全头盔', 'helmets', 'safety helmets',
  '防护眼镜', '面罩', 'goggles', 'face shield', 'safety glasses',
  '口罩', '呼吸防护', 'mask', 'respirator', 'N95', 'KN95',
  '防护服', '防护衣', 'protective clothing', 'hazmat suit',
  '手套', 'gloves', '防切割手套', '防化手套',
  '安全鞋', '防护鞋', 'safety shoes', 'protective footwear',
  '安全带', '安全绳', 'safety belt', 'safety rope', 'fall arrest',
  '耳塞', '耳罩', ' hearing protection', 'earplugs',
  '高可视服装', '反光衣', 'high visibility', 'hi-vis',
  '消防装备', 'firefighting equipment',
  '防坠落', 'fall protection', 'life jacket',
  '焊接防护', 'welding gloves', 'welding helmet',
  '阻燃服', '防火服', 'fire resistant', 'flame resistant',
  '防静电服', '防化服', 'chemical resistant',
  '保温服', '防寒服', 'cold weather gear',
  '潜水服', 'wetsuit', 'dive suit'
];

// 检查数据库表结构
async function checkTableStructure() {
  console.log('=== 检查数据库表结构 ===\n');

  // 检查 regulations 表
  console.log('1. regulations 表结构:');
  const { data: regulationsColumns, error: regError } = await supabase
    .from('regulations')
    .select('*')
    .limit(1);

  if (regError) {
    console.error('查询 regulations 表错误:', regError);
  } else {
    console.log('regulations 表存在，字段:', Object.keys(regulationsColumns[0] || {}));
  }

  // 检查 companies 表
  console.log('\n2. companies 表结构:');
  const { data: companiesColumns, error: companiesError } = await supabase
    .from('companies')
    .select('*')
    .limit(1);

  if (companiesError) {
    console.error('查询 companies 表错误:', companiesError);
  } else {
    console.log('companies 表存在，字段:', Object.keys(companiesColumns[0] || {}));
  }

  // 检查 all_products 视图
  console.log('\n3. all_products 视图结构:');
  const { data: productsColumns, error: productsError } = await supabase
    .from('all_products')
    .select('*')
    .limit(1);

  if (productsError) {
    console.error('查询 all_products 视图错误:', productsError);
  } else {
    console.log('all_products 视图存在，字段:', Object.keys(productsColumns[0] || {}));
  }

  // 检查 fda_510k 表
  console.log('\n4. fda_510k 表结构:');
  const { data: fdaColumns, error: fdaError } = await supabase
    .from('fda_510k')
    .select('*')
    .limit(1);

  if (fdaError) {
    console.error('查询 fda_510k 表错误:', fdaError);
  } else {
    console.log('fda_510k 表存在，字段:', Object.keys(fdaColumns[0] || {}));
  }

  // 检查 nmpa_registrations 表
  console.log('\n5. nmpa_registrations 表结构:');
  const { data: nmpaColumns, error: nmpaError } = await supabase
    .from('nmpa_registrations')
    .select('*')
    .limit(1);

  if (nmpaError) {
    console.error('查询 nmpa_registrations 表错误:', nmpaError);
  } else {
    console.log('nmpa_registrations 表存在，字段:', Object.keys(nmpaColumns[0] || {}));
  }
}

// 搜索PPE相关法规
async function searchPPERegulations() {
  console.log('\n\n=== 搜索PPE相关法规 ===\n');

  for (const keyword of ppeKeywords.slice(0, 5)) { // 只搜索前5个关键词作为示例
    console.log(`\n搜索关键词: ${keyword}`);
    
    const { data, error, count } = await supabase
      .from('regulations')
      .select('id, title, title_zh, jurisdiction, type, category, effective_date, content, keywords, created_at', { count: 'exact' })
      .or(`title.ilike.%${keyword}%,title_zh.ilike.%${keyword}%,content.ilike.%${keyword}%,keywords.cs.{${keyword}}`)
      .limit(5);

    if (error) {
      console.error('查询错误:', error);
    } else if (data && data.length > 0) {
      console.log(`找到 ${count} 条相关记录（显示前5条）:`);
      data.forEach((reg, index) => {
        console.log(`  ${index + 1}. [${reg.jurisdiction}] ${reg.title}`);
        console.log(`     类型: ${reg.type}, 分类: ${reg.category}`);
        console.log(`     生效日期: ${reg.effective_date}`);
      });
    } else {
      console.log('未找到相关记录');
    }
  }
}

// 搜索PPE相关产品
async function searchPPEProducts() {
  console.log('\n\n=== 搜索PPE相关产品 ===\n');

  for (const keyword of ppeKeywords.slice(0, 5)) { // 只搜索前5个关键词作为示例
    console.log(`\n搜索关键词: ${keyword}`);
    
    const { data, error, count } = await supabase
      .from('all_products')
      .select('id, name, name_en, company_name, product_code, device_classification, approval_date, market, source', { count: 'exact' })
      .ilike('name', `%${keyword}%`)
      .limit(5);

    if (error) {
      console.error('查询错误:', error);
    } else if (data && data.length > 0) {
      console.log(`找到 ${count} 条相关记录（显示前5条）:`);
      data.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name}`);
        console.log(`     公司: ${product.company_name}`);
        console.log(`     市场: ${product.market}, 来源: ${product.source}`);
      });
    } else {
      console.log('未找到相关记录');
    }
  }
}

// 搜索PPE相关企业
async function searchPPECompanies() {
  console.log('\n\n=== 搜索PPE相关企业 ===\n');

  const keywords = ['防护', '安全', 'PPE', '安全帽', '口罩', '手套', '防护服'];

  for (const keyword of keywords.slice(0, 3)) {
    console.log(`\n搜索关键词: ${keyword}`);
    
    const { data, error, count } = await supabase
      .from('companies')
      .select('id, name, legal_name, country, description, website', { count: 'exact' })
      .ilike('name', `%${keyword}%`)
      .limit(5);

    if (error) {
      console.error('查询错误:', error);
    } else if (data && data.length > 0) {
      console.log(`找到 ${count} 条相关记录（显示前5条）:`);
      data.forEach((company, index) => {
        console.log(`  ${index + 1}. ${company.name}`);
        console.log(`     国家: ${company.country}`);
        console.log(`     描述: ${company.description?.substring(0, 100) || 'N/A'}`);
      });
    } else {
      console.log('未找到相关记录');
    }
  }
}

// 导出数据到JSON
async function exportPPEData() {
  console.log('\n\n=== 导出PPE相关数据 ===\n');

  // 导出PPE法规
  console.log('导出PPE法规...');
  const { data: regulations, error: regError } = await supabase
    .from('regulations')
    .select('*')
    .or(`title.ilike.%PPE%,title.ilike.%防护%,title.ilike.%安全%,title.ilike.%口罩%,title.ilike.%手套%,title.ilike.%防护服%,title.ilike.%安全帽%,title.ilike.%呼吸%,title.ilike.%耳塞%,title.ilike.%高可视%`)
    .limit(100);

  if (regError) {
    console.error('导出法规错误:', regError);
  } else {
    console.log(`找到 ${regulations?.length || 0} 条PPE相关法规`);
    if (regulations && regulations.length > 0) {
      const fs = require('fs');
      fs.writeFileSync('data/ppe_regulations.json', JSON.stringify(regulations, null, 2));
      console.log('已导出到 data/ppe_regulations.json');
    }
  }

  // 导出PPE产品
  console.log('\n导出PPE产品...');
  const { data: products, error: prodError } = await supabase
    .from('all_products')
    .select('*')
    .ilike('name', '%防护%')
    .ilike('name', '%安全%')
    .ilike('name', '%口罩%')
    .limit(100);

  if (prodError) {
    console.error('导出产品错误:', prodError);
  } else {
    console.log(`找到 ${products?.length || 0} 条PPE相关产品`);
    if (products && products.length > 0) {
      const fs = require('fs');
      fs.writeFileSync('data/ppe_products.json', JSON.stringify(products, null, 2));
      console.log('已导出到 data/ppe_products.json');
    }
  }

  // 导出PPE企业
  console.log('\n导出PPE企业...');
  const { data: companies, error: compError } = await supabase
    .from('companies')
    .select('*')
    .ilike('name', '%防护%')
    .ilike('name', '%安全%')
    .ilike('name', '%PPE%')
    .limit(100);

  if (compError) {
    console.error('导出企业错误:', compError);
  } else {
    console.log(`找到 ${companies?.length || 0} 条PPE相关企业`);
    if (companies && companies.length > 0) {
      const fs = require('fs');
      fs.writeFileSync('data/ppe_companies.json', JSON.stringify(companies, null, 2));
      console.log('已导出到 data/ppe_companies.json');
    }
  }
}

// 主函数
async function main() {
  console.log('开始提取PPE相关数据...\n');

  // 检查表结构
  await checkTableStructure();

  // 搜索PPE相关法规
  await searchPPERegulations();

  // 搜索PPE相关产品
  await searchPPEProducts();

  // 搜索PPE相关企业
  await searchPPECompanies();

  // 导出数据
  await exportPPEData();

  console.log('\n\n数据提取完成！');
}

// 运行主函数
main().catch(console.error);