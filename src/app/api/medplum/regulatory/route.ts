/**
 * Medplum 法规 API
 * 
 * 提供基于Medplum的全球医疗器械法规变更跟踪功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchRegulations, getLatestChanges, getMarketRegulations, getRegulationDetail, getRegulationImpact } from '@/lib/medplum/regulatory';
import { validatePagination } from '@/lib/security/sanitize';
import { withRateLimit } from '@/lib/middleware/rateLimit';

/**
 * GET /api/medplum/regulatory
 * 搜索法规
 */
export async function GET(request: NextRequest) {
  return withRateLimit(async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    
    const query = searchParams.get('query') || '';
    const market = searchParams.get('market') || 'All';
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || 'active';
    const sort = searchParams.get('sort') || 'date';
    const latest = searchParams.get('latest') === 'true';
    const marketOnly = searchParams.get('marketOnly');
    const regulationId = searchParams.get('id');
    const impact = searchParams.get('impact') === 'true';
    
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
      
      // 获取最新法规变更
      if (latest) {
        const days = parseInt(searchParams.get('days') || '30', 10);
        results = await getLatestChanges(days);
      }
      // 获取特定市场的法规
      else if (marketOnly && (marketOnly === 'FDA' || marketOnly === 'CE' || marketOnly === 'NMPA')) {
        results = await getMarketRegulations(marketOnly as 'FDA' | 'CE' | 'NMPA');
      }
      // 获取法规详情
      else if (regulationId) {
        if (impact) {
          results = await getRegulationImpact(regulationId);
        } else {
          results = await getRegulationDetail(regulationId);
        }
      }
      // 搜索法规
      else {
        results = await searchRegulations({
          query,
          market: market as any,
          type,
          status: status as any,
          limit: pagination.limit,
          offset: (pagination.page - 1) * pagination.limit,
          sort: sort as 'date' | 'relevance',
        });
      }
      
      return NextResponse.json({
        success: true,
        data: results,
      });
    } catch (error) {
      console.error('Medplum regulatory error:', error);
      return NextResponse.json(
        { success: false, error: 'Regulatory search failed' },
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
