import mockData from '@/data/ppe/mock-data.json';

export interface PPECategory {
  id: string;
  name: string;
  name_zh: string;
  description: string;
  icon: string;
  sort_order: number;
  subcategories?: Array<{
    id: string;
    name: string;
    name_zh: string;
    description: string;
    parent_id: string;
  }>;
  product_features?: {
    materials: string[];
    protection_levels: string[];
    intended_uses: string[];
  };
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

export interface PPEStats {
  totalProducts: number;
  totalRegulations: number;
  totalManufacturers: number;
  categoryCount: Record<string, number>;
  marketCount: Record<string, number>;
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

// 获取 PPE 统计数据
export function getPPEStats(): PPEStats {
  const categories = getPPECategories();
  const markets = getTargetMarkets();
  const complianceData = mockData.compliance_data;
  
  // 计算每个品类的产品数量（假设每个品类有 10-50 个产品）
  const categoryCount: Record<string, number> = {};
  categories.forEach(cat => {
    categoryCount[cat.id] = Math.floor(Math.random() * 41) + 10; // 10-50
  });
  
  // 计算每个市场的产品数量
  const marketCount: Record<string, number> = {};
  markets.forEach(market => {
    marketCount[market.code] = Math.floor(Math.random() * 101) + 20; // 20-120
  });
  
  // 计算总产品数
  const totalProducts = Object.values(categoryCount).reduce((sum, count) => sum + count, 0);
  
  // 计算法规总数
  const totalRegulations = complianceData.reduce((sum, data) => {
    return sum + data.standards.length + data.certification_requirements.length;
  }, 0);
  
  // 制造商数量（假设有 50-200 个）
  const totalManufacturers = Math.floor(Math.random() * 151) + 50;
  
  return {
    totalProducts,
    totalRegulations,
    totalManufacturers,
    categoryCount,
    marketCount,
  };
}
