/**
 * 法规监控任务管理 API
 *
 * A-008: 法规变更影响分析
 */

import { NextRequest, NextResponse } from 'next/server'
import { regulationMonitor } from '@/lib/ai/regulation-impact'
import type { MonitoringConfig } from '@/lib/ai/regulation-impact'

/**
 * GET /api/regulation-impact/monitor
 * 获取监控任务列表
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('id')

    if (taskId) {
      // 获取单个任务
      const task = regulationMonitor.getTask(taskId)
      if (!task) {
        return NextResponse.json(
          {
            success: false,
            error: '监控任务不存在',
            processing_time_ms: Date.now() - startTime,
          },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        task,
        processing_time_ms: Date.now() - startTime,
      })
    }

    // 获取所有任务
    const tasks = regulationMonitor.getAllTasks()
    const stats = regulationMonitor.getStatistics()

    return NextResponse.json({
      success: true,
      tasks,
      statistics: stats,
      processing_time_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('获取监控任务失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取监控任务失败',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/regulation-impact/monitor
 * 创建监控任务
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()

    // 验证必填字段
    if (!body.name) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必要参数: name',
          processing_time_ms: Date.now() - startTime,
        },
        { status: 400 }
      )
    }

    const task = regulationMonitor.createTask(body.name, body.config as MonitoringConfig)

    return NextResponse.json(
      {
        success: true,
        task,
        processing_time_ms: Date.now() - startTime,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('创建监控任务失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '创建监控任务失败',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/regulation-impact/monitor
 * 更新监控任务
 */
export async function PATCH(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必要参数: id',
          processing_time_ms: Date.now() - startTime,
        },
        { status: 400 }
      )
    }

    const task = regulationMonitor.updateTask(body.id, body.updates)

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          error: '监控任务不存在',
          processing_time_ms: Date.now() - startTime,
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      task,
      processing_time_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('更新监控任务失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '更新监控任务失败',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/regulation-impact/monitor
 * 删除监控任务
 */
export async function DELETE(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('id')

    if (!taskId) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必要参数: id',
          processing_time_ms: Date.now() - startTime,
        },
        { status: 400 }
      )
    }

    const deleted = regulationMonitor.deleteTask(taskId)

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: '监控任务不存在',
          processing_time_ms: Date.now() - startTime,
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '监控任务已删除',
      processing_time_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('删除监控任务失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '删除监控任务失败',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}
