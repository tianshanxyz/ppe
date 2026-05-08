#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

(async () => {
  console.log('=== PPE五大品类全覆盖检查 ===\n');

  // 获取所有产品
  const allProducts = [];
  for (let p = 0; ; p++) {
    const { data } = await supabase.from('ppe_products')
      .select('name, category, country_of_origin, data_source')
      .range(p * 1000, (p + 1) * 1000 - 1);
    if (!data || data.length === 0) break;
    allProducts.push(...data);
    if (data.length < 1000) break;
  }

  console.log(`总产品数: ${allProducts.length}\n`);

  // 定义五大品类关键词
  const categories = {
    '1. 头面部防护': {
      keywords: ['安全帽', '头盔', 'helmet', 'hard hat',
                 '护目镜', '防护眼镜', 'goggle', 'eye protection',
                 '面屏', '面罩', 'face shield', 'faceshield',
                 '焊接面罩', 'welding mask', '焊帽',
                 '口罩', 'mask', 'N95', 'KN95', 'FFP', 'respirator',
                 '防毒面具', 'gas mask', '防毒面罩',
                 '耳塞', '耳罩', 'earplug', 'earmuff', '听力防护'],
      found: [],
      count: 0
    },
    '2. 呼吸防护': {
      keywords: ['呼吸器', '呼吸防护', 'respirator', 'breathing apparatus',
                 '随弃式', '一次性呼吸器', 'disposable respirator',
                 '半面罩', '全面罩', 'half mask', 'full face',
                 '动力送风', 'powered air', 'PAPR',
                 '自给式', '正压呼吸器', 'SCBA', 'self-contained',
                 '逃生呼吸器', 'escape respirator', 'emergency breathing'],
      found: [],
      count: 0
    },
    '3. 躯体防护': {
      keywords: ['防护服', '防护衣', 'protective suit', 'protective clothing', 'coverall',
                 '医用防护服', 'medical protective clothing',
                 '化学防护服', 'chemical protective', '防化服',
                 '消防服', 'firefighter suit', 'fire fighting',
                 '防静电服', 'anti-static clothing', 'ESD clothing',
                 '防电弧服', 'arc flash', 'arc protective',
                 '焊接服', 'welding clothing', 'welder clothing',
                 '耐高温服', '耐高温防护服', 'heat resistant',
                 '低温防护服', 'cold resistant', '低温防护',
                 '核辐射防护服', 'radiation protective', 'nuclear protective',
                 '反光背心', '反光衣', 'reflective vest', 'high visibility',
                 '隔离衣', 'isolation gown', '手术衣', 'surgical gown'],
      found: [],
      count: 0
    },
    '4. 手足部防护': {
      keywords: ['手套', 'glove',
                 '医用手套', 'medical glove', 'examination glove', 'surgical glove',
                 '耐酸碱手套', 'chemical resistant glove', 'acid resistant',
                 '耐油手套', 'oil resistant glove',
                 '绝缘手套', 'insulating glove', 'electrical glove',
                 '防切割手套', 'cut resistant glove', '防刺手套', 'puncture resistant',
                 '焊工手套', 'welding glove', '焊接手套',
                 '防护鞋', '防护靴', 'safety shoe', 'safety boot', 'protective footwear',
                 '防砸安全鞋', '防砸鞋', 'safety toe', 'steel toe',
                 '绝缘鞋', '绝缘靴', 'electrical insulating footwear',
                 '耐酸碱靴', 'chemical resistant boot',
                 '消防靴', 'firefighter boot', 'fire fighting boot',
                 '防静电鞋', 'anti-static shoe', 'ESD footwear'],
      found: [],
      count: 0
    },
    '5. 坠落及其他防护': {
      keywords: ['安全带', '安全绳', 'safety belt', 'safety harness', 'lanyard',
                 '防坠器', 'fall arrest', 'fall protection', 'fall arrester',
                 '救生衣', 'life jacket', '救生圈', 'life buoy',
                 '护膝', 'knee pad', '护肘', 'elbow pad', '护腰', 'back support',
                 '肢体防护', 'limb protection'],
      found: [],
      count: 0
    }
  };

  // 检查每个产品属于哪个品类
  allProducts.forEach(p => {
    const name = (p.name || '').toLowerCase();
    let matched = false;

    for (const [catName, catInfo] of Object.entries(categories)) {
      for (const kw of catInfo.keywords) {
        if (name.includes(kw.toLowerCase())) {
          catInfo.found.push({
            name: p.name,
            category: p.category,
            country: p.country_of_origin,
            source: p.data_source
          });
          catInfo.count++;
          matched = true;
          break;
        }
      }
      if (matched) break;
    }
  });

  // 输出结果
  for (const [catName, catInfo] of Object.entries(categories)) {
    console.log(`${catName}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   产品数量: ${catInfo.count}`);

    if (catInfo.count > 0) {
      // 去重后统计
      const uniqueProducts = [...new Set(catInfo.found.map(p => p.name))];
      console.log(`   去重后: ${uniqueProducts.length}`);

      // 显示前5个示例
      console.log('   示例产品:');
      uniqueProducts.slice(0, 5).forEach((name, i) => {
        console.log(`      ${i + 1}. ${name.substring(0, 50)}`);
      });
      if (uniqueProducts.length > 5) {
        console.log(`      ... 还有 ${uniqueProducts.length - 5} 个`);
      }
    } else {
      console.log('   ❌ 该品类暂无产品数据');
    }
    console.log('');
  }

  // 检查缺失的细分品类
  console.log('=== 细分品类缺失检查 ===\n');

  const missingItems = [];

  // 头面部
  if (!allProducts.some(p => /安全帽|helmet|hard hat/i.test(p.name))) missingItems.push('安全帽/头盔');
  if (!allProducts.some(p => /焊接面罩|welding mask|焊帽/i.test(p.name))) missingItems.push('焊接面罩');
  if (!allProducts.some(p => /防毒面具|gas mask/i.test(p.name))) missingItems.push('防毒面具');

  // 呼吸防护
  if (!allProducts.some(p => /动力送风|powered air|PAPR/i.test(p.name))) missingItems.push('动力送风过滤式呼吸器');
  if (!allProducts.some(p => /自给式|正压呼吸器|SCBA/i.test(p.name))) missingItems.push('自给式正压呼吸器');
  if (!allProducts.some(p => /逃生呼吸器|escape respirator/i.test(p.name))) missingItems.push('逃生呼吸器');

  // 躯体防护
  if (!allProducts.some(p => /消防服|firefighter/i.test(p.name))) missingItems.push('消防服');
  if (!allProducts.some(p => /防电弧服|arc flash/i.test(p.name))) missingItems.push('防电弧服');
  if (!allProducts.some(p => /焊接服|welding clothing/i.test(p.name))) missingItems.push('焊接服');
  if (!allProducts.some(p => /耐高温服|heat resistant/i.test(p.name))) missingItems.push('耐高温防护服');
  if (!allProducts.some(p => /低温防护服|cold resistant/i.test(p.name))) missingItems.push('低温防护服');
  if (!allProducts.some(p => /核辐射|nuclear|radiation protective/i.test(p.name))) missingItems.push('核辐射防护服');
  if (!allProducts.some(p => /反光背心|reflective vest|high visibility/i.test(p.name))) missingItems.push('反光背心/反光衣');

  // 手足部
  if (!allProducts.some(p => /耐酸碱手套|chemical resistant/i.test(p.name))) missingItems.push('耐酸碱手套');
  if (!allProducts.some(p => /耐油手套|oil resistant/i.test(p.name))) missingItems.push('耐油手套');
  if (!allProducts.some(p => /绝缘手套|insulating glove/i.test(p.name))) missingItems.push('绝缘手套');
  if (!allProducts.some(p => /防切割|cut resistant/i.test(p.name))) missingItems.push('防切割/防刺手套');
  if (!allProducts.some(p => /焊工手套|welding glove/i.test(p.name))) missingItems.push('焊工手套');
  if (!allProducts.some(p => /防护鞋|防护靴|safety shoe|safety boot/i.test(p.name))) missingItems.push('防护鞋/安全鞋');
  if (!allProducts.some(p => /防砸|safety toe|steel toe/i.test(p.name))) missingItems.push('防砸安全鞋');
  if (!allProducts.some(p => /绝缘鞋|绝缘靴|electrical insulating footwear/i.test(p.name))) missingItems.push('绝缘鞋/靴');
  if (!allProducts.some(p => /消防靴|firefighter boot/i.test(p.name))) missingItems.push('消防靴');

  // 坠落及其他
  if (!allProducts.some(p => /安全带|安全绳|safety harness|safety belt/i.test(p.name))) missingItems.push('安全带/安全绳');
  if (!allProducts.some(p => /防坠器|fall arrest|fall protection/i.test(p.name))) missingItems.push('防坠器');
  if (!allProducts.some(p => /救生衣|life jacket/i.test(p.name))) missingItems.push('救生衣');
  if (!allProducts.some(p => /护膝|knee pad/i.test(p.name))) missingItems.push('护膝');
  if (!allProducts.some(p => /护肘|elbow pad/i.test(p.name))) missingItems.push('护肘');
  if (!allProducts.some(p => /护腰|back support/i.test(p.name))) missingItems.push('护腰/背部支撑');

  if (missingItems.length > 0) {
    console.log('❌ 缺失的细分品类:');
    missingItems.forEach(item => console.log(`   - ${item}`));
  } else {
    console.log('✅ 所有细分品类均已覆盖');
  }

  // 总结
  console.log('\n=== 覆盖度总结 ===');
  const totalCategories = Object.keys(categories).length;
  const coveredCategories = Object.values(categories).filter(c => c.count > 0).length;
  console.log(`五大品类覆盖: ${coveredCategories}/${totalCategories}`);
  console.log(`细分品类缺失: ${missingItems.length}项`);

})();
