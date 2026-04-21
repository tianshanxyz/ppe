/**
 * 实体关联模型（企业去重）- 类型定义
 *
 * A-007: 实体关联模型（企业去重）
 */

/**
 * 企业实体
 */
export interface CompanyEntity {
  id: string
  name: string
  normalized_name?: string
  aliases?: string[]
  country?: string
  registration_number?: string
  address?: string
  source?: string
  metadata?: Record<string, unknown>
}

/**
 * 实体匹配结果
 */
export interface EntityMatchResult {
  entity1: CompanyEntity
  entity2: CompanyEntity
  similarity_score: number
  match_confidence: 'high' | 'medium' | 'low'
  match_reasons: string[]
  is_match: boolean
}

/**
 * 实体簇（去重后的企业组）
 */
export interface EntityCluster {
  id: string
  canonical_name: string
  entities: CompanyEntity[]
  entity_count: number
  countries: string[]
  confidence: number
  created_at: string
  updated_at: string
}

/**
 * 名称标准化结果
 */
export interface NormalizedName {
  original: string
  normalized: string
  tokens: string[]
  abbreviation_expanded: string
  legal_suffix_removed: string
}

/**
 * 相似度算法类型
 */
export enum SimilarityAlgorithm {
  LEVENSHTEIN = 'levenshtein',
  JARO_WINKLER = 'jaro_winkler',
  COSINE = 'cosine',
  JACCARD = 'jaccard',
  HYBRID = 'hybrid',
}

/**
 * 实体解析配置
 */
export interface EntityResolutionConfig {
  similarity_threshold: number
  high_confidence_threshold: number
  medium_confidence_threshold: number
  algorithm: SimilarityAlgorithm
  use_phonetic: boolean
  use_abbreviation_expansion: boolean
  use_legal_suffix_removal: boolean
  max_edit_distance: number
  ngram_size: number
}

/**
 * 默认配置
 */
export const DEFAULT_ENTITY_RESOLUTION_CONFIG: EntityResolutionConfig = {
  similarity_threshold: 0.85,
  high_confidence_threshold: 0.95,
  medium_confidence_threshold: 0.85,
  algorithm: SimilarityAlgorithm.HYBRID,
  use_phonetic: true,
  use_abbreviation_expansion: true,
  use_legal_suffix_removal: true,
  max_edit_distance: 3,
  ngram_size: 2,
}

/**
 * 实体解析请求
 */
export interface EntityResolutionRequest {
  entities: CompanyEntity[]
  config?: Partial<EntityResolutionConfig>
}

/**
 * 实体解析响应
 */
export interface EntityResolutionResponse {
  success: boolean
  clusters: EntityCluster[]
  total_entities: number
  total_clusters: number
  duplicates_found: number
  processing_time_ms: number
  error?: string
}

/**
 * 实体查询请求
 */
export interface EntityQueryRequest {
  name?: string
  country?: string
  registration_number?: string
  threshold?: number
  limit?: number
}

/**
 * 实体关联图谱节点
 */
export interface EntityGraphNode {
  id: string
  name: string
  type: 'canonical' | 'alias'
  cluster_id?: string
  metadata?: Record<string, unknown>
}

/**
 * 实体关联图谱边
 */
export interface EntityGraphEdge {
  source: string
  target: string
  weight: number
  type: 'similarity' | 'alias' | 'canonical'
}

/**
 * 实体关联图谱
 */
export interface EntityGraph {
  nodes: EntityGraphNode[]
  edges: EntityGraphEdge[]
}

/**
 * 常见公司后缀
 */
export const LEGAL_SUFFIXES = [
  // 英文
  'inc', 'incorporated',
  'corp', 'corporation',
  'ltd', 'limited',
  'llc', 'limited liability company',
  'lp', 'limited partnership',
  'plc', 'public limited company',
  'gmbh',
  'ag', 'aktienegesellschaft',
  'bv', 'besloten vennootschap',
  'sarl', 'societe a responsabilite limitee',
  'sa', 'societe anonyme',
  'spa', 'societa per azioni',
  'sl', 'sociedad limitada',
  'ab', 'aktiebolag',
  'as', 'aksjeselskap',
  'oy', 'osakeyhtio',
  'kk', 'kabushiki kaisha',
  'co', 'company',
  'co ltd', 'company limited',
  'llp', 'limited liability partnership',
  // 中文
  '有限公司',
  '有限责任公司',
  '股份有限公司',
  '股份公司',
  '集团公司',
  '总公司',
  '分公司',
  '子公司',
  '企业',
  '工厂',
  '制造',
  '生产',
  '贸易',
  '商贸',
  '科技',
  '技术',
  '工程',
  '实业',
  '发展',
  '投资',
  '控股',
  '集团',
  '股份',
]

/**
 * 常见缩写扩展
 */
export const ABBREVIATION_MAP: Record<string, string> = {
  // 英文缩写
  '3m': 'minnesota mining manufacturing',
  'ibm': 'international business machines',
  'hp': 'hewlett packard',
  'ge': 'general electric',
  'gm': 'general motors',
  'at&t': 'american telephone telegraph',
  'bmw': 'bayerische motoren werke',
  'basf': 'badische anilin soda fabrik',
  // 中文缩写
  '中石油': '中国石油天然气集团',
  '中石化': '中国石油化工集团',
  '中海油': '中国海洋石油集团',
  '中化': '中国中化集团',
  '中粮': '中粮集团',
  '中建': '中国建筑集团',
  '中铁': '中国铁路工程集团',
  '中交': '中国交通建设集团',
  '中冶': '中国冶金科工集团',
  '中电': '中国电子科技集团',
  '中航': '中国航空工业集团',
  '中船': '中国船舶集团',
  '中核': '中国核工业集团',
  '国电': '国家电力投资集团',
  '华能': '中国华能集团',
  '大唐': '中国大唐集团',
  '华电': '中国华电集团',
  '国核': '国家核电技术公司',
  '国网': '国家电网',
  '南网': '南方电网',
}

/**
 * 音似词映射（用于模糊匹配）
 */
export const PHONETIC_MAP: Record<string, string> = {
  // 常见音似词
  'ph': 'f',
  'ck': 'k',
  'c': 'k',
  'q': 'k',
  'x': 'ks',
  'z': 's',
  'v': 'f',
  'w': 'v',
  'j': 'g',
  'y': 'i',
}
