/**
 * Medplum 搜索服务
 * 
 * 提供基于Medplum API的医疗器械搜索功能
 */

import { getMedplumClient, isMedplumEnabled } from './client';

/**
 * 搜索参数接口
 */
export interface SearchParams {
  query: string;
  market?: 'FDA' | 'CE' | 'NMPA' | 'All';
  type?: string;
  status?: 'active' | 'expired' | 'all';
  limit?: number;
  offset?: number;
}

/**
 * 搜索结果接口
 */
export interface SearchResult {
  id: string;
  name: string;
  type: string;
  market: string;
  status: 'active' | 'expired' | 'unknown';
  regulatoryId?: string;
  manufacturer?: string;
 有效期?: {
    start: string;
    end: string;
  };
  dataSource: 'Medplum' | 'FDA' | 'EUDAMED' | 'NMPA';
  score?: number;
}

/**
 * 搜索响应接口
 */
export interface SearchResponse {
  results: SearchResult[];
  total: number;
  offset: number;
  limit: number;
}

/**
 * 搜索医疗器械
 */
export async function searchDevices(params: SearchParams): Promise<SearchResponse> {
  if (!isMedplumEnabled('search')) {
    return {
      results: [],
      total: 0,
      offset: params.offset || 0,
      limit: params.limit || 20,
    };
  }

  const client = getMedplumClient();
  const { query, market, type, status, limit = 20, offset = 0 } = params;

  try {
    // 构建搜索参数
    const searchParams: Record<string, any> = {
      _count: limit.toString(),
      _offset: offset.toString(),
    };

    // 添加搜索关键词
    if (query) {
      searchParams.name = query;
    }

    // 添加市场筛选
    if (market && market !== 'All') {
      searchParams.market = market;
    }

    // 添加类型筛选
    if (type) {
      searchParams.type = type;
    }

    // 调用Medplum API搜索Device资源
    const devices = await client.searchResources('Device', searchParams);

    // 转换结果
    const results: SearchResult[] = (devices as any[] || []).map((device: unknown) => ({
      id: device.id || device.resourceType + '-' + Math.random(),
      name: device.name?.[0]?.text || device.name || 'Unknown Device',
      type: device.type?.[0]?.text || device.type || 'Unknown Type',
      market: device.market || 'Unknown',
      status: device.status as 'active' | 'expired' | 'unknown' || 'unknown',
      regulatoryId: device.identifier?.[0]?.value,
      manufacturer: device.manufacturer?.display || device.manufacturer,
      有效期: device.validityPeriod ? {
        start: device.validityPeriod.start || '',
        end: device.validityPeriod.end || '',
      } : undefined,
      dataSource: 'Medplum',
      score: device.score,
    }));

    return {
      results,
      total: (devices as any).total || results.length,
      offset,
      limit,
    };
  } catch (error) {
    console.error('Medplum search error:', error);
    // 降级到本地搜索
    return {
      results: [],
      total: 0,
      offset,
      limit,
    };
  }
}

/**
 * 搜索企业
 */
export async function searchOrganizations(params: SearchParams): Promise<SearchResponse> {
  if (!isMedplumEnabled('search')) {
    return {
      results: [],
      total: 0,
      offset: params.offset || 0,
      limit: params.limit || 20,
    };
  }

  const client = getMedplumClient();
  const { query, limit = 20, offset = 0 } = params;

  try {
    // 构建搜索参数
    const searchParams: Record<string, any> = {
      _count: limit.toString(),
      _offset: offset.toString(),
    };

    // 添加搜索关键词
    if (query) {
      searchParams.name = query;
    }

    // 调用Medplum API搜索Organization资源
    const organizations = await client.searchResources('Organization', searchParams);

    // 转换结果
    const results: SearchResult[] = (organizations as any[] || []).map((org: unknown) => ({
      id: org.id || org.resourceType + '-' + Math.random(),
      name: org.name || 'Unknown Organization',
      type: org.type?.[0]?.text || 'Unknown Type',
      market: 'Global',
      status: 'active',
      manufacturer: org.name,
      dataSource: 'Medplum',
      score: org.score,
    }));

    return {
      results,
      total: (organizations as any).total || results.length,
      offset,
      limit,
    };
  } catch (error) {
    console.error('Medplum organization search error:', error);
    return {
      results: [],
      total: 0,
      offset,
      limit,
    };
  }
}

/**
 * 搜索注册认证
 */
export async function searchRegulatoryAuthorizations(params: SearchParams): Promise<SearchResponse> {
  if (!isMedplumEnabled('search')) {
    return {
      results: [],
      total: 0,
      offset: params.offset || 0,
      limit: params.limit || 20,
    };
  }

  const client = getMedplumClient();
  const { query, market, status, limit = 20, offset = 0 } = params;

  try {
    // 构建搜索参数
    const searchParams: Record<string, any> = {
      _count: limit.toString(),
      _offset: offset.toString(),
    };

    // 添加搜索关键词
    if (query) {
      searchParams.identifier = query;
    }

    // 添加市场筛选
    if (market && market !== 'All') {
      searchParams.market = market;
    }

    // 添加状态筛选
    if (status && status !== 'all') {
      searchParams.status = status;
    }

    // 调用 Medplum API 搜索 RegulatoryAuthorization 资源（使用 Device 资源类型作为替代）
    const authorizations = await client.searchResources('Device', searchParams);

    // 转换结果
    const results: SearchResult[] = (authorizations as any[] || []).map((auth: unknown) => ({
      id: auth.id || auth.resourceType + '-' + Math.random(),
      name: auth.name || 'Unknown Authorization',
      type: auth.type?.[0]?.text || 'Unknown Type',
      market: auth.market || 'Unknown',
      status: auth.status as 'active' | 'expired' | 'unknown' || 'unknown',
      regulatoryId: auth.identifier?.[0]?.value,
      有效期: auth.validityPeriod ? {
        start: auth.validityPeriod.start || '',
        end: auth.validityPeriod.end || '',
      } : undefined,
      dataSource: 'Medplum',
      score: auth.score,
    }));

    return {
      results,
      total: (authorizations as any).total || results.length,
      offset,
      limit,
    };
  } catch (error) {
    console.error('Medplum regulatory search error:', error);
    return {
      results: [],
      total: 0,
      offset,
      limit,
    };
  }
}

/**
 * 综合搜索
 * 同时搜索Device、Organization和RegulatoryAuthorization
 */
export async function searchAll(params: SearchParams): Promise<SearchResponse> {
  if (!isMedplumEnabled('search')) {
    return {
      results: [],
      total: 0,
      offset: params.offset || 0,
      limit: params.limit || 20,
    };
  }

  try {
    // 并行搜索
    const [devices, organizations, authorizations] = await Promise.all([
      searchDevices(params),
      searchOrganizations(params),
      searchRegulatoryAuthorizations(params),
    ]);

    // 合并结果
    const allResults = [
      ...devices.results,
      ...organizations.results,
      ...authorizations.results,
    ];

    // 按分数排序
    allResults.sort((a, b) => (b.score || 0) - (a.score || 0));

    // 截取指定数量
    const limitedResults = allResults.slice(0, params.limit || 20);

    return {
      results: limitedResults,
      total: allResults.length,
      offset: params.offset || 0,
      limit: params.limit || 20,
    };
  } catch (error) {
    console.error('Medplum search all error:', error);
    return {
      results: [],
      total: 0,
      offset: params.offset || 0,
      limit: params.limit || 20,
    };
  }
}

export default {
  searchDevices,
  searchOrganizations,
  searchRegulatoryAuthorizations,
  searchAll,
};
