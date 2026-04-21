/**
 * 法规变更影响分析系统 - 监控服务
 *
 * A-008: 法规变更影响分析
 */

import {
  MonitoringConfig,
  MonitoringTask,
  RegulationChange,
  DEFAULT_MONITORING_CONFIG,
} from './types'
import { changeDetector } from './change-detector'

/**
 * 法规监控服务
 */
export class RegulationMonitor {
  private tasks: Map<string, MonitoringTask> = new Map()

  /**
   * 创建监控任务
   */
  createTask(name: string, config: Partial<MonitoringConfig> = {}): MonitoringTask {
    const task: MonitoringTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      config: { ...DEFAULT_MONITORING_CONFIG, ...config },
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    this.tasks.set(task.id, task)
    return task
  }

  /**
   * 获取监控任务
   */
  getTask(taskId: string): MonitoringTask | undefined {
    return this.tasks.get(taskId)
  }

  /**
   * 获取所有监控任务
   */
  getAllTasks(): MonitoringTask[] {
    return Array.from(this.tasks.values())
  }

  /**
   * 更新监控任务
   */
  updateTask(taskId: string, updates: Partial<MonitoringTask>): MonitoringTask | undefined {
    const task = this.tasks.get(taskId)
    if (!task) return undefined

    const updatedTask = {
      ...task,
      ...updates,
      updated_at: new Date().toISOString(),
    }

    this.tasks.set(taskId, updatedTask)
    return updatedTask
  }

  /**
   * 删除监控任务
   */
  deleteTask(taskId: string): boolean {
    return this.tasks.delete(taskId)
  }

  /**
   * 启用监控任务
   */
  enableTask(taskId: string): MonitoringTask | undefined {
    return this.updateTask(taskId, { is_active: true })
  }

  /**
   * 禁用监控任务
   */
  disableTask(taskId: string): MonitoringTask | undefined {
    return this.updateTask(taskId, { is_active: false })
  }

  /**
   * 执行监控检查
   */
  async checkForChanges(taskId: string): Promise<{
    task: MonitoringTask
    changes: RegulationChange[]
    checked_at: string
  } | null> {
    const task = this.tasks.get(taskId)
    if (!task || !task.is_active) return null

    // 这里应该实现实际的法规数据获取和变更检测
    // 模拟返回空结果
    const changes: RegulationChange[] = []

    // 更新最后检查时间
    this.updateTask(taskId, {
      last_check_at: new Date().toISOString(),
      ...(changes.length > 0 ? { last_change_detected: new Date().toISOString() } : {}),
    })

    return {
      task: this.tasks.get(taskId)!,
      changes,
      checked_at: new Date().toISOString(),
    }
  }

  /**
   * 执行所有监控任务
   */
  async checkAllTasks(): Promise<
    Array<{
      task: MonitoringTask
      changes: RegulationChange[]
      checked_at: string
    }>
  > {
    const results = []

    for (const [taskId] of this.tasks) {
      const result = await this.checkForChanges(taskId)
      if (result) {
        results.push(result)
      }
    }

    return results
  }

  /**
   * 获取监控统计
   */
  getStatistics(): {
    total_tasks: number
    active_tasks: number
    inactive_tasks: number
    tasks_with_changes: number
  } {
    const allTasks = this.getAllTasks()

    return {
      total_tasks: allTasks.length,
      active_tasks: allTasks.filter((t) => t.is_active).length,
      inactive_tasks: allTasks.filter((t) => !t.is_active).length,
      tasks_with_changes: allTasks.filter((t) => t.last_change_detected).length,
    }
  }
}

// 导出单例
export const regulationMonitor = new RegulationMonitor()
