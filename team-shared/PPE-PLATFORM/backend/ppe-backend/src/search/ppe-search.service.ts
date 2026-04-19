import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from './elasticsearch.service';
import { PPE_INDEX_NAME, PPE_INDEX_MAPPING } from './index-config';

export interface PpeFilters {
  category?: string;
  type?: string;
  manufacturer?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  [key: string]: string | number | undefined;
}

export interface SearchOptions {
  query?: string;
  filters?: PpeFilters | Record<string, unknown>;
  page?: number;
  limit?: number;
  sort?: Record<string, string>;
  highlight?: boolean;
  aggregations?: Record<string, unknown>;
}

export interface PpeDocument {
  id: string;
  [key: string]: unknown;
}

export interface SearchResult {
  hits: any[];
  total: number;
  aggregations?: any;
  took: number;
}

@Injectable()
export class PpeSearchService {
  private readonly index: string = PPE_INDEX_NAME;

  constructor(private readonly esService: ElasticsearchService) {}

  /**
   * 初始化索引
   */
  async initIndex(): Promise<void> {
    await this.esService.createIndex(this.index, PPE_INDEX_MAPPING);
  }

  /**
   * 索引 PPE 数据
   */
  async indexPpe(ppe: any): Promise<void> {
    const document = this.transformToDocument(ppe);
    
    await this.esService.getClient().index({
      index: this.index,
      id: ppe.id,
      body: document,
    });

    await this.esService.refreshIndex(this.index);
  }

  /**
   * 批量索引 PPE 数据
   */
  async bulkIndexPpe(ppeList: any[]): Promise<void> {
    const operations = [];

    for (const ppe of ppeList) {
      const document = this.transformToDocument(ppe);
      
      operations.push(
        { index: { _index: this.index, _id: ppe.id } },
        document,
      );
    }

    await this.esService.getClient().bulk({
      body: operations,
    });

    await this.esService.refreshIndex(this.index);
  }

  /**
   * 更新 PPE 数据
   */
  async updatePpe(id: string, updates: any): Promise<void> {
    await this.esService.getClient().update({
      index: this.index,
      id,
      body: {
        doc: updates,
      },
    });

    await this.esService.refreshIndex(this.index);
  }

  /**
   * 删除 PPE 数据
   */
  async deletePpe(id: string): Promise<void> {
    await this.esService.getClient().delete({
      index: this.index,
      id,
    });
  }

  /**
   * 搜索 PPE
   */
  async search(options: SearchOptions): Promise<SearchResult> {
    const {
      query,
      filters = {},
      page = 1,
      limit = 20,
      sort,
      highlight = false,
      aggregations,
    } = options;

    const searchQuery: any = {
      index: this.index,
      from: (page - 1) * limit,
      size: limit,
      body: {
        query: this.buildQuery(query, filters),
      },
    };

    // 排序
    if (sort) {
      searchQuery.body.sort = sort;
    } else {
      // 默认按相关性排序
      searchQuery.body.sort = [{ _score: 'desc' }];
    }

    // 高亮
    if (highlight) {
      searchQuery.body.highlight = {
        fields: {
          name: {},
          description: {},
          manufacturer: {},
          fullText: {},
        },
        pre_tags: ['<mark>'],
        post_tags: ['</mark>'],
      };
    }

    // 聚合
    if (aggregations) {
      searchQuery.body.aggs = aggregations;
    }

    const response = await this.esService.getClient().search(searchQuery);

    return {
      hits: response.body.hits.hits.map(hit => ({
        id: hit._id,
        ...hit._source,
        highlight: hit.highlight,
      })),
      total: response.body.hits.total.value,
      aggregations: response.body.aggregations,
      took: response.body.took,
    };
  }

  /**
   * 自动补全搜索
   */
  async suggest(query: string, size: number = 5): Promise<string[]> {
    const response = await this.esService.getClient().search({
      index: this.index,
      body: {
        suggest: {
          nameSuggest: {
            prefix: query,
            completion: {
              field: 'name.suggest',
              size,
            },
          },
        },
      },
    });

    const suggestions = response.body.suggest.nameSuggest[0].options.map(
      (option: any) => option.text,
    );

    return suggestions;
  }

  /**
   * 获取搜索统计
   */
  async getSearchStats(): Promise<any> {
    const response = await this.esService.getClient().search({
      index: this.index,
      size: 0,
      body: {
        aggs: {
          categoryStats: {
            terms: { field: 'category' },
          },
          manufacturerStats: {
            terms: { field: 'manufacturer.keyword', size: 10 },
          },
          statusStats: {
            terms: { field: 'status' },
          },
          priceStats: {
            stats: { field: 'price' },
          },
          qualityScoreAvg: {
            avg: { field: 'qualityScore' },
          },
        },
      },
    });

    return response.body.aggregations;
  }

  /**
   * 构建查询
   */
  private buildQuery(query?: string, filters?: Record<string, any>): any {
    const must: any[] = [];
    const filter: any[] = [];

    // 全文搜索
    if (query) {
      must.push({
        multi_match: {
          query,
          fields: [
            'name^3',
            'description^2',
            'manufacturer^2',
            'model',
            'keywords',
            'fullText',
          ],
          fuzziness: 'AUTO',
        },
      });
    }

    // 过滤器
    if (filters) {
      // 分类过滤
      if (filters.category) {
        filter.push({
          term: { category: filters.category },
        });
      }

      // 子分类过滤
      if (filters.subcategory) {
        filter.push({
          term: { subcategory: filters.subcategory },
        });
      }

      // 企业类型过滤
      if (filters.type) {
        filter.push({
          term: { type: filters.type },
        });
      }

      // 制造商过滤
      if (filters.manufacturer) {
        filter.push({
          term: { manufacturerId: filters.manufacturer },
        });
      }

      // 标准过滤
      if (filters.standards) {
        filter.push({
          terms: { standards: filters.standards },
        });
      }

      // 使用场景过滤
      if (filters.usageScenarios) {
        filter.push({
          terms: { usageScenarios: filters.usageScenarios },
        });
      }

      // 保护等级过滤
      if (filters.protectionLevel) {
        filter.push({
          term: { protectionLevel: filters.protectionLevel },
        });
      }

      // 状态过滤
      if (filters.status) {
        filter.push({
          term: { status: filters.status },
        });
      }

      // 审批状态过滤
      if (filters.approvalStatus) {
        filter.push({
          term: { approvalStatus: filters.approvalStatus },
        });
      }

      // 价格范围
      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        const range: any = {};
        if (filters.minPrice !== undefined) {
          range.gte = filters.minPrice;
        }
        if (filters.maxPrice !== undefined) {
          range.lte = filters.maxPrice;
        }
        filter.push({ range: { price: range } });
      }

      // 质量评分范围
      if (filters.minQualityScore !== undefined) {
        filter.push({
          range: { qualityScore: { gte: filters.minQualityScore } },
        });
      }

      // 注册日期范围
      if (filters.registrationDateFrom || filters.registrationDateTo) {
        const range: any = {};
        if (filters.registrationDateFrom) {
          range.gte = filters.registrationDateFrom;
        }
        if (filters.registrationDateTo) {
          range.lte = filters.registrationDateTo;
        }
        filter.push({ range: { registrationDate: range } });
      }

      // 创建时间范围
      if (filters.createdAtFrom || filters.createdAtTo) {
        const range: any = {};
        if (filters.createdAtFrom) {
          range.gte = filters.createdAtFrom;
        }
        if (filters.createdAtTo) {
          range.lte = filters.createdAtTo;
        }
        filter.push({ range: { createdAt: range } });
      }
    }

    const boolQuery: any = {};
    if (must.length > 0) {
      boolQuery.must = must;
    }
    if (filter.length > 0) {
      boolQuery.filter = filter;
    }

    return { bool: boolQuery };
  }

  /**
   * 转换为 ES 文档
   */
  private transformToDocument(ppe: any): any {
    return {
      id: ppe.id,
      name: ppe.name,
      description: ppe.description,
      category: ppe.category,
      subcategory: ppe.subcategory,
      type: ppe.type,
      registrationNumber: ppe.registrationNumber,
      registrationDate: ppe.registrationDate,
      expiryDate: ppe.expiryDate,
      manufacturer: ppe.manufacturer,
      manufacturerId: ppe.manufacturerId,
      specifications: ppe.specifications,
      model: ppe.model,
      standards: ppe.standards,
      certificationMarks: ppe.certificationMarks,
      usageScenarios: ppe.usageScenarios,
      protectionLevel: ppe.protectionLevel,
      price: ppe.price,
      currency: ppe.currency,
      stock: ppe.stock,
      status: ppe.status,
      approvalStatus: ppe.approvalStatus,
      qualityScore: ppe.qualityScore,
      images: ppe.images,
      documents: ppe.documents,
      keywords: ppe.keywords,
      metadata: ppe.metadata,
      createdAt: ppe.createdAt,
      updatedAt: ppe.updatedAt,
      fullText: this.buildFullText(ppe),
    };
  }

  /**
   * 构建全文搜索字段
   */
  private buildFullText(ppe: any): string {
    const fields = [
      ppe.name,
      ppe.description,
      ppe.manufacturer,
      ppe.specifications,
      ppe.model,
      ...(ppe.keywords || []),
    ].filter(Boolean);

    return fields.join(' ');
  }
}
