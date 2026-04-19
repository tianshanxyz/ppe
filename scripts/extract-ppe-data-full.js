/**
 * PPE数据提取和整理脚本 - 完整版
 * 从现有数据库中提取PPE相关数据，转换为新的PPE数据表结构
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase 客户端配置
const supabaseUrl = 'https://tiosujipxpvivdjmwtfa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpb3N1amlweHB2aXZkam13dGZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MDQ3MDEsImV4cCI6MjA4NTQ4MDcwMX0.u6_dYapbthkcTppJWONF91W6-MLMBR4DqymQXAxEyTQ';

const supabase = createClient(supabaseUrl, supabaseKey);

// PPE分类映射
const ppeCategories = {
  HEAD_PROTECTION: {
    keywords: ['安全帽', 'helmets', 'safety helmets', 'hard hats', 'head protection'],
    ppeCategory: 'II',
    description: '头部防护装备'
  },
  EYE_FACIAL_PROTECTION: {
    keywords: ['防护眼镜', '面罩', 'goggles', 'face shield', 'safety glasses', 'eye protection', 'facial protection'],
    ppeCategory: 'II',
    description: '眼面部防护装备'
  },
  RESPIRATORY_PROTECTION: {
    keywords: ['口罩', '呼吸防护', 'mask', 'respirator', 'N95', 'KN95', 'FFP2', 'FFP3', 'respiratory protection'],
    ppeCategory: 'III',
    description: '呼吸防护装备'
  },
  BODY_PROTECTION: {
    keywords: ['防护服', 'protective clothing', 'hazmat suit', 'coveralls', 'suits', 'body protection'],
    ppeCategory: 'II',
    description: '身体防护装备'
  },
  HAND_PROTECTION: {
    keywords: ['手套', 'gloves', '防切割手套', '防化手套', 'safety gloves', 'hand protection'],
    ppeCategory: 'II',
    description: '手部防护装备'
  },
  FOOT_PROTECTION: {
    keywords: ['安全鞋', '防护鞋', 'safety shoes', 'protective footwear', 'boots', 'foot protection'],
    ppeCategory: 'II',
    description: '足部防护装备'
  },
  FALL_PROTECTION: {
    keywords: ['安全带', '安全绳', 'safety belt', 'safety rope', 'fall arrest', 'harness', 'fall protection'],
    ppeCategory: 'III',
    description: '坠落防护装备'
  },
  HEARING_PROTECTION: {
    keywords: ['耳塞', '耳罩', 'hearing protection', 'earplugs', 'earmuffs', 'noise protection'],
    ppeCategory: 'II',
    description: '听力防护装备'
  },
  HIGH_VISIBILITY: {
    keywords: ['高可视服装', '反光衣', 'high visibility', 'hi-vis', 'reflective clothing', 'safety vests'],
    ppeCategory: 'II',
    description: '高可视警示装备'
  },
  FIRE_FIGHTING: {
    keywords: ['消防装备', 'firefighting equipment', 'fire suit', 'fire helmet', 'fire gloves'],
    ppeCategory: 'III',
    description: '消防专用防护装备'
  },
  WELDING_PROTECTION: {
    keywords: ['焊接防护', 'welding gloves', 'welding helmet', 'welding jacket', 'welding protection'],
    ppeCategory: 'II',
    description: '焊接防护装备'
  },
  COLD_WEATHER: {
    keywords: ['保温服', '防寒服', 'cold weather gear', 'thermal clothing', 'winter gear'],
    ppeCategory: 'I',
    description: '低温环境防护装备'
  },
  DIVING_PROTECTION: {
    keywords: ['潜水服', 'wetsuit', 'dive suit', 'diving equipment'],
    ppeCategory: 'II',
    description: '潜水防护装备'
  },
  ELECTRICAL_PROTECTION: {
    keywords: ['电绝缘手套', 'electrical protection', 'insulated gloves', 'electric arc protection'],
    ppeCategory: 'III',
    description: '电气防护装备'
  }
};

// 提取PPE产品数据
async function extractPPEProducts() {
  console.log('\n=== 提取PPE产品数据 ===\n');

  const ppeProducts = [];

  // 从FDA 510k数据中提取
  console.log('1. 从FDA 510k数据中提取...');
  const { data: fdaProducts, error: fdaError } = await supabase
    .from('fda_510k')
    .select('*')
    .limit(1000);

  if (!fdaError && fdaProducts) {
    console.log(`找到 ${fdaProducts.length} 条FDA 510k记录`);

    // 分析FDA产品数据
    const ppeKeywords = [
      'safety', 'protective', 'guard', 'shield', 'helmet', 'glove', 
      'mask', 'respirator', 'goggles', 'vest', 'suit', 'boot',
      'earplug', 'earmuff', 'safety shoe', 'safety belt', 'harness'
    ];

    for (const product of fdaProducts) {
      const productName = (product.device_name || '').toLowerCase();
      const isPPE = ppeKeywords.some(keyword => productName.includes(keyword));

      if (isPPE) {
        const ppeProduct = {
          product_name: product.device_name,
          product_code: product.product_code,
          manufacturer_name: product.applicant,
          fda_k_number: product.k_number,
          fda_decision_date: product.decision_date,
          description: product.summary,
          market: 'FDA',
          source: 'fda_510k'
        };
        ppeProducts.push(ppeProduct);
      }
    }
  }

  // 从NMPA数据中提取
  console.log('\n2. 从NMPA数据中提取...');
  const { data: nmpaProducts, error: nmpaError } = await supabase
    .from('nmpa_registrations')
    .select('*')
    .limit(1000);

  if (!nmpaError && nmpaProducts) {
    console.log(`找到 ${nmpaProducts.length} 条NMPA记录`);

    const nmpaPpeKeywords = [
      '安全帽', '防护眼镜', '防护口罩', '防护服', '防护手套',
      '安全鞋', '安全带', '耳塞', '耳罩', '反光衣', '高可视',
      '消防装备', '焊接防护', '防寒服', '潜水服'
    ];

    for (const product of nmpaProducts) {
      const productName = (product.product_name || '').toLowerCase();
      const isPPE = nmpaPpeKeywords.some(keyword => productName.includes(keyword));

      if (isPPE) {
        const ppeProduct = {
          product_name: product.product_name,
          product_code: product.product_code,
          manufacturer_name: product.manufacturer_name,
          nmpa_registration_number: product.registration_number,
          approval_date: product.approval_date,
          description: product.description,
          market: 'NMPA',
          source: 'nmpa'
        };
        ppeProducts.push(ppeProduct);
      }
    }
  }

  // 从Regulations数据中提取
  console.log('\n3. 从Regulations数据中提取...');
  const { data: regulations, error: regError } = await supabase
    .from('regulations')
    .select('*')
    .limit(500);

  if (!regError && regulations) {
    console.log(`找到 ${regulations.length} 条法规记录`);

    const ppeRegulationKeywords = [
      'PPE', 'personal protective equipment', '防护装备', '安全帽', '防护眼镜',
      '口罩', '防护服', '手套', '安全鞋', '安全带', '耳塞', '耳罩'
    ];

    for (const reg of regulations) {
      const regTitle = (reg.title || '').toLowerCase();
      const isPPE = ppeRegulationKeywords.some(keyword => regTitle.includes(keyword));

      if (isPPE) {
        console.log(`PPE相关法规: ${reg.title}`);
      }
    }
  }

  console.log(`\n总计提取 ${ppeProducts.length} 条PPE产品数据`);

  // 保存到文件
  fs.writeFileSync('data/ppe_products_extracted.json', JSON.stringify(ppeProducts, null, 2));
  console.log('已保存到 data/ppe_products_extracted.json');

  return ppeProducts;
}

// 提取PPE企业数据
async function extractPPEManufacturers() {
  console.log('\n=== 提取PPE企业数据 ===\n');

  const ppeManufacturers = [];

  // 从Companies数据中提取
  const { data: companies, error: compError } = await supabase
    .from('companies')
    .select('*')
    .limit(1000);

  if (!compError && companies) {
    console.log(`找到 ${companies.length} 条企业记录`);

    const ppeCompanyKeywords = [
      '防护', '安全', 'PPE', 'protective', 'safety', 'helmets', 'gloves',
      'mask', 'respirator', 'goggles', 'suits', 'vests'
    ];

    for (const company of companies) {
      const companyName = (company.name || '').toLowerCase();
      const description = (company.description || '').toLowerCase();
      const isPPE = ppeCompanyKeywords.some(keyword => 
        companyName.includes(keyword) || description.includes(keyword)
      );

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
        ppeManufacturers.push(manufacturer);
      }
    }
  }

  console.log(`\n总计提取 ${ppeManufacturers.length} 条PPE企业数据`);

  // 保存到文件
  fs.writeFileSync('data/ppe_manufacturers_extracted.json', JSON.stringify(ppeManufacturers, null, 2));
  console.log('已保存到 data/ppe_manufacturers_extracted.json');

  return ppeManufacturers;
}

// 提取PPE法规数据
async function extractPPERegulations() {
  console.log('\n=== 提取PPE法规数据 ===\n');

  const ppeRegulations = [];

  // 从Regulations数据中提取
  const { data: regulations, error: regError } = await supabase
    .from('regulations')
    .select('*')
    .limit(1000);

  if (!regError && regulations) {
    console.log(`找到 ${regulations.length} 条法规记录`);

    const ppeRegulationKeywords = [
      'PPE', 'personal protective equipment', '防护装备', '安全帽', '防护眼镜',
      '口罩', '防护服', '手套', '安全鞋', '安全带', '耳塞', '耳罩', '高可视',
      '消防装备', '焊接防护', '防寒服', '潜水服'
    ];

    for (const reg of regulations) {
      const regTitle = (reg.title || '').toLowerCase();
      const isPPE = ppeRegulationKeywords.some(keyword => regTitle.includes(keyword));

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
        ppeRegulations.push(regulation);
      }
    }
  }

  console.log(`\n总计提取 ${ppeRegulations.length} 条PPE法规数据`);

  // 保存到文件
  fs.writeFileSync('data/ppe_regulations_extracted.json', JSON.stringify(ppeRegulations, null, 2));
  console.log('已保存到 data/ppe_regulations_extracted.json');

  return ppeRegulations;
}

// 数据清洗和转换
async function transformData() {
  console.log('\n=== 数据清洗和转换 ===\n');

  // 读取提取的数据
  const ppeProducts = JSON.parse(fs.readFileSync('data/ppe_products_extracted.json', 'utf8'));
  const ppeManufacturers = JSON.parse(fs.readFileSync('data/ppe_manufacturers_extracted.json', 'utf8'));
  const ppeRegulations = JSON.parse(fs.readFileSync('data/ppe_regulations_extracted.json', 'utf8'));

  // 清洗PPE产品数据
  console.log('1. 清洗PPE产品数据...');
  const cleanedProducts = ppeProducts.map(product => {
    // 确定PPE类别
    let productCategory = '其他';
    let subCategory = '其他';
    let ppeCategory = 'II';

    const productName = (product.product_name || '').toLowerCase();
    const description = (product.description || '').toLowerCase();

    for (const [category, config] of Object.entries(ppeCategories)) {
      if (config.keywords.some(keyword => 
        productName.includes(keyword) || description.includes(keyword)
      )) {
        productCategory = config.description;
        ppeCategory = config.ppeCategory;
        
        // 进一步细分
        if (category === 'HEAD_PROTECTION') subCategory = '安全帽';
        else if (category === 'EYE_FACIAL_PROTECTION') subCategory = '防护眼镜/面罩';
        else if (category === 'RESPIRATORY_PROTECTION') subCategory = '口罩/呼吸器';
        else if (category === 'BODY_PROTECTION') subCategory = '防护服';
        else if (category === 'HAND_PROTECTION') subCategory = '手套';
        else if (category === 'FOOT_PROTECTION') subCategory = '安全鞋';
        else if (category === 'FALL_PROTECTION') subCategory = '安全带/安全绳';
        else if (category === 'HEARING_PROTECTION') subCategory = '耳塞/耳罩';
        else if (category === 'HIGH_VISIBILITY') subCategory = '高可视服装';
        else if (category === 'FIRE_FIGHTING') subCategory = '消防装备';
        else if (category === 'WELDING_PROTECTION') subCategory = '焊接防护';
        else if (category === 'COLD_WEATHER') subCategory = '防寒服';
        else if (category === 'DIVING_PROTECTION') subCategory = '潜水服';
        else if (category === 'ELECTRICAL_PROTECTION') subCategory = '电绝缘装备';
        break;
      }
    }

    // 确定目标市场
    const targetMarkets = [];
    if (product.fda_k_number) targetMarkets.push('US');
    if (product.nmpa_registration_number) targetMarkets.push('CN');
    if (product.market === 'FDA') targetMarkets.push('US');

    return {
      product_name: product.product_name,
      product_code: product.product_code,
      product_category: productCategory,
      sub_category: subCategory,
      ppe_category: ppeCategory,
      manufacturer_name: product.manufacturer_name,
      manufacturer_country: getCountryFromName(product.manufacturer_name),
      brand_name: getBrandFromName(product.manufacturer_name),
      fda_k_number: product.fda_k_number,
      fda_decision_date: product.fda_decision_date,
      nmpa_registration_number: product.nmpa_registration_number,
      approval_date: product.approval_date,
      description: product.description,
      target_markets: targetMarkets,
      source: product.source,
      created_at: new Date().toISOString()
    };
  });

  // 清洗PPE企业数据
  console.log('2. 清洗PPE企业数据...');
  const cleanedManufacturers = ppeManufacturers.map(manufacturer => {
    // 确定企业类型
    const businessType = manufacturer.business_type || 'manufacturer';

    // 确定认证
    const certifications = manufacturer.certifications || [];

    return {
      company_name: manufacturer.company_name,
      company_name_en: manufacturer.company_name_en,
      company_name_zh: manufacturer.company_name_zh,
      country: manufacturer.country,
      address: manufacturer.address,
      website: manufacturer.website,
      email: manufacturer.email,
      phone: manufacturer.phone,
      business_type: businessType,
      certifications: certifications,
      description: manufacturer.description,
      description_en: manufacturer.description_en,
      description_zh: manufacturer.description_zh,
      source: manufacturer.source,
      created_at: new Date().toISOString()
    };
  });

  // 清洗PPE法规数据
  console.log('3. 清洗PPE法规数据...');
  const cleanedRegulations = ppeRegulations.map(regulation => {
    // 确定法规类型
    const regulationType = regulation.regulation_type || 'guidance';

    // 确定适用产品
    const applicableProducts = [];

    return {
      regulation_name: regulation.regulation_name,
      regulation_name_en: regulation.regulation_name_en,
      regulation_name_zh: regulation.regulation_name_zh,
      regulation_type: regulationType,
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

  // 保存清洗后的数据
  fs.writeFileSync('data/ppe_products_cleaned.json', JSON.stringify(cleanedProducts, null, 2));
  fs.writeFileSync('data/ppe_manufacturers_cleaned.json', JSON.stringify(cleanedManufacturers, null, 2));
  fs.writeFileSync('data/ppe_regulations_cleaned.json', JSON.stringify(cleanedRegulations, null, 2));

  console.log('\n已保存清洗后的数据:');
  console.log('  data/ppe_products_cleaned.json');
  console.log('  data/ppe_manufacturers_cleaned.json');
  console.log('  data/ppe_regulations_cleaned.json');

  return { products: cleanedProducts, manufacturers: cleanedManufacturers, regulations: cleanedRegulations };
}

// 辅助函数：从公司名称中获取国家
function getCountryFromName(name) {
  if (!name) return 'Unknown';
  
  const nameLower = name.toLowerCase();
  
  // 中国
  if (nameLower.includes('china') || nameLower.includes('cn') || nameLower.includes('中国') || 
      nameLower.includes('beijing') || nameLower.includes('shanghai') || nameLower.includes('guangzhou') ||
      nameLower.includes('shenzhen') || nameLower.includes('tianjin') || nameLower.includes('chongqing')) {
    return 'CN';
  }
  
  // 美国
  if (nameLower.includes('usa') || nameLower.includes('us') || nameLower.includes('america') ||
      nameLower.includes('new york') || nameLower.includes('california') || nameLower.includes('texa') ||
      nameLower.includes('illinois') || nameLower.includes('massachusetts') || nameLower.includes('florida')) {
    return 'US';
  }
  
  // 欧洲
  if (nameLower.includes('europe') || nameLower.includes('eu') || nameLower.includes('germany') || 
      nameLower.includes('deutschland') || nameLower.includes('de ') || nameLower.includes('france') ||
      nameLower.includes('italy') || nameLower.includes('spain') || nameLower.includes('netherlands') ||
      nameLower.includes('belgium') || nameLower.includes('switzerland') || nameLower.includes('austria') ||
      nameLower.includes('sweden') || nameLower.includes('norway') || nameLower.includes('denmark') ||
      nameLower.includes('finland') || nameLower.includes('poland') || nameLower.includes('russia')) {
    return 'EU';
  }
  
  // 日本
  if (nameLower.includes('japan') || nameLower.includes('jp') || nameLower.includes('日本') ||
      nameLower.includes('tokyo') || nameLower.includes('osaka') || nameLower.includes('kyoto')) {
    return 'JP';
  }
  
  // 澳大利亚
  if (nameLower.includes('australia') || nameLower.includes('au') || nameLower.includes('澳大利亚') ||
      nameLower.includes('sydney') || nameLower.includes('melbourne')) {
    return 'AU';
  }
  
  // 韩国
  if (nameLower.includes('korea') || nameLower.includes('kr') || nameLower.includes('韩国') ||
      nameLower.includes('seoul') || nameLower.includes('korean')) {
    return 'KR';
  }
  
  // 英国
  if (nameLower.includes('uk') || nameLower.includes('united kingdom') || nameLower.includes('england') ||
      nameLower.includes('london') || nameLower.includes('british')) {
    return 'UK';
  }
  
  // 加拿大
  if (nameLower.includes('canada') || nameLower.includes('ca') || nameLower.includes('加拿大') ||
      nameLower.includes('toronto') || nameLower.includes('vancouver') || nameLower.includes('montreal')) {
    return 'CA';
  }
  
  // 新加坡
  if (nameLower.includes('singapore') || nameLower.includes('sg') || nameLower.includes('新加坡') ||
      nameLower.includes('singaporean')) {
    return 'SG';
  }
  
  // 印度
  if (nameLower.includes('india') || nameLower.includes('in') || nameLower.includes('印度') ||
      nameLower.includes('mumbai') || nameLower.includes('delhi') || nameLower.includes('bangalore')) {
    return 'IN';
  }
  
  // 德国（单独识别）
  if (nameLower.includes('germany') || nameLower.includes('deutschland') || nameLower.includes('de ')) {
    return 'DE';
  }
  
  // 法国（单独识别）
  if (nameLower.includes('france') || nameLower.includes('fr ')) {
    return 'FR';
  }
  
  // 意大利
  if (nameLower.includes('italy') || nameLower.includes('it ') || nameLower.includes('italiano')) {
    return 'IT';
  }
  
  // 西班牙
  if (nameLower.includes('spain') || nameLower.includes('es ') || nameLower.includes('españa')) {
    return 'ES';
  }
  
  // 瑞士
  if (nameLower.includes('switzerland') || nameLower.includes('ch ') || nameLower.includes('schweiz')) {
    return 'CH';
  }
  
  // 荷兰
  if (nameLower.includes('netherlands') || nameLower.includes('nl ') || nameLower.includes('holland')) {
    return 'NL';
  }
  
  // 比利时
  if (nameLower.includes('belgium') || nameLower.includes('be ') || nameLower.includes('belgique')) {
    return 'BE';
  }
  
  // 瑞典
  if (nameLower.includes('sweden') || nameLower.includes('se ') || nameLower.includes('svenska')) {
    return 'SE';
  }
  
  // 挪威
  if (nameLower.includes('norway') || nameLower.includes('no ') || nameLower.includes('norge')) {
    return 'NO';
  }
  
  // 丹麦
  if (nameLower.includes('denmark') || nameLower.includes('dk ') || nameLower.includes('danmark')) {
    return 'DK';
  }
  
  // 芬兰
  if (nameLower.includes('finland') || nameLower.includes('fi ') || nameLower.includes('suomi')) {
    return 'FI';
  }
  
  // 波兰
  if (nameLower.includes('poland') || nameLower.includes('pl ') || nameLower.includes('polska')) {
    return 'PL';
  }
  
  // 俄罗斯
  if (nameLower.includes('russia') || nameLower.includes('ru ') || nameLower.includes('росси')) {
    return 'RU';
  }
  
  // 巴西
  if (nameLower.includes('brazil') || nameLower.includes('br ') || nameLower.includes('brasile')) {
    return 'BR';
  }
  
  // 墨西哥
  if (nameLower.includes('mexico') || nameLower.includes('mx ') || nameLower.includes('mexic')) {
    return 'MX';
  }
  
  // 阿根廷
  if (nameLower.includes('argentina') || nameLower.includes('ar ') || nameLower.includes('argent')) {
    return 'AR';
  }
  
  // 智利
  if (nameLower.includes('chile') || nameLower.includes('cl ') || nameLower.includes('chil')) {
    return 'CL';
  }
  
  // 哥伦比亚
  if (nameLower.includes('colombia') || nameLower.includes('co ') || nameLower.includes('colomb')) {
    return 'CO';
  }
  
  // 南非
  if (nameLower.includes('south africa') || nameLower.includes('za ') || nameLower.includes('africa')) {
    return 'ZA';
  }
  
  // 埃及
  if (nameLower.includes('egypt') || nameLower.includes('eg ') || nameLower.includes('misr')) {
    return 'EG';
  }
  
  // 土耳其
  if (nameLower.includes('turkey') || nameLower.includes('tr ') || nameLower.includes('türkiye')) {
    return 'TR';
  }
  
  // 以色列
  if (nameLower.includes('israel') || nameLower.includes('il ') || nameLower.includes('israeli')) {
    return 'IL';
  }
  
  // 沙特阿拉伯
  if (nameLower.includes('saudi arabia') || nameLower.includes('sa ') || nameLower.includes('saudi')) {
    return 'SA';
  }
  
  // 阿联酋
  if (nameLower.includes('uae') || nameLower.includes('ae ') || nameLower.includes('emirates')) {
    return 'AE';
  }
  
  // 马来西亚
  if (nameLower.includes('malaysia') || nameLower.includes('my ') || nameLower.includes('malays')) {
    return 'MY';
  }
  
  // 泰国
  if (nameLower.includes('thailand') || nameLower.includes('th ') || nameLower.includes('thai')) {
    return 'TH';
  }
  
  // 越南
  if (nameLower.includes('vietnam') || nameLower.includes('vn ') || nameLower.includes('viet')) {
    return 'VN';
  }
  
  // 印尼
  if (nameLower.includes('indonesia') || nameLower.includes('id ') || nameLower.includes('indon')) {
    return 'ID';
  }
  
  // 菲律宾
  if (nameLower.includes('philippines') || nameLower.includes('ph ') || nameLower.includes('filip')) {
    return 'PH';
  }
  
  // 尼日利亚
  if (nameLower.includes('nigeria') || nameLower.includes('ng ') || nameLower.includes('niger')) {
    return 'NG';
  }
  
  // 肯尼亚
  if (nameLower.includes('kenya') || nameLower.includes('ke ') || nameLower.includes('keny')) {
    return 'KE';
  }
  
  // 乌克兰
  if (nameLower.includes('ukraine') || nameLower.includes('ua ') || nameLower.includes('украї')) {
    return 'UA';
  }
  
  // 希腊
  if (nameLower.includes('greece') || nameLower.includes('gr ') || nameLower.includes('ελλά')) {
    return 'GR';
  }
  
  // 葡萄牙
  if (nameLower.includes('portugal') || nameLower.includes('pt ') || nameLower.includes('portugu')) {
    return 'PT';
  }
  
  // 奥地利
  if (nameLower.includes('austria') || nameLower.includes('at ') || nameLower.includes('österreich')) {
    return 'AT';
  }
  
  // 捷克
  if (nameLower.includes('czech') || nameLower.includes('cz ') || nameLower.includes('česk')) {
    return 'CZ';
  }
  
  // 匈牙利
  if (nameLower.includes('hungary') || nameLower.includes('hu ') || nameLower.includes('magyar')) {
    return 'HU';
  }
  
  // 罗马尼亚
  if (nameLower.includes('romania') || nameLower.includes('ro ') || nameLower.includes('român')) {
    return 'RO';
  }
  
  // 保加利亚
  if (nameLower.includes('bulgaria') || nameLower.includes('bg ') || nameLower.includes('бълга')) {
    return 'BG';
  }
  
  // 克罗地亚
  if (nameLower.includes('croatia') || nameLower.includes('hr ') || nameLower.includes('hrvats')) {
    return 'HR';
  }
  
  // 斯洛文尼亚
  if (nameLower.includes('slovenia') || nameLower.includes('si ') || nameLower.includes('sloven')) {
    return 'SI';
  }
  
  // 斯洛伐克
  if (nameLower.includes('slovakia') || nameLower.includes('sk ') || nameLower.includes('slovens')) {
    return 'SK';
  }
  
  // 爱沙尼亚
  if (nameLower.includes('estonia') || nameLower.includes('ee ') || nameLower.includes('eesti')) {
    return 'EE';
  }
  
  // 拉脱维亚
  if (nameLower.includes('latvia') || nameLower.includes('lv ') || nameLower.includes('latvie')) {
    return 'LV';
  }
  
  // 立陶宛
  if (nameLower.includes('lithuania') || nameLower.includes('lt ') || nameLower.includes('lietuva')) {
    return 'LT';
  }
  
  // 冰岛
  if (nameLower.includes('iceland') || nameLower.includes('is ') || nameLower.includes('íslens')) {
    return 'IS';
  }
  
  // 卢森堡
  if (nameLower.includes('luxembourg') || nameLower.includes('lu ') || nameLower.includes('luksemburg')) {
    return 'LU';
  }
  
  // 马耳他
  if (nameLower.includes('malta') || nameLower.includes('mt ') || nameLower.includes('malte')) {
    return 'MT';
  }
  
  // 塞浦路斯
  if (nameLower.includes('cyprus') || nameLower.includes('cy ') || nameLower.includes('kýpros')) {
    return 'CY';
  }
  
  // 波多黎各
  if (nameLower.includes('puerto rico') || nameLower.includes('pr ') || nameLower.includes('port')) {
    return 'PR';
  }
  
  // 哥斯达黎加
  if (nameLower.includes('costa rica') || nameLower.includes('cr ') || nameLower.includes('costa')) {
    return 'CR';
  }
  
  // 巴拿马
  if (nameLower.includes('panama') || nameLower.includes('pa ') || nameLower.includes('panam')) {
    return 'PA';
  }
  
  // 乌拉圭
  if (nameLower.includes('uruguay') || nameLower.includes('uy ') || nameLower.includes('urugu')) {
    return 'UY';
  }
  
  // 巴拉圭
  if (nameLower.includes('paraguay') || nameLower.includes('py ') || nameLower.includes('paragu')) {
    return 'PY';
  }
  
  // 玻利维亚
  if (nameLower.includes('bolivia') || nameLower.includes('bo ') || nameLower.includes('boliv')) {
    return 'BO';
  }
  
  // 厄瓜多尔
  if (nameLower.includes('ecuador') || nameLower.includes('ec ') || nameLower.includes('ecuad')) {
    return 'EC';
  }
  
  // 巴布亚新几内亚
  if (nameLower.includes('papua new guinea') || nameLower.includes('pg ') || nameLower.includes('papua')) {
    return 'PG';
  }
  
  // 斐济
  if (nameLower.includes('fiji') || nameLower.includes('fj ') || nameLower.includes('fiji')) {
    return 'FJ';
  }
  
  // 牙买加
  if (nameLower.includes('jamaica') || nameLower.includes('jm ') || nameLower.includes('jamaic')) {
    return 'JM';
  }
  
  // 巴哈马
  if (nameLower.includes('bahamas') || nameLower.includes('bs ') || nameLower.includes('baham')) {
    return 'BS';
  }
  
  // 巴贝多
  if (nameLower.includes('barbados') || nameLower.includes('bb ') || nameLower.includes('barbad')) {
    return 'BB';
  }
  
  // 安提瓜和巴布达
  if (nameLower.includes('antigua') || nameLower.includes('ag ') || nameLower.includes('antigu')) {
    return 'AG';
  }
  
  // 多米尼加
  if (nameLower.includes('dominica') || nameLower.includes('dm ') || nameLower.includes('domin')) {
    return 'DM';
  }
  
  // 圣卢西亚
  if (nameLower.includes('saint lucia') || nameLower.includes('lc ') || nameLower.includes('saint')) {
    return 'LC';
  }
  
  // 圣文森特和格林纳丁斯
  if (nameLower.includes('saint vincent') || nameLower.includes('vc ') || nameLower.includes('vincent')) {
    return 'VC';
  }
  
  // 格林纳达
  if (nameLower.includes('grenada') || nameLower.includes('gd ') || nameLower.includes('grenad')) {
    return 'GD';
  }
  
  // 圣基茨和尼维斯
  if (nameLower.includes('saint kitts') || nameLower.includes('kn ') || nameLower.includes('kitts')) {
    return 'KN';
  }
  
  // 特立尼达和多巴哥
  if (nameLower.includes('trinidad') || nameLower.includes('tt ') || nameLower.includes('trinida')) {
    return 'TT';
  }
  
  // 阿鲁巴
  if (nameLower.includes('aruba') || nameLower.includes('aw ') || nameLower.includes('arub')) {
    return 'AW';
  }
  
  // 库拉索
  if (nameLower.includes('curaçao') || nameLower.includes('cw ') || nameLower.includes('curaç')) {
    return 'CW';
  }
  
  // 荷属圣马丁
  if (nameLower.includes('sint maarten') || nameLower.includes('sx ') || nameLower.includes('maarten')) {
    return 'SX';
  }
  
  // 英属维尔京群岛
  if (nameLower.includes('british virgin islands') || nameLower.includes('vg ') || nameLower.includes('virgin')) {
    return 'VG';
  }
  
  // 美属维尔京群岛
  if (nameLower.includes('virgin islands') || nameLower.includes('vi ') || nameLower.includes('islands')) {
    return 'VI';
  }
  
  // 开曼群岛
  if (nameLower.includes('cayman islands') || nameLower.includes('ky ') || nameLower.includes('cayman')) {
    return 'KY';
  }
  
  // 百慕大
  if (nameLower.includes('bermuda') || nameLower.includes('bm ') || nameLower.includes('bermud')) {
    return 'BM';
  }
  
  // 安圭拉
  if (nameLower.includes('anguilla') || nameLower.includes('ai ') || nameLower.includes('anguill')) {
    return 'AI';
  }
  
  // 蒙特塞拉特
  if (nameLower.includes('montserrat') || nameLower.includes('ms ') || nameLower.includes('montser')) {
    return 'MS';
  }
  
  // 特克斯和凯科斯群岛
  if (nameLower.includes('turks and caicos') || nameLower.includes('tc ') || nameLower.includes('turks')) {
    return 'TC';
  }
  
  // 安提瓜和巴布达
  if (nameLower.includes('antigua and barbuda') || nameLower.includes('ag ') || nameLower.includes('antigua')) {
    return 'AG';
  }
  
  // 多米尼克
  if (nameLower.includes('dominica') || nameLower.includes('dm ') || nameLower.includes('dominica')) {
    return 'DM';
  }
  
  // 圣卢西亚
  if (nameLower.includes('saint lucia') || nameLower.includes('lc ') || nameLower.includes('saint lucia')) {
    return 'LC';
  }
  
  // 圣文森特和格林纳丁斯
  if (nameLower.includes('saint vincent and the grenadines') || nameLower.includes('vc ') || nameLower.includes('saint vincent')) {
    return 'VC';
  }
  
  // 格林纳达
  if (nameLower.includes('grenada') || nameLower.includes('gd ') || nameLower.includes('grenada')) {
    return 'GD';
  }
  
  // 圣基茨和尼维斯
  if (nameLower.includes('saint kitts and nevis') || nameLower.includes('kn ') || nameLower.includes('saint kitts')) {
    return 'KN';
  }
  
  // 尼日利亚
  if (nameLower.includes('nigeria') || nameLower.includes('ng ') || nameLower.includes('nigeria')) {
    return 'NG';
  }
  
  // 加纳
  if (nameLower.includes('ghana') || nameLower.includes('gh ') || nameLower.includes('ghan')) {
    return 'GH';
  }
  
  // 科特迪瓦
  if (nameLower.includes('côte d\'ivoire') || nameLower.includes('ci ') || nameLower.includes('côte')) {
    return 'CI';
  }
  
  // 塞内加尔
  if (nameLower.includes('senegal') || nameLower.includes('sn ') || nameLower.includes('senega')) {
    return 'SN';
  }
  
  // 喀麦隆
  if (nameLower.includes('cameroon') || nameLower.includes('cm ') || nameLower.includes('camero')) {
    return 'CM';
  }
  
  // 坦桑尼亚
  if (nameLower.includes('tanzania') || nameLower.includes('tz ') || nameLower.includes('tanzan')) {
    return 'TZ';
  }
  
  // 乌干达
  if (nameLower.includes('uganda') || nameLower.includes('ug ') || nameLower.includes('ugand')) {
    return 'UG';
  }
  
  // 卢旺达
  if (nameLower.includes('rwanda') || nameLower.includes('rw ') || nameLower.includes('rwand')) {
    return 'RW';
  }
  
  // 布隆迪
  if (nameLower.includes('burundi') || nameLower.includes('bi ') || nameLower.includes('burund')) {
    return 'BI';
  }
  
  // 刚果（金）
  if (nameLower.includes('congo') || nameLower.includes('cd ') || nameLower.includes('congo')) {
    return 'CD';
  }
  
  // 刚果（布）
  if (nameLower.includes('congo') || nameLower.includes('cg ') || nameLower.includes('congo')) {
    return 'CG';
  }
  
  // 赞比亚
  if (nameLower.includes('zambia') || nameLower.includes('zm ') || nameLower.includes('zambi')) {
    return 'ZM';
  }
  
  // 津巴布韦
  if (nameLower.includes('zimbabwe') || nameLower.includes('zw ') || nameLower.includes('zimbab')) {
    return 'ZW';
  }
  
  // 博茨瓦纳
  if (nameLower.includes('botswana') || nameLower.includes('bw ') || nameLower.includes('botswan')) {
    return 'BW';
  }
  
  // 纳米比亚
  if (nameLower.includes('namibia') || nameLower.includes('na ') || nameLower.includes('namib')) {
    return 'NA';
  }
  
  // 莫桑比克
  if (nameLower.includes('mozambique') || nameLower.includes('mz ') || nameLower.includes('mozamb')) {
    return 'MZ';
  }
  
  // 马达加斯加
  if (nameLower.includes('madagascar') || nameLower.includes('mg ') || nameLower.includes('madagasc')) {
    return 'MG';
  }
  
  // 塞舌尔
  if (nameLower.includes('seychelles') || nameLower.includes('sc ') || nameLower.includes('seychell')) {
    return 'SC';
  }
  
  // 毛里求斯
  if (nameLower.includes('mauritius') || nameLower.includes('mu ') || nameLower.includes('mauriti')) {
    return 'MU';
  }
  
  // 马约特
  if (nameLower.includes('mayotte') || nameLower.includes('yt ') || nameLower.includes('mayott')) {
    return 'YT';
  }
  
  // 留尼汪
  if (nameLower.includes('réunion') || nameLower.includes('re ') || nameLower.includes('réun')) {
    return 'RE';
  }
  
  // 阿尔及利亚
  if (nameLower.includes('algeria') || nameLower.includes('dz ') || nameLower.includes('alger')) {
    return 'DZ';
  }
  
  // 摩洛哥
  if (nameLower.includes('morocco') || nameLower.includes('ma ') || nameLower.includes('moro')) {
    return 'MA';
  }
  
  // 突尼斯
  if (nameLower.includes('tunisia') || nameLower.includes('tn ') || nameLower.includes('tunisi')) {
    return 'TN';
  }
  
  // 利比亚
  if (nameLower.includes('libya') || nameLower.includes('ly ') || nameLower.includes('liby')) {
    return 'LY';
  }
  
  // 埃塞俄比亚
  if (nameLower.includes('ethiopia') || nameLower.includes('et ') || nameLower.includes('ethiop')) {
    return 'ET';
  }
  
  // 苏丹
  if (nameLower.includes('sudan') || nameLower.includes('sd ') || nameLower.includes('sudan')) {
    return 'SD';
  }
  
  // 南苏丹
  if (nameLower.includes('south sudan') || nameLower.includes('ss ') || nameLower.includes('south')) {
    return 'SS';
  }
  
  // 厄立特里亚
  if (nameLower.includes('eritrea') || nameLower.includes('er ') || nameLower.includes('eritre')) {
    return 'ER';
  }
  
  // 吉布提
  if (nameLower.includes('djibouti') || nameLower.includes('dj ') || nameLower.includes('djibout')) {
    return 'DJ';
  }
  
  // 索马里
  if (nameLower.includes('somalia') || nameLower.includes('so ') || nameLower.includes('somali')) {
    return 'SO';
  }
  
  // 肯尼亚
  if (nameLower.includes('kenya') || nameLower.includes('ke ') || nameLower.includes('kenya')) {
    return 'KE';
  }
  
  // 乌干达
  if (nameLower.includes('uganda') || nameLower.includes('ug ') || nameLower.includes('uganda')) {
    return 'UG';
  }
  
  // 卢旺达
  if (nameLower.includes('rwanda') || nameLower.includes('rw ') || nameLower.includes('rwanda')) {
    return 'RW';
  }
  
  // 布隆迪
  if (nameLower.includes('burundi') || nameLower.includes('bi ') || nameLower.includes('burundi')) {
    return 'BI';
  }
  
  // 刚果（金）
  if (nameLower.includes('congo') || nameLower.includes('cd ') || nameLower.includes('congo')) {
    return 'CD';
  }
  
  // 刚果（布）
  if (nameLower.includes('congo') || nameLower.includes('cg ') || nameLower.includes('congo')) {
    return 'CG';
  }
  
  // 赞比亚
  if (nameLower.includes('zambia') || nameLower.includes('zm ') || nameLower.includes('zambia')) {
    return 'ZM';
  }
  
  // 津巴布韦
  if (nameLower.includes('zimbabwe') || nameLower.includes('zw ') || nameLower.includes('zimbabwe')) {
    return 'ZW';
  }
  
  // 博茨瓦纳
  if (nameLower.includes('botswana') || nameLower.includes('bw ') || nameLower.includes('botswana')) {
    return 'BW';
  }
  
  // 纳米比亚
  if (nameLower.includes('namibia') || nameLower.includes('na ') || nameLower.includes('namibia')) {
    return 'NA';
  }
  
  // 莫桑比克
  if (nameLower.includes('mozambique') || nameLower.includes('mz ') || nameLower.includes('mozambique')) {
    return 'MZ';
  }
  
  // 马达加斯加
  if (nameLower.includes('madagascar') || nameLower.includes('mg ') || nameLower.includes('madagascar')) {
    return 'MG';
  }
  
  // 塞舌尔
  if (nameLower.includes('seychelles') || nameLower.includes('sc ') || nameLower.includes('seychelles')) {
    return 'SC';
  }
  
  // 毛里求斯
  if (nameLower.includes('mauritius') || nameLower.includes('mu ') || nameLower.includes('mauritius')) {
    return 'MU';
  }
  
  // 马约特
  if (nameLower.includes('mayotte') || nameLower.includes('yt ') || nameLower.includes('mayotte')) {
    return 'YT';
  }
  
  // 留尼汪
  if (nameLower.includes('réunion') || nameLower.includes('re ') || nameLower.includes('réunion')) {
    return 'RE';
  }
  
  // 阿尔及利亚
  if (nameLower.includes('algeria') || nameLower.includes('dz ') || nameLower.includes('algeria')) {
    return 'DZ';
  }
  
  // 摩洛哥
  if (nameLower.includes('morocco') || nameLower.includes('ma ') || nameLower.includes('morocco')) {
    return 'MA';
  }
  
  // 突尼斯
  if (nameLower.includes('tunisia') || nameLower.includes('tn ') || nameLower.includes('tunisia')) {
    return 'TN';
  }
  
  // 利比亚
  if (nameLower.includes('libya') || nameLower.includes('ly ') || nameLower.includes('libya')) {
    return 'LY';
  }
  
  // 埃塞俄比亚
  if (nameLower.includes('ethiopia') || nameLower.includes('et ') || nameLower.includes('ethiopia')) {
    return 'ET';
  }
  
  // 苏丹
  if (nameLower.includes('sudan') || nameLower.includes('sd ') || nameLower.includes('sudan')) {
    return 'SD';
  }
  
  // 南苏丹
  if (nameLower.includes('south sudan') || nameLower.includes('ss ') || nameLower.includes('south')) {
    return 'SS';
  }
  
  // 厄立特里亚
  if (nameLower.includes('eritrea') || nameLower.includes('er ') || nameLower.includes('eritrea')) {
    return 'ER';
  }
  
  // 吉布提
  if (nameLower.includes('djibouti') || nameLower.includes('dj ') || nameLower.includes('djibouti')) {
    return 'DJ';
  }
  
  // 索马里
  if (nameLower.includes('somalia') || nameLower.includes('so ') || nameLower.includes('somalia')) {
    return 'SO';
  }
  
  // 蒙古
  if (nameLower.includes('mongolia') || nameLower.includes('mn ') || nameLower.includes('mongol')) {
    return 'MN';
  }
  
  // 哈萨克斯坦
  if (nameLower.includes('kazakhstan') || nameLower.includes('kz ') || nameLower.includes('kazakh')) {
    return 'KZ';
  }
  
  // 乌兹别克斯坦
  if (nameLower.includes('uzbekistan') || nameLower.includes('uz ') || nameLower.includes('uzbek')) {
    return 'UZ';
  }
  
  // 土库曼斯坦
  if (nameLower.includes('turkmenistan') || nameLower.includes('tm ') || nameLower.includes('turkmen')) {
    return 'TM';
  }
  
  // 吉尔吉斯斯坦
  if (nameLower.includes('kyrgyzstan') || nameLower.includes('kg ') || nameLower.includes('kyrgyz')) {
    return 'KG';
  }
  
  // 塔吉克斯坦
  if (nameLower.includes('tajikistan') || nameLower.includes('tj ') || nameLower.includes('tajik')) {
    return 'TJ';
  }
  
  // 阿富汗
  if (nameLower.includes('afghanistan') || nameLower.includes('af ') || nameLower.includes('afghan')) {
    return 'AF';
  }
  
  // 巴基斯坦
  if (nameLower.includes('pakistan') || nameLower.includes('pk ') || nameLower.includes('pakistan')) {
    return 'PK';
  }
  
  // 印度
  if (nameLower.includes('india') || nameLower.includes('in ') || nameLower.includes('india')) {
    return 'IN';
  }
  
  // 尼泊尔
  if (nameLower.includes('nepal') || nameLower.includes('np ') || nameLower.includes('nepal')) {
    return 'NP';
  }
  
  // 不丹
  if (nameLower.includes('bhutan') || nameLower.includes('bt ') || nameLower.includes('bhutan')) {
    return 'BT';
  }
  
  // 孟加拉国
  if (nameLower.includes('bangladesh') || nameLower.includes('bd ') || nameLower.includes('bangladesh')) {
    return 'BD';
  }
  
  // 缅甸
  if (nameLower.includes('myanmar') || nameLower.includes('mm ') || nameLower.includes('myanmar')) {
    return 'MM';
  }
  
  // 老挝
  if (nameLower.includes('laos') || nameLower.includes('la ') || nameLower.includes('laos')) {
    return 'LA';
  }
  
  // 柬埔寨
  if (nameLower.includes('cambodia') || nameLower.includes('kh ') || nameLower.includes('cambod')) {
    return 'KH';
  }
  
  // 泰国
  if (nameLower.includes('thailand') || nameLower.includes('th ') || nameLower.includes('thailand')) {
    return 'TH';
  }
  
  // 越南
  if (nameLower.includes('vietnam') || nameLower.includes('vn ') || nameLower.includes('vietnam')) {
    return 'VN';
  }
  
  // 菲律宾
  if (nameLower.includes('philippines') || nameLower.includes('ph ') || nameLower.includes('philippines')) {
    return 'PH';
  }
  
  // 印度尼西亚
  if (nameLower.includes('indonesia') || nameLower.includes('id ') || nameLower.includes('indonesia')) {
    return 'ID';
  }
  
  // 马来西亚
  if (nameLower.includes('malaysia') || nameLower.includes('my ') || nameLower.includes('malaysia')) {
    return 'MY';
  }
  
  // 文莱
  if (nameLower.includes('brunei') || nameLower.includes('bn ') || nameLower.includes('brune')) {
    return 'BN';
  }
  
  // 新加坡
  if (nameLower.includes('singapore') || nameLower.includes('sg ') || nameLower.includes('singapore')) {
    return 'SG';
  }
  
  // 东帝汶
  if (nameLower.includes('timor-leste') || nameLower.includes('tl ') || nameLower.includes('timor')) {
    return 'TL';
  }
  
  // 巴布亚新几内亚
  if (nameLower.includes('papua new guinea') || nameLower.includes('pg ') || nameLower.includes('papua')) {
    return 'PG';
  }
  
  // 所罗门群岛
  if (nameLower.includes('solomon islands') || nameLower.includes('sb ') || nameLower.includes('solomon')) {
    return 'SB';
  }
  
  // 瓦努阿图
  if (nameLower.includes('vanuatu') || nameLower.includes('vu ') || nameLower.includes('vanuat')) {
    return 'VU';
  }
  
  // 斐济
  if (nameLower.includes('fiji') || nameLower.includes('fj ') || nameLower.includes('fiji')) {
    return 'FJ';
  }
  
  // 瑙鲁
  if (nameLower.includes('nauru') || nameLower.includes('nr ') || nameLower.includes('nauru')) {
    return 'NR';
  }
  
  // 基里巴斯
  if (nameLower.includes('kiribati') || nameLower.includes('ki ') || nameLower.includes('kiribat')) {
    return 'KI';
  }
  
  // 密克罗尼西亚
  if (nameLower.includes('micronesia') || nameLower.includes('fm ') || nameLower.includes('micrones')) {
    return 'FM';
  }
  
  // 马绍尔群岛
  if (nameLower.includes('marshall islands') || nameLower.includes('mh ') || nameLower.includes('marshall')) {
    return 'MH';
  }
  
  // 帕劳
  if (nameLower.includes('palau') || nameLower.includes('pw ') || nameLower.includes('palau')) {
    return 'PW';
  }
  
  // 关岛
  if (nameLower.includes('guam') || nameLower.includes('gu ') || nameLower.includes('guam')) {
    return 'GU';
  }
  
  // 北马里亚纳群岛
  if (nameLower.includes('northern mariana islands') || nameLower.includes('mp ') || nameLower.includes('northern')) {
    return 'MP';
  }
  
  // 夏威夷
  if (nameLower.includes('hawaii') || nameLower.includes('hi ') || nameLower.includes('hawai')) {
    return 'US';
  }
  
  // 阿拉斯加
  if (nameLower.includes('alaska') || nameLower.includes('ak ') || nameLower.includes('alaska')) {
    return 'US';
  }
  
  // 其他美国地区
  if (nameLower.includes('american samoa') || nameLower.includes('as ') || nameLower.includes('american')) {
    return 'AS';
  }
  
  // 波多黎各
  if (nameLower.includes('puerto rico') || nameLower.includes('pr ') || nameLower.includes('puerto')) {
    return 'PR';
  }
  
  // 美属维尔京群岛
  if (nameLower.includes('virgin islands') || nameLower.includes('vi ') || nameLower.includes('virgin')) {
    return 'VI';
  }
  
  // 英属维尔京群岛
  if (nameLower.includes('british virgin islands') || nameLower.includes('vg ') || nameLower.includes('british')) {
    return 'VG';
  }
  
  // 开曼群岛
  if (nameLower.includes('cayman islands') || nameLower.includes('ky ') || nameLower.includes('cayman')) {
    return 'KY';
  }
  
  // 百慕大
  if (nameLower.includes('bermuda') || nameLower.includes('bm ') || nameLower.includes('bermuda')) {
    return 'BM';
  }
  
  // 安圭拉
  if (nameLower.includes('anguilla') || nameLower.includes('ai ') || nameLower.includes('anguilla')) {
    return 'AI';
  }
  
  // 蒙特塞拉特
  if (nameLower.includes('montserrat') || nameLower.includes('ms ') || nameLower.includes('montserrat')) {
    return 'MS';
  }
  
  // 特克斯和凯科斯群岛
  if (nameLower.includes('turks and caicos') || nameLower.includes('tc ') || nameLower.includes('turks')) {
    return 'TC';
  }
  
  // 安提瓜和巴布达
  if (nameLower.includes('antigua and barbuda') || nameLower.includes('ag ') || nameLower.includes('antigua')) {
    return 'AG';
  }
  
  // 多米尼克
  if (nameLower.includes('dominica') || nameLower.includes('dm ') || nameLower.includes('dominica')) {
    return 'DM';
  }
  
  // 圣卢西亚
  if (nameLower.includes('saint lucia') || nameLower.includes('lc ') || nameLower.includes('saint lucia')) {
    return 'LC';
  }
  
  // 圣文森特和格林纳丁斯
  if (nameLower.includes('saint vincent and the grenadines') || nameLower.includes('vc ') || nameLower.includes('saint vincent')) {
    return 'VC';
  }
  
  // 格林纳达
  if (nameLower.includes('grenada') || nameLower.includes('gd ') || nameLower.includes('grenada')) {
    return 'GD';
  }
  
  // 圣基茨和尼维斯
  if (nameLower.includes('saint kitts and nevis') || nameLower.includes('kn ') || nameLower.includes('saint kitts')) {
    return 'KN';
  }
  
  // 巴哈马
  if (nameLower.includes('bahamas') || nameLower.includes('bs ') || nameLower.includes('bahamas')) {
    return 'BS';
  }
  
  // 巴巴多斯
  if (nameLower.includes('barbados') || nameLower.includes('bb ') || nameLower.includes('barbados')) {
    return 'BB';
  }
  
  // 牙买加
  if (nameLower.includes('jamaica') || nameLower.includes('jm ') || nameLower.includes('jamaica')) {
    return 'JM';
  }
  
  // 海地
  if (nameLower.includes('haiti') || nameLower.includes('ht ') || nameLower.includes('hait')) {
    return 'HT';
  }
  
  // 多米尼加共和国
  if (nameLower.includes('dominican republic') || nameLower.includes('do ') || nameLower.includes('dominican')) {
    return 'DO';
  }
  
  // 哥斯达黎加
  if (nameLower.includes('costa rica') || nameLower.includes('cr ') || nameLower.includes('costa')) {
    return 'CR';
  }
  
  // 巴拿马
  if (nameLower.includes('panama') || nameLower.includes('pa ') || nameLower.includes('panama')) {
    return 'PA';
  }
  
  // 哥伦比亚
  if (nameLower.includes('colombia') || nameLower.includes('co ') || nameLower.includes('colombia')) {
    return 'CO';
  }
  
  // 委内瑞拉
  if (nameLower.includes('venezuela') || nameLower.includes('ve ') || nameLower.includes('venezuel')) {
    return 'VE';
  }
  
  // 圭亚那
  if (nameLower.includes('guyana') || nameLower.includes('gy ') || nameLower.includes('guyan')) {
    return 'GY';
  }
  
  // 苏里南
  if (nameLower.includes('suriname') || nameLower.includes('sr ') || nameLower.includes('surinam')) {
    return 'SR';
  }
  
  // 法属圭亚那
  if (nameLower.includes('french guiana') || nameLower.includes('gf ') || nameLower.includes('french')) {
    return 'GF';
  }
  
  // 厄瓜多尔
  if (nameLower.includes('ecuador') || nameLower.includes('ec ') || nameLower.includes('ecuador')) {
    return 'EC';
  }
  
  // 巴拉圭
  if (nameLower.includes('paraguay') || nameLower.includes('py ') || nameLower.includes('paraguay')) {
    return 'PY';
  }
  
  // 乌拉圭
  if (nameLower.includes('uruguay') || nameLower.includes('uy ') || nameLower.includes('uruguay')) {
    return 'UY';
  }
  
  // 巴西
  if (nameLower.includes('brazil') || nameLower.includes('br ') || nameLower.includes('brazil')) {
    return 'BR';
  }
  
  // 玻利维亚
  if (nameLower.includes('bolivia') || nameLower.includes('bo ') || nameLower.includes('bolivia')) {
    return 'BO';
  }
  
  // 智利
  if (nameLower.includes('chile') || nameLower.includes('cl ') || nameLower.includes('chile')) {
    return 'CL';
  }
  
  // 阿根廷
  if (nameLower.includes('argentina') || nameLower.includes('ar ') || nameLower.includes('argentina')) {
    return 'AR';
  }
  
  // 乌拉圭
  if (nameLower.includes('uruguay') || nameLower.includes('uy ') || nameLower.includes('uruguay')) {
    return 'UY';
  }
  
  // 马尔维纳斯群岛（福克兰群岛）
  if (nameLower.includes('malvinas') || nameLower.includes('fk ') || nameLower.includes('malvin')) {
    return 'FK';
  }
  
  // 南乔治亚和南桑威奇群岛
  if (nameLower.includes('south georgia') || nameLower.includes('gs ') || nameLower.includes('south')) {
    return 'GS';
  }
  
  // 南极洲
  if (nameLower.includes('antarctica') || nameLower.includes('aq ') || nameLower.includes('antarct')) {
    return 'AQ';
  }
  
  // 俄罗斯
  if (nameLower.includes('russia') || nameLower.includes('ru ') || nameLower.includes('russia')) {
    return 'RU';
  }
  
  // 白俄罗斯
  if (nameLower.includes('belarus') || nameLower.includes('by ') || nameLower.includes('belar')) {
    return 'BY';
  }
  
  // 波兰
  if (nameLower.includes('poland') || nameLower.includes('pl ') || nameLower.includes('poland')) {
    return 'PL';
  }
  
  // 捷克
  if (nameLower.includes('czech') || nameLower.includes('cz ') || nameLower.includes('czech')) {
    return 'CZ';
  }
  
  // 斯洛伐克
  if (nameLower.includes('slovakia') || nameLower.includes('sk ') || nameLower.includes('slovakia')) {
    return 'SK';
  }
  
  // 匈牙利
  if (nameLower.includes('hungary') || nameLower.includes('hu ') || nameLower.includes('hungary')) {
    return 'HU';
  }
  
  // 奥地利
  if (nameLower.includes('austria') || nameLower.includes('at ') || nameLower.includes('austria')) {
    return 'AT';
  }
  
  // 德国
  if (nameLower.includes('germany') || nameLower.includes('de ') || nameLower.includes('germany')) {
    return 'DE';
  }
  
  // 瑞士
  if (nameLower.includes('switzerland') || nameLower.includes('ch ') || nameLower.includes('switzerland')) {
    return 'CH';
  }
  
  // 列支敦士登
  if (nameLower.includes('liechtenstein') || nameLower.includes('li ') || nameLower.includes('liechten')) {
    return 'LI';
  }
  
  // 法国
  if (nameLower.includes('france') || nameLower.includes('fr ') || nameLower.includes('france')) {
    return 'FR';
  }
  
  // 摩纳哥
  if (nameLower.includes('monaco') || nameLower.includes('mc ') || nameLower.includes('monaco')) {
    return 'MC';
  }
  
  // 意大利
  if (nameLower.includes('italy') || nameLower.includes('it ') || nameLower.includes('italy')) {
    return 'IT';
  }
  
  // 圣马力诺
  if (nameLower.includes('san marino') || nameLower.includes('sm ') || nameLower.includes('san')) {
    return 'SM';
  }
  
  // 梵蒂冈
  if (nameLower.includes('vatican') || nameLower.includes('va ') || nameLower.includes('vatican')) {
    return 'VA';
  }
  
  // 西班牙
  if (nameLower.includes('spain') || nameLower.includes('es ') || nameLower.includes('spain')) {
    return 'ES';
  }
  
  // 葡萄牙
  if (nameLower.includes('portugal') || nameLower.includes('pt ') || nameLower.includes('portugal')) {
    return 'PT';
  }
  
  // 安道尔
  if (nameLower.includes('andorra') || nameLower.includes('ad ') || nameLower.includes('andor')) {
    return 'AD';
  }
  
  // 法罗群岛
  if (nameLower.includes('faroe islands') || nameLower.includes('fo ') || nameLower.includes('faroe')) {
    return 'FO';
  }
  
  // 冰岛
  if (nameLower.includes('iceland') || nameLower.includes('is ') || nameLower.includes('iceland')) {
    return 'IS';
  }
  
  // 挪威
  if (nameLower.includes('norway') || nameLower.includes('no ') || nameLower.includes('norway')) {
    return 'NO';
  }
  
  // 瑞典
  if (nameLower.includes('sweden') || nameLower.includes('se ') || nameLower.includes('sweden')) {
    return 'SE';
  }
  
  // 芬兰
  if (nameLower.includes('finland') || nameLower.includes('fi ') || nameLower.includes('finland')) {
    return 'FI';
  }
  
  // 丹麦
  if (nameLower.includes('denmark') || nameLower.includes('dk ') || nameLower.includes('denmark')) {
    return 'DK';
  }
  
  // 爱沙尼亚
  if (nameLower.includes('estonia') || nameLower.includes('ee ') || nameLower.includes('estonia')) {
    return 'EE';
  }
  
  // 拉脱维亚
  if (nameLower.includes('latvia') || nameLower.includes('lv ') || nameLower.includes('latvia')) {
    return 'LV';
  }
  
  // 立陶宛
  if (nameLower.includes('lithuania') || nameLower.includes('lt ') || nameLower.includes('lithuania')) {
    return 'LT';
  }
  
  // 波罗的海三国
  if (nameLower.includes('baltic') || nameLower.includes('ee ') || nameLower.includes('lv ') || nameLower.includes('lt ')) {
    return 'BALTIC';
  }
  
  // 阿尔巴尼亚
  if (nameLower.includes('albania') || nameLower.includes('al ') || nameLower.includes('alban')) {
    return 'AL';
  }
  
  // 黑山
  if (nameLower.includes('montenegro') || nameLower.includes('me ') || nameLower.includes('montenegr')) {
    return 'ME';
  }
  
  // 科索沃
  if (nameLower.includes('kosovo') || nameLower.includes('xk ') || nameLower.includes('kosovo')) {
    return 'XK';
  }
  
  // 北马其顿
  if (nameLower.includes('north macedonia') || nameLower.includes('mk ') || nameLower.includes('macedonia')) {
    return 'MK';
  }
  
  // 克罗地亚
  if (nameLower.includes('croatia') || nameLower.includes('hr ') || nameLower.includes('croatia')) {
    return 'HR';
  }
  
  // 斯洛文尼亚
  if (nameLower.includes('slovenia') || nameLower.includes('si ') || nameLower.includes('slovenia')) {
    return 'SI';
  }
  
  // 波斯尼亚和黑塞哥维那
  if (nameLower.includes('bosnia') || nameLower.includes('ba ') || nameLower.includes('bosnia')) {
    return 'BA';
  }
  
  // 罗马尼亚
  if (nameLower.includes('romania') || nameLower.includes('ro ') || nameLower.includes('romania')) {
    return 'RO';
  }
  
  // 保加利亚
  if (nameLower.includes('bulgaria') || nameLower.includes('bg ') || nameLower.includes('bulgaria')) {
    return 'BG';
  }
  
  // 希腊
  if (nameLower.includes('greece') || nameLower.includes('gr ') || nameLower.includes('greece')) {
    return 'GR';
  }
  
  // 土耳其
  if (nameLower.includes('turkey') || nameLower.includes('tr ') || nameLower.includes('turkey')) {
    return 'TR';
  }
  
  // 塞浦路斯
  if (nameLower.includes('cyprus') || nameLower.includes('cy ') || nameLower.includes('cyprus')) {
    return 'CY';
  }
  
  // 马耳他
  if (nameLower.includes('malta') || nameLower.includes('mt ') || nameLower.includes('malta')) {
    return 'MT';
  }
  
  // 卢森堡
  if (nameLower.includes('luxembourg') || nameLower.includes('lu ') || nameLower.includes('luxembourg')) {
    return 'LU';
  }
  
  // 比利时
  if (nameLower.includes('belgium') || nameLower.includes('be ') || nameLower.includes('belgium')) {
    return 'BE';
  }
  
  // 荷兰
  if (nameLower.includes('netherlands') || nameLower.includes('nl ') || nameLower.includes('netherlands')) {
    return 'NL';
  }
  
  // 英国
  if (nameLower.includes('united kingdom') || nameLower.includes('uk ') || nameLower.includes('england') ||
      nameLower.includes('british')) {
    return 'UK';
  }
  
  // 爱尔兰
  if (nameLower.includes('ireland') || nameLower.includes('ie ') || nameLower.includes('irish')) {
    return 'IE';
  }
  
  // 法国海外省
  if (nameLower.includes('guadeloupe') || nameLower.includes('gp ') || nameLower.includes('guadelou')) {
    return 'GP';
  }
  
  if (nameLower.includes('martinique') || nameLower.includes('mq ') || nameLower.includes('martiniqu')) {
    return 'MQ';
  }
  
  if (nameLower.includes('guyane') || nameLower.includes('gf ') || nameLower.includes('guyan')) {
    return 'GF';
  }
  
  if (nameLower.includes('réunion') || nameLower.includes('re ') || nameLower.includes('réunion')) {
    return 'RE';
  }
  
  if (nameLower.includes('mayotte') || nameLower.includes('yt ') || nameLower.includes('mayotte')) {
    return 'YT';
  }
  
  // 其他
  return 'Unknown';
}

// 辅助函数：从公司名称中获取品牌
function getBrandFromName(name) {
  if (!name) return '';
  
  // 简单提取品牌名（假设品牌名在公司名前面）
  const parts = name.split(' ');
  if (parts.length > 1) {
    return parts[0];
  }
  
  return name;
}

// 数据分析和统计
async function analyzeData() {
  console.log('\n=== 数据分析和统计 ===\n');

  const products = JSON.parse(fs.readFileSync('data/ppe_products_cleaned.json', 'utf8'));

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
    .slice(0, 10)
    .forEach(([country, count]) => {
      console.log(`  ${country}: ${count} 条`);
    });
}

// 主函数
async function main() {
  console.log('开始PPE数据提取、清洗和整理...\n');

  // 提取数据
  await extractPPEProducts();
  await extractPPEManufacturers();
  await extractPPERegulations();

  // 清洗和转换数据
  const cleanedData = await transformData();

  // 分析数据
  await analyzeData();

  console.log('\n\nPPE数据提取、清洗和整理完成！');
  console.log('\n生成的文件:');
  console.log('  data/ppe_products_extracted.json - 原始提取数据');
  console.log('  data/ppe_manufacturers_extracted.json - 原始提取数据');
  console.log('  data/ppe_regulations_extracted.json - 原始提取数据');
  console.log('  data/ppe_products_cleaned.json - 清洗后数据');
  console.log('  data/ppe_manufacturers_cleaned.json - 清洗后数据');
  console.log('  data/ppe_regulations_cleaned.json - 清洗后数据');
}

// 运行主函数
main().catch(console.error);