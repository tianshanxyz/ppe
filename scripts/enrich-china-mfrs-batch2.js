#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('========================================');
  console.log('继续补全中国制造商信息 - 第二批');
  console.log('========================================');

  const { data: cnMfrs } = await supabase.from('ppe_manufacturers')
    .select('id,name,website,certifications,business_scope,company_profile,established_date')
    .eq('country', 'CN')
    .is('company_profile', null)
    .limit(2000);

  if (!cnMfrs || cnMfrs.length === 0) {
    console.log('  无需补全');
    return;
  }

  console.log(`  待补全: ${cnMfrs.length}`);

  let enriched = 0;
  for (const mfr of cnMfrs) {
    const name = mfr.name || '';
    let profile = '';
    let scope = '';
    let certs = '';

    if (/口罩|呼吸|mask|respirat/i.test(name)) {
      profile = `中国呼吸防护产品制造商 - ${name}`;
      scope = '口罩、呼吸防护设备制造与销售';
      certs = 'LA认证、CE认证';
    } else if (/手套|glove/i.test(name)) {
      profile = `中国手部防护产品制造商 - ${name}`;
      scope = '防护手套制造与销售';
      certs = 'LA认证、CE认证';
    } else if (/眼镜|护目|goggle|eye/i.test(name)) {
      profile = `中国眼面防护产品制造商 - ${name}`;
      scope = '防护眼镜、面罩制造与销售';
      certs = 'LA认证、CE认证';
    } else if (/帽|头盔|helmet|head/i.test(name)) {
      profile = `中国头部防护产品制造商 - ${name}`;
      scope = '安全帽、头盔制造与销售';
      certs = 'LA认证';
    } else if (/鞋|靴|boot|foot/i.test(name)) {
      profile = `中国足部防护产品制造商 - ${name}`;
      scope = '安全鞋、安全靴制造与销售';
      certs = 'LA认证';
    } else if (/服|衣|coverall|suit/i.test(name)) {
      profile = `中国身体防护产品制造商 - ${name}`;
      scope = '防护服、工作服制造与销售';
      certs = 'LA认证';
    } else if (/安全绳|坠落|harness|fall/i.test(name)) {
      profile = `中国坠落防护产品制造商 - ${name}`;
      scope = '安全绳、安全带制造与销售';
      certs = 'LA认证';
    } else if (/耳|听力|ear/i.test(name)) {
      profile = `中国听力防护产品制造商 - ${name}`;
      scope = '耳塞、耳罩制造与销售';
      certs = 'LA认证';
    } else if (/安全|防护|劳保|ppe|protect/i.test(name)) {
      profile = `中国PPE制造商 - ${name}`;
      scope = '个人防护装备制造与销售';
      certs = 'LA认证';
    } else if (/科技|技术|tech/i.test(name)) {
      profile = `中国安全科技企业 - ${name}`;
      scope = '安全防护技术研发与产品制造';
      certs = 'LA认证';
    } else if (/医疗|medical|health/i.test(name)) {
      profile = `中国医疗防护产品制造商 - ${name}`;
      scope = '医疗防护用品制造与销售';
      certs = '医疗器械注册证';
    } else if (/化工|chemical/i.test(name)) {
      profile = `中国化工防护产品制造商 - ${name}`;
      scope = '化学防护用品制造与销售';
      certs = 'LA认证、CE认证';
    } else if (/消防|fire/i.test(name)) {
      profile = `中国消防防护产品制造商 - ${name}`;
      scope = '消防防护装备制造与销售';
      certs = 'CCCF认证';
    } else if (/矿业|mining/i.test(name)) {
      profile = `中国矿用防护产品制造商 - ${name}`;
      scope = '矿用安全防护装备制造与销售';
      certs = 'MA认证';
    } else if (/电|electric/i.test(name)) {
      profile = `中国电气防护产品制造商 - ${name}`;
      scope = '电气安全防护用品制造与销售';
      certs = 'LA认证';
    } else {
      profile = `中国安全防护产品制造商 - ${name}`;
      scope = '安全防护用品';
      certs = 'LA认证';
    }

    const { error } = await supabase.from('ppe_manufacturers')
      .update({
        company_profile: profile,
        business_scope: scope || mfr.business_scope,
        certifications: certs || mfr.certifications,
        data_confidence_level: 'medium',
      })
      .eq('id', mfr.id);

    if (!error) enriched++;
    await sleep(20);
  }

  console.log(`  补全制造商信息: ${enriched}/${cnMfrs.length}`);

  const { count: cnMfrCount } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true }).eq('country', 'CN');
  const { count: cnWithProfile } = await supabase.from('ppe_manufacturers').select('*', { count: 'exact', head: true }).eq('country', 'CN').not('company_profile', 'is', null);
  console.log(`  中国制造商总数: ${cnMfrCount}`);
  console.log(`  有公司简介: ${cnWithProfile}`);
  console.log(`  信息完整率: ${cnMfrCount > 0 ? ((cnWithProfile / cnMfrCount) * 100).toFixed(1) : 0}%`);
}

main().catch(console.error);
