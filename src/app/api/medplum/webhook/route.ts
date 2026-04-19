/**
 * Medplum Webhook 端点
 * 
 * 接收和处理来自 Medplum 的 webhook 通知，
 * 主要用于处理预警、法规变更等事件。
 * 
 * @module app/api/medplum/webhook/route
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleMedplumWebhook } from '@/lib/medplum/services/alertService'

/**
 * POST /api/medplum/webhook
 * 
 * 接收 Medplum webhook 通知
 * 
 * @param request Webhook 请求
 * @returns 处理结果
 */
export async function POST(request: NextRequest) {
  try {
    // 验证 webhook 签名（可选）
    const signature = request.headers.get('x-medplum-signature')
    if (signature) {
      // 这里可以添加签名验证逻辑
      console.log('Webhook signature:', signature)
    }

    // 解析请求体
    const payload = await request.json()
    console.log('Received Medplum webhook:', payload)

    // 处理 webhook
    const result = await handleMedplumWebhook(payload)

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: 'Webhook processed successfully',
          data: 'data' in result ? result.data : undefined
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'message' in result ? result.message : 'Failed to process webhook',
          error: 'error' in result ? result.error : undefined
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/medplum/webhook
 * 
 * 健康检查端点
 * 
 * @returns 健康状态
 */
export async function GET() {
  return NextResponse.json(
    {
      success: true,
      message: 'Medplum webhook endpoint is ready',
      timestamp: new Date().toISOString(),
      service: 'medplum-webhook'
    },
    { status: 200 }
  )
}
