import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from './elasticsearch.service';
import { COMPANY_INDEX_NAME, COMPANY_INDEX_MAPPING } from './index-config';

export interface CompanySearchOptions {
  query?: string;
  filters?: {
    companyType?: string;
    province?: string;
    city?: string;
    status?: string;
    certifications?: string[];
    minRegisteredCapital?: number;
    maxRegisteredCapital?: number;
    minProductCount?: number;
    minQualityScore?: number;
  };
  page?: number;
  limit?: number;
  sort?: Record<string, string>;
  highlight?: boolean;
}

export interface CompanySearchResult {
  hits: any[];
  total: number;
  took: number;
}

@Injectable()
export class CompanySearchService {
  private readonly index: string = COMPANY_INDEX_NAME;

  constructor(private readonly esService: ElasticsearchService) {}

  /**
   * 初始化索引
   */
  async initIndex(): Promise<void> {
    await this.esService.createIndex(this.index, COMPANY_INDEX_MAPPING);
  }

  /**
   * 索引企业数据
   */
  async indexCompany(company: any): Promise<void> {
    const document = this.transformToDocument(company);
    
    await this.esService.getClient().index({
      index: this.index,
      id: company.id,
      body: document,
    });

    await this.esService.refreshIndex(this.index);
  }

  /**
   * 批量索引企业数据
   */
  async bulkIndexCompanies(companies: any[]): Promise<void> {
    const operations = [];

    for (const company of companies) {
      const document = this.transformToDocument(company);
      
      operations.push(
        { index: { _index: this.index, _id: company.id } },
        document,
      );
    }

    await this.esService.getClient().bulk({
      body: operations,
    });

    await this.esService.refreshIndex(this.index);
  }

  /**
   * 更新企业数据
   */
  async updateCompany(id: string, updates: any): Promise<void> {
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
   * 删除企业数据
   */
  async deleteCompany(id: string): Promise<void> {
    await this.esService.getClient().delete({
      index: this.index,
      id,
    });
  }

  /**
   * 搜索企业
   */
  async search(options: CompanySearchOptions): Promise<CompanySearchResult> {
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
      searchQuery.body.sort = [{ _score: 'desc' }];
    }

    // 高亮
    if (highlight) {
      searchQuery.body.highlight = {
        fields: {
          name: {},
          businessScope: {},
          address: {},
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
   * 获取统计信息
   */
  async getSearchStats(): Promise<any> {
    const response = await this.esService.getClient().search({
      index: this.index,
      size: 0,
      body: {
        aggs: {
          typeStats: {
            terms: { field: 'companyType' },
          },
          provinceStats: {
            terms: { field: 'province', size: 31 },
          },
          cityStats: {
            terms: { field: 'city', size: 50 },
          },
          statusStats: {
            terms: { field: 'status' },
          },
          certificationStats: {
            terms: { field: 'certifications' },
          },
          capitalStats: {
            stats: { field: 'registeredCapital' },
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
  private buildQuery(query?: string, filters?: any): any {
    const must: any[] = [];
    const filter: any[] = [];

    // 全文搜索
    if (query) {
      must.push({
        multi_match: {
          query,
          fields: [
            'name^3',
            'businessScope^2',
            'address',
            'fullText',
          ],
          fuzziness: 'AUTO',
        },
      });
    }

    // 过滤器
    if (filters) {
      if (filters.companyType) {
        filter.push({ term: { companyType: filters.companyType } });
      }

      if (filters.province) {
        filter.push({ term: { province: filters.province } });
      }

      if (filters.city) {
        filter.push({ term: { city: filters.city } });
      }

      if (filters.status) {
        filter.push({ term: { status: filters.status } });
      }

      if (filters.certifications && filters.certifications.length > 0) {
        filter.push({
          terms: { certifications: filters.certifications },
        });
      }

      // 注册资本范围
      if (filters.minRegisteredCapital !== undefined || filters.maxRegisteredCapital !== undefined) {
        const range: any = {};
        if (filters.minRegisteredCapital !== undefined) {
          range.gte = filters.minRegisteredCapital;
        }
        if (filters.maxRegisteredCapital !== undefined) {
          range.lte = filters.maxRegisteredCapital;
        }
        filter.push({ range: { registeredCapital: range } });
      }

      // 产品数量
      if (filters.minProductCount !== undefined) {
        filter.push({
          range: { productCount: { gte: filters.minProductCount } },
        });
      }

      // 质量评分
      if (filters.minQualityScore !== undefined) {
        filter.push({
          range: { qualityScore: { gte: filters.minQualityScore } },
        });
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
  private transformToDocument(company: any): any {
    return {
      id: company.id,
      name: company.name,
      companyType: company.companyType,
      creditCode: company.creditCode,
      registrationDate: company.registrationDate,
      registeredCapital: company.registeredCapital,
      address: company.address,
      province: company.province,
      city: company.city,
      phone: company.phone,
      email: company.email,
      website: company.website,
      businessScope: company.businessScope,
      status: company.status,
      certifications: company.certifications,
      productCount: company.productCount,
      qualityScore: company.qualityScore,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      fullText: this.buildFullText(company),
    };
  }

  /**
   * 构建全文搜索字段
   */
  private buildFullText(company: any): string {
    const fields = [
      company.name,
      company.businessScope,
      company.address,
      company.creditCode,
      ...(company.certifications || []),
    ].filter(Boolean);

    return fields.join(' ');
  }
}
