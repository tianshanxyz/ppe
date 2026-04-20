/**
 * 查询意图分类器
 * 
 * 使用规则+AI混合方式识别用户查询意图
 * A-003: AI助手升级（自然语言查询）
 */

import {
  QueryIntent,
  QueryIntentType,
  EntityType,
  ExtractedEntity,
  NLParseResult,
  QueryCondition,
  QuerySlot,
  QuerySort,
  QueryPagination,
} from './types'

// ============================================
// 意图识别规则
// ============================================

interface IntentPattern {
  intent: QueryIntentType
  subType?: string
  patterns: RegExp[]
  keywords: string[]
  priority: number
}

const INTENT_PATTERNS: IntentPattern[] = [
  // 搜索意图
  {
    intent: 'search',
    subType: 'product',
    patterns: [
      /找(?:到)?(.+?)(?:制造商|厂家|生产商|供应商)/,
      /搜索(.+?)(?:产品|设备|器械)/,
      /有哪些(.+?)(?:产品|型号)/,
    ],
    keywords: ['找', '搜索', '查询', '有哪些', '列出', '显示'],
    priority: 10,
  },
  {
    intent: 'search',
    subType: 'company',
    patterns: [
      /找(?:到)?(.+?)(?:公司|企业|制造商)/,
      /(?:哪些|什么)(?:公司|企业)(?:生产|制造|供应)(.+)/,
    ],
    keywords: ['公司', '企业', '制造商', '厂家'],
    priority: 10,
  },
  // 对比意图
  {
    intent: 'compare',
    patterns: [
      /(?:对比|比较)(.+?)(?:和|与|跟)(.+)/,
      /(.+?)(?:和|与|跟)(.+?)(?:有什么|的)(?:区别|差异|不同)/,
      /(?:哪个|哪家)(?:更好|更优|更推荐)/,
    ],
    keywords: ['对比', '比较', '区别', '差异', 'vs', 'versus'],
    priority: 20,
  },
  // 分析意图
  {
    intent: 'analyze',
    patterns: [
      /分析(.+)/,
      /(?:评估|评价)(.+?)(?:的)?(?:风险|合规性|质量)/,
      /(.+?)(?:的)?(?:情况|状况|表现)(?:如何|怎么样)/,
    ],
    keywords: ['分析', '评估', '评价', '怎么样', '如何'],
    priority: 15,
  },
  // 推荐意图
  {
    intent: 'recommend',
    patterns: [
      /推荐(.+)/,
      /(?:给我|帮我)?(?:推荐|建议)(.+)/,
      /(?:哪个|哪些)(?:适合|推荐|最好)(?:用于|做)?(.+)/,
    ],
    keywords: ['推荐', '建议', '最好', '适合', '最优'],
    priority: 15,
  },
  // 解释意图
  {
    intent: 'explain',
    patterns: [
      /(?:什么|啥)是(.+)/,
      /(?:解释|说明|介绍)(?:一下)?(.+)/,
      /(.+?)(?:是|指)(?:什么|啥)/,
    ],
    keywords: ['什么是', '解释', '说明', '介绍', '定义'],
    priority: 12,
  },
  // 状态检查
  {
    intent: 'status_check',
    patterns: [
      /(.+?)(?:的)?(?:状态|进度|情况)(?:如何|怎么样)/,
      /(?:查询|查看)(.+?)(?:的)?(?:认证|注册|状态)/,
      /(.+?)(?:是否|有没有)(?:通过|获得|过期)/,
    ],
    keywords: ['状态', '进度', '是否', '过期', '有效'],
    priority: 18,
  },
  // 趋势分析
  {
    intent: 'trend_analysis',
    patterns: [
      /(.+?)(?:的)?(?:趋势|变化|发展)/,
      /(?:最近|近期|过去)(.+?)(?:情况|数据|表现)/,
      /(.+?)(?:增长|下降|变化)(?:如何|多少)/,
    ],
    keywords: ['趋势', '变化', '增长', '下降', '最近', '近期'],
    priority: 14,
  },
]

// ============================================
// 实体识别规则
// ============================================

interface EntityPattern {
  type: EntityType
  patterns: RegExp[]
  normalizer?: (value: string) => string
}

const ENTITY_PATTERNS: EntityPattern[] = [
  {
    type: 'product',
    patterns: [
      /(N95|KN95|FFP2|FFP3|医用口罩|外科口罩|防护服|护目镜|手套)/gi,
      /(\d{3,4}[\s-]?\d{3,4})/g,  // 产品型号如 510K
    ],
    normalizer: (value) => value.toUpperCase().replace(/\s/g, ''),
  },
  {
    type: 'market',
    patterns: [
      /(美国|欧盟|中国|日本|加拿大|澳大利亚|英国|德国|法国)/g,
      /(FDA|CE|NMPA|PMDA|Health\s*Canada|TGA|UKCA)/gi,
      /(US|EU|CN|JP|CA|AU|UK)/gi,
    ],
    normalizer: (value) => {
      const marketMap: Record<string, string> = {
        '美国': 'US', 'FDA': 'US',
        '欧盟': 'EU', 'CE': 'EU', '欧洲': 'EU',
        '中国': 'CN', 'NMPA': 'CN', '国内': 'CN',
        '日本': 'JP', 'PMDA': 'JP',
        '加拿大': 'CA', 'HealthCanada': 'CA',
        '澳大利亚': 'AU', 'TGA': 'AU',
        '英国': 'UK', 'UKCA': 'UK',
      }
      return marketMap[value] || value.toUpperCase()
    },
  },
  {
    type: 'certification',
    patterns: [
      /(510k|510\(k\)|PMA|De\s*Novo)/gi,
      /(Class\s*[I|II|III])/gi,
      /(K\d{6,8})/g,  // 510K编号
    ],
  },
]

// ============================================
// 条件提取规则
// ============================================

interface ConditionPattern {
  field: string
  patterns: { regex: RegExp; operator: QueryCondition['operator']; extract: (match: RegExpMatchArray) => unknown }[]
}

const CONDITION_PATTERNS: ConditionPattern[] = [
  {
    field: 'device_class',
    patterns: [
      {
        regex: /Class\s*([I|II|III])/i,
        operator: 'eq',
        extract: (m) => m[1],
      },
      {
        regex: /([一二三类])类器械/,
        operator: 'eq',
        extract: (m) => {
          const map: Record<string, string> = { '一': 'I', '二': 'II', '三': 'III' }
          return map[m[1]]
        },
      },
    ],
  },
  {
    field: 'market',
    patterns: [
      {
        regex: /(?:在|有)(.+?)(?:和|、|,)?(.+?)?(?:市场|注册|认证)/,
        operator: 'in',
        extract: (m) => [m[1], m[2]].filter(Boolean),
      },
    ],
  },
  {
    field: 'status',
    patterns: [
      {
        regex: /(?:有效|活跃|通过)/,
        operator: 'eq',
        extract: () => 'active',
      },
      {
        regex: /(?:过期|失效|撤销)/,
        operator: 'eq',
        extract: () => 'expired',
      },
    ],
  },
]

// ============================================
// 意图分类器类
// ============================================

export class IntentClassifier {
  /**
   * 分类查询意图
   */
  classifyIntent(query: string): QueryIntent {
    const normalizedQuery = query.toLowerCase().trim()
    let bestMatch: QueryIntent = { type: 'unknown', confidence: 0 }
    let maxScore = 0

    for (const pattern of INTENT_PATTERNS) {
      let score = 0
      let matched = false

      // 检查正则匹配
      for (const regex of pattern.patterns) {
        if (regex.test(normalizedQuery)) {
          score += pattern.priority * 2
          matched = true
          break
        }
      }

      // 检查关键词匹配
      for (const keyword of pattern.keywords) {
        if (normalizedQuery.includes(keyword.toLowerCase())) {
          score += pattern.priority
          matched = true
        }
      }

      // 更新最佳匹配
      if (matched && score > maxScore) {
        maxScore = score
        bestMatch = {
          type: pattern.intent,
          subType: pattern.subType,
          confidence: Math.min(score / 50, 0.95), // 归一化置信度
        }
      }
    }

    return bestMatch
  }

  /**
   * 提取实体
   */
  extractEntities(query: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = []
    const seen = new Set<string>()

    for (const pattern of ENTITY_PATTERNS) {
      for (const regex of pattern.patterns) {
        const matches = query.matchAll(regex)
        for (const match of matches) {
          const value = match[1] || match[0]
          const normalizedValue = pattern.normalizer ? pattern.normalizer(value) : value
          
          // 去重
          const key = `${pattern.type}:${normalizedValue}`
          if (seen.has(key)) continue
          seen.add(key)

          entities.push({
            type: pattern.type,
            value,
            normalizedValue,
            confidence: 0.85,
            position: {
              start: match.index || 0,
              end: (match.index || 0) + match[0].length,
            },
          })
        }
      }
    }

    return entities
  }

  /**
   * 提取查询条件
   */
  extractConditions(query: string): QueryCondition[] {
    const conditions: QueryCondition[] = []

    for (const pattern of CONDITION_PATTERNS) {
      for (const { regex, operator, extract } of pattern.patterns) {
        const match = query.match(regex)
        if (match) {
          conditions.push({
            field: pattern.field,
            operator,
            value: extract(match),
            logic: 'and',
          })
        }
      }
    }

    return conditions
  }

  /**
   * 提取排序信息
   */
  extractSort(query: string): QuerySort | undefined {
    // 按风险排序
    if (/风险.*(?:最高|最大|排序)/.test(query)) {
      return { field: 'risk_score', direction: 'desc' }
    }
    if (/风险.*(?:最低|最小)/.test(query)) {
      return { field: 'risk_score', direction: 'asc' }
    }

    // 按时间排序
    if (/最新|最近|新/.test(query)) {
      return { field: 'created_at', direction: 'desc' }
    }

    // 按评分排序
    if (/评分|信用|排名/.test(query)) {
      return { field: 'credit_score', direction: 'desc' }
    }

    return undefined
  }

  /**
   * 填充槽位
   */
  fillSlots(intent: QueryIntentType, entities: ExtractedEntity[]): QuerySlot[] {
    const slotDefinitions: Record<string, { name: string; required: boolean; entityTypes: EntityType[] }[]> = {
      search: [
        { name: 'entityType', required: true, entityTypes: ['product', 'company'] },
        { name: 'market', required: false, entityTypes: ['market'] },
        { name: 'keyword', required: false, entityTypes: [] },
      ],
      compare: [
        { name: 'entityA', required: true, entityTypes: ['product', 'company'] },
        { name: 'entityB', required: true, entityTypes: ['product', 'company'] },
      ],
      analyze: [
        { name: 'target', required: true, entityTypes: ['product', 'company'] },
        { name: 'dimension', required: false, entityTypes: [] },
      ],
      recommend: [
        { name: 'scenario', required: true, entityTypes: [] },
        { name: 'constraints', required: false, entityTypes: ['market'] },
      ],
    }

    const slots: QuerySlot[] = []
    const definitions = slotDefinitions[intent] || []

    for (const def of definitions) {
      const matchingEntities = entities.filter(e => 
        def.entityTypes.length === 0 || def.entityTypes.includes(e.type)
      )

      slots.push({
        name: def.name,
        value: matchingEntities[0]?.normalizedValue || null,
        required: def.required,
        filled: matchingEntities.length > 0,
      })
    }

    return slots
  }

  /**
   * 完整解析查询
   */
  parse(query: string): NLParseResult {
    const startTime = Date.now()

    // 1. 识别意图
    const intent = this.classifyIntent(query)

    // 2. 提取实体
    const entities = this.extractEntities(query)

    // 3. 提取条件
    const conditions = this.extractConditions(query)

    // 4. 提取排序
    const sort = this.extractSort(query)

    // 5. 填充槽位
    const slots = this.fillSlots(intent.type, entities)

    // 6. 计算置信度
    const confidence = this.calculateConfidence(intent, entities, slots)

    return {
      originalQuery: query,
      intent,
      entities,
      conditions,
      slots,
      sort,
      pagination: { page: 1, pageSize: 20, offset: 0 },
      confidence,
    }
  }

  /**
   * 计算整体置信度
   */
  private calculateConfidence(
    intent: QueryIntent,
    entities: ExtractedEntity[],
    slots: QuerySlot[]
  ): number {
    const intentWeight = 0.4
    const entityWeight = 0.3
    const slotWeight = 0.3

    // 意图置信度
    const intentScore = intent.confidence

    // 实体置信度（平均）
    const entityScore = entities.length > 0
      ? entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length
      : 0.5

    // 槽位填充率
    const requiredSlots = slots.filter(s => s.required)
    const filledRequiredSlots = requiredSlots.filter(s => s.filled).length
    const slotScore = requiredSlots.length > 0
      ? filledRequiredSlots / requiredSlots.length
      : 1.0

    return intentWeight * intentScore + entityWeight * entityScore + slotWeight * slotScore
  }
}

// 导出单例
export const intentClassifier = new IntentClassifier()
