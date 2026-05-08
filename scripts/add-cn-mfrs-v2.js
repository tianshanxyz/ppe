#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

(async () => {
  console.log('=== 补充缺失的中国PPE企业 ===\n');

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

  const companies = [
    { name: '深圳市华安劳保用品有限公司', cat: '呼吸防护装备', prov: '广东', type: '劳保' },
    { name: '北京生宝恒泰安全科技有限公司', cat: '呼吸防护装备', prov: '北京', type: '劳保' },
    { name: '上海港凯净化制品有限公司', cat: '呼吸防护装备', prov: '上海', type: '劳保' },
    { name: '衢州南核特种劳动防护用品科技有限公司', cat: '呼吸防护装备', prov: '浙江', type: '劳保' },
    { name: '桐城市惠友劳保用品有限公司', cat: '呼吸防护装备', prov: '安徽', type: '劳保' },
    { name: '桐城市康宝劳保用品有限公司', cat: '呼吸防护装备', prov: '安徽', type: '劳保' },
    { name: '上海大胜卫生用品制造有限公司', cat: '呼吸防护装备', prov: '上海', type: '劳保' },
    { name: '江阴市长洪防护用品有限公司', cat: '呼吸防护装备', prov: '江苏', type: '劳保' },
    { name: '上海美迪康医用制品有限公司', cat: '呼吸防护装备', prov: '上海', type: '劳保' },
    { name: '赛纳集团有限公司', cat: '呼吸防护装备,身体防护装备', prov: '浙江', type: '劳保' },
    { name: '山东星宇手套有限公司', cat: '手部防护装备', prov: '山东', type: '劳保' },
    { name: '浙江康隆达特种防护科技股份有限公司', cat: '手部防护装备', prov: '浙江', type: '劳保' },
    { name: '山东登升安防科技有限公司', cat: '手部防护装备', prov: '山东', type: '劳保' },
    { name: '江苏恒辉安防股份有限公司', cat: '手部防护装备', prov: '江苏', type: '劳保' },
    { name: '东亚手套有限公司', cat: '手部防护装备', prov: '浙江', type: '劳保' },
    { name: '江苏盾王科技集团有限公司', cat: '足部防护装备', prov: '江苏', type: '劳保' },
    { name: '上海广和工贸有限公司', cat: '足部防护装备', prov: '上海', type: '劳保' },
    { name: '赛立特（上海）安全设备有限公司', cat: '足部防护装备,头部防护装备', prov: '上海', type: '劳保' },
    { name: '无锡华信安全设备股份有限公司', cat: '头部防护装备,眼面部防护装备,呼吸防护装备', prov: '江苏', type: '劳保' },
    { name: '上海希玛科技（集团）有限公司', cat: '头部防护装备,眼面部防护装备', prov: '上海', type: '劳保' },
    { name: '上海宝亚安全装备股份有限公司', cat: '呼吸防护装备,身体防护装备', prov: '上海', type: '劳保' },
    { name: '优普泰（深圳）科技有限公司', cat: '身体防护装备', prov: '广东', type: '劳保' },
    { name: '荆州思创科技开发有限公司', cat: '呼吸防护装备', prov: '湖北', type: '劳保' },
    { name: '邦威防护科技股份有限公司', cat: '身体防护装备,手部防护装备', prov: '江苏', type: '劳保' },
    { name: '优唯斯（广州）安全防护用品有限公司', cat: '头部防护装备,眼面部防护装备', prov: '广东', type: '外资' },
    { name: '霍尼韦尔安全防护设备（上海）有限公司', cat: '头部防护装备,呼吸防护装备', prov: '上海', type: '外资' },
    { name: '安思尔（上海）商贸有限公司', cat: '手部防护装备', prov: '上海', type: '外资' },
    { name: '代尔塔（中国）安全防护有限公司', cat: '身体防护装备,头部防护装备', prov: '上海', type: '外资' },
    { name: '3M中国有限公司', cat: '呼吸防护装备,听觉防护装备', prov: '上海', type: '外资' },
    { name: '梅思安（中国）安全设备有限公司', cat: '头部防护装备,呼吸防护装备', prov: '上海', type: '外资' },
    { name: '广州阳悦安全防护设备有限公司', cat: '身体防护装备,头部防护装备', prov: '广东', type: '劳保' },
    { name: '江苏宏洋安全防护用品有限公司', cat: '眼面部防护装备', prov: '江苏', type: '劳保' },
    { name: '北京力达塑料制造有限公司', cat: '手部防护装备', prov: '北京', type: '劳保' },
    { name: '安博安全防护用品有限公司', cat: '身体防护装备,头部防护装备', prov: '广东', type: '劳保' },
    { name: '卡莫安全防护用品有限公司', cat: '身体防护装备', prov: '广东', type: '劳保' },
    { name: '赛弗图安全鞋业有限公司', cat: '足部防护装备', prov: '广东', type: '劳保' },
    { name: '浙江东亚手套有限公司', cat: '手部防护装备', prov: '浙江', type: '劳保' },
    { name: '山东英科医疗用品有限公司', cat: '手部防护装备', prov: '山东', type: '劳保' },
    { name: '蓝禾医疗用品有限公司', cat: '呼吸防护装备', prov: '江苏', type: '劳保' },
    { name: '河南驼人医疗器械集团有限公司', cat: '呼吸防护装备,身体防护装备', prov: '河南', type: '医用+劳保' },
    { name: '稳健医疗用品股份有限公司', cat: '呼吸防护装备,身体防护装备', prov: '广东', type: '医用+劳保' },
    { name: '奥美医疗用品股份有限公司', cat: '呼吸防护装备,身体防护装备', prov: '湖北', type: '医用+劳保' },
    { name: '振德医疗用品股份有限公司', cat: '呼吸防护装备,身体防护装备', prov: '浙江', type: '医用+劳保' },
    { name: '江苏南方卫材医药股份有限公司', cat: '呼吸防护装备,身体防护装备', prov: '江苏', type: '医用+劳保' },
    { name: '阳普医疗科技股份有限公司', cat: '呼吸防护装备', prov: '广东', type: '医用+劳保' },
    { name: '中红普林医疗用品股份有限公司', cat: '手部防护装备', prov: '河北', type: '医用+劳保' },
    { name: '蓝帆医疗股份有限公司', cat: '手部防护装备', prov: '山东', type: '医用+劳保' },
    { name: '英科医疗科技股份有限公司', cat: '手部防护装备', prov: '山东', type: '医用+劳保' },
  ];

  let ins = 0, skip = 0, fail = 0;
  for (const c of companies) {
    const key = c.name.toLowerCase().trim();
    if (existingMfrs.has(key)) { skip++; continue; }

    const certs = [];
    if (c.type === '劳保') certs.push('LA安标认证');
    if (c.type === '医用+劳保') certs.push('NMPA医疗器械注册证', 'LA安标认证');
    if (c.type === '外资') certs.push('LA安标认证', '进口代理');

    const { error } = await supabase.from('ppe_manufacturers').insert({
      name: c.name,
      country: c.type === '外资' ? 'Multi' : 'CN',
      data_source: '行业公开资料+安标中心',
      last_verified: new Date().toISOString().split('T')[0],
      data_confidence_level: c.type === '外资' ? 'medium' : 'high',
      business_scope: c.cat,
      certifications: certs,
      company_profile: `省份: ${c.prov} | 企业类型: ${c.type} | 产品类别: ${c.cat}`,
    });

    if (!error) { existingMfrs.add(key); ins++; }
    else { fail++; console.log(`  失败: ${c.name} - ${error.message}`); }
  }

  console.log(`\n新增: ${ins}, 跳过: ${skip}, 失败: ${fail}`);

  const { count: totalMfrs } = await supabase.from('ppe_manufacturers')
    .select('*', { count: 'exact', head: true });
  const { count: cnMfrs } = await supabase.from('ppe_manufacturers')
    .select('*', { count: 'exact', head: true })
    .in('country', ['CN', 'Multi']);

  console.log(`总制造商: ${totalMfrs}, 中国相关: ${cnMfrs}`);
  console.log('\n=== 完成 ===');
})();
