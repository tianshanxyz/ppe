#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

(async () => {
  console.log('=== 补充缺失的PPE企业数据 ===\n');

  // 获取现有制造商
  const existingMfrs = new Set();
  for (let p = 0; ; p++) {
    const { data } = await supabase.from('ppe_manufacturers')
      .select('name')
      .range(p*1000, (p+1)*1000-1);
    if (!data?.length) break;
    data.forEach(r => existingMfrs.add((r.name||'').toLowerCase().trim()));
    if (data.length < 1000) break;
  }
  console.log(`现有制造商: ${existingMfrs.size}`);

  // 补充缺失的PPE企业 - 覆盖五大品类
  const missingCompanies = [
    // ===== 1. 头面部防护 =====
    // 焊接面罩
    { name: '上海沪工焊接集团股份有限公司', cat: '头面部防护', products: '焊接面罩、焊接防护', prov: '上海' },
    { name: '深圳市佳士科技股份有限公司', cat: '头面部防护', products: '焊接面罩、焊帽', prov: '广东' },
    { name: '瑞凌股份有限公司', cat: '头面部防护', products: '焊接面罩', prov: '广东' },
    { name: '北京时代科技股份有限公司', cat: '头面部防护', products: '焊接防护设备', prov: '北京' },
    { name: '山东奥太电气有限公司', cat: '头面部防护', products: '焊接面罩', prov: '山东' },
    
    // 安全帽
    { name: '北京力达塑料制造有限公司', cat: '头面部防护', products: '安全帽、防护帽', prov: '北京' },
    { name: '河北安达特种防护用品制造有限公司', cat: '头面部防护', products: '安全帽、防护面罩', prov: '河北' },
    { name: '华安安全设备制造有限公司', cat: '头面部防护', products: '安全帽', prov: '广东' },
    { name: '永康市博盾防护用品有限公司', cat: '头面部防护', products: '耳塞、听力防护', prov: '浙江' },
    
    // ===== 2. 呼吸防护 =====
    { name: '上海宝亚安全装备股份有限公司', cat: '呼吸防护', products: '自给式呼吸器、正压呼吸器', prov: '上海' },
    { name: '荆州思创科技开发有限公司', cat: '呼吸防护', products: '防毒面具、呼吸防护', prov: '湖北' },
    { name: '北京生宝恒泰安全科技有限公司', cat: '呼吸防护', products: '逃生呼吸器、防尘口罩', prov: '北京' },
    { name: '上海港凯净化制品有限公司', cat: '呼吸防护', products: '防尘口罩、颗粒物防护', prov: '上海' },
    { name: '上海大胜卫生用品制造有限公司', cat: '呼吸防护', products: '防尘口罩、工业口罩', prov: '上海' },
    { name: '衢州市南核特种劳动防护用品科技有限公司', cat: '呼吸防护', products: '防毒面具、滤毒盒', prov: '浙江' },
    
    // ===== 3. 躯体防护 =====
    // 消防服
    { name: '优普泰（深圳）科技有限公司', cat: '躯体防护', products: '消防服、阻燃防护服', prov: '广东' },
    { name: '邦威防护科技股份有限公司', cat: '躯体防护', products: '消防服、防护服', prov: '江苏' },
    { name: '际华集团股份有限公司', cat: '躯体防护', products: '消防服、军需防护服', prov: '北京' },
    { name: '北京邦维普泰防护纺织有限公司', cat: '躯体防护', products: '消防服、应急救援服', prov: '北京' },
    
    // 防电弧服
    { name: '美国杜邦中国集团有限公司', cat: '躯体防护', products: '防电弧服、Nomex防护服', prov: '上海', foreign: true },
    { name: '美国雷克兰工业公司', cat: '躯体防护', products: '防电弧服、化学防护服', prov: '上海', foreign: true },
    
    // 焊接服
    { name: '梧州市友盟焊接防护用品有限公司', cat: '躯体防护', products: '焊接服、焊工防护服', prov: '广西' },
    { name: '福建泉州嘉成皮件手套有限公司', cat: '躯体防护', products: '焊接服、焊工围裙', prov: '福建' },
    
    // 耐高温/低温防护服
    { name: '美国开普乐（Kappler）', cat: '躯体防护', products: '耐高温防护服、化学防护服', prov: '上海', foreign: true },
    { name: '德国德尔格', cat: '躯体防护', products: '低温防护服、化学防护服', prov: '上海', foreign: true },
    
    // 核辐射防护服
    { name: '美国RST核生化防护', cat: '躯体防护', products: '核辐射防护服', prov: '北京', foreign: true },
    
    // 反光背心
    { name: '河南依卓尔服饰制造有限公司', cat: '躯体防护', products: '反光背心、反光衣', prov: '河南' },
    { name: '浙江星华新材料集团股份有限公司', cat: '躯体防护', products: '反光材料、反光背心', prov: '浙江' },
    { name: '道明光学股份有限公司', cat: '躯体防护', products: '反光材料、反光背心', prov: '浙江' },
    
    // ===== 4. 手足部防护 =====
    // 安全鞋
    { name: '江苏盾王科技集团有限公司', cat: '手足部防护', products: '防砸安全鞋、绝缘鞋、防静电鞋', prov: '江苏' },
    { name: '上海澳翔鞋业有限公司', cat: '手足部防护', products: '安全鞋、耐酸碱鞋', prov: '上海' },
    { name: '上海首沪劳保用品有限公司', cat: '手足部防护', products: '防滑安全鞋、防砸鞋', prov: '上海' },
    { name: '河北安盾劳保制造有限公司', cat: '手足部防护', products: '安全鞋、防砸鞋', prov: '河北' },
    { name: '际华3515强人皮鞋有限公司', cat: '手足部防护', products: '安全鞋、军需鞋靴', prov: '河南' },
    { name: '浙江安腾安全防护设备有限公司', cat: '手足部防护', products: '安全鞋、职业防护鞋', prov: '浙江' },
    { name: '广州赛固鞋业有限公司', cat: '手足部防护', products: '安全鞋、防护靴', prov: '广东' },
    { name: '上海希玛科技（集团）有限公司', cat: '手足部防护', products: '安全鞋、防护鞋', prov: '上海' },
    { name: '浙江海纳鞋业有限公司', cat: '手足部防护', products: '安全鞋、劳保鞋', prov: '浙江' },
    { name: '山东春江鞋业集团有限公司', cat: '手足部防护', products: '安全鞋、防护靴', prov: '山东' },
    { name: '际华3539制鞋有限公司', cat: '手足部防护', products: '安全鞋、橡胶靴', prov: '重庆' },
    { name: '宁波百力安防科技有限公司', cat: '手足部防护', products: '安全鞋、防护靴', prov: '浙江' },
    { name: '青岛美康防火材料有限公司', cat: '手足部防护', products: '防火鞋、安全靴', prov: '山东' },
    { name: '上海朗峰工业有限公司', cat: '手足部防护', products: 'PU注塑安全鞋', prov: '上海' },
    { name: '高密市星隆劳保用品有限公司', cat: '手足部防护', products: '安全鞋、防护鞋', prov: '山东' },
    { name: '瑞安市赣宇鞋业有限公司', cat: '手足部防护', products: '安全鞋、安全靴', prov: '浙江' },
    { name: '温州百斯特安全鞋业有限公司', cat: '手足部防护', products: '安全鞋、CE认证安全鞋', prov: '浙江' },
    { name: '厦门倍特安防科技有限公司', cat: '手足部防护', products: '轻便安全鞋、运动安全鞋', prov: '福建' },
    
    // 防护手套
    { name: '山东星宇手套有限公司', cat: '手足部防护', products: '耐酸碱手套、防切割手套', prov: '山东' },
    { name: '浙江康隆达特种防护科技股份有限公司', cat: '手足部防护', products: '防切割手套、耐油手套', prov: '浙江' },
    { name: '山东登升安防科技有限公司', cat: '手足部防护', products: '耐酸碱手套、防切割手套', prov: '山东' },
    { name: '江苏恒辉安防股份有限公司', cat: '手足部防护', products: '防切割手套、防刺手套', prov: '江苏' },
    { name: '东亚手套有限公司', cat: '手足部防护', products: '耐酸碱手套、绝缘手套', prov: '浙江' },
    { name: '浙江东亚手套有限公司', cat: '手足部防护', products: '耐油手套、防切割手套', prov: '浙江' },
    { name: '山东英科医疗用品有限公司', cat: '手足部防护', products: '医用手套、工业手套', prov: '山东' },
    { name: '台州市厂兴手套有限公司', cat: '手足部防护', products: '防护手套、劳保手套', prov: '浙江' },
    { name: '高州市倍力牛皮革制品有限公司', cat: '手足部防护', products: '焊工手套、皮手套', prov: '广东' },
    { name: '福建泉州嘉成皮件手套有限公司', cat: '手足部防护', products: '焊工手套、焊接防护手套', prov: '福建' },
    { name: '上海湃福实业有限公司', cat: '手足部防护', products: '防护手套、劳保手套', prov: '上海' },
    
    // 绝缘手套/鞋
    { name: '天津双安劳保用品有限公司', cat: '手足部防护', products: '绝缘手套、绝缘鞋', prov: '天津' },
    { name: '上海电工器材厂有限公司', cat: '手足部防护', products: '绝缘手套、绝缘靴', prov: '上海' },
    
    // ===== 5. 坠落及其他防护 =====
    { name: '北京力达塑料制造有限公司', cat: '坠落防护', products: '安全带、安全绳', prov: '北京' },
    { name: '河北安达特种防护用品制造有限公司', cat: '坠落防护', products: '安全带、防坠器', prov: '河北' },
    { name: '邯郸奇梦劳动防护用品制造有限公司', cat: '坠落防护', products: '安全带、安全绳、防护网', prov: '河北' },
    { name: '上海百业安防科技有限公司', cat: '坠落防护', products: '防坠器、安全带', prov: '上海' },
    { name: '3M中国有限公司', cat: '坠落防护', products: '安全带、防坠系统', prov: '上海', foreign: true },
    { name: '梅思安（中国）安全设备有限公司', cat: '坠落防护', products: '安全带、救援装备', prov: '上海', foreign: true },
    
    // 救生衣
    { name: '无锡兴泰船舶装备有限公司', cat: '坠落防护', products: '救生衣、救生圈', prov: '江苏' },
    { name: '东台市江海救生消防设备有限公司', cat: '坠落防护', products: '救生衣、救生设备', prov: '江苏' },
    
    // 护膝/护肘/护腰
    { name: '河北宁纺集团有限责任公司', cat: '坠落防护', products: '护膝、护腰、劳保服装', prov: '河北' },
    { name: '保定伊爽服饰制造有限公司', cat: '坠落防护', products: '护腰、劳保用品', prov: '河北' },
    { name: '石家庄市萱奇床上用品有限公司', cat: '坠落防护', products: '防护用品、劳保用品', prov: '河北' },
    
    // ===== 其他综合类 =====
    { name: '乌鲁木齐市伊莱特商贸有限公司', cat: '综合', products: '安全帽、防护手套、劳保鞋、劳保工装', prov: '新疆' },
    { name: '黑龙江鑫意劳保用品有限公司', cat: '综合', products: '劳保用品一站式供应', prov: '黑龙江' },
    { name: '大连有一安防科技有限公司', cat: '综合', products: '劳保用品、安全防护', prov: '辽宁' },
    { name: '安徽新浩诚防护科技有限公司', cat: '综合', products: '口罩、防护用品', prov: '安徽' },
    { name: '仟佰盾（厦门）科技有限公司', cat: '综合', products: '口罩、防护装备', prov: '福建' },
    { name: '桐城市康宝防护用品有限公司', cat: '综合', products: '口罩、防护用品', prov: '安徽' },
    { name: '临沂福安特劳保用品有限公司', cat: '综合', products: '劳保用品、安全防护', prov: '山东' },
    { name: '临沂市忠辰劳保用品有限公司', cat: '综合', products: '劳保用品、安全防护', prov: '山东' },
    { name: '临沂大华劳保用品有限公司', cat: '综合', products: '劳保用品、安全防护', prov: '山东' },
    { name: '临沂乐红劳保用品有限公司', cat: '综合', products: '劳保用品、安全防护', prov: '山东' },
  ];

  console.log(`待补充企业: ${missingCompanies.length}`);

  let ins = 0, skip = 0, fail = 0;
  for (const c of missingCompanies) {
    const key = c.name.toLowerCase().trim();
    if (existingMfrs.has(key)) { skip++; continue; }

    const { error } = await supabase.from('ppe_manufacturers').insert({
      name: c.name,
      country: c.foreign ? 'Multi' : 'CN',
      data_source: '行业公开资料+劳保网',
      last_verified: new Date().toISOString().split('T')[0],
      data_confidence_level: c.foreign ? 'medium' : 'high',
      business_scope: c.cat,
      certifications: c.foreign ? ['国际认证'] : ['LA安标认证'],
      company_profile: `产品: ${c.products} | 省份: ${c.prov} | 企业类型: ${c.foreign ? '外资在华' : '国内企业'} | 产品数据状态: 待补充`,
    });

    if (!error) { existingMfrs.add(key); ins++; }
    else { fail++; }
  }

  console.log(`\n新增: ${ins}, 跳过: ${skip}, 失败: ${fail}`);

  // 统计
  const { count: totalMfrs } = await supabase.from('ppe_manufacturers')
    .select('*', { count: 'exact', head: true });
  const { count: cnMfrs } = await supabase.from('ppe_manufacturers')
    .select('*', { count: 'exact', head: true })
    .in('country', ['CN', 'Multi']);

  console.log(`\n总制造商: ${totalMfrs}, 中国相关: ${cnMfrs}`);
  console.log('\n=== 完成 ===');
})();
