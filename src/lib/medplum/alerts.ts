/**
 * Medplum 预警服务
 * 
 * 提供基于Medplum API的医疗器械注册证有效期预警功能
 */

import { getMedplumClient, isMedplumEnabled } from './client';

/**
 * 预警参数接口
 */
export interface AlertParams {
  days?: number; // 提前预警天数
  status?: 'active' | 'expired' | 'all';
  market?: 'FDA' | 'CE' | 'NMPA' | 'All';
  limit?: number;
  offset?: number;
}

/**
 * 预警结果接口
 */
export interface AlertResult {
  id: string;
  name: string;
  regulatoryId: string;
  market: string;
  status: 'active' | 'expired' | 'expiring';
  expiryDate: string;
  daysUntilExpiry: number;
  manufacturer?: string;
  dataSource: 'Medplum' | 'FDA' | 'EUDAMED' | 'NMPA';
  url?: string;
}

/**
 * 预警响应接口
 */
export interface AlertResponse {
  alerts: AlertResult[];
  total: number;
  offset: number;
  limit: number;
}

/**
 * 获取过期预警
 */
export async function getExpiryAlerts(params: AlertParams): Promise<AlertResponse> {
  if (!isMedplumEnabled('alerts')) {
    return {
      alerts: [],
      total: 0,
      offset: params.offset || 0,
      limit: params.limit || 50,
    };
  }

  const client = getMedplumClient();
  const { days = 30, status = 'all', market, limit = 50, offset = 0 } = params;

  try {
    // 计算日期范围
    const today = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(today.getDate() + days);

    // 构建搜索参数
    const searchParams: Record<string, any> = {
      _count: limit.toString(),
      _offset: offset.toString(),
    };

    // 添加状态筛选
    if (status !== 'all') {
      searchParams.status = status;
    }

    // 添加市场筛选
    if (market && market !== 'All') {
      searchParams.market = market;
    }

    // 搜索 RegulatoryAuthorization 资源（使用 Device 资源类型作为替代）
    const authorizations = await client.searchResources('Device', searchParams);

    // 转换和过滤结果
    const alerts: AlertResult[] = (authorizations as any[] || [])
      .filter((auth: unknown) => {
        if (!auth.validityPeriod || !auth.validityPeriod.end) {
          return false;
        }

        const endDate = new Date(auth.validityPeriod.end);
        const daysUntil = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // 只保留在预警范围内的
        return daysUntil <= days && daysUntil >= -30; // 包括已过期30天内的
      })
      .map((auth: unknown) => {
        const endDate = new Date(auth.validityPeriod.end);
        const daysUntil = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

        return {
          id: auth.id || auth.resourceType + '-' + Math.random(),
          name: auth.name || 'Unknown Authorization',
          regulatoryId: auth.identifier?.[0]?.value || 'Unknown ID',
          market: auth.market || 'Unknown',
          status: daysUntil < 0 ? 'expired' : daysUntil <= 30 ? 'expiring' : 'active',
          expiryDate: auth.validityPeriod.end || '',
          daysUntilExpiry: daysUntil,
          manufacturer: auth.manufacturer?.display || auth.manufacturer,
          dataSource: 'Medplum',
          url: auth.url,
        };
      });

    return {
      alerts,
      total: alerts.length,
      offset,
      limit,
    };
  } catch (error) {
    console.error('Medplum alerts error:', error);
    return {
      alerts: [],
      total: 0,
      offset,
      limit,
    };
  }
}

/**
 * 获取特定产品的预警
 */
export async function getProductAlerts(productId: string): Promise<AlertResult[]> {
  if (!isMedplumEnabled('alerts')) {
    return [];
  }

  const client = getMedplumClient();

  try {
    // 搜索与产品相关的 RegulatoryAuthorization（使用 Device 资源类型作为替代）
    const authorizations = await client.searchResources('Device', {
      product: productId,
    });

    // 转换结果
    const alerts: AlertResult[] = (authorizations as any[] || [])
      .filter((auth: unknown) => auth.validityPeriod && auth.validityPeriod.end)
      .map((auth: unknown) => {
        const endDate = new Date(auth.validityPeriod.end);
        const daysUntil = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

        return {
          id: auth.id || auth.resourceType + '-' + Math.random(),
          name: auth.name || 'Unknown Authorization',
          regulatoryId: auth.identifier?.[0]?.value || 'Unknown ID',
          market: auth.market || 'Unknown',
          status: daysUntil < 0 ? 'expired' : daysUntil <= 30 ? 'expiring' : 'active',
          expiryDate: auth.validityPeriod.end || '',
          daysUntilExpiry: daysUntil,
          manufacturer: auth.manufacturer?.display || auth.manufacturer,
          dataSource: 'Medplum',
          url: auth.url,
        };
      });

    return alerts;
  } catch (error) {
    console.error('Medplum product alerts error:', error);
    return [];
  }
}

/**
 * 检查特定注册证是否即将过期
 */
export async function checkExpiry(regulatoryId: string): Promise<AlertResult | null> {
  if (!isMedplumEnabled('alerts')) {
    return null;
  }

  const client = getMedplumClient();

  try {
    // 搜索特定注册证（使用 Device 资源类型作为替代）
    const authorizations = await client.searchResources('Device', {
      identifier: regulatoryId,
    });

    if (!authorizations || (authorizations as any).length === 0) {
      return null;
    }

    const auth = (authorizations as any)[0];
    
    if (!auth.validityPeriod || !auth.validityPeriod.end) {
      return null;
    }

    const endDate = new Date(auth.validityPeriod.end);
    const daysUntil = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return {
      id: auth.id || auth.resourceType + '-' + Math.random(),
      name: auth.name || 'Unknown Authorization',
      regulatoryId: auth.identifier?.[0]?.value || regulatoryId,
      market: auth.market || 'Unknown',
      status: daysUntil < 0 ? 'expired' : daysUntil <= 30 ? 'expiring' : 'active',
      expiryDate: auth.validityPeriod.end || '',
      daysUntilExpiry: daysUntil,
      manufacturer: auth.manufacturer?.display || auth.manufacturer,
      dataSource: 'Medplum',
      url: auth.url,
    };
  } catch (error) {
    console.error('Medplum expiry check error:', error);
    return null;
  }
}

/**
 * 获取过期统计
 */
export async function getExpiryStats(): Promise<{
  total: number;
  expiring: number;
  expired: number;
  active: number;
}> {
  if (!isMedplumEnabled('alerts')) {
    return {
      total: 0,
      expiring: 0,
      expired: 0,
      active: 0,
    };
  }

  const client = getMedplumClient();

  try {
    // 搜索所有 RegulatoryAuthorization（使用 Device 资源类型作为替代）
    const authorizations = await client.searchResources('Device', {
      _count: '1000',
    });

    const today = new Date();
    let total = 0;
    let expiring = 0;
    let expired = 0;
    let active = 0;

    (authorizations as any[] || []).forEach((auth: unknown) => {
      if (!auth.validityPeriod || !auth.validityPeriod.end) {
        return;
      }

      total++;
      const endDate = new Date(auth.validityPeriod.end);
      const daysUntil = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil < 0) {
        expired++;
      } else if (daysUntil <= 30) {
        expiring++;
      } else {
        active++;
      }
    });

    return {
      total,
      expiring,
      expired,
      active,
    };
  } catch (error) {
    console.error('Medplum expiry stats error:', error);
    return {
      total: 0,
      expiring: 0,
      expired: 0,
      active: 0,
    };
  }
}

export default {
  getExpiryAlerts,
  getProductAlerts,
  checkExpiry,
  getExpiryStats,
};
