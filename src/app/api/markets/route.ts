/**
 * 市场信息 API
 *
 * A-004: 市场准入推荐引擎
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAllMarkets, getMarketsByRegion, getMarketInfo } from '@/lib/ai/market-recommendation'

/**
 * GET /api/markets
 * 获取市场列表
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { searchParams } = new URL(request.url)
    const region = searchParams.get('region')
    const code = searchParams.get('code')

    let markets

    if (code) {
      // 获取单个市场
      const market = getMarketInfo(code)
      if (!market) {
        return NextResponse.json(
          {
            success: false,
            error: '市场不存在',
            processing_time_ms: Date.now() - startTime,
          },
          { status: 404 }
        )
      }
      markets = [market]
    } else if (region) {
      // 按地区获取
      markets = getMarketsByRegion(region)
    } else {
      // 获取所有市场
      markets = getAllMarkets()
    }

    return NextResponse.json({
      success: true,
      markets,
      total: markets.length,
      processing_time_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('获取市场信息失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取市场信息失败',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}
