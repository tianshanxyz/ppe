/**
 * Medplum 法规跟踪服务
 * 
 * 提供基于Medplum API的全球医疗器械法规变更跟踪功能
 */

import { getMedplumClient, isMedplumEnabled } from './client';

/**
 * 法规搜索参数接口
 */
export interface RegulatoryParams {
  query?: string;
  market?: 'FDA' | 'CE' | 'NMPA' | 'All';
  type?: string;
  status?: 'active' | 'draft' | 'retired';
  limit?: number;
  offset?: number;
  sort?: 'date' | 'relevance';
}

/**
 * 法规结果接口
 */
export interface RegulatoryResult {
  id: string;
  title: string;
  market: string;
  type: string;
  status: 'active' | 'draft' | 'retired';
  effectiveDate?: string;
  publicationDate?: string;
  description?: string;
  url?: string;
  impact?: 'low' | 'medium' | 'high';
  dataSource: 'Medplum' | 'FDA' | 'EUDAMED' | 'NMPA';
  score?: number;
}

/**
 * 法规响应接口
 */
export interface RegulatoryResponse {
  regulations: RegulatoryResult[];
  total: number;
  offset: number;
  limit: number;
}

/**
 * 搜索法规
 */
export async function searchRegulations(params: RegulatoryParams): Promise<RegulatoryResponse> {
  if (!isMedplumEnabled('regulatory')) {
    return {
      regulations: [],
      total: 0,
      offset: params.offset || 0,
      limit: params.limit || 20,
    };
  }

  const client = getMedplumClient();
  const { query, market, type, status, limit = 20, offset = 0, sort = 'date' } = params;

  try {
    // 构建搜索参数
    const searchParams: Record<string, any> = {
      _count: limit.toString(),
      _offset: offset.toString(),
    };

    // 添加搜索关键词
    if (query) {
      searchParams.title = query;
    }

    // 添加市场筛选
    if (market && market !== 'All') {
      searchParams.market = market;
    }

    // 添加类型筛选
    if (type) {
      searchParams.type = type;
    }

    // 添加状态筛选
    if (status) {
      searchParams.status = status;
    }

    // 添加排序
    if (sort === 'date') {
      searchParams._sort = '-effectiveDate';
    }

    // 调用 Medplum API 搜索 RegulatoryPolicy 资源（使用 Device 资源类型作为替代）
    const regulations = await client.searchResources('Device', searchParams);

    // 转换结果
    const results: RegulatoryResult[] = (regulations as any[] || []).map((reg: any) => ({
      id: reg.id || reg.resourceType + '-' + Math.random(),
      title: reg.title || 'Unknown Regulation',
      market: reg.market || 'Unknown',
      type: reg.type?.[0]?.text || reg.type || 'Unknown Type',
      status: reg.status as 'active' | 'draft' | 'retired' || 'active',
      effectiveDate: reg.effectiveDate,
      publicationDate: reg.date,
      description: reg.description,
      url: reg.url,
      impact: reg.impact as 'low' | 'medium' | 'high' || 'medium',
      dataSource: 'Medplum',
      score: reg.score,
    }));

    return {
      regulations: results,
      total: (regulations as any).total || results.length,
      offset,
      limit,
    };
  } catch (error) {
    console.error('Medplum regulatory search error:', error);
    return {
      regulations: [],
      total: 0,
      offset,
      limit,
    };
  }
}

/**
 * 获取最新法规变更
 */
export async function getLatestChanges(days: number = 30): Promise<RegulatoryResult[]> {
  if (!isMedplumEnabled('regulatory')) {
    return [];
  }

  const client = getMedplumClient();

  try {
    // 计算日期范围
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - days);

    // 构建搜索参数
    const searchParams: Record<string, any> = {
      _count: '50',
      _sort: '-date',
      date: `ge${startDate.toISOString().split('T')[0]}`,
    };

    // 调用 Medplum API 搜索 RegulatoryPolicy 资源（使用 Device 资源类型作为替代）
    const regulations = await client.searchResources('Device', searchParams);

    // 转换结果
    const results: RegulatoryResult[] = (regulations as any[] || []).map((reg: any) => ({
      id: reg.id || reg.resourceType + '-' + Math.random(),
      title: reg.title || 'Unknown Regulation',
      market: reg.market || 'Unknown',
      type: reg.type?.[0]?.text || reg.type || 'Unknown Type',
      status: reg.status as 'active' | 'draft' | 'retired' || 'active',
      effectiveDate: reg.effectiveDate,
      publicationDate: reg.date,
      description: reg.description,
      url: reg.url,
      impact: reg.impact as 'low' | 'medium' | 'high' || 'medium',
      dataSource: 'Medplum',
    }));

    return results;
  } catch (error) {
    console.error('Medplum latest changes error:', error);
    return [];
  }
}

/**
 * 获取特定市场的法规
 */
export async function getMarketRegulations(market: 'FDA' | 'CE' | 'NMPA'): Promise<RegulatoryResult[]> {
  if (!isMedplumEnabled('regulatory')) {
    return [];
  }

  const client = getMedplumClient();

  try {
    // 构建搜索参数
    const searchParams: Record<string, any> = {
      _count: '100',
      _sort: '-effectiveDate',
      market: market,
      status: 'active',
    };

    // 调用 Medplum API 搜索 RegulatoryPolicy 资源（使用 Device 资源类型作为替代）
    const regulations = await client.searchResources('Device', searchParams);

    // 转换结果
    const results: RegulatoryResult[] = (regulations as any[] || []).map((reg: any) => ({
      id: reg.id || reg.resourceType + '-' + Math.random(),
      title: reg.title || 'Unknown Regulation',
      market: reg.market || market,
      type: reg.type?.[0]?.text || reg.type || 'Unknown Type',
      status: reg.status as 'active' | 'draft' | 'retired' || 'active',
      effectiveDate: reg.effectiveDate,
      publicationDate: reg.date,
      description: reg.description,
      url: reg.url,
      impact: reg.impact as 'low' | 'medium' | 'high' || 'medium',
      dataSource: 'Medplum',
    }));

    return results;
  } catch (error) {
    console.error(`Medplum ${market} regulations error:`, error);
    return [];
  }
}

/**
 * 获取法规详情
 */
export async function getRegulationDetail(regulationId: string): Promise<RegulatoryResult | null> {
  if (!isMedplumEnabled('regulatory')) {
    return null;
  }

  const client = getMedplumClient();

  try {
    // 调用 Medplum API 获取 RegulatoryPolicy 详情（使用 Device 资源类型作为替代）
    const regulation = await client.readResource('Device', regulationId);

    if (!regulation) {
      return null;
    }

    return {
      id: (regulation as any).id || (regulation as any).resourceType + '-' + Math.random(),
      title: (regulation as any).title || 'Unknown Regulation',
      market: (regulation as any).market || 'Unknown',
      type: (regulation as any).type?.[0]?.text || (regulation as any).type || 'Unknown Type',
      status: (regulation as any).status as 'active' | 'draft' | 'retired' || 'active',
      effectiveDate: (regulation as any).effectiveDate,
      publicationDate: (regulation as any).date,
      description: (regulation as any).description,
      url: (regulation as any).url,
      impact: (regulation as any).impact as 'low' | 'medium' | 'high' || 'medium',
      dataSource: 'Medplum',
    };
  } catch (error) {
    console.error('Medplum regulation detail error:', error);
    return null;
  }
}

/**
 * 获取法规影响分析
 */
export async function getRegulationImpact(regulationId: string): Promise<{
  impact: 'low' | 'medium' | 'high';
  affectedProducts: number;
  description: string;
} | null> {
  if (!isMedplumEnabled('regulatory')) {
    return null;
  }

  const client = getMedplumClient();

  try {
    // 调用 Medplum API 获取 RegulatoryPolicy 详情（使用 Device 资源类型作为替代）
    const regulation = await client.readResource('Device', regulationId);

    if (!regulation) {
      return null;
    }

    // 模拟影响分析
    return {
      impact: (regulation as any).impact as 'low' | 'medium' | 'high' || 'medium',
      affectedProducts: Math.floor(Math.random() * 1000) + 100,
      description: (regulation as any).description || 'No impact analysis available',
    };
  } catch (error) {
    console.error('Medplum regulation impact error:', error);
    return null;
  }
}

export default {
  searchRegulations,
  getLatestChanges,
  getMarketRegulations,
  getRegulationDetail,
  getRegulationImpact,
};
