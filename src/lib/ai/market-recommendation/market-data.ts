/**
 * 市场准入推荐引擎 - 市场数据配置
 *
 * A-004: 市场准入推荐引擎
 */

import { MarketInfo, MarketDataConfig } from './types'

// ============================================
// 主要市场数据
// ============================================

export const MARKETS: MarketInfo[] = [
  {
    code: 'US',
    name: 'United States',
    name_zh: '美国',
    region: '北美',
    market_size: {
      total_value_usd: 18000000000, // $18B
      growth_rate: 0.08,
      ppe_market_share: 0.15,
    },
    entry_requirements: {
      mandatory_certification: true,
      certification_types: ['FDA 510(k)', 'FDA PMA', 'NIOSH N95'],
      local_representative_required: false,
      testing_required: true,
      clinical_data_required: false,
    },
    difficulty_score: 75,
    estimated_timeline: { min_months: 6, max_months: 18, average_months: 12 },
    estimated_cost: { min_usd: 50000, max_usd: 200000, average_usd: 100000 },
    competition_level: 'high',
    regulation: {
      framework: 'FDA CFR Title 21',
      authority: 'U.S. Food and Drug Administration',
    },
  },
  {
    code: 'EU',
    name: 'European Union',
    name_zh: '欧盟',
    region: '欧洲',
    market_size: {
      total_value_usd: 15000000000, // $15B
      growth_rate: 0.06,
      ppe_market_share: 0.18,
    },
    entry_requirements: {
      mandatory_certification: true,
      certification_types: ['CE Mark (MDR/IVDR)', 'CE Mark (PPE Regulation)'],
      local_representative_required: true,
      testing_required: true,
      clinical_data_required: false,
    },
    difficulty_score: 70,
    estimated_timeline: { min_months: 6, max_months: 24, average_months: 12 },
    estimated_cost: { min_usd: 30000, max_usd: 150000, average_usd: 80000 },
    competition_level: 'high',
    regulation: {
      framework: 'MDR 2017/745, PPE Regulation 2016/425',
      authority: 'European Medicines Agency / Notified Bodies',
    },
  },
  {
    code: 'CN',
    name: 'China',
    name_zh: '中国',
    region: '亚洲',
    market_size: {
      total_value_usd: 12000000000, // $12B
      growth_rate: 0.12,
      ppe_market_share: 0.25,
    },
    entry_requirements: {
      mandatory_certification: true,
      certification_types: ['NMPA Registration', 'GB Standards Compliance'],
      local_representative_required: true,
      testing_required: true,
      clinical_data_required: true,
    },
    difficulty_score: 80,
    estimated_timeline: { min_months: 12, max_months: 36, average_months: 18 },
    estimated_cost: { min_usd: 80000, max_usd: 300000, average_usd: 150000 },
    competition_level: 'high',
    regulation: {
      framework: 'NMPA Regulations, GB Standards',
      authority: 'National Medical Products Administration',
    },
  },
  {
    code: 'JP',
    name: 'Japan',
    name_zh: '日本',
    region: '亚洲',
    market_size: {
      total_value_usd: 5000000000, // $5B
      growth_rate: 0.04,
      ppe_market_share: 0.12,
    },
    entry_requirements: {
      mandatory_certification: true,
      certification_types: ['PMDA Approval', 'Class I/II/III/IV'],
      local_representative_required: true,
      testing_required: true,
      clinical_data_required: true,
    },
    difficulty_score: 85,
    estimated_timeline: { min_months: 12, max_months: 36, average_months: 24 },
    estimated_cost: { min_usd: 100000, max_usd: 400000, average_usd: 200000 },
    competition_level: 'medium',
    regulation: {
      framework: 'PMDA Act, PAL (Pharmaceutical Affairs Law)',
      authority: 'Pharmaceuticals and Medical Devices Agency',
    },
  },
  {
    code: 'UK',
    name: 'United Kingdom',
    name_zh: '英国',
    region: '欧洲',
    market_size: {
      total_value_usd: 3000000000, // $3B
      growth_rate: 0.05,
      ppe_market_share: 0.14,
    },
    entry_requirements: {
      mandatory_certification: true,
      certification_types: ['UKCA Mark', 'MHRA Registration'],
      local_representative_required: true,
      testing_required: true,
      clinical_data_required: false,
    },
    difficulty_score: 65,
    estimated_timeline: { min_months: 6, max_months: 18, average_months: 10 },
    estimated_cost: { min_usd: 25000, max_usd: 100000, average_usd: 60000 },
    competition_level: 'medium',
    regulation: {
      framework: 'UK MDR 2002, UKCA',
      authority: 'Medicines and Healthcare products Regulatory Agency',
    },
  },
  {
    code: 'CA',
    name: 'Canada',
    name_zh: '加拿大',
    region: '北美',
    market_size: {
      total_value_usd: 2000000000, // $2B
      growth_rate: 0.06,
      ppe_market_share: 0.13,
    },
    entry_requirements: {
      mandatory_certification: true,
      certification_types: ['Health Canada MDL', 'ISO 13485'],
      local_representative_required: true,
      testing_required: true,
      clinical_data_required: false,
    },
    difficulty_score: 60,
    estimated_timeline: { min_months: 6, max_months: 12, average_months: 8 },
    estimated_cost: { min_usd: 20000, max_usd: 80000, average_usd: 50000 },
    competition_level: 'medium',
    regulation: {
      framework: 'Medical Devices Regulations (SOR/98-282)',
      authority: 'Health Canada',
    },
  },
  {
    code: 'AU',
    name: 'Australia',
    name_zh: '澳大利亚',
    region: '大洋洲',
    market_size: {
      total_value_usd: 1500000000, // $1.5B
      growth_rate: 0.07,
      ppe_market_share: 0.11,
    },
    entry_requirements: {
      mandatory_certification: true,
      certification_types: ['TGA ARTG Inclusion', 'ISO 13485'],
      local_representative_required: true,
      testing_required: true,
      clinical_data_required: false,
    },
    difficulty_score: 55,
    estimated_timeline: { min_months: 4, max_months: 12, average_months: 7 },
    estimated_cost: { min_usd: 15000, max_usd: 60000, average_usd: 35000 },
    competition_level: 'low',
    regulation: {
      framework: 'Therapeutic Goods Act 1989',
      authority: 'Therapeutic Goods Administration',
    },
  },
  {
    code: 'BR',
    name: 'Brazil',
    name_zh: '巴西',
    region: '南美',
    market_size: {
      total_value_usd: 2000000000, // $2B
      growth_rate: 0.10,
      ppe_market_share: 0.16,
    },
    entry_requirements: {
      mandatory_certification: true,
      certification_types: ['ANVISA Registration', 'BGMP'],
      local_representative_required: true,
      testing_required: true,
      clinical_data_required: true,
    },
    difficulty_score: 70,
    estimated_timeline: { min_months: 12, max_months: 24, average_months: 18 },
    estimated_cost: { min_usd: 50000, max_usd: 150000, average_usd: 90000 },
    competition_level: 'medium',
    regulation: {
      framework: 'RDC ANVISA',
      authority: 'Agência Nacional de Vigilância Sanitária',
    },
  },
  {
    code: 'KR',
    name: 'South Korea',
    name_zh: '韩国',
    region: '亚洲',
    market_size: {
      total_value_usd: 2500000000, // $2.5B
      growth_rate: 0.08,
      ppe_market_share: 0.14,
    },
    entry_requirements: {
      mandatory_certification: true,
      certification_types: ['MFDS Approval', 'KGMP'],
      local_representative_required: true,
      testing_required: true,
      clinical_data_required: false,
    },
    difficulty_score: 65,
    estimated_timeline: { min_months: 8, max_months: 18, average_months: 12 },
    estimated_cost: { min_usd: 40000, max_usd: 120000, average_usd: 70000 },
    competition_level: 'medium',
    regulation: {
      framework: 'Medical Device Act',
      authority: 'Ministry of Food and Drug Safety',
    },
  },
  {
    code: 'SG',
    name: 'Singapore',
    name_zh: '新加坡',
    region: '亚洲',
    market_size: {
      total_value_usd: 500000000, // $500M
      growth_rate: 0.09,
      ppe_market_share: 0.10,
    },
    entry_requirements: {
      mandatory_certification: true,
      certification_types: ['HSA Registration', 'GDPMDS'],
      local_representative_required: true,
      testing_required: true,
      clinical_data_required: false,
    },
    difficulty_score: 50,
    estimated_timeline: { min_months: 3, max_months: 9, average_months: 5 },
    estimated_cost: { min_usd: 10000, max_usd: 40000, average_usd: 25000 },
    competition_level: 'low',
    regulation: {
      framework: 'Health Products Act',
      authority: 'Health Sciences Authority',
    },
  },
  {
    code: 'MX',
    name: 'Mexico',
    name_zh: '墨西哥',
    region: '北美',
    market_size: {
      total_value_usd: 1200000000, // $1.2B
      growth_rate: 0.09,
      ppe_market_share: 0.15,
    },
    entry_requirements: {
      mandatory_certification: true,
      certification_types: ['COFEPRIS Registration'],
      local_representative_required: true,
      testing_required: true,
      clinical_data_required: false,
    },
    difficulty_score: 60,
    estimated_timeline: { min_months: 6, max_months: 15, average_months: 10 },
    estimated_cost: { min_usd: 20000, max_usd: 70000, average_usd: 45000 },
    competition_level: 'medium',
    regulation: {
      framework: 'Ley General de Salud',
      authority: 'COFEPRIS',
    },
  },
  {
    code: 'IN',
    name: 'India',
    name_zh: '印度',
    region: '亚洲',
    market_size: {
      total_value_usd: 3000000000, // $3B
      growth_rate: 0.15,
      ppe_market_share: 0.20,
    },
    entry_requirements: {
      mandatory_certification: true,
      certification_types: ['CDSCO Registration', 'BIS Certification'],
      local_representative_required: true,
      testing_required: true,
      clinical_data_required: false,
    },
    difficulty_score: 65,
    estimated_timeline: { min_months: 9, max_months: 24, average_months: 15 },
    estimated_cost: { min_usd: 30000, max_usd: 100000, average_usd: 60000 },
    competition_level: 'high',
    regulation: {
      framework: 'Medical Device Rules 2017',
      authority: 'Central Drugs Standard Control Organization',
    },
  },
]

// ============================================
// 产品类型要求映射
// ============================================

export const PRODUCT_TYPE_REQUIREMENTS: MarketDataConfig['product_type_requirements'] = {
  '口罩': {
    certifications: ['CE (PPE)', 'FDA 510(k)', 'NIOSH N95', 'NMPA'],
    typical_timeline_months: 6,
    typical_cost_usd: 30000,
  },
  '医用手套': {
    certifications: ['CE (MDR)', 'FDA 510(k)', 'NMPA'],
    typical_timeline_months: 9,
    typical_cost_usd: 50000,
  },
  '防护服': {
    certifications: ['CE (PPE)', 'FDA 510(k)', 'NMPA'],
    typical_timeline_months: 12,
    typical_cost_usd: 60000,
  },
  '护目镜': {
    certifications: ['CE (PPE)', 'FDA 510(k)', 'NMPA'],
    typical_timeline_months: 6,
    typical_cost_usd: 25000,
  },
  '面罩': {
    certifications: ['CE (PPE)', 'FDA 510(k)', 'NMPA'],
    typical_timeline_months: 6,
    typical_cost_usd: 20000,
  },
  '呼吸器': {
    certifications: ['CE (PPE)', 'FDA 510(k)', 'NIOSH', 'NMPA'],
    typical_timeline_months: 18,
    typical_cost_usd: 100000,
  },
  '安全帽': {
    certifications: ['CE (PPE)', 'ANSI/ISEA', 'NMPA'],
    typical_timeline_months: 6,
    typical_cost_usd: 20000,
  },
  '耳塞': {
    certifications: ['CE (PPE)', 'ANSI/ISEA', 'NMPA'],
    typical_timeline_months: 4,
    typical_cost_usd: 15000,
  },
  '安全带': {
    certifications: ['CE (PPE)', 'ANSI/ISEA', 'OSHA', 'NMPA'],
    typical_timeline_months: 9,
    typical_cost_usd: 40000,
  },
  '安全鞋': {
    certifications: ['CE (PPE)', 'ASTM', 'NMPA'],
    typical_timeline_months: 6,
    typical_cost_usd: 25000,
  },
}

// ============================================
// 认证互认关系
// ============================================

export const CERTIFICATION_RECIPROCITY: MarketDataConfig['certification_reciprocity'] = {
  'CE': {
    recognized_by: ['UK', 'CH', 'TR', 'AU', 'SG'],
    advantages: ['欧盟CE认证被英国、瑞士、土耳其等多国认可', '可简化部分国家的注册流程'],
  },
  'FDA': {
    recognized_by: ['CA', 'AU', 'SG', 'IL'],
    advantages: ['FDA认证被加拿大、澳大利亚、新加坡等认可', '在部分国家可享受加速审批'],
  },
  'ISO_13485': {
    recognized_by: ['US', 'EU', 'CA', 'AU', 'JP', '全球'],
    advantages: ['质量管理体系认证被全球广泛认可', '是多数国家市场准入的基础要求'],
  },
  'NMPA': {
    recognized_by: [],
    advantages: ['中国NMPA认证主要适用于中国市场', '部分东南亚国家可能参考'],
  },
}

// ============================================
// 认证成本和时间详情
// ============================================

export const CERTIFICATION_DETAILS: Record<string, {
  name: string
  estimated_cost_usd: number
  estimated_timeline_months: number
  prerequisites: string[]
  description: string
}> = {
  'CE (PPE)': {
    name: 'CE Marking (PPE Regulation 2016/425)',
    estimated_cost_usd: 15000,
    estimated_timeline_months: 4,
    prerequisites: ['Technical Documentation', 'Test Reports', 'Quality Manual'],
    description: '欧盟个人防护设备CE认证',
  },
  'CE (MDR)': {
    name: 'CE Marking (MDR 2017/745)',
    estimated_cost_usd: 25000,
    estimated_timeline_months: 6,
    prerequisites: ['Technical Documentation', 'Clinical Evaluation', 'ISO 13485'],
    description: '欧盟医疗器械法规CE认证',
  },
  'FDA 510(k)': {
    name: 'FDA 510(k) Premarket Notification',
    estimated_cost_usd: 20000,
    estimated_timeline_months: 6,
    prerequisites: ['Predicate Device', 'Substantial Equivalence', 'Test Reports'],
    description: '美国FDA 510(k)上市前通知',
  },
  'FDA PMA': {
    name: 'FDA Premarket Approval',
    estimated_cost_usd: 300000,
    estimated_timeline_months: 18,
    prerequisites: ['Clinical Trials', 'Extensive Testing', 'Manufacturing Data'],
    description: '美国FDA上市前批准（高风险器械）',
  },
  'NMPA': {
    name: 'NMPA Registration (China)',
    estimated_cost_usd: 80000,
    estimated_timeline_months: 18,
    prerequisites: ['Chinese Local Agent', 'Clinical Data', 'Type Testing'],
    description: '中国国家药品监督管理局注册',
  },
  'ISO 13485': {
    name: 'ISO 13485 Medical Device QMS',
    estimated_cost_usd: 15000,
    estimated_timeline_months: 6,
    prerequisites: ['Quality Manual', 'Procedures', 'Internal Audits'],
    description: '医疗器械质量管理体系认证',
  },
  'UKCA': {
    name: 'UKCA Marking (UK)',
    estimated_cost_usd: 12000,
    estimated_timeline_months: 4,
    prerequisites: ['Technical Documentation', 'UK Approved Body', 'Test Reports'],
    description: '英国合格评定标志',
  },
  'TGA': {
    name: 'TGA ARTG Inclusion (Australia)',
    estimated_cost_usd: 10000,
    estimated_timeline_months: 4,
    prerequisites: ['Australian Sponsor', 'CE/FDA Evidence', 'GMP Evidence'],
    description: '澳大利亚治疗用品注册',
  },
  'Health Canada': {
    name: 'Health Canada MDL',
    estimated_cost_usd: 15000,
    estimated_timeline_months: 6,
    prerequisites: ['Canadian Representative', 'ISO 13485', 'Test Reports'],
    description: '加拿大医疗器械许可证',
  },
  'PMDA': {
    name: 'PMDA Approval (Japan)',
    estimated_cost_usd: 100000,
    estimated_timeline_months: 18,
    prerequisites: ['Japanese Marketing Authorization Holder', 'Clinical Data', 'QMS Audit'],
    description: '日本医药品医疗器械综合机构批准',
  },
}

// ============================================
// 辅助函数
// ============================================

/**
 * 获取市场信息
 */
export function getMarketInfo(marketCode: string): MarketInfo | undefined {
  return MARKETS.find(m => m.code === marketCode)
}

/**
 * 获取所有市场
 */
export function getAllMarkets(): MarketInfo[] {
  return MARKETS
}

/**
 * 按地区获取市场
 */
export function getMarketsByRegion(region: string): MarketInfo[] {
  return MARKETS.filter(m => m.region === region)
}

/**
 * 获取产品类型要求
 */
export function getProductTypeRequirements(productType: string) {
  return PRODUCT_TYPE_REQUIREMENTS[productType] || {
    certifications: ['CE', 'FDA', 'ISO 13485'],
    typical_timeline_months: 9,
    typical_cost_usd: 40000,
  }
}

/**
 * 检查认证互认
 */
export function getCertificationReciprocity(certType: string) {
  return CERTIFICATION_RECIPROCITY[certType] || {
    recognized_by: [],
    advantages: [],
  }
}
