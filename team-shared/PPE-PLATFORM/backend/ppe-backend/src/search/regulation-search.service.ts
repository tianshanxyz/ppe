import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from './elasticsearch.service';
import { REGULATION_INDEX_NAME, REGULATION_INDEX_MAPPING } from './index-config';

export interface RegulationSearchOptions {
  query?: string;
  filters?: {
    regulationType?: string;
    level?: string;
    issuingAgency?: string;
    status?: string;
    applicableFields?: string[];
    releaseDateFrom?: string;
    releaseDateTo?: string;
  };
  page?: number;
  limit?: number;
  sort?: Record<string, string>;
  highlight?: boolean;
}

export interface RegulationSearchResult {
  hits: any[];
  total: number;
  took: number;
}

@Injectable()
export class RegulationSearchService {
  private readonly index: string = REGULATION_INDEX_NAME;

  constructor(private readonly esService: ElasticsearchService) {}

  /**
   * 初始化索引
   */
  async initIndex(): Promise<void> {
    await this.esService.createIndex(this.index, REGULATION_INDEX_MAPPING);
  }

  /**
   * 索引法规数据
   */
  async indexRegulation(regulation: any): Promise<void> {
    const document = this.transformToDocument(regulation);
    
    await this.esService.getClient().index({
      index: this.index,
      id: regulation.id,
      body: document,
    });

    await this.esService.refreshIndex(this.index);
  }

  /**
   * 批量索引法规数据
   */
  async bulkIndexRegulations(regulations: any[]): Promise<void> {
    const operations = [];

    for (const regulation of regulations) {
      const document = this.transformToDocument(regulation);
      
      operations.push(
        { index: { _index: this.index, _id: regulation.id } },
        document,
      );
    }

    await this.esService.getClient().bulk({
      body: operations,
    });

    await this.esService.refreshIndex(this.index);
  }

  /**
   * 更新法规数据
   */
  async updateRegulation(id: string, updates: any): Promise<void> {
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
   * 删除法规数据
   */
  async deleteRegulation(id: string): Promise<void> {
    await this.esService.getClient().delete({
      index: this.index,
      id,
    });
  }

  /**
   * 搜索法规
   */
  async search(options: RegulationSearchOptions): Promise<RegulationSearchResult> {
    const {
      query,
      filters = {},
      page = 1,
      limit = 20,
      sort,
      highlight = false,
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
          title: {},
          content: {},
        },
        pre_tags: ['<mark>'],
        post_tags: ['</mark>'],
      };
    }

    const response = await this.esService.getClient().search(searchQuery);

    return {
      hits: response.body.hits.hits.map(hit => ({
        id: hit._id,
        ...hit._source,
        highlight: hit.highlight,
      })),
      total: response.body.hits.total.value,
      took: response.body.took,
    };
  }

  /**
   * 自动补全
   */
  async suggest(query: string, size: number = 5): Promise<string[]> {
    const response = await this.esService.getClient().search({
      index: this.index,
      body: {
        suggest: {
          titleSuggest: {
            prefix: query,
            completion: {
              field: 'title.suggest',
              size,
            },
          },
        },
      },
    });

    const suggestions = response.body.suggest.titleSuggest[0].options.map(
      (option: any) => option.text,
    );

    return suggestions;
  }

  /**
   * 获取统计信息
   */
  async getSearchStats(): Promise<any> {
    const response = await this.esService.getClient().search({
      index: this.index,
      size: 0,
      body: {
        aggs: {
          typeStats: {
            terms: { field: 'regulationType' },
          },
          levelStats: {
            terms: { field: 'level' },
          },
          agencyStats: {
            terms: { field: 'issuingAgency', size: 10 },
          },
          statusStats: {
            terms: { field: 'status' },
          },
          fieldStats: {
            terms: { field: 'applicableFields' },
          },
        },
      },
    });

    return response.body.aggregations;
  }

  /**
   * 构建查询
   */
  private buildQuery(query?: string, filters?: any): any {
    const must: any[] = [];
    const filter: any[] = [];

    // 全文搜索
    if (query) {
      must.push({
        multi_match: {
          query,
          fields: [
            'title^3',
            'content^2',
            'documentNumber',
            'keywords',
            'fullText',
          ],
          fuzziness: 'AUTO',
        },
      });
    }

    // 过滤器
    if (filters) {
      if (filters.regulationType) {
        filter.push({ term: { regulationType: filters.regulationType } });
      }

      if (filters.level) {
        filter.push({ term: { level: filters.level } });
      }

      if (filters.issuingAgency) {
        filter.push({ term: { issuingAgency: filters.issuingAgency } });
      }

      if (filters.status) {
        filter.push({ term: { status: filters.status } });
      }

      if (filters.applicableFields && filters.applicableFields.length > 0) {
        filter.push({
          terms: { applicableFields: filters.applicableFields },
        });
      }

      // 发布日期范围
      if (filters.releaseDateFrom || filters.releaseDateTo) {
        const range: any = {};
        if (filters.releaseDateFrom) {
          range.gte = filters.releaseDateFrom;
        }
        if (filters.releaseDateTo) {
          range.lte = filters.releaseDateTo;
        }
        filter.push({ range: { releaseDate: range } });
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
  private transformToDocument(regulation: any): any {
    return {
      id: regulation.id,
      title: regulation.title,
      content: regulation.content,
      regulationType: regulation.regulationType,
      level: regulation.level,
      issuingAgency: regulation.issuingAgency,
      documentNumber: regulation.documentNumber,
      releaseDate: regulation.releaseDate,
      implementationDate: regulation.implementationDate,
      status: regulation.status,
      applicableFields: regulation.applicableFields,
      keywords: regulation.keywords,
      createdAt: regulation.createdAt,
      updatedAt: regulation.updatedAt,
      fullText: this.buildFullText(regulation),
    };
  }

  /**
   * 构建全文搜索字段
   */
  private buildFullText(regulation: any): string {
    const fields = [
      regulation.title,
      regulation.content,
      regulation.documentNumber,
      ...(regulation.keywords || []),
    ].filter(Boolean);

    return fields.join(' ');
  }
}
