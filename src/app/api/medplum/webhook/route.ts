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
import { createHmac } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    
    const signature = request.headers.get('x-medplum-signature')
    const webhookSecret = process.env.MEDPLUM_WEBHOOK_SECRET
    
    if (webhookSecret) {
      if (!signature) {
        return NextResponse.json(
          { error: 'Missing webhook signature' },
          { status: 401 }
        )
      }
      
      const expectedSignature = createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex')
      
      if (signature !== expectedSignature) {
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        )
      }
    }

    const payload = JSON.parse(body)

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
