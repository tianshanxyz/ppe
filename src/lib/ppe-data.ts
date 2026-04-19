import mockData from '@/data/ppe/mock-data.json';

export interface PPECategory {
  id: string;
  name: string;
  name_zh: string;
  description: string;
  icon: string;
  sort_order: number;
}

export interface TargetMarket {
  code: string;
  name: string;
  name_zh: string;
  flag_emoji: string;
  regulation_name: string;
  authority: string;
}

export interface ComplianceData {
  category_id: string;
  market_code: string;
  classification: string;
  standards: Array<{
    name: string;
    title: string;
    url: string;
  }>;
  certification_requirements: string[];
  estimated_cost: {
    min: number;
    max: number;
    currency: string;
  };
  estimated_timeline: {
    min: number;
    max: number;
    unit: string;
  };
  customs_documents: string[];
  risk_warnings: string[];
}

export interface MembershipTier {
  id: string;
  name: string;
  name_zh: string;
  price: number;
  currency: string;
  billing_period: string;
  features: string[];
  limitations: string[];
  recommended_for: string;
  popular?: boolean;
}

// 获取所有 PPE 品类
export function getPPECategories(): PPECategory[] {
  return mockData.ppe_categories.sort((a, b) => a.sort_order - b.sort_order);
}

// 获取所有目标市场
export function getTargetMarkets(): TargetMarket[] {
  return mockData.target_markets;
}

// 根据品类和市场获取合规数据
export function getComplianceData(categoryId: string, marketCode: string): ComplianceData | null {
  return mockData.compliance_data.find(
    data => data.category_id === categoryId && data.market_code === marketCode
  ) || null;
}

// 获取所有会员等级
export function getMembershipTiers(): MembershipTier[] {
  return mockData.membership_tiers;
}

// 获取单个品类
export function getPPECategoryById(id: string): PPECategory | undefined {
  return mockData.ppe_categories.find(cat => cat.id === id);
}

// 获取单个市场
export function getTargetMarketByCode(code: string): TargetMarket | undefined {
  return mockData.target_markets.find(market => market.code === code);
}
