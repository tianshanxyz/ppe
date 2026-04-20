/**
 * 会员计划 API
 *
 * B-001: 会员等级系统
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAllMembershipConfigs } from '@/lib/membership'

/**
 * GET /api/membership/plans
 * 获取所有会员计划信息
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const configs = getAllMembershipConfigs()

    return NextResponse.json({
      success: true,
      plans: configs.map(config => ({
        tier: config.tier,
        name: config.name,
        nameEn: config.nameEn,
        description: config.description,
        prices: {
          monthly: config.monthlyPrice,
          yearly: config.yearlyPrice,
          yearlyDiscount: config.monthlyPrice > 0
            ? Math.round((1 - config.yearlyPrice / (config.monthlyPrice * 12)) * 100)
            : 0,
        },
        features: config.features,
        limits: {
          maxSearchResults: config.limits.maxSearchResults,
          maxApiCallsPerDay: config.limits.maxApiCallsPerDay,
          maxExportRecordsPerMonth: config.limits.maxExportRecordsPerMonth,
          maxReportsPerMonth: config.limits.maxReportsPerMonth,
          maxMonitoredProducts: config.limits.maxMonitoredProducts,
          maxMonitoredCompanies: config.limits.maxMonitoredCompanies,
          maxTeamMembers: config.limits.maxTeamMembers,
        },
        popular: config.tier === 'professional',
      })),
      processing_time_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('获取会员计划失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取会员计划失败',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}
