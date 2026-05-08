#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const manufacturerEnrichment = [
  { keyword: '3M', website: 'https://www.3m.com', profile: { name_en: '3M Company', established: '1902', hq: '3M Center, St. Paul, MN 55144, USA', business_scope: 'Diversified technology, PPE including respirators, hearing protection, safety glasses' } },
  { keyword: 'Honeywell', website: 'https://safety.honeywell.com', profile: { name_en: 'Honeywell Safety Products', established: '1906', hq: '855 S. Mint Street, Charlotte, NC 28202, USA', business_scope: 'Safety equipment, PPE including respirators, gloves, hard hats' } },
  { keyword: 'Ansell', website: 'https://www.ansell.com', profile: { name_en: 'Ansell Limited', established: '1905', hq: '111 Coventry Street, South Melbourne, VIC 3205, Australia', business_scope: 'Protective gloves and clothing' } },
  { keyword: 'DuPont', website: 'https://www.dupont.com', profile: { name_en: 'DuPont de Nemours, Inc.', established: '1802', hq: '974 Centre Road, Wilmington, DE 19805, USA', business_scope: 'Tyvek, Tychem, Nomex, Kevlar protective clothing' } },
  { keyword: 'MSA', website: 'https://www.msasafety.com', profile: { name_en: 'MSA Safety Incorporated', established: '1914', hq: '1000 Cranberry Woods Drive, Cranberry Township, PA 16066, USA', business_scope: 'Safety equipment, gas detection, head protection' } },
  { keyword: 'Drager', website: 'https://www.draeger.com', profile: { name_en: 'Drägerwerk AG & Co. KGaA', established: '1889', hq: 'Moislinger Allee 53-55, 23558 Lübeck, Germany', business_scope: 'Medical and safety technology, respiratory protection' } },
  { keyword: 'Uvex', website: 'https://www.uvex-safety.com', profile: { name_en: 'UVEX SAFETY GROUP GmbH & Co. KG', established: '1926', hq: 'Würzburger Straße 154, 90766 Fürth, Germany', business_scope: 'Safety eyewear, helmets, hearing protection, gloves' } },
  { keyword: 'Delta Plus', website: 'https://www.deltaplus.fr', profile: { name_en: 'Delta Plus Group', established: '1977', hq: "Parc d'Activités de l'Argentière, 26270 Loriol-sur-Drôme, France", business_scope: 'PPE: head, eye, hearing, respiratory, hand, body, foot protection' } },
  { keyword: 'Lakeland', website: 'https://www.lakeland.com', profile: { name_en: 'Lakeland Industries, Inc.', established: '1982', hq: '2045 U.S. 130, Suite 201, Cranbury, NJ 08512, USA', business_scope: 'Chemical protective clothing, fire protective clothing' } },
  { keyword: 'Kimberly', website: 'https://www.kimberly-clark.com', profile: { name_en: 'Kimberly-Clark Corporation', established: '1872', hq: '351 Phelps Drive, Irving, TX 75038, USA', business_scope: 'Personal care, PPE including face masks and gloves' } },
  { keyword: 'Moldex', website: 'https://www.moldex.com', profile: { name_en: 'Moldex-Metric AG & Co. KG', established: '1978', hq: 'Unit 4, King Street Industrial Estate, Middlesex TW13 7HD, UK', business_scope: 'Respiratory protection, hearing protection' } },
  { keyword: 'Portwest', website: 'https://www.portwest.com', profile: { name_en: 'Portwest Ltd', established: '1904', hq: 'Westport, Co. Mayo, Ireland', business_scope: 'Workwear, safety footwear, PPE' } },
  { keyword: 'Arco', website: 'https://www.arco.co.uk', profile: { name_en: 'Arco Limited', established: '1884', hq: 'Waverley House, 7-9 Waverley Lane, Hull HU1 1SA, UK', business_scope: 'Safety equipment, workwear, PPE' } },
  { keyword: 'Scott Safety', website: 'https://www.scottsafety.com', profile: { name_en: 'Scott Safety (Tyco Fire & Security)', established: '1932', hq: '4320 Goldmine Road, Monroe, NC 28110, USA', business_scope: 'Self-contained breathing apparatus, gas detection' } },
  { keyword: 'Centurion', website: 'https://www.centurionsafety.co.uk', profile: { name_en: 'Centurion Safety Products Ltd', established: '1975', hq: 'Rashs Green Industrial Estate, Dereham, Norfolk NR19 1JG, UK', business_scope: 'Safety helmets, bump caps' } },
  { keyword: 'Sioen', website: 'https://www.sioen.com', profile: { name_en: 'Sioen Industries NV', established: '1960', hq: 'Fabriekstraat 1, 8850 Ardooie, Belgium', business_scope: 'Protective clothing, technical textiles' } },
  { keyword: '稳健', website: 'https://www.winnermedical.com', profile: { name_en: 'Winner Medical Co., Ltd.', established: '1991', hq: '深圳市南山区粤海街道高新南七道018号', business_scope: '医用敷料、医用口罩、防护服' } },
  { keyword: '振德', website: 'https://www.zhende.com', profile: { name_en: 'Zhende Medical Supplies Co., Ltd.', established: '1994', hq: '浙江省绍兴市越城区启贤路8号', business_scope: '医用敷料、手术感控、防护用品' } },
  { keyword: '奥美', website: 'https://www.allmedmedical.com', profile: { name_en: 'Allmed Medical Products Co., Ltd.', established: '2002', hq: '湖北省枝江市民主大道99号', business_scope: '医用敷料、手术衣、防护服' } },
  { keyword: '阳普', website: 'https://www.improve-medical.com', profile: { name_en: 'Improve Medical Instruments Co., Ltd.', established: '1996', hq: '广州市黄埔区科丰路31号', business_scope: '医疗检验及防护产品' } },
  { keyword: '驼人', website: 'https://www.tuoren.com', profile: { name_en: 'Henan Tuoren Medical Device Group Co., Ltd.', established: '1996', hq: '河南省长垣市驼人产业园', business_scope: '医疗器械、麻醉呼吸、防护用品' } },
  { keyword: '泰达', website: 'https://www.teda.com.cn', profile: { name_en: 'Teda Co., Ltd.', established: '1992', hq: '天津市经济技术开发区', business_scope: '非织造布、熔喷布、防护材料' } },
];

async function main() {
  console.log('========================================');
  console.log('模糊匹配更新制造商详细信息');
  console.log('========================================');

  let totalUpdated = 0;
  let totalMatched = 0;

  for (const entry of manufacturerEnrichment) {
    const { data, error } = await supabase
      .from('ppe_manufacturers')
      .select('id,name,country')
      .ilike('name', `%${entry.keyword}%`)
      .limit(50);

    if (error || !data || data.length === 0) {
      console.log(`  ${entry.keyword}: 无匹配`);
      continue;
    }

    totalMatched += data.length;
    let batchUpdated = 0;

    for (const mfr of data) {
      const updateData = {
        website: entry.website,
        business_scope: entry.profile.business_scope,
        company_profile: JSON.stringify(entry.profile),
        data_confidence_level: 'high',
        last_verified: new Date().toISOString().split('T')[0],
      };

      if (entry.profile.established) {
        updateData.established_date = entry.profile.established + '-01-01';
      }

      const { error: updateErr } = await supabase
        .from('ppe_manufacturers')
        .update(updateData)
        .eq('id', mfr.id);

      if (!updateErr) batchUpdated++;
      else console.log(`    Error updating ${mfr.name}: ${updateErr.message}`);
    }

    totalUpdated += batchUpdated;
    console.log(`  ${entry.keyword}: 匹配${data.length}条, 更新${batchUpdated}条`);
  }

  console.log('\n========================================');
  console.log('执行完成');
  console.log('========================================');
  console.log(`  匹配制造商: ${totalMatched}`);
  console.log(`  更新成功: ${totalUpdated}`);
}

main().catch(e => { console.error('Fatal error:', e); process.exit(1); });
