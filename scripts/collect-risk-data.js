#!/usr/bin/env node
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xtqhjyiyjhxfdzyypfqq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwNTU1OSwiZXhwIjoyMDkyMDgxNTU5fQ.6uW47M6vaxbWomXiUiplhHbzST0vxs0CAIWoL5FdchU'
);

const sleep = ms => new Promise(r => setTimeout(r, ms));

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

async function main() {
  console.log('========================================');
  console.log('PPE 风险场景数据采集');
  console.log('========================================');

  // ===== BLS Occupational Injury Statistics =====
  console.log('\n========================================');
  console.log('BLS 职业伤害统计');
  console.log('========================================');

  const blsData = [
    { year: 2019, total_cases: 2850000, incidence_rate: 2.8, industry: 'Healthcare', occupation: 'Healthcare Support', event_type: 'Exposure to harmful substances', injury_type: 'PPE-related', body_part: 'Multiple' },
    { year: 2019, total_cases: 880000, incidence_rate: 3.1, industry: 'Manufacturing', occupation: 'Production', event_type: 'Contact with objects', injury_type: 'Cut/Laceration', body_part: 'Hand' },
    { year: 2019, total_cases: 790000, incidence_rate: 2.9, industry: 'Construction', occupation: 'Construction', event_type: 'Falls', injury_type: 'Fracture', body_part: 'Multiple' },
    { year: 2020, total_cases: 2590000, incidence_rate: 2.7, industry: 'Healthcare', occupation: 'Healthcare Support', event_type: 'Exposure to COVID-19', injury_type: 'Illness', body_part: 'Respiratory' },
    { year: 2020, total_cases: 798000, incidence_rate: 2.8, industry: 'Manufacturing', occupation: 'Production', event_type: 'Contact with objects', injury_type: 'Cut/Laceration', body_part: 'Hand' },
    { year: 2020, total_cases: 740000, incidence_rate: 2.7, industry: 'Construction', occupation: 'Construction', event_type: 'Falls', injury_type: 'Fracture', body_part: 'Multiple' },
    { year: 2021, total_cases: 2530000, incidence_rate: 2.6, industry: 'Healthcare', occupation: 'Healthcare Support', event_type: 'Exposure to harmful substances', injury_type: 'PPE-related', body_part: 'Multiple' },
    { year: 2021, total_cases: 820000, incidence_rate: 2.9, industry: 'Manufacturing', occupation: 'Production', event_type: 'Contact with objects', injury_type: 'Cut/Laceration', body_part: 'Hand' },
    { year: 2021, total_cases: 750000, incidence_rate: 2.6, industry: 'Construction', occupation: 'Construction', event_type: 'Falls', injury_type: 'Fracture', body_part: 'Multiple' },
    { year: 2022, total_cases: 2680000, incidence_rate: 2.7, industry: 'Healthcare', occupation: 'Healthcare Support', event_type: 'Exposure to harmful substances', injury_type: 'PPE-related', body_part: 'Multiple' },
    { year: 2022, total_cases: 850000, incidence_rate: 3.0, industry: 'Manufacturing', occupation: 'Production', event_type: 'Contact with objects', injury_type: 'Cut/Laceration', body_part: 'Hand' },
    { year: 2022, total_cases: 760000, incidence_rate: 2.7, industry: 'Construction', occupation: 'Construction', event_type: 'Falls', injury_type: 'Fracture', body_part: 'Multiple' },
    { year: 2023, total_cases: 2700000, incidence_rate: 2.8, industry: 'Healthcare', occupation: 'Healthcare Support', event_type: 'Exposure to harmful substances', injury_type: 'PPE-related', body_part: 'Multiple' },
    { year: 2023, total_cases: 860000, incidence_rate: 3.0, industry: 'Manufacturing', occupation: 'Production', event_type: 'Contact with objects', injury_type: 'Cut/Laceration', body_part: 'Hand' },
    { year: 2023, total_cases: 770000, incidence_rate: 2.8, industry: 'Construction', occupation: 'Construction', event_type: 'Falls', injury_type: 'Fracture', body_part: 'Multiple' },
  ];

  console.log(`  BLS数据: ${blsData.length} 条记录`);

  // ===== OSHA Inspection Data =====
  console.log('\n========================================');
  console.log('OSHA 检查与违规数据');
  console.log('========================================');

  const oshaData = [
    { activity_nr: '123456789', establishment_name: 'General Manufacturing Co', city: 'Chicago', state: 'IL', inspection_date: '2023-01-15', violation_standards: '1910.132', penalty: 3500 },
    { activity_nr: '123456790', establishment_name: 'Midwest Construction LLC', city: 'Detroit', state: 'MI', inspection_date: '2023-02-20', violation_standards: '1910.134', penalty: 7200 },
    { activity_nr: '123456791', establishment_name: 'Healthcare Services Inc', city: 'Houston', state: 'TX', inspection_date: '2023-03-10', violation_standards: '1910.133', penalty: 2800 },
    { activity_nr: '123456792', establishment_name: 'Industrial Supply Corp', city: 'Pittsburgh', state: 'PA', inspection_date: '2023-04-05', violation_standards: '1910.135', penalty: 4500 },
    { activity_nr: '123456793', establishment_name: 'Safety First Manufacturing', city: 'Cleveland', state: 'OH', inspection_date: '2023-05-12', violation_standards: '1910.136', penalty: 3200 },
    { activity_nr: '123456794', establishment_name: 'Chemical Processing Plant', city: 'Baton Rouge', state: 'LA', inspection_date: '2023-06-18', violation_standards: '1910.138', penalty: 8900 },
    { activity_nr: '123456795', establishment_name: 'Food Processing Inc', city: 'Fresno', state: 'CA', inspection_date: '2023-07-22', violation_standards: '1910.132', penalty: 4100 },
    { activity_nr: '123456796', establishment_name: 'Textile Manufacturing Co', city: 'Charlotte', state: 'NC', inspection_date: '2023-08-14', violation_standards: '1910.134', penalty: 5600 },
    { activity_nr: '123456797', establishment_name: 'Metal Fabrication LLC', city: 'Milwaukee', state: 'WI', inspection_date: '2023-09-30', violation_standards: '1910.133', penalty: 6700 },
    { activity_nr: '123456798', establishment_name: 'Pharmaceutical Plant', city: 'Newark', state: 'NJ', inspection_date: '2023-10-15', violation_standards: '1910.135', penalty: 9200 },
  ];

  console.log(`  OSHA检查数据: ${oshaData.length} 条记录`);

  // ===== Global PPE Market Risk Data =====
  console.log('\n========================================');
  console.log('全球PPE市场风险数据');
  console.log('========================================');

  const riskData = [
    { region: 'North America', risk_level: 'medium', primary_hazards: 'Chemical exposure, Falls', ppe_gaps: 'Respiratory protection in healthcare', year: 2023 },
    { region: 'Europe', risk_level: 'medium', primary_hazards: 'Chemical exposure, Noise', ppe_gaps: 'Hearing protection in manufacturing', year: 2023 },
    { region: 'Asia Pacific', risk_level: 'high', primary_hazards: 'Respiratory hazards, Chemical exposure', ppe_gaps: 'Quality control of disposable PPE', year: 2023 },
    { region: 'Latin America', risk_level: 'high', primary_hazards: 'Falls, Mechanical hazards', ppe_gaps: 'Fall protection equipment', year: 2023 },
    { region: 'Middle East', risk_level: 'medium', primary_hazards: 'Heat stress, Chemical exposure', ppe_gaps: 'Heat stress management PPE', year: 2023 },
    { region: 'Africa', risk_level: 'high', primary_hazards: 'Respiratory hazards, Infectious diseases', ppe_gaps: 'Basic respiratory protection', year: 2023 },
  ];

  console.log(`  风险数据: ${riskData.length} 条记录`);

  // ===== PPE Recall Data =====
  console.log('\n========================================');
  console.log('PPE产品召回数据');
  console.log('========================================');

  const recallData = [
    { recall_number: 'Z-1234-2023', classification: 'Class I', status: 'Ongoing', recall_initiation_date: '2023-01-10', product_quantity: 50000, product_description: 'N95 Respirator Mask', reason_for_recall: 'Filter efficiency below N95 standard', hazard_classification: 'Respiratory', distribution: 'Nationwide', country: 'US' },
    { recall_number: 'Z-1235-2023', classification: 'Class II', status: 'Terminated', recall_initiation_date: '2023-02-15', product_quantity: 120000, product_description: 'Surgical Glove', reason_for_recall: 'Sterility compromised', hazard_classification: 'Infection', distribution: 'Multiple states', country: 'US' },
    { recall_number: 'Z-1236-2023', classification: 'Class I', status: 'Ongoing', recall_initiation_date: '2023-03-20', product_quantity: 25000, product_description: 'Face Shield', reason_for_recall: 'Impact resistance below standard', hazard_classification: 'Eye/Face', distribution: 'Nationwide', country: 'US' },
    { recall_number: 'Z-1237-2023', classification: 'Class II', status: 'Ongoing', recall_initiation_date: '2023-04-05', product_quantity: 80000, product_description: 'Protective Gown', reason_for_recall: 'Fluid resistance inadequate', hazard_classification: 'Chemical/Fluid', distribution: 'Multiple states', country: 'US' },
    { recall_number: 'Z-1238-2023', classification: 'Class III', status: 'Terminated', recall_initiation_date: '2023-05-12', product_quantity: 15000, product_description: 'Safety Helmet', reason_for_recall: 'Retention system failure', hazard_classification: 'Head', distribution: 'Regional', country: 'US' },
    { recall_number: 'Z-1239-2023', classification: 'Class I', status: 'Ongoing', recall_initiation_date: '2023-06-18', product_quantity: 100000, product_description: 'KN95 Respirator', reason_for_recall: 'Unauthorized manufacturer', hazard_classification: 'Respiratory', distribution: 'Nationwide', country: 'US' },
    { recall_number: 'Z-1240-2023', classification: 'Class II', status: 'Ongoing', recall_initiation_date: '2023-07-22', product_quantity: 45000, product_description: 'Chemical Protective Glove', reason_for_recall: 'Degradation resistance below standard', hazard_classification: 'Chemical', distribution: 'Multiple states', country: 'US' },
    { recall_number: 'Z-1241-2023', classification: 'Class I', status: 'Ongoing', recall_initiation_date: '2023-08-14', product_quantity: 30000, product_description: 'Self-Contained Breathing Apparatus', reason_for_recall: 'Air supply failure risk', hazard_classification: 'Respiratory', distribution: 'Nationwide', country: 'US' },
  ];

  console.log(`  召回数据: ${recallData.length} 条记录`);

  // ===== Summary =====
  console.log('\n========================================');
  console.log('风险场景数据采集完成');
  console.log('========================================');
  console.log(`  BLS伤害统计: ${blsData.length} 条`);
  console.log(`  OSHA检查数据: ${oshaData.length} 条`);
  console.log(`  全球风险数据: ${riskData.length} 条`);
  console.log(`  PPE召回数据: ${recallData.length} 条`);
  console.log(`  风险数据总计: ${blsData.length + oshaData.length + riskData.length + recallData.length} 条`);
  console.log('\n  注意: 以上数据为结构化示例数据');
  console.log('  实际BLS/OSHA数据可通过以下链接获取:');
  console.log('  - BLS: https://www.bls.gov/iif/data.htm');
  console.log('  - OSHA: https://enforcement.osha.gov/data');
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
