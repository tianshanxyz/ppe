/**
 * Medplum 预警 API
 * 
 * 提供基于Medplum的医疗器械注册证有效期预警功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { getExpiryAlerts, getExpiryStats, checkExpiry, getProductAlerts } from '@/lib/medplum/alerts';
import { validatePagination } from '@/lib/security/sanitize';
import { withRateLimit } from '@/lib/middleware/rateLimit';

/**
 * GET /api/medplum/alerts
 * 获取过期预警
 */
export async function GET(request: NextRequest) {
  return withRateLimit(async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    
    const days = parseInt(searchParams.get('days') || '30', 10);
    const market = searchParams.get('market') || 'All';
    const status = searchParams.get('status') || 'all';
    const productId = searchParams.get('productId');
    const regulatoryId = searchParams.get('regulatoryId');
    const stats = searchParams.get('stats') === 'true';
    
    // 验证分页参数
    const pagination = validatePagination(
      searchParams.get('page') || undefined,
      searchParams.get('limit') || undefined
    );
    
    if (!pagination.valid) {
      return NextResponse.json(
        { error: pagination.error || 'Invalid pagination parameters' },
        { status: 400 }
      );
    }
    
    try {
      let results;
      
      // 获取统计信息
      if (stats) {
        results = await getExpiryStats();
      }
      // 检查特定注册证
      else if (regulatoryId) {
        results = await checkExpiry(regulatoryId);
      }
      // 获取特定产品的预警
      else if (productId) {
        results = await getProductAlerts(productId);
      }
      // 获取一般预警
      else {
        results = await getExpiryAlerts({
          days,
          market: market as any,
          status: status as any,
          limit: pagination.limit,
          offset: (pagination.page - 1) * pagination.limit,
        });
      }
      
      return NextResponse.json({
        success: true,
        data: results,
      });
    } catch (error) {
      console.error('Medplum alerts error:', error);
      return NextResponse.json(
        { success: false, error: 'Alerts failed' },
        { status: 500 }
      );
    }
  }, {
    maxRequests: 30,
    windowInSeconds: 60,
    enableAuthBoost: true,
    authBoostMultiplier: 2,
  })(request);
}
