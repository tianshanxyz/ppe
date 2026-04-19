/**
 * PPE数据扩展提取脚本 v2 - 使用all_products视图
 * 从all_products视图提取更全面的PPE数据
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase 客户端配置
const supabaseUrl = 'https://tiosujipxpvivdjmwtfa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpb3N1amlweHB2aXZkam13dGZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MDQ3MDEsImV4cCI6MjA4NTQ4MDcwMX0.u6_dYapbthkcTppJWONF91W6-MLMBR4DqymQXAxEyTQ';

const supabase = createClient(supabaseUrl, supabaseKey);

// 扩展的PPE关键词库（中英文）
const extendedPpeKeywords = {
  HEAD_PROTECTION: [
    '安全帽', '安全头盔', '防冲击头盔', '防穿刺头盔', 'hard hat', 'safety helmet', 
    'helmets', 'safety helmets', 'hard hats', 'industrial helmets', 'construction helmets'
  ],
  EYE_FACIAL_PROTECTION: [
    '防护眼镜', '安全眼镜', '护目镜', '面罩', '焊接面罩', '护面', 'goggles', 
    'safety glasses', 'face shield', 'safety goggles', 'protective eyewear', 
    'welding helmet', 'welding face shield', 'safety face shield'
  ],
  RESPIRATORY_PROTECTION: [
    '口罩', 'N95', 'KN95', 'FFP2', 'FFP3', 'N100', 'P100', '呼吸器', '防尘口罩', 
    '防毒面具', '面罩', 'mask', 'respirator', 'N95 mask', 'KN95 mask', 
    'FFP2 mask', 'FFP3 mask', 'surgical mask', 'N95 respirator', 'air purifying respirator'
  ],
  BODY_PROTECTION: [
    '防护服', '防化服', '隔离衣', '手术衣', 'hazmat suit', 'protective clothing',
    'coveralls', 'suits', 'hazmat suits', 'chemical protective clothing',
    'fire resistant clothing', 'flame resistant clothing', 'anti-static clothing',
    'high visibility clothing', 'hi-vis clothing', 'safety vests', 'reflective vests'
  ],
  HAND_PROTECTION: [
    '手套', '防护手套', '安全手套', '医用手套', '检查手套', '手术手套', 'gloves',
    'safety gloves', 'medical gloves', 'nitrile gloves', 'latex gloves', 'vinyl gloves',
    'cut resistant gloves', 'chemical resistant gloves', 'heat resistant gloves',
    'welding gloves', 'industrial gloves'
  ],
  FOOT_PROTECTION: [
    '安全鞋', '防护鞋', '安全靴', '防砸鞋', '防刺穿鞋', 'safety shoes', 'protective footwear',
    'safety boots', 'steel toe boots', 'steel toe shoes', 'safety sneakers',
    'anti-static shoes', 'electrical hazard shoes', 'chemical resistant boots'
  ],
  FALL_PROTECTION: [
    '安全带', '安全绳', '安全索', '安全钩', 'harness', 'safety belt', 'safety rope',
    'safety line', 'fall arrest harness', 'fall protection system', 'lanyard',
    'anchor point', 'safety harness', 'descender', 'rescue harness'
  ],
  HEARING_PROTECTION: [
    '耳塞', '耳罩', '防噪耳塞', '降噪耳罩', 'hearing protection', 'earplugs',
    'earmuffs', 'safety earplugs', 'noise earplugs', 'hearing conservation',
    'ear protection', 'ear muffs', 'ear plugs'
  ],
  HIGH_VISIBILITY: [
    '反光衣', '高可视服装', '高可见度服装', '反光背心', 'hi-vis clothing',
    'high visibility clothing', 'safety vests', 'reflective vests', 'warning vests',
    'safety jackets', 'safety coats', 'safety suits'
  ],
  FIRE_FIGHTING: [
    '消防服', '灭火服', '消防头盔', '消防手套', '消防靴', 'firefighting equipment',
    'fire suit', 'fire helmet', 'fire gloves', 'fire boots', 'firefighter gear',
    'structural firefighting gear', 'wildland firefighting gear'
  ],
  WELDING_PROTECTION: [
    '焊接手套', '焊接面罩', '焊接服', '焊接防护服', 'welding gloves', 'welding helmet',
    'welding jacket', 'welding apron', 'welding sleeves', 'welding protection',
    'welding gear', 'welding equipment'
  ],
  COLD_WEATHER: [
    '保温服', '防寒服', '保暖服', '冷防护服', 'cold weather gear', 'thermal clothing',
    'winter gear', 'cold protection clothing', 'arctic gear', 'insulated clothing',
    'frost protection clothing', 'cold resistant clothing'
  ],
  DIVING_PROTECTION: [
    '潜水服', '水肺装备', '湿式潜水服', '干式潜水服', 'wetsuit', 'dive suit',
    'scuba gear', 'scuba equipment', 'diving equipment', 'snorkeling gear',
    'dive mask', 'dive fins', 'dive regulator'
  ],
  ELECTRICAL_PROTECTION: [
    '电绝缘手套', '电弧防护', '电气安全', '绝缘手套', 'electrical protection',
    'insulated gloves', 'electric arc protection', 'electrical safety gear',
    'live working gloves', 'electrical gloves', 'insulating gloves'
  ],
  MEDICAL_PROTECTION: [
    '医用防护服', '隔离衣', '手术衣', '医用手套', '医用口罩', '医用帽', '医用鞋套',
    'medical protective equipment', 'medical protective clothing', 'surgical gowns',
    'surgical masks', 'medical gloves', 'surgical caps', 'surgical shoe covers'
  ],
  INDUSTRIAL_PROTECTION: [
    '工业安全', '工业防护', '工厂防护', 'industrial safety', 'industrial protective',
    'factory safety', 'workplace safety', 'occupational safety', 'industrial equipment'
  ],
  SAFETY_EQUIPMENT: [
    '安全装备', '防护设备', '安全设备', 'safety equipment', 'protective equipment',
    'safety gear', 'protective gear', 'safety devices', 'safety products'
  ],
  LABOR_PROTECTION: [
    '劳保用品', '劳动保护', '职业防护', 'labor protection', 'occupational protection',
    'work protection', 'safety supplies', 'protective supplies'
  ]
};

// 扩展的国家/地区关键词
const countryKeywords = {
  EU: ['欧盟', '欧洲', 'CE', 'EU', 'EN', '欧盟'],
  US: ['美国', 'FDA', 'USA', 'US', 'NIOSH', 'ANSI'],
  CN: ['中国', 'NMPA', 'CFDA', 'GB', '中国'],
  JP: ['日本', 'PMDA', 'PMD Act', '日本'],
  AU: ['澳大利亚', 'TGA', 'Australia', 'AU', 'AS/NZS'],
  UK: ['英国', 'UKCA', 'UK', '欧洲'],
  CA: ['加拿大', 'Health Canada', 'Canada', 'CA'],
  KR: ['韩国', 'MFDS', 'Korea', 'KR'],
  BR: ['巴西', 'ANVISA', 'Brazil', 'BR'],
  IN: ['印度', 'CDSCO', 'India', 'IN'],
  SA: ['沙特', 'SFDA', 'Saudi Arabia', 'SA'],
  SG: ['新加坡', 'HSA', 'Singapore', 'SG'],
  MY: ['马来西亚', 'Malaysia', 'MY'],
  TH: ['泰国', 'Thailand', 'TH'],
  VN: ['越南', 'Vietnam', 'VN'],
  PH: ['菲律宾', 'Philippines', 'PH'],
  ID: ['印度尼西亚', 'Indonesia', 'ID'],
  TW: ['台湾', 'TFDA', 'Taiwan', 'TW'],
  HK: ['香港', 'Hong Kong', 'HK'],
  MO: ['澳门', 'Macao', 'MO']
};

// 扩展的PPE法规关键词
const ppeRegulationKeywords = [
  'PPE', 'personal protective equipment', '个人防护装备', '防护装备',
  '欧盟PPE法规', 'EU PPE', 'EU 2016/425', 'CE认证', 'CE marking',
  'FDA PPE', 'NIOSH认证', 'NMPA PPE', 'GB标准',
  '日本PPE', 'PMDA', '韩国PPE', 'MFDS',
  '澳大利亚PPE', 'TGA', '加拿大PPE', 'Health Canada',
  '沙特PPE', 'SFDA', '新加坡PPE', 'HSA',
  '防护服标准', '手套标准', '口罩标准', '安全帽标准',
  '呼吸器标准', '安全鞋标准', '安全带标准', '耳塞标准'
];

// 从all_products视图提取PPE数据
async function extractFromAllProducts() {
  console.log('\n=== 从all_products视图提取PPE数据 ===\n');
  
  const allPPEProducts = [];
  
  // 分批提取数据
  const batchSize = 500;
  const totalBatches = 10; // 提取5000条记录
  
  for (let i = 0; i < totalBatches; i++) {
    console.log(`\n提取批次 ${i + 1}/${totalBatches}...`);
    
    const { data: products, error } = await supabase
      .from('all_products')
      .select('*')
      .range(i * batchSize, (i + 1) * batchSize - 1);
    
    if (error) {
      console.error(`批次 ${i + 1} 提取错误:`, error);
      continue;
    }
    
    if (!products || products.length === 0) {
      console.log(`批次 ${i + 1} 无数据`);
      continue;
    }
    
    console.log(`批次 ${i + 1} 提取了 ${products.length} 条记录`);
    
    // 过滤PPE相关产品
    for (const product of products) {
      const productName = (product.name || '').toLowerCase();
      const productDesc = (product.description || '').toLowerCase();
      const productSource = (product.source || '').toLowerCase();
      
      // 检查是否包含PPE关键词
      let isPPE = false;
      let ppeCategory = null;
      
      for (const [category, keywords] of Object.entries(extendedPpeKeywords)) {
        for (const keyword of keywords) {
          if (productName.includes(keyword.toLowerCase()) || 
              productDesc.includes(keyword.toLowerCase())) {
            isPPE = true;
            ppeCategory = category;
            break;
          }
        }
        if (isPPE) break;
      }
      
      if (isPPE) {
        const ppeProduct = {
          product_name: product.name,
          product_code: product.source_id,
          manufacturer_name: getManufacturerFromMetadata(product.metadata),
          source: product.source,
          source_id: product.source_id,
          registration_date: product.registration_date,
          status: product.status,
          device_classification: product.device_classification,
          ppe_category: ppeCategory,
          market: getMarketFromSource(product.source),
          description: product.description
        };
        allPPEProducts.push(ppeProduct);
      }
    }
  }
  
  console.log(`\nall_products 提取完成: ${allPPEProducts.length} 条PPE产品`);
  return allPPEProducts;
}

// 从metadata中提取制造商名称
function getManufacturerFromMetadata(metadata) {
  if (!metadata) return '';
  
  try {
    const metaObj = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
    if (metaObj.manufacturer) return metaObj.manufacturer;
    if (metaObj.applicant) return metaObj.applicant;
    return '';
  } catch (e) {
    return '';
  }
}

// 从source获取市场
function getMarketFromSource(source) {
  if (!source) return 'Unknown';
  
  if (source === 'fda_510k' || source === 'fda_pma') return 'US';
  if (source === 'nmpa') return 'CN';
  if (source === 'eudamed') return 'EU';
  
  return 'Unknown';
}

// 从Regulations提取PPE法规数据
async function extractFromRegulations() {
  console.log('\n=== 从Regulations提取PPE法规数据 ===\n');
  
  const allPPERegulations = [];
  
  const { data: regulations, error } = await supabase
    .from('regulations')
    .select('*')
    .limit(1000);
  
  if (error) {
    console.error('提取错误:', error);
    return allPPERegulations;
  }
  
  console.log(`提取了 ${regulations.length} 条法规记录`);
  
  // 过滤PPE相关法规
  for (const reg of regulations) {
    const regTitle = (reg.title || '').toLowerCase();
    const regTitleZh = (reg.title_zh || '').toLowerCase();
    const keywords = (reg.keywords || []).map(k => k.toLowerCase());
    
    // 检查是否包含PPE法规关键词
    let isPPE = false;
    
    for (const keyword of ppeRegulationKeywords) {
      if (regTitle.includes(keyword.toLowerCase()) || 
          regTitleZh.includes(keyword.toLowerCase()) ||
          keywords.some(k => k.includes(keyword.toLowerCase()))) {
        isPPE = true;
        break;
      }
    }
    
    if (isPPE) {
      const regulation = {
        regulation_name: reg.title,
        regulation_name_en: reg.title,
        regulation_name_zh: reg.title_zh,
        regulation_type: reg.type,
        jurisdiction: reg.jurisdiction,
        category: reg.category,
        effective_date: reg.effective_date,
        content: reg.content,
        keywords: reg.keywords,
        source_url: reg.attachments?.html_url || reg.attachments?.pdf_url,
        source: 'regulations'
      };
      allPPERegulations.push(regulation);
    }
  }
  
  console.log(`\nRegulations 提取完成: ${allPPERegulations.length} 条PPE法规`);
  return allPPERegulations;
}

// 从Companies提取PPE企业数据
async function extractFromCompanies() {
  console.log('\n=== 从Companies提取PPE企业数据 ===\n');
  
  const allPPEManufacturers = [];
  
  const { data: companies, error } = await supabase
    .from('companies')
    .select('*')
    .limit(2000);
  
  if (error) {
    console.error('提取错误:', error);
    return allPPEManufacturers;
  }
  
  console.log(`提取了 ${companies.length} 条企业记录`);
  
  // 过滤PPE相关企业
  for (const company of companies) {
    const companyName = (company.name || '').toLowerCase();
    const companyNameZh = (company.name_zh || '').toLowerCase();
    const description = (company.description || '').toLowerCase();
    const descriptionZh = (company.description_zh || '').toLowerCase();
    
    // 检查是否包含PPE关键词
    let isPPE = false;
    
    for (const [category, keywords] of Object.entries(extendedPpeKeywords)) {
      for (const keyword of keywords) {
        if (companyName.includes(keyword.toLowerCase()) || 
            companyNameZh.includes(keyword.toLowerCase()) ||
            description.includes(keyword.toLowerCase()) ||
            descriptionZh.includes(keyword.toLowerCase())) {
          isPPE = true;
          break;
        }
      }
      if (isPPE) break;
    }
    
    if (isPPE) {
      const manufacturer = {
        company_name: company.name,
        company_name_en: company.name,
        company_name_zh: company.name_zh,
        country: company.country,
        address: company.address,
        website: company.website,
        email: company.email,
        phone: company.phone,
        business_type: 'manufacturer',
        certifications: company.certifications || [],
        description: company.description,
        description_en: company.description,
        description_zh: company.description_zh,
        source: 'companies'
      };
      allPPEManufacturers.push(manufacturer);
    }
  }
  
  console.log(`\nCompanies 提取完成: ${allPPEManufacturers.length} 条PPE企业`);
  return allPPEManufacturers;
}

// 数据清洗和转换
async function transformData(allProducts, allManufacturers, allRegulations) {
  console.log('\n=== 数据清洗和转换 ===\n');
  
  // 清洗PPE产品数据
  console.log('1. 清洗PPE产品数据...');
  
  const cleanedProducts = allProducts.map(product => {
    // 确定PPE类别
    let productCategory = '其他';
    let subCategory = '其他';
    let ppeCategory = 'II';
    
    const productName = (product.product_name || '').toLowerCase();
    const description = (product.description || '').toLowerCase();
    
    for (const [category, config] of Object.entries(extendedPpeKeywords)) {
      for (const keyword of config) {
        if (productName.includes(keyword.toLowerCase()) || 
            description.includes(keyword.toLowerCase())) {
          // 根据类别设置
          if (category === 'HEAD_PROTECTION') {
            productCategory = '头部防护装备';
            subCategory = '安全帽';
            ppeCategory = 'II';
          } else if (category === 'EYE_FACIAL_PROTECTION') {
            productCategory = '眼面部防护装备';
            subCategory = '防护眼镜/面罩';
            ppeCategory = 'II';
          } else if (category === 'RESPIRATORY_PROTECTION') {
            productCategory = '呼吸防护装备';
            subCategory = '口罩/呼吸器';
            ppeCategory = 'III';
          } else if (category === 'BODY_PROTECTION') {
            productCategory = '身体防护装备';
            subCategory = '防护服';
            ppeCategory = 'II';
          } else if (category === 'HAND_PROTECTION') {
            productCategory = '手部防护装备';
            subCategory = '手套';
            ppeCategory = 'II';
          } else if (category === 'FOOT_PROTECTION') {
            productCategory = '足部防护装备';
            subCategory = '安全鞋';
            ppeCategory = 'II';
          } else if (category === 'FALL_PROTECTION') {
            productCategory = '坠落防护装备';
            subCategory = '安全带/安全绳';
            ppeCategory = 'III';
          } else if (category === 'HEARING_PROTECTION') {
            productCategory = '听力防护装备';
            subCategory = '耳塞/耳罩';
            ppeCategory = 'II';
          } else if (category === 'HIGH_VISIBILITY') {
            productCategory = '高可视警示装备';
            subCategory = '高可视服装';
            ppeCategory = 'II';
          } else if (category === 'FIRE_FIGHTING') {
            productCategory = '消防专用防护装备';
            subCategory = '消防装备';
            ppeCategory = 'III';
          } else if (category === 'WELDING_PROTECTION') {
            productCategory = '焊接防护装备';
            subCategory = '焊接防护';
            ppeCategory = 'II';
          } else if (category === 'COLD_WEATHER') {
            productCategory = '低温环境防护装备';
            subCategory = '防寒服';
            ppeCategory = 'I';
          } else if (category === 'DIVING_PROTECTION') {
            productCategory = '潜水防护装备';
            subCategory = '潜水服';
            ppeCategory = 'II';
          } else if (category === 'ELECTRICAL_PROTECTION') {
            productCategory = '电气防护装备';
            subCategory = '电绝缘装备';
            ppeCategory = 'III';
          } else if (category === 'MEDICAL_PROTECTION') {
            productCategory = '医疗防护装备';
            subCategory = '医用防护';
            ppeCategory = 'II';
          }
          break;
        }
      }
    }
    
    // 确定目标市场
    const targetMarkets = [];
    if (product.source === 'fda_510k' || product.source === 'fda_pma') targetMarkets.push('US');
    if (product.source === 'nmpa') targetMarkets.push('CN');
    if (product.source === 'eudamed') targetMarkets.push('EU');
    
    // 获取制造商国家
    const manufacturerCountry = getCountryFromName(product.manufacturer_name);
    
    return {
      product_name: product.product_name,
      product_code: product.product_code,
      product_category: productCategory,
      sub_category: subCategory,
      ppe_category: ppeCategory,
      manufacturer_name: product.manufacturer_name,
      manufacturer_country: manufacturerCountry,
      brand_name: getBrandFromName(product.manufacturer_name),
      source: product.source,
      source_id: product.source_id,
      registration_date: product.registration_date,
      status: product.status,
      device_classification: product.device_classification,
      target_markets: targetMarkets,
      description: product.description,
      created_at: new Date().toISOString()
    };
  });
  
  // 清洗PPE企业数据
  console.log('2. 清洗PPE企业数据...');
  const cleanedManufacturers = allManufacturers.map(manufacturer => {
    return {
      company_name: manufacturer.company_name,
      company_name_en: manufacturer.company_name_en,
      company_name_zh: manufacturer.company_name_zh,
      country: manufacturer.country,
      address: manufacturer.address,
      website: manufacturer.website,
      email: manufacturer.email,
      phone: manufacturer.phone,
      business_type: manufacturer.business_type,
      certifications: manufacturer.certifications,
      description: manufacturer.description,
      description_en: manufacturer.description_en,
      description_zh: manufacturer.description_zh,
      source: manufacturer.source,
      created_at: new Date().toISOString()
    };
  });
  
  // 清洗PPE法规数据
  console.log('3. 清洗PPE法规数据...');
  const cleanedRegulations = allRegulations.map(regulation => {
    return {
      regulation_name: regulation.regulation_name,
      regulation_name_en: regulation.regulation_name_en,
      regulation_name_zh: regulation.regulation_name_zh,
      regulation_type: regulation.regulation_type,
      jurisdiction: regulation.jurisdiction,
      category: regulation.category,
      effective_date: regulation.effective_date,
      content: regulation.content,
      keywords: regulation.keywords,
      source_url: regulation.source_url,
      source: regulation.source,
      created_at: new Date().toISOString()
    };
  });
  
  console.log(`\n清洗后数据统计:`);
  console.log(`  PPE产品: ${cleanedProducts.length} 条`);
  console.log(`  PPE企业: ${cleanedManufacturers.length} 条`);
  console.log(`  PPE法规: ${cleanedRegulations.length} 条`);
  
  return { products: cleanedProducts, manufacturers: cleanedManufacturers, regulations: cleanedRegulations };
}

// 辅助函数：从公司名称中获取国家
function getCountryFromName(name) {
  if (!name) return 'Unknown';
  
  const nameLower = name.toLowerCase();
  if (nameLower.includes('china') || nameLower.includes('cn') || nameLower.includes('中国')) return 'CN';
  if (nameLower.includes('usa') || nameLower.includes('us') || nameLower.includes('america')) return 'US';
  if (nameLower.includes('europe') || nameLower.includes('eu') || nameLower.includes('德国') || nameLower.includes('法国')) return 'EU';
  if (nameLower.includes('japan') || nameLower.includes('jp') || nameLower.includes('日本')) return 'JP';
  if (nameLower.includes('australia') || nameLower.includes('au') || nameLower.includes('澳大利亚')) return 'AU';
  if (nameLower.includes('canada') || nameLower.includes('ca') || nameLower.includes('加拿大')) return 'CA';
  if (nameLower.includes('korea') || nameLower.includes('kr') || nameLower.includes('韩国')) return 'KR';
  if (nameLower.includes('singapore') || nameLower.includes('sg') || nameLower.includes('新加坡')) return 'SG';
  if (nameLower.includes('taiwan') || nameLower.includes('tw') || nameLower.includes('台湾')) return 'TW';
  if (nameLower.includes('hong kong') || nameLower.includes('hk') || nameLower.includes('香港')) return 'HK';
  if (nameLower.includes('macao') || nameLower.includes('mo') || nameLower.includes('澳门')) return 'MO';
  
  return 'Unknown';
}

// 辅助函数：从公司名称中获取品牌
function getBrandFromName(name) {
  if (!name) return '';
  
  const parts = name.split(' ');
  if (parts.length > 1) {
    return parts[0];
  }
  
  return name;
}

// 数据分析和统计
async function analyzeData(products) {
  console.log('\n=== 数据分析和统计 ===\n');
  
  // 按类别统计
  const categoryStats = {};
  products.forEach(product => {
    const category = product.product_category || '其他';
    if (!categoryStats[category]) {
      categoryStats[category] = 0;
    }
    categoryStats[category]++;
  });
  
  console.log('1. PPE产品类别分布:');
  Object.entries(categoryStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      console.log(`  ${category}: ${count} 条`);
    });
  
  // 按PPE类别统计
  const ppeCategoryStats = {};
  products.forEach(product => {
    const ppeCat = product.ppe_category || 'II';
    if (!ppeCategoryStats[ppeCat]) {
      ppeCategoryStats[ppeCat] = 0;
    }
    ppeCategoryStats[ppeCat]++;
  });
  
  console.log('\n2. PPE风险类别分布:');
  Object.entries(ppeCategoryStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`  Category ${cat}: ${count} 条`);
    });
  
  // 按市场统计
  const marketStats = {};
  products.forEach(product => {
    const markets = product.target_markets || [];
    markets.forEach(market => {
      if (!marketStats[market]) {
        marketStats[market] = 0;
      }
      marketStats[market]++;
    });
  });
  
  console.log('\n3. 目标市场分布:');
  Object.entries(marketStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([market, count]) => {
      console.log(`  ${market}: ${count} 条`);
    });
  
  // 按国家统计
  const countryStats = {};
  products.forEach(product => {
    const country = product.manufacturer_country || 'Unknown';
    if (!countryStats[country]) {
      countryStats[country] = 0;
    }
    countryStats[country]++;
  });
  
  console.log('\n4. 制造商国家分布:');
  Object.entries(countryStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([country, count]) => {
      console.log(`  ${country}: ${count} 条`);
    });
  
  // 按数据源统计
  const sourceStats = {};
  products.forEach(product => {
    const source = product.source || 'Unknown';
    if (!sourceStats[source]) {
      sourceStats[source] = 0;
    }
    sourceStats[source]++;
  });
  
  console.log('\n5. 数据源分布:');
  Object.entries(sourceStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([source, count]) => {
      console.log(`  ${source}: ${count} 条`);
    });
}

// 主函数
async function main() {
  console.log('开始扩展PPE数据提取 v2...\n');
  
  // 从all_products视图提取数据
  const allProducts = await extractFromAllProducts();
  
  // 从Regulations提取法规数据
  const regulations = await extractFromRegulations();
  
  // 从Companies提取企业数据
  const manufacturers = await extractFromCompanies();
  
  console.log(`\n合并后产品总数: ${allProducts.length} 条`);
  console.log(`合并后法规总数: ${regulations.length} 条`);
  console.log(`合并后企业总数: ${manufacturers.length} 条`);
  
  // 保存原始提取数据
  fs.writeFileSync('data/ppe_products_extracted_v2.json', JSON.stringify(allProducts, null, 2));
  fs.writeFileSync('data/ppe_manufacturers_extracted_v2.json', JSON.stringify(manufacturers, null, 2));
  fs.writeFileSync('data/ppe_regulations_extracted_v2.json', JSON.stringify(regulations, null, 2));
  
  console.log('\n已保存原始提取数据:');
  console.log('  data/ppe_products_extracted_v2.json');
  console.log('  data/ppe_manufacturers_extracted_v2.json');
  console.log('  data/ppe_regulations_extracted_v2.json');
  
  // 清洗和转换数据
  const cleanedData = await transformData(allProducts, manufacturers, regulations);
  
  // 保存清洗后的数据
  fs.writeFileSync('data/ppe_products_cleaned_v2.json', JSON.stringify(cleanedData.products, null, 2));
  fs.writeFileSync('data/ppe_manufacturers_cleaned_v2.json', JSON.stringify(cleanedData.manufacturers, null, 2));
  fs.writeFileSync('data/ppe_regulations_cleaned_v2.json', JSON.stringify(cleanedData.regulations, null, 2));
  
  console.log('\n已保存清洗后的数据:');
  console.log('  data/ppe_products_cleaned_v2.json');
  console.log('  data/ppe_manufacturers_cleaned_v2.json');
  console.log('  data/ppe_regulations_cleaned_v2.json');
  
  // 分析数据
  await analyzeData(cleanedData.products);
  
  console.log('\n\nPPE数据扩展提取 v2 完成！');
  console.log('\n生成的文件:');
  console.log('  data/ppe_products_extracted_v2.json - 原始提取数据');
  console.log('  data/ppe_manufacturers_extracted_v2.json - 原始提取数据');
  console.log('  data/ppe_regulations_extracted_v2.json - 原始提取数据');
  console.log('  data/ppe_products_cleaned_v2.json - 清洗后数据');
  console.log('  data/ppe_manufacturers_cleaned_v2.json - 清洗后数据');
  console.log('  data/ppe_regulations_cleaned_v2.json - 清洗后数据');
}

// 运行主函数
main().catch(console.error);