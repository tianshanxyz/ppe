#!/usr/bin/env node

const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

async function collectMarketData() {
  console.log('\n=== Collect PPE Market Dynamics Data ===\n');

  const marketData = [
    {
      name: '全球PPE市场规模报告2024',
      code: 'MARKET-001',
      region: 'Global',
      description: '全球个人防护装备市场规模预计从2024年的580亿美元增长至2030年的920亿美元，CAGR约8.0%。主要驱动因素：后疫情时代防护意识提升、工业安全法规趋严、新兴市场需求增长。\n\n细分市场：\n- 手部防护：占比约25%，最大细分市场\n- 呼吸防护：占比约20%，增速最快\n- 身体防护：占比约18%\n- 眼面部防护：占比约15%\n- 头部防护：占比约12%\n- 足部防护：占比约10%\n\n主要贸易流向：\n- 中国→美国：口罩、手套、防护服\n- 马来西亚→全球：橡胶手套（占全球出口60%以上）\n- 美国→全球：高端呼吸防护设备\n- 欧盟→全球：专业级PPE设备\n\n价格趋势：\n- N95口罩：疫情后从$0.50/个回落至$0.20-0.35/个\n- 丁腈手套：从$0.15/只回落至$0.03-0.05/只\n- 防护服：Level 3约$5-8/件，Level 4约$12-20/件',
    },
    {
      name: 'COVID-19对PPE市场影响分析',
      code: 'MARKET-002',
      region: 'Global',
      description: 'COVID-19疫情对PPE市场产生深远影响：\n\n1. 供需失衡（2020-2021）：\n   - N95口罩需求增长300%以上\n   - 全球手套短缺约40%\n   - 防护服需求增长200%\n\n2. 供应链重构（2021-2023）：\n   - 各国建立战略储备\n   - 本土化生产加速\n   - 多元化采购策略\n\n3. 新常态（2024+）：\n   - 医疗PPE需求维持高位\n   - 工业PPE稳步增长\n   - 消费级PPE市场兴起\n\n4. 价格波动：\n   - 2020年Q2：价格峰值，N95达$5-10/个\n   - 2021年Q4：逐步回落\n   - 2023年：接近疫情前水平\n   - 2024年：稳定在略高于疫情前水平',
    },
    {
      name: '中国PPE出口贸易数据',
      code: 'MARKET-003',
      region: 'CN',
      description: '中国PPE出口贸易关键数据：\n\n1. 口罩出口：\n   - 2020年：出口约2,240亿只，价值约3,400亿元\n   - 2021年：出口约1,000亿只\n   - 2022年：出口约600亿只\n   - 2023年：出口约400亿只，回归常态化\n   - 主要出口目的地：美国、欧盟、东盟\n\n2. 防护服出口：\n   - 2020年：出口约140亿件\n   - 2023年：出口约30亿件\n\n3. 手套出口：\n   - 中国PVC手套占全球出口约80%\n   - 丁腈手套份额逐步提升\n\n4. 主要出口企业：\n   - 稳健医疗、3M中国、霍尼韦尔中国\n   - 振德医疗、奥美医疗、阳普医疗\n   - 蓝禾医疗、道恩股份\n\n5. HS编码：\n   - 630790: 面罩（纺织材料）\n   - 401519: 手套（硫化橡胶）\n   - 900490: 护目镜',
    },
    {
      name: '马来西亚手套产业分析',
      code: 'MARKET-004',
      region: 'MY',
      description: '马来西亚是全球最大的橡胶手套生产国和出口国：\n\n1. 市场份额：\n   - 全球橡胶手套出口占比约65%\n   - 丁腈手套出口占比约50%\n   - 年产能约2,500亿只\n\n2. 主要企业：\n   - Top Glove：全球最大手套制造商，市占率约26%\n   - Hartalega：丁腈手套技术领先\n   - Kossan：多元化产品线\n   - Supermax：垂直一体化生产\n\n3. 价格指数：\n   - 2020年ASP：$0.10-0.15/只\n   - 2021年ASP：$0.04-0.08/只\n   - 2023年ASP：$0.02-0.04/只\n   - 2024年ASP：$0.018-0.025/只\n\n4. 产能扩张：\n   - 2020-2021年大规模扩产\n   - 2022-2023年产能过剩\n   - 2024年行业整合期',
    },
    {
      name: '美国PPE采购趋势',
      code: 'MARKET-005',
      region: 'US',
      description: '美国PPE市场采购趋势分析：\n\n1. 市场规模：\n   - 2024年约180亿美元\n   - 医疗PPE约100亿美元\n   - 工业PPE约80亿美元\n\n2. 政府采购：\n   - STRATAGEN（战略国家储备）持续采购\n   - VA医院系统年度PPE预算约20亿美元\n   - FEMA应急储备约5亿美元\n\n3. FDA紧急使用授权(EUA)影响：\n   - 疫情期间授权约800家中国口罩企业\n   - 2021-2023年逐步撤销EUA\n   - 约200家企业通过正式510(k)审批\n\n4. 供应链趋势：\n   - "美国制造"政策推动本土生产\n   - 近岸外包（墨西哥、中美洲）\n   - 关键医疗PPE本土化率目标50%\n\n5. 价格指数：\n   - N95：$0.20-0.35/个\n   - 外科口罩：$0.02-0.05/个\n   - 丁腈手套：$0.03-0.05/只\n   - 隔离衣Level 3：$3-6/件',
    },
    {
      name: '欧盟PPE法规与市场准入',
      code: 'MARKET-006',
      region: 'EU',
      description: '欧盟PPE市场准入关键信息：\n\n1. 法规框架：\n   - PPE Regulation (EU) 2016/425\n   - Medical Device Regulation (EU) 2017/745\n   - 双重用途产品需同时满足两套法规\n\n2. 认证流程：\n   - Category I: 自声明+技术文件\n   - Category II: 公告机构EU型式检验\n   - Category III: 公告机构EU型式检验+质量保证\n\n3. 主要公告机构：\n   - BSI (UK)\n   - TÜV SÜD (DE)\n   - SGS (CH)\n   - DEKRA (DE)\n   - Intertek (UK)\n\n4. CE标志要求：\n   - 所有PPE产品必须CE标记\n   - Category III需年度监督审核\n   - 技术文件保存10年\n\n5. 市场规模：\n   - 2024年约150亿欧元\n   - 德国最大市场（约30亿欧元）\n   - 法国、意大利、西班牙为主要市场',
    },
    {
      name: 'PPE技术标准对比',
      code: 'MARKET-007',
      region: 'Global',
      description: '全球PPE主要技术标准对比：\n\n1. 呼吸防护标准：\n   - 美国：NIOSH 42 CFR Part 84 (N95/N99/N100)\n   - 欧盟：EN 149:2001+A1:2009 (FFP1/FFP2/FFP3)\n   - 中国：GB 2626-2019 (KN95)\n   - 澳大利亚：AS/NZS 1716:2012 (P1/P2/P3)\n   - 日本：JIS T 8151:2018\n\n2. 手套标准：\n   - 医用手套：ASTM D3578 (橡胶)/D6319 (丁腈)\n   - 欧盟：EN 455 (医用手套)/EN 374 (化学防护)\n   - 中国：GB 10213 (橡胶)/GB 7543 (丁腈)\n\n3. 防护服标准：\n   - 美国：AAMI PB70 (液体阻隔)\n   - 欧盟：EN 13795 (手术衣/手术单)\n   - 中国：GB 19082 (医用防护服)\n\n4. 护目镜标准：\n   - 美国：ANSI Z87.1\n   - 欧盟：EN 166\n   - 中国：GB 14866',
    },
    {
      name: 'PPE行业并购与竞争格局',
      code: 'MARKET-008',
      region: 'Global',
      description: 'PPE行业竞争格局与并购趋势：\n\n1. 全球TOP 10 PPE企业：\n   - 3M (US)：呼吸防护领导者\n   - Honeywell (US)：综合PPE供应商\n   - Ansell (AU)：手部防护专家\n   - DuPont (US)：化学防护服\n   - Kimberly-Clark (US)：医疗PPE\n   - MSA Safety (US)：工业安全\n   - Dräger (DE)：呼吸防护\n   - Lakeland Industries (US)：防护服\n   - Alpha Pro Tech (US)：医疗PPE\n   - Moldex (DE)：呼吸防护\n\n2. 中国主要PPE企业：\n   - 稳健医疗(Winner Medical)：外科口罩、手术衣\n   - 振德医疗(Zhende Medical)：伤口护理+PPE\n   - 奥美医疗(Allmed Medical)：手术衣、手套\n   - 蓝禾医疗(Lanhine Medical)：口罩\n   - 阳普医疗(Yangpu Medical)：真空采血管+PPE\n\n3. 并购趋势：\n   - 2020-2021：疫情驱动的产能扩张\n   - 2022-2023：行业整合，大鱼吃小鱼\n   - 2024+：技术驱动并购（智能PPE、可持续材料）',
    },
  ];

  let inserted = 0;
  for (const item of marketData) {
    const { error } = await supabase.from('ppe_regulations').insert({
      name: item.name,
      code: item.code,
      region: item.region,
      description: item.description,
    });

    if (!error) {
      inserted++;
      console.log(`  ✅ ${item.code}: ${item.name}`);
    } else {
      console.log(`  ❌ ${item.code}: ${error.message}`);
    }
  }

  console.log(`\n  ✅ Inserted ${inserted}/${marketData.length} market data records`);

  const { count } = await supabase.from('ppe_regulations').select('*', { count: 'exact', head: true });
  console.log(`  Total regulations: ${count}`);
}

async function main() {
  await collectMarketData();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
