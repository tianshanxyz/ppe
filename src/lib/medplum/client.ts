/**
 * Medplum 客户端配置
 * 
 * 用于初始化和管理 Medplum API 客户端
 */

import { MedplumClient } from '@medplum/core';
import { NextRequest, NextResponse } from 'next/server';

let medplumClient: MedplumClient | null = null;

/**
 * 初始化 Medplum 客户端
 */
export function initMedplumClient(): MedplumClient {
  if (medplumClient) {
    return medplumClient;
  }

  const client = new MedplumClient({
    baseUrl: process.env.MEDPLUM_BASE_URL || 'https://api.medplum.com',
    clientId: process.env.MEDPLUM_CLIENT_ID,
    clientSecret: process.env.MEDPLUM_CLIENT_SECRET,
  });

  medplumClient = client;
  return client;
}

/**
 * 获取 Medplum 客户端实例
 */
export function getMedplumClient(): MedplumClient {
  if (!medplumClient) {
    return initMedplumClient();
  }
  return medplumClient;
}

/**
 * 检查 Medplum 配置是否有效
 */
export function isMedplumConfigured(): boolean {
  return !!(process.env.MEDPLUM_CLIENT_ID && process.env.MEDPLUM_CLIENT_SECRET);
}

/**
 * 检查 Medplum 功能是否启用
 */
export function isMedplumEnabled(feature?: keyof typeof featureFlags): boolean {
  if (!isMedplumConfigured()) {
    return false;
  }

  if (!feature) {
    return process.env.MEDPLUM_ENABLED === 'true';
  }

  return featureFlags[feature];
}

/**
 * Medplum 认证中间件
 */
export async function withMedplumAuth(
  handler: (request: NextRequest, client: MedplumClient) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    if (!isMedplumConfigured()) {
      return NextResponse.json(
        { error: 'Medplum not configured' },
        { status: 503 }
      );
    }

    const client = getMedplumClient();
    
    try {
      // 验证认证状态
      if (!client.isAuthenticated()) {
        throw new Error('Not authenticated');
      }
      return await handler(request, client);
    } catch (error) {
      console.error('Medplum authentication failed:', error);
      return NextResponse.json(
        { error: 'Medplum authentication failed' },
        { status: 401 }
      );
    }
  };
}

// 功能开关
const featureFlags = {
  search: process.env.MEDPLUM_SEARCH_ENABLED === 'true',
  alerts: process.env.MEDPLUM_ALERTS_ENABLED === 'true',
  regulatory: process.env.MEDPLUM_REGULATORY_ENABLED === 'true',
};

export default {
  initMedplumClient,
  getMedplumClient,
  isMedplumConfigured,
  isMedplumEnabled,
  withMedplumAuth,
};
