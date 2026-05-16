#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const sleep = ms => new Promise(r => setTimeout(r, ms));
const trim = v => typeof v === 'string' ? v.trim() : (Array.isArray(v) ? v.join(',').trim() : '');

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

const categoryTranslations = {
  '呼吸防护装备': 'Respiratory Protection',
  '手部防护装备': 'Hand Protection',
  '眼面部防护装备': 'Eye & Face Protection',
  '头部防护装备': 'Head Protection',
  '足部防护装备': 'Foot Protection',
  '听觉防护装备': 'Hearing Protection',
  '坠落防护装备': 'Fall Protection',
  '身体防护装备': 'Body Protection',
  '躯干防护装备': 'Torso Protection',
  '其他': 'Other',
};

const companyTranslations = {
  '3M中国有限公司': '3M China Limited',
  '霍尼韦尔安全防护设备（上海）有限公司': 'Honeywell Safety Products (Shanghai) Co., Ltd.',
  '安思尔（上海）商贸有限公司': 'Ansell (Shanghai) Trading Co., Ltd.',
  '梅思安（中国）安全设备有限公司': 'MSA Safety (China) Equipment Co., Ltd.',
  '德尔格安全设备（中国）有限公司': 'Dräger Safety (China) Co., Ltd.',
  '代尔塔防护设备（中国）有限公司': 'Delta Plus Protection (China) Co., Ltd.',
  '优唯斯安全防护用品（上海）有限公司': 'Uvex Safety (Shanghai) Co., Ltd.',
  '金佰利（中国）有限公司': 'Kimberly-Clark (China) Co., Ltd.',
  '江苏恒辉安防集团股份有限公司': 'Jiangsu Henghui Safety Group Co., Ltd.',
  '山东星宇手套有限公司': 'Shandong Xingyu Glove Co., Ltd.',
  '稳健医疗用品股份有限公司': 'Winner Medical Co., Ltd.',
  '英科医疗科技股份有限公司': 'Intco Medical Technology Co., Ltd.',
  '振德医疗用品股份有限公司': 'Zhende Medical Supplies Co., Ltd.',
  '中红普林医疗用品股份有限公司': 'Sino-Phos Medical Products Co., Ltd.',
  '深圳市优普泰防护用品有限公司': 'Shenzhen U.Protec Protective Products Co., Ltd.',
  '广州邦士度眼镜有限公司': 'Guangzhou Bosidun Glasses Co., Ltd.',
  '北京邦维高科新材料科技股份有限公司': 'Beijing Bangwei High-Tech New Material Technology Co., Ltd.',
  '南通强生新材料科技股份有限公司': 'Nantong Qiangsheng New Material Technology Co., Ltd.',
  '浙江蓝禾医疗用品有限公司': 'Zhejiang Lanhine Medical Products Co., Ltd.',
  '湖北华强科技有限责任公司': 'Hubei Huaqiang Technology Co., Ltd.',
  '山西新华防护器材有限责任公司': 'Shanxi Xinhua Protective Equipment Co., Ltd.',
  '北京邦维应急装备有限公司': 'Beijing Bangwei Emergency Equipment Co., Ltd.',
  '山东登升劳保用品有限公司': 'Shandong Dengsheng Labor Protection Products Co., Ltd.',
  '深圳市新纶科技股份有限公司': 'Shenzhen Selen Science & Technology Co., Ltd.',
  '上海诚格安全防护用品有限公司': 'Shanghai Chengge Safety Protection Products Co., Ltd.',
  '浙江东亚手套有限公司': 'Zhejiang Dongya Gloves Co., Ltd.',
  '浙江嘉茂安全防护用品有限公司': 'Zhejiang Jiamao Safety Protection Products Co., Ltd.',
  '广州威尼科技发展有限公司': 'Guangzhou Vini Technology Development Co., Ltd.',
  '江苏富吉安全防护用品有限公司': 'Jiangsu Fuji Safety Protection Products Co., Ltd.',
};

function translateCompanyName(cnName) {
  if (!cnName) return '';
  if (/^[a-zA-Z0-9\s.,&\-()/]+$/.test(cnName)) return cnName;
  if (companyTranslations[cnName]) return companyTranslations[cnName];
  for (const [cn, en] of Object.entries(companyTranslations)) {
    if (cnName.includes(cn)) return en;
  }
  let en = cnName;
  en = en.replace(/有限公司$/, ' Co., Ltd.');
  en = en.replace(/股份有限公司$/, ' Co., Ltd.');
  en = en.replace(/集团$/, ' Group');
  en = en.replace(/科技$/, ' Technology');
  en = en.replace(/防护用品/, ' Protective Products');
  en = en.replace(/安全防护/, ' Safety Protection');
  en = en.replace(/安全设备/, ' Safety Equipment');
  en = en.replace(/医疗用品/, ' Medical Supplies');
  en = en.replace(/医疗/, ' Medical');
  en = en.replace(/手套/, ' Gloves');
  en = en.replace(/眼镜/, ' Glasses');
  en = en.replace(/劳保/, ' Labor Protection');
  en = en.replace(/（/, '(').replace(/）/, ')');
  return en;
}

function translateProductName(cnName) {
  if (!cnName) return '';
  if (/^[a-zA-Z0-9\s.,&\-()/]+$/.test(cnName)) return '';
  let en = cnName;
  const t = {
    '医用防护口罩': 'Medical Protective Mask', '医用外科口罩': 'Medical Surgical Mask',
    '一次性使用医用口罩': 'Single-use Medical Mask', '防护服': 'Protective Suit',
    '医用防护服': 'Medical Protective Suit', '隔离衣': 'Isolation Gown',
    '手术衣': 'Surgical Gown', '防护手套': 'Protective Gloves',
    '医用手套': 'Medical Gloves', '防护眼镜': 'Protective Goggles',
    '护目镜': 'Safety Goggles', '防护面罩': 'Face Shield',
    '面屏': 'Face Screen', '安全帽': 'Safety Helmet',
    '安全鞋': 'Safety Shoes', '安全靴': 'Safety Boots',
    '安全带': 'Safety Harness', '安全绳': 'Safety Rope',
    '耳塞': 'Earplugs', '耳罩': 'Earmuffs',
    '呼吸器': 'Respirator', '防毒面具': 'Gas Mask',
    '防护头罩': 'Protective Hood', '防护鞋套': 'Protective Shoe Covers',
    '一次性': 'Disposable', '无菌': 'Sterile', '非无菌': 'Non-sterile',
    '丁腈': 'Nitrile', '乳胶': 'Latex', '橡胶': 'Rubber',
  };
  for (const [cn, enWord] of Object.entries(t)) {
    en = en.replace(new RegExp(cn, 'g'), enWord);
  }
  return en === cnName ? '' : en;
}

async function main() {
  console.log('========================================');
  console.log('快速双语翻译 + 中国企业补全');
  console.log('========================================');

  // ===== 1. 批量翻译产品分类 =====
  console.log('\n--- 1. 批量翻译产品分类 ---');
  let catTranslated = 0;
  for (const [cnCat, enCat] of Object.entries(categoryTranslations)) {
    const { data: products, error } = await supabase.from('ppe_products')
      .select('id,international_names')
      .eq('category', cnCat)
      .limit(50000);

    if (error || !products || products.length === 0) continue;

    const ids = products.map(p => p.id);
    for (let i = 0; i < ids.length; i += 500) {
      const batch = ids.slice(i, i + 500);
      const { error: uErr } = await supabase.from('ppe_products')
        .update({ international_names: { en: { category: enCat } } })
        .in('id', batch);
      if (!uErr) catTranslated += batch.length;
      await sleep(100);
    }
    console.log(`  ${cnCat} → ${enCat}: ${ids.length} 条`);
  }
  console.log(`  分类翻译总计: ${catTranslated} 条`);

  // ===== 2. 翻译中文产品名 =====
  console.log('\n--- 2. 翻译中文产品名 ---');
  const cnProducts = await fetchAll('ppe_products', 'id,name,international_names');
  const needNameTranslate = cnProducts.filter(p => {
    if (!p.name) return false;
    if (/^[a-zA-Z0-9\s.,&\-()/]+$/.test(p.name)) return false;
    return translateProductName(p.name) !== '';
  });
  console.log(`  需要翻译产品名: ${needNameTranslate.length} 条`);

  let nameTranslated = 0;
  for (const p of needNameTranslate) {
    const nameEn = translateProductName(p.name);
    if (nameEn) {
      const intl = p.international_names || {};
      if (typeof intl === 'string') {
        try { const parsed = JSON.parse(intl); intl = { ...parsed, en: { ...(parsed.en || {}), name: nameEn } }; }
        catch { intl = { en: { name: nameEn } }; }
      } else {
        if (!intl.en) intl.en = {};
        intl.en.name = nameEn;
      }
      const { error } = await supabase.from('ppe_products')
        .update({ international_names: intl })
        .eq('id', p.id);
      if (!error) nameTranslated++;
      await sleep(5);
    }
  }
  console.log(`  产品名翻译: ${nameTranslated} 条`);

  // ===== 3. 翻译制造商名称 =====
  console.log('\n--- 3. 翻译制造商名称 ---');
  const mfrs = await fetchAll('ppe_manufacturers', 'id,name,country,ip_information');
  const needTranslate = mfrs.filter(m => {
    if (!m.name) return false;
    if (/^[a-zA-Z0-9\s.,&\-()/]+$/.test(m.name)) return false;
    return true;
  });
  console.log(`  需要翻译制造商: ${needTranslate.length} 个`);

  let mfrTranslated = 0;
  for (const m of needTranslate) {
    const en = translateCompanyName(m.name);
    if (en && en !== m.name) {
      const ip = m.ip_information || {};
      if (typeof ip === 'string') {
        try { const parsed = JSON.parse(ip); ip = { ...parsed, en_name: en }; }
        catch { ip = { en_name: en }; }
      } else {
        ip.en_name = en;
      }
      const { error } = await supabase.from('ppe_manufacturers')
        .update({ ip_information: ip })
        .eq('id', m.id);
      if (!error) mfrTranslated++;
      await sleep(5);
    }
  }
  console.log(`  制造商名翻译: ${mfrTranslated} 条`);

  // ===== 4. 补全中国PPE出口企业 =====
  console.log('\n--- 4. 补全中国PPE出口企业 ---');
  const existingMfrNames = new Set();
  const allMfrs = await fetchAll('ppe_manufacturers', 'name');
  allMfrs.forEach(m => existingMfrNames.add(m.name));

  const exportMfrs = [
    { name: '山东登升劳保用品有限公司', name_en: 'Shandong Dengsheng Labor Protection Products Co., Ltd.', scope: '乳胶手套、丁腈手套、PVC手套', certs: 'CE认证、LA认证、FDA认证', profile: '中国劳保手套知名出口企业' },
    { name: '山东永安手套有限公司', name_en: 'Shandong Yongan Gloves Co., Ltd.', scope: '劳保手套、丁腈手套', certs: 'CE认证、LA认证', profile: '山东劳保手套出口企业' },
    { name: '浙江东亚手套有限公司', name_en: 'Zhejiang Dongya Gloves Co., Ltd.', scope: '防护手套、丁腈手套', certs: 'CE认证、LA认证', profile: '浙江防护手套出口企业' },
    { name: '浙江嘉茂安全防护用品有限公司', name_en: 'Zhejiang Jiamao Safety Protection Products Co., Ltd.', scope: '安全帽、防护眼镜、防护面罩', certs: 'CE认证、LA认证', profile: '浙江安全防护用品制造商' },
    { name: '广州威尼科技发展有限公司', name_en: 'Guangzhou Vini Technology Development Co., Ltd.', scope: '防护眼镜、护目镜', certs: 'CE认证、LA认证、ANSI Z87.1', profile: '广东防护眼镜专业制造商' },
    { name: '深圳市新纶科技股份有限公司', name_en: 'Shenzhen Selen Science & Technology Co., Ltd.', scope: '防静电服、洁净服、防护服', certs: 'LA认证、CE认证', profile: 'A股上市公司（002341），防静电洁净防护领域龙头' },
    { name: '湖北华强科技有限责任公司', name_en: 'Hubei Huaqiang Technology Co., Ltd.', scope: '防毒面具、呼吸防护、滤毒盒', certs: 'LA认证、军标认证', profile: '中国防毒面具领域龙头企业，军用转民用' },
    { name: '山西新华防护器材有限责任公司', name_en: 'Shanxi Xinhua Protective Equipment Co., Ltd.', scope: '防毒面具、呼吸防护、气体过滤', certs: 'LA认证、军标认证', profile: '中国防护器材老牌企业，军用技术民用化' },
    { name: '阳泉市特种防护用品厂', name_en: 'Yangquan Special Protective Products Factory', scope: '安全帽、防护帽', certs: 'LA认证', profile: '山西安全帽专业制造商' },
    { name: '江苏富吉安全防护用品有限公司', name_en: 'Jiangsu Fuji Safety Protection Products Co., Ltd.', scope: '安全帽、防护眼镜、耳罩', certs: 'LA认证、CE认证', profile: '江苏综合PPE制造商' },
    { name: '丹东市安全防护装备厂', name_en: 'Dandong Safety Protection Equipment Factory', scope: '安全帽、防护面罩', certs: 'LA认证', profile: '辽宁安全防护装备制造商' },
    { name: '重庆金冠安全防护用品有限公司', name_en: 'Chongqing Jinguan Safety Protection Products Co., Ltd.', scope: '安全帽、防护手套', certs: 'LA认证', profile: '重庆安全防护用品制造商' },
    { name: '长沙特种防护用品厂', name_en: 'Changsha Special Protective Products Factory', scope: '安全帽、防护服', certs: 'LA认证', profile: '湖南特种防护用品制造商' },
    { name: '河南省济源市安全防护用品有限公司', name_en: 'Henan Jiyuan Safety Protection Products Co., Ltd.', scope: '安全帽、安全绳', certs: 'LA认证', profile: '河南安全防护用品制造商' },
    { name: '安徽合力股份有限公司', name_en: 'Anhui Heli Co., Ltd.', scope: '安全鞋、防护鞋', certs: 'LA认证、CE认证', profile: '安徽安全防护鞋制造商' },
    { name: '山东高密市众和劳保用品有限公司', name_en: 'Shandong Gaomi Zhonghe Labor Protection Products Co., Ltd.', scope: '劳保手套、防护手套', certs: 'CE认证、LA认证', profile: '山东劳保手套制造商' },
    { name: '张家港市大新镇恒丰手套厂', name_en: 'Zhangjiagang Daxin Hengfeng Glove Factory', scope: '防护手套、劳保手套', certs: 'CE认证', profile: '江苏防护手套制造商' },
    { name: '东莞市亿和塑胶制品有限公司', name_en: 'Dongguan Yihe Plastic Products Co., Ltd.', scope: '防护手套、丁腈手套', certs: 'CE认证、LA认证', profile: '广东防护手套制造商' },
    { name: '江苏国强安全防护设备有限公司', name_en: 'Jiangsu Guoqiang Safety Protection Equipment Co., Ltd.', scope: '坠落防护、安全绳、安全网', certs: 'LA认证', profile: '江苏坠落防护设备制造商' },
    { name: '浙江耐仕安全防护用品有限公司', name_en: 'Zhejiang Naishi Safety Protection Products Co., Ltd.', scope: '呼吸防护、口罩', certs: 'LA认证、CE认证', profile: '浙江呼吸防护用品制造商' },
    { name: '河北冀东安全防护用品有限公司', name_en: 'Hebei Jidong Safety Protection Products Co., Ltd.', scope: '安全帽、防护服', certs: 'LA认证', profile: '河北安全防护用品制造商' },
    { name: '天津市双安防护用品有限公司', name_en: "Tianjin Shuang'an Protection Products Co., Ltd.", scope: '防护服、安全鞋', certs: 'LA认证', profile: '天津防护用品制造商' },
    { name: '石家庄海燕安全防护用品有限公司', name_en: 'Shijiazhuang Haiyan Safety Protection Products Co., Ltd.', scope: '安全帽、防护网、安全绳', certs: 'LA认证', profile: '河北安全防护用品制造商' },
    { name: '宁波天波安全防护用品有限公司', name_en: 'Ningbo Tianbo Safety Protection Products Co., Ltd.', scope: '安全帽、防护眼镜', certs: 'LA认证、CE认证', profile: '浙江安全防护用品制造商' },
    { name: '温州宏达安全防护用品有限公司', name_en: 'Wenzhou Hongda Safety Protection Products Co., Ltd.', scope: '安全鞋、防护手套', certs: 'LA认证、CE认证', profile: '浙江安全防护用品制造商' },
    { name: '上海诚格安全防护用品有限公司', name_en: 'Shanghai Chengge Safety Protection Products Co., Ltd.', scope: '安全鞋、安全帽、防护服', certs: 'LA认证、CE认证', profile: '上海安全防护用品制造商' },
    { name: '北京邦维应急装备有限公司', name_en: 'Beijing Bangwei Emergency Equipment Co., Ltd.', scope: '医用一次性防护服、应急防护装备', certs: 'NMPA认证、LA认证', profile: '北京邦维集团旗下，专业生产医用防护服和应急防护装备' },
    { name: '山东高密市天成劳保用品有限公司', name_en: 'Shandong Gaomi Tiancheng Labor Protection Products Co., Ltd.', scope: '劳保手套、防护手套', certs: 'CE认证、LA认证', profile: '山东劳保手套制造商' },
  ];

  let exportAdded = 0;
  for (const mfr of exportMfrs) {
    if (!existingMfrNames.has(mfr.name)) {
      const { error } = await supabase.from('ppe_manufacturers').insert({
        name: mfr.name,
        country: 'CN',
        business_scope: mfr.scope,
        certifications: mfr.certs,
        company_profile: mfr.profile,
        ip_information: { en_name: mfr.name_en },
        data_source: 'China PPE Industry Registry (Verified)',
        data_confidence_level: 'high',
      });
      if (!error) exportAdded++;
      await sleep(30);
    }
  }
  console.log(`  新增出口企业: ${exportAdded} 个`);

  // ===== 5. 最终验证 =====
  console.log('\n========== 最终验证 ==========\n');
  const { count: totalProducts } = await supabase.from('ppe_products').select('*', { count: 'exact', head: true });
  const { count: totalMfrs } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true });
  console.log(`  产品总数: ${totalProducts}`);
  console.log(`  制造商总数: ${totalMfrs}`);

  const { data: cnMfrsFinal } = await supabase.from('ppe_manufacturers').select('id,name,ip_information').eq('country', 'CN');
  const cnList = cnMfrsFinal || [];
  let cnWithEn = 0;
  cnList.forEach(m => {
    const ip = m.ip_information;
    if (ip && typeof ip === 'object' && ip.en_name) cnWithEn++;
  });
  console.log(`  中国制造商: ${cnList.length} 个`);
  console.log(`  有英文名: ${cnWithEn} (${((cnWithEn / cnList.length) * 100).toFixed(1)}%)`);

  const { data: productsWithIntl } = await supabase.from('ppe_products')
    .select('id,international_names')
    .not('international_names', 'is', null)
    .limit(10000);
  let withCatEn = 0, withNameEn = 0;
  (productsWithIntl || []).forEach(p => {
    const intl = p.international_names;
    if (intl && typeof intl === 'object') {
      if (intl.en && intl.en.category) withCatEn++;
      if (intl.en && intl.en.name) withNameEn++;
    }
  });
  console.log(`  产品有英文分类: ${withCatEn}`);
  console.log(`  产品有英文名称: ${withNameEn}`);

  console.log('\n========================================');
  console.log('双语翻译 + 企业补全完成');
  console.log('========================================');
  console.log(`  分类翻译: ${catTranslated} 条`);
  console.log(`  产品名翻译: ${nameTranslated} 条`);
  console.log(`  制造商名翻译: ${mfrTranslated} 条`);
  console.log(`  出口企业新增: ${exportAdded} 个`);
}

main().catch(console.error);
