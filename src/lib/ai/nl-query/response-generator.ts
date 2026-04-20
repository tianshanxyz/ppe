/**
 * AI响应生成器
 *
 * 基于查询结果生成自然语言回答
 * A-003: AI助手升级（自然语言查询）
 */

import {
  AIQueryResponse,
  QueryExecutionResult,
  StructuredQuery,
  QueryIntentType,
  EntityType,
  ConversationContext,
} from './types'

// ============================================
// 提示词模板
// ============================================

const RESPONSE_TEMPLATES: Record<QueryIntentType, string> = {
  search: `基于以下搜索结果，为用户生成一个清晰、专业的回答：

查询意图：搜索{entityType}
查询条件：{conditions}
找到结果：{total}条

结果摘要：
{results}

请生成：
1. 直接回答用户的问题
2. 列出关键信息（最多5条）
3. 如果有更多结果，提示用户可以查看更多
4. 提供1-2个相关的后续问题建议`,

  compare: `基于以下对比数据，生成专业的对比分析：

对比对象：{entities}
对比维度：{dimensions}

数据：
{data}

请生成：
1. 整体对比总结
2. 关键差异点（3-5个）
3. 各自的优势和劣势
4. 针对不同场景的建议`,

  analyze: `基于以下分析数据，生成专业的分析报告：

分析对象：{target}
分析维度：{dimensions}

数据：
{data}

请生成：
1. 核心发现（3-5点）
2. 数据洞察和趋势
3. 潜在风险或机会
4.  actionable建议`,

  recommend: `基于用户需求和以下候选数据，生成个性化推荐：

用户需求：{requirements}
候选数量：{total}

候选列表：
{candidates}

请生成：
1. 推荐理由概述
2. Top 3推荐（带理由）
3. 每个推荐的核心优势
4. 注意事项或限制`,

  explain: `解释以下概念或术语：

主题：{topic}
上下文：{context}

请生成：
1. 简洁的定义（1-2句话）
2. 详细解释
3. 实际应用示例
4. 相关概念联系`,

  status_check: `基于以下状态数据，生成状态报告：

检查对象：{target}
当前状态：{status}

详细信息：
{details}

请生成：
1. 状态摘要
2. 关键时间节点
3. 需要注意的事项
4. 后续建议`,

  trend_analysis: `基于以下趋势数据，生成趋势分析报告：

分析对象：{target}
时间范围：{timeRange}

数据：
{data}

请生成：
1. 趋势概述
2. 关键变化点
3. 增长/下降原因分析
4. 未来预测和建议`,

  unknown: `用户提出了一个问题，但我无法确定具体的查询意图。

用户问题：{query}

请生成：
1. 礼貌地说明理解上的困难
2. 询问用户具体想要什么信息
3. 提供几个可能的理解方向供用户选择
4. 给出示例问题帮助用户重新表述`,
}

// ============================================
// 结果格式化器
// ============================================

class ResultFormatter {
  /**
   * 格式化搜索结果
   */
  formatSearchResults(results: unknown[], entityType: EntityType): string {
    if (results.length === 0) {
      return '未找到相关结果。'
    }

    return results
      .slice(0, 5)
      .map((item: any, index) => {
        if (entityType === 'product') {
          return `${index + 1}. ${item.product_name} - ${item.company_name} (${item.market})`
        } else if (entityType === 'company') {
          return `${index + 1}. ${item.company_name} - ${item.country}`
        } else {
          return `${index + 1}. ${JSON.stringify(item).slice(0, 100)}...`
        }
      })
      .join('\n')
  }

  /**
   * 格式化条件
   */
  formatConditions(conditions: Array<{ field: string; operator: string; value: unknown }>): string {
    if (conditions.length === 0) {
      return '无特定条件'
    }

    return conditions
      .map((c) => {
        const operatorMap: Record<string, string> = {
          eq: '等于',
          neq: '不等于',
          gt: '大于',
          gte: '大于等于',
          lt: '小于',
          lte: '小于等于',
          like: '包含',
          in: '在列表中',
        }
        return `${c.field} ${operatorMap[c.operator] || c.operator} ${c.value}`
      })
      .join(', ')
  }

  /**
   * 格式化对比数据
   */
  formatComparisonData(items: unknown[]): string {
    return items
      .map((item: any, index) => {
        const fields = Object.entries(item)
          .filter(([key]) => !['id', 'created_at', 'updated_at'].includes(key))
          .map(([key, value]) => `  ${key}: ${value}`)
          .join('\n')
        return `对象 ${index + 1}:\n${fields}`
      })
      .join('\n\n')
  }
}

// ============================================
// 响应生成器
// ============================================

export class ResponseGenerator {
  private formatter = new ResultFormatter()

  /**
   * 生成简单响应（无需AI）
   */
  generateSimpleResponse(
    intent: QueryIntentType,
    entityType: EntityType,
    result: QueryExecutionResult<unknown>,
    originalQuery: string
  ): AIQueryResponse {
    const startTime = Date.now()

    // 根据意图类型生成模板响应
    let answer = ''
    let suggestions: string[] = []

    switch (intent) {
      case 'search':
        answer = this.generateSearchResponse(entityType, result, originalQuery)
        suggestions = this.generateSearchSuggestions(entityType, originalQuery)
        break
      case 'compare':
        answer = this.generateComparisonResponse(result)
        break
      case 'analyze':
        answer = this.generateAnalysisResponse(entityType, result)
        break
      case 'status_check':
        answer = this.generateStatusResponse(result)
        break
      default:
        answer = this.generateDefaultResponse(result)
    }

    return {
      success: result.success,
      answer,
      results: result,
      suggestions,
      relatedQuestions: this.generateRelatedQuestions(intent, entityType),
      confidence: 0.8,
      processingTimeMs: Date.now() - startTime,
    }
  }

  /**
   * 生成搜索响应
   */
  private generateSearchResponse(
    entityType: EntityType,
    result: QueryExecutionResult<unknown>,
    query: string
  ): string {
    if (!result.success) {
      return `抱歉，查询时出现错误：${result.error}`
    }

    if (result.total === 0) {
      return `未找到符合"${query}"的${entityType === 'product' ? '产品' : '公司'}。\n\n建议：\n- 尝试使用更通用的关键词\n- 检查拼写是否正确\n- 尝试不同的搜索条件`
    }

    const entityName = entityType === 'product' ? '产品' : '公司'
    let response = `为您找到 **${result.total}** 个相关${entityName}：\n\n`

    result.data.slice(0, 5).forEach((item: any, index) => {
      if (entityType === 'product') {
        response += `${index + 1}. **${item.product_name}** - ${item.company_name}\n`
        response += `   市场：${item.market} | 类别：${item.device_class || 'N/A'}\n\n`
      } else {
        response += `${index + 1}. **${item.company_name}** - ${item.country}\n`
        response += `   注册号：${item.registration_number || 'N/A'}\n\n`
      }
    })

    if (result.total > 5) {
      response += `... 还有 ${result.total - 5} 个结果\n\n`
    }

    return response
  }

  /**
   * 生成对比响应
   */
  private generateComparisonResponse(result: QueryExecutionResult<unknown>): string {
    if (!result.success || result.data.length < 2) {
      return '对比需要至少两个对象，请提供更多详细信息。'
    }

    const items = result.data.slice(0, 2)
    return `已找到对比对象，正在为您生成详细对比分析...\n\n（使用AI生成更详细的对比报告）`
  }

  /**
   * 生成分析响应
   */
  private generateAnalysisResponse(
    entityType: EntityType,
    result: QueryExecutionResult<unknown>
  ): string {
    if (!result.success || result.data.length === 0) {
      return '未找到可分析的数据。'
    }

    return `基于${result.total}条数据进行分析...\n\n（使用AI生成深度分析报告）`
  }

  /**
   * 生成状态响应
   */
  private generateStatusResponse(result: QueryExecutionResult<unknown>): string {
    if (!result.success || result.data.length === 0) {
      return '未找到状态信息。'
    }

    const item: any = result.data[0]
    return `当前状态：**${item.status || '未知'}**\n\n详细信息需要进一步查询...`
  }

  /**
   * 生成默认响应
   */
  private generateDefaultResponse(result: QueryExecutionResult<unknown>): string {
    if (!result.success) {
      return `查询失败：${result.error}`
    }

    return `找到 ${result.total} 条相关记录。`
  }

  /**
   * 生成搜索建议
   */
  private generateSearchSuggestions(entityType: EntityType, query: string): string[] {
    const suggestions: string[] = []

    if (entityType === 'product') {
      suggestions.push(`查看这些${query}制造商的详细信息`)
      suggestions.push(`对比${query}在不同市场的认证情况`)
    } else {
      suggestions.push(`查看该公司的产品列表`)
      suggestions.push(`分析该公司的合规风险`)
    }

    return suggestions
  }

  /**
   * 生成相关问题
   */
  private generateRelatedQuestions(intent: QueryIntentType, entityType: EntityType): string[] {
    const questions: string[] = []

    switch (intent) {
      case 'search':
        if (entityType === 'product') {
          questions.push('这些制造商中谁的风险最低？')
          questions.push('这些产品在哪些市场有认证？')
        } else {
          questions.push('这家公司有哪些主要产品？')
          questions.push('这家公司的合规记录如何？')
        }
        break
      case 'compare':
        questions.push('哪个更适合进入欧盟市场？')
        questions.push('它们的认证有效期分别到什么时候？')
        break
      case 'analyze':
        questions.push('未来6个月的风险预测如何？')
        questions.push('有哪些改进建议？')
        break
    }

    return questions
  }

  /**
   * 构建AI提示词
   */
  buildPrompt(
    intent: QueryIntentType,
    query: string,
    result: QueryExecutionResult<unknown>,
    structuredQuery: StructuredQuery,
    context?: ConversationContext
  ): string {
    const template = RESPONSE_TEMPLATES[intent] || RESPONSE_TEMPLATES.unknown

    const variables: Record<string, string> = {
      query,
      entityType: structuredQuery.entityType,
      conditions: this.formatter.formatConditions(structuredQuery.filters),
      total: String(result.total),
      results: this.formatter.formatSearchResults(result.data, structuredQuery.entityType),
    }

    // 替换模板变量
    let prompt = template
    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replace(new RegExp(`{${key}}`, 'g'), value)
    }

    // 添加上下文信息
    if (context && context.history.length > 0) {
      prompt += `\n\n对话历史：\n${context.history
        .slice(-3)
        .map((h) => `${h.role}: ${h.content}`)
        .join('\n')}`
    }

    return prompt
  }
}

// 导出单例
export const responseGenerator = new ResponseGenerator()
