export type SearchCategory = 'product' | 'company' | 'regulation' | 'ai'

export interface ClassificationResult {
  category: SearchCategory
  confidence: number
  reason: string
  targetPath: string
  icon: string
  color: string
}

const PRODUCT_KEYWORDS = [
  'glove', 'gloves', 'helmet', 'helmets', 'mask', 'masks', 'respirator', 'respirators',
  'goggle', 'goggles', 'footwear', 'shoe', 'shoes', 'boot', 'boots', 'vest', 'vests',
  'suit', 'suits', 'harness', 'earplug', 'earplugs', 'earmuff', 'earmuffs',
  'shield', 'face shield', 'apron', 'aprons', 'coverall', 'coveralls',
  'n95', 'kn95', 'ffp2', 'ffp3', 'p100', 'n99',
  'safety', 'protective', 'ppe', 'head protection', 'eye protection',
  'hand protection', 'foot protection', 'hearing protection', 'respiratory protection',
  'fall protection', 'body protection', 'welding', 'firefighter', 'chemical',
  '手套', '头盔', '口罩', '面罩', '防护服', '安全鞋', '安全帽', '护目镜',
  '耳塞', '耳罩', '安全带', '防护手套', '防毒面具', '呼吸器', '消防服',
  '绝缘鞋', '防化服', '劳保用品', '防护面罩', '安全绳',
]

const COMPANY_KEYWORDS = [
  'company', 'companies', 'manufacturer', 'manufacturers', 'supplier', 'suppliers',
  'brand', 'brands', 'vendor', 'vendors', 'factory', 'factories', 'producer',
  '3m', 'honeywell', 'msa', 'drager', 'uvex', 'anstel', 'karam', 'jsp',
  'deltaplus', 'lacrosse', 'magid', 'kimberly', 'ansell', 'lakeland',
  '制造商', '供应商', '厂家', '生产商', '品牌', '工厂', '企业', '公司',
]

const REGULATION_KEYWORDS = [
  'regulation', 'regulations', 'standard', 'standards', 'certification', 'certificate',
  'ce', 'ce marking', 'ukca', 'fda', '510k', '510(k)', 'nmpa', 'pmda',
  'iso', 'en ', 'astm', 'ansi', 'nfpa', 'osha', 'iec',
  'directive', 'compliance', 'approval', 'registered', 'registration',
  'testing', 'test report', 'notified body', 'declaration of conformity',
  'technical file', 'risk assessment', 'market access',
  'en 388', 'en 374', 'en 149', 'en 166', 'en 397', 'en 20345',
  'iso 9001', 'iso 13485', 'regulation 2016/425', 'ppe regulation',
  '法规', '标准', '认证', 'ce认证', 'fda认证', '注册', '合规', '准入',
  '检验', '测试报告', '技术文件', '风险评估', '公告机构', '符合性声明',
  '市场准入', '型式检验', '质量体系',
]

const PPE_GENERAL_KEYWORDS = [
  'ppe', 'personal protective equipment', 'protective equipment',
  'occupational safety', 'workplace safety', 'industrial safety',
  '个人防护装备', '劳动防护', '职业安全', '工业安全',
]

function normalizeQuery(query: string): string {
  return query.toLowerCase().trim()
}

function countKeywordMatches(query: string, keywords: string[]): { count: number; matched: string[] } {
  const normalized = normalizeQuery(query)
  const matched: string[] = []

  for (const keyword of keywords) {
    if (normalized.includes(keyword.toLowerCase())) {
      matched.push(keyword)
    }
  }

  return { count: matched.length, matched }
}

export function classifySearchQuery(query: string): ClassificationResult {
  if (!query || !query.trim()) {
    return {
      category: 'ai',
      confidence: 0,
      reason: 'Empty query',
      targetPath: '/ai-chat',
      icon: 'sparkles',
      color: '#339999',
    }
  }

  const productMatch = countKeywordMatches(query, PRODUCT_KEYWORDS)
  const companyMatch = countKeywordMatches(query, COMPANY_KEYWORDS)
  const regulationMatch = countKeywordMatches(query, REGULATION_KEYWORDS)
  const ppeGeneralMatch = countKeywordMatches(query, PPE_GENERAL_KEYWORDS)

  const scores: Record<SearchCategory, number> = {
    product: productMatch.count * 2 + (ppeGeneralMatch.count > 0 ? 0.5 : 0),
    company: companyMatch.count * 2 + (ppeGeneralMatch.count > 0 ? 0.5 : 0),
    regulation: regulationMatch.count * 2 + (ppeGeneralMatch.count > 0 ? 0.5 : 0),
    ai: 0,
  }

  const maxScore = Math.max(scores.product, scores.company, scores.regulation)

  if (maxScore === 0) {
    if (query.trim().length < 15 && !query.includes(' ') && !query.includes('?') && !query.includes('？')) {
      return {
        category: 'product',
        confidence: 0.4,
        reason: 'Short keyword, likely a product search',
        targetPath: '/search',
        icon: 'package',
        color: '#3B82F6',
      }
    }

    return {
      category: 'ai',
      confidence: 0.6,
      reason: 'No category keywords detected, routing to AI',
      targetPath: '/ai-chat',
      icon: 'sparkles',
      color: '#339999',
    }
  }

  let bestCategory: SearchCategory = 'product'
  let bestScore = 0

  for (const [cat, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score
      bestCategory = cat as SearchCategory
    }
  }

  const confidence = Math.min(0.5 + bestScore * 0.1, 0.95)

  const categoryConfig: Record<SearchCategory, { path: string; icon: string; color: string; reason: string }> = {
    product: {
      path: '/search',
      icon: 'package',
      color: '#3B82F6',
      reason: `Product keywords detected: ${productMatch.matched.slice(0, 3).join(', ')}`,
    },
    company: {
      path: '/search',
      icon: 'building',
      color: '#10B981',
      reason: `Company keywords detected: ${companyMatch.matched.slice(0, 3).join(', ')}`,
    },
    regulation: {
      path: '/search',
      icon: 'file-text',
      color: '#F59E0B',
      reason: `Regulation keywords detected: ${regulationMatch.matched.slice(0, 3).join(', ')}`,
    },
    ai: {
      path: '/ai-chat',
      icon: 'sparkles',
      color: '#339999',
      reason: 'No category keywords detected, routing to AI',
    },
  }

  const config = categoryConfig[bestCategory]

  return {
    category: bestCategory,
    confidence,
    reason: config.reason,
    targetPath: config.path,
    icon: config.icon,
    color: config.color,
  }
}

export function getCategoryLabel(category: SearchCategory, locale: string = 'en'): string {
  const labels: Record<string, Record<SearchCategory, string>> = {
    en: {
      product: 'Product',
      company: 'Manufacturer',
      regulation: 'Regulation',
      ai: 'AI Assistant',
    },
    zh: {
      product: '产品',
      company: '企业',
      regulation: '法规',
      ai: 'AI助手',
    },
  }

  return (labels[locale] || labels.en)[category] || category
}

export function getCategorySearchType(category: SearchCategory): string {
  switch (category) {
    case 'product': return 'product'
    case 'company': return 'company'
    case 'regulation': return 'regulation'
    default: return 'all'
  }
}
