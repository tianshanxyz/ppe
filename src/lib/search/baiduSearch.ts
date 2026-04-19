/**
 * 百度 AI 搜索客户端
 * 
 * 功能:
 * - 语义搜索增强
 * - 查询意图识别
 * - 智能推荐
 * - 知识图谱查询
 * 
 * 文档：https://cloud.baidu.com/doc/
 */

export interface BaiduSearchOptions {
  query: string
  limit?: number
  filters?: Record<string, unknown>
}

export interface BaiduSearchResult {
  id: string
  title: string
  abstract: string
  content: string
  url?: string
  score: number
  type?: string
}

export interface BaiduSearchResponse {
  results: BaiduSearchResult[]
  suggestions?: string[]
  intent?: {
    type: string
    entities: Array<{
      name: string
      type: string
    }>
  }
}

interface BaiduSearchData {
  results?: Array<{
    id?: string
    title?: string
    abstract?: string
    content?: string
    url?: string
    score?: number
    type?: string
  }>
  suggestions?: string[]
  intent?: {
    type: string
    entities: Array<{
      name: string
      type: string
    }>
  }
}

/**
 * 百度 AI 搜索客户端
 */
export class BaiduSearchClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.BAIDU_AI_SEARCH_KEY || '';
    this.baseUrl = process.env.BAIDU_AI_SEARCH_URL || 'https://openapi.baidu.com/rest/2.0/ai_search/v1/search';

    if (!this.apiKey) {
      console.warn('⚠️ 百度 AI 搜索 API 密钥未配置');
    }
  }

  /**
   * 执行智能搜索
   */
  async search(options: BaiduSearchOptions): Promise<BaiduSearchResponse> {
    const { query, limit = 10, filters = {} } = options;

    if (!this.apiKey) {
      throw new Error('百度 AI 搜索 API 密钥未配置');
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query,
          limit,
          ...filters,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`百度 AI 搜索请求失败：${response.status} - ${errorText}`);
      }

      const data: BaiduSearchData = await response.json()

      return {
        results: (data.results || []).map((item) => ({
          id: item.id || this.generateId(),
          title: item.title || '',
          abstract: item.abstract || '',
          content: item.content || '',
          url: item.url,
          score: item.score || 0,
          type: item.type,
        })),
        suggestions: data.suggestions || [],
        intent: data.intent,
      };
    } catch (error) {
      console.error('百度 AI 搜索失败:', error);
      throw error;
    }
  }

  /**
   * 查询意图识别
   */
  async recognizeIntent(query: string): Promise<{
    type: string;
    confidence: number;
    entities: Array<{ name: string; type: string }>;
  }> {
    try {
      const result = await this.search({ query, limit: 1 });
      
      // 从搜索结果中提取意图
      const intent = result.intent || {
        type: 'general',
        entities: [],
      };

      return {
        type: intent.type,
        confidence: 0.8, // 默认置信度
        entities: intent.entities || [],
      };
    } catch (error) {
      console.error('意图识别失败:', error);
      return {
        type: 'general',
        confidence: 0.5,
        entities: [],
      };
    }
  }

  /**
   * 获取搜索建议
   */
  async getSuggestions(query: string): Promise<string[]> {
    try {
      const result = await this.search({ query, limit: 1 });
      return result.suggestions || [];
    } catch (error) {
      console.error('获取建议失败:', error);
      return [];
    }
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `baidu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.search({ query: 'test', limit: 1 });
      return true;
    } catch (error) {
      console.error('百度 AI 搜索连接测试失败:', error);
      return false;
    }
  }
}

// 导出单例
export const baiduSearchClient = new BaiduSearchClient();
