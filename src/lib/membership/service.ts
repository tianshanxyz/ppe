/**
 * 会员等级系统 - 服务层
 *
 * B-001: 会员等级系统
 */

import { createClient } from '@/lib/supabase/server'
import {
  MembershipTier,
  UserMembership,
  MembershipConfig,
  MembershipLimits,
  MembershipPermissions,
  MembershipHistoryItem,
  GetMembershipResponse,
  CheckPermissionResponse,
  CheckLimitResponse,
  getMembershipConfig,
  getRequiredTierForFeature,
  isHigherTier,
} from './types'

// ============================================
// 会员服务
// ============================================

export class MembershipService {
  /**
   * 获取用户会员信息
   */
  async getUserMembership(userId: string): Promise<GetMembershipResponse> {
    const supabase = await createClient()

    try {
      // 查询用户会员信息
      const { data: membership, error } = await supabase
        .from('user_memberships')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        // 如果没有记录，创建免费版会员
        if (error.code === 'PGRST116') {
          const newMembership = await this.createFreeMembership(userId)
          return {
            success: true,
            membership: newMembership,
            config: getMembershipConfig('free'),
            usagePercentage: {
              apiCalls: 0,
              exports: 0,
              reports: 0,
            },
          }
        }
        throw error
      }

      // 检查是否需要重置使用统计
      await this.checkAndResetUsage(userId, membership)

      // 计算使用百分比
      const config = getMembershipConfig(membership.current_tier)
      const usagePercentage = {
        apiCalls: config.limits.maxApiCallsPerDay > 0
          ? (membership.usage.api_calls_today / config.limits.maxApiCallsPerDay) * 100
          : 0,
        exports: config.limits.maxExportRecordsPerMonth > 0
          ? (membership.usage.exports_this_month / config.limits.maxExportRecordsPerMonth) * 100
          : 0,
        reports: config.limits.maxReportsPerMonth > 0
          ? (membership.usage.reports_this_month / config.limits.maxReportsPerMonth) * 100
          : 0,
      }

      // 转换数据格式
      const userMembership: UserMembership = {
        userId: membership.user_id,
        currentTier: membership.current_tier,
        subscription: membership.subscription,
        usage: membership.usage,
        history: membership.history || [],
        metadata: membership.metadata || {},
      }

      return {
        success: true,
        membership: userMembership,
        config,
        usagePercentage,
      }
    } catch (error) {
      console.error('获取会员信息失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取会员信息失败',
      }
    }
  }

  /**
   * 检查权限
   */
  async checkPermission(
    userId: string,
    permission: keyof MembershipPermissions
  ): Promise<CheckPermissionResponse> {
    const { success, membership } = await this.getUserMembership(userId)

    if (!success || !membership) {
      return {
        success: false,
        allowed: false,
        currentTier: 'free',
        message: '无法获取会员信息',
      }
    }

    const config = getMembershipConfig(membership.currentTier)
    const allowed = config.permissions[permission]

    if (allowed) {
      return {
        success: true,
        allowed: true,
        currentTier: membership.currentTier,
      }
    }

    // 获取需要的最低等级
    const requiredTier = getRequiredTierForFeature(permission)

    return {
      success: true,
      allowed: false,
      currentTier: membership.currentTier,
      requiredTier: requiredTier || 'professional',
      message: `此功能需要${requiredTier === 'enterprise' ? '企业版' : '专业版'}会员`,
    }
  }

  /**
   * 检查限制
   */
  async checkLimit(
    userId: string,
    limitType: keyof MembershipLimits,
    requestedAmount: number = 1
  ): Promise<CheckLimitResponse> {
    const { success, membership, config } = await this.getUserMembership(userId)

    if (!success || !membership || !config) {
      return {
        success: false,
        allowed: false,
        currentUsage: 0,
        limit: 0,
        remaining: 0,
        message: '无法获取会员信息',
      }
    }

    const limit = config.limits[limitType]

    // 如果是数组类型（如allowedExportFormats），特殊处理
    if (Array.isArray(limit)) {
      return {
        success: true,
        allowed: true,
        currentUsage: 0,
        limit: limit.length,
        remaining: limit.length,
      }
    }

    // 获取当前使用量
    let currentUsage = 0
    switch (limitType) {
      case 'maxApiCallsPerDay':
        currentUsage = membership.usage.apiCallsToday
        break
      case 'maxExportRecordsPerMonth':
        currentUsage = membership.usage.exportsThisMonth
        break
      case 'maxReportsPerMonth':
        currentUsage = membership.usage.reportsThisMonth
        break
      case 'maxSearchResults':
        currentUsage = membership.usage.searchesToday
        break
      default:
        // 其他限制类型需要从数据库查询
        currentUsage = await this.getCurrentUsage(userId, limitType)
    }

    const remaining = Math.max(0, (limit as number) - currentUsage)
    const allowed = remaining >= requestedAmount

    return {
      success: true,
      allowed,
      currentUsage,
      limit: limit as number,
      remaining,
      resetAt: this.getResetTime(limitType),
      message: allowed ? undefined : `已达到${limitType}限制，请升级会员等级`,
    }
  }

  /**
   * 增加使用量
   */
  async incrementUsage(
    userId: string,
    limitType: keyof MembershipLimits,
    amount: number = 1
  ): Promise<boolean> {
    const supabase = await createClient()

    try {
      let updateField = ''
      switch (limitType) {
        case 'maxApiCallsPerDay':
          updateField = 'usage.api_calls_today'
          break
        case 'maxExportRecordsPerMonth':
          updateField = 'usage.exports_this_month'
          break
        case 'maxReportsPerMonth':
          updateField = 'usage.reports_this_month'
          break
        case 'maxSearchResults':
          updateField = 'usage.searches_today'
          break
        default:
          return false
      }

      const { error } = await supabase.rpc('increment_membership_usage', {
        p_user_id: userId,
        p_field: updateField,
        p_amount: amount,
      })

      if (error) {
        // 如果RPC不存在，使用直接更新
        const { data: membership } = await supabase
          .from('user_memberships')
          .select('usage')
          .eq('user_id', userId)
          .single()

        if (membership) {
          const usage = membership.usage || {}
          const field = updateField.split('.')[1]
          usage[field] = (usage[field] || 0) + amount

          await supabase
            .from('user_memberships')
            .update({ usage })
            .eq('user_id', userId)
        }
      }

      return true
    } catch (error) {
      console.error('增加使用量失败:', error)
      return false
    }
  }

  /**
   * 升级会员
   */
  async upgradeMembership(
    userId: string,
    targetTier: MembershipTier,
    billingCycle: 'monthly' | 'yearly'
  ): Promise<{ success: boolean; error?: string }> {
    const { success, membership } = await this.getUserMembership(userId)

    if (!success || !membership) {
      return { success: false, error: '无法获取当前会员信息' }
    }

    // 检查是否是升级
    if (!isHigherTier(targetTier, membership.currentTier)) {
      return { success: false, error: '目标等级必须高于当前等级' }
    }

    const supabase = await createClient()

    try {
      const now = new Date()
      const config = getMembershipConfig(targetTier)

      // 计算到期时间
      const expiresAt = new Date(now)
      if (billingCycle === 'monthly') {
        expiresAt.setMonth(expiresAt.getMonth() + 1)
      } else {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1)
      }

      // 更新会员信息
      const { error } = await supabase
        .from('user_memberships')
        .update({
          current_tier: targetTier,
          subscription: {
            status: 'active',
            started_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
            billing_cycle: billingCycle,
            auto_renew: true,
          },
          metadata: {
            ...membership.metadata,
            upgraded_at: now.toISOString(),
          },
          updated_at: now.toISOString(),
        })
        .eq('user_id', userId)

      if (error) throw error

      // 记录历史
      await this.addHistoryItem(userId, {
        id: crypto.randomUUID(),
        fromTier: membership.currentTier,
        toTier: targetTier,
        reason: 'upgrade',
        changedAt: now.toISOString(),
        changedBy: userId,
        notes: `升级到${billingCycle === 'yearly' ? '年付' : '月付'}计划`,
      })

      return { success: true }
    } catch (error) {
      console.error('升级会员失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '升级失败',
      }
    }
  }

  /**
   * 降级会员
   */
  async downgradeMembership(
    userId: string,
    targetTier: MembershipTier,
    effectiveAt: 'immediately' | 'period_end' = 'period_end'
  ): Promise<{ success: boolean; error?: string }> {
    const { success, membership } = await this.getUserMembership(userId)

    if (!success || !membership) {
      return { success: false, error: '无法获取当前会员信息' }
    }

    // 检查是否是降级
    if (isHigherTier(targetTier, membership.currentTier)) {
      return { success: false, error: '目标等级必须低于当前等级' }
    }

    const supabase = await createClient()

    try {
      const now = new Date()

      if (effectiveAt === 'immediately') {
        // 立即降级
        const { error } = await supabase
          .from('user_memberships')
          .update({
            current_tier: targetTier,
            subscription: {
              ...membership.subscription,
              status: 'active',
            },
            metadata: {
              ...membership.metadata,
              downgraded_at: now.toISOString(),
            },
            updated_at: now.toISOString(),
          })
          .eq('user_id', userId)

        if (error) throw error
      } else {
        // 在当前周期结束时降级（通过设置metadata标记）
        const { error } = await supabase
          .from('user_memberships')
          .update({
            metadata: {
              ...membership.metadata,
              scheduled_downgrade_tier: targetTier,
              scheduled_downgrade_at: membership.subscription.expiresAt,
            },
            updated_at: now.toISOString(),
          })
          .eq('user_id', userId)

        if (error) throw error
      }

      // 记录历史
      await this.addHistoryItem(userId, {
        id: crypto.randomUUID(),
        fromTier: membership.currentTier,
        toTier: targetTier,
        reason: 'downgrade',
        changedAt: now.toISOString(),
        changedBy: userId,
        notes: effectiveAt === 'immediately' ? '立即降级' : '当前周期结束后降级',
      })

      return { success: true }
    } catch (error) {
      console.error('降级会员失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '降级失败',
      }
    }
  }

  /**
   * 取消订阅
   */
  async cancelMembership(
    userId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()

    try {
      const now = new Date()

      const { error } = await supabase
        .from('user_memberships')
        .update({
          subscription: {
            status: 'cancelled',
          },
          metadata: {
            cancelled_at: now.toISOString(),
            cancellation_reason: reason,
          },
          updated_at: now.toISOString(),
        })
        .eq('user_id', userId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('取消订阅失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '取消失败',
      }
    }
  }

  // ============================================
  // 私有方法
  // ============================================

  /**
   * 创建免费版会员
   */
  private async createFreeMembership(userId: string): Promise<UserMembership> {
    const supabase = await createClient()
    const now = new Date()

    const membership: UserMembership = {
      userId,
      currentTier: 'free',
      subscription: {
        status: 'active',
        startedAt: now.toISOString(),
        expiresAt: new Date(now.getFullYear() + 100, now.getMonth(), now.getDate()).toISOString(),
        billingCycle: 'monthly',
        autoRenew: false,
      },
      usage: {
        apiCallsToday: 0,
        apiCallsThisMonth: 0,
        exportsThisMonth: 0,
        reportsThisMonth: 0,
        searchesToday: 0,
        lastResetAt: now.toISOString(),
      },
      history: [],
      metadata: {},
    }

    await supabase.from('user_memberships').insert({
      user_id: userId,
      current_tier: membership.currentTier,
      subscription: membership.subscription,
      usage: membership.usage,
      history: membership.history,
      metadata: membership.metadata,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    })

    return membership
  }

  /**
   * 检查并重置使用统计
   */
  private async checkAndResetUsage(userId: string, membership: any): Promise<void> {
    const lastReset = new Date(membership.usage?.last_reset_at || 0)
    const now = new Date()
    const supabase = await createClient()

    let needsUpdate = false
    const updates: any = { ...membership.usage }

    // 检查是否需要重置日统计
    if (lastReset.getDate() !== now.getDate() || lastReset.getMonth() !== now.getMonth()) {
      updates.api_calls_today = 0
      updates.searches_today = 0
      needsUpdate = true
    }

    // 检查是否需要重置月统计
    if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
      updates.exports_this_month = 0
      updates.reports_this_month = 0
      updates.api_calls_this_month = 0
      needsUpdate = true
    }

    if (needsUpdate) {
      updates.last_reset_at = now.toISOString()

      await supabase
        .from('user_memberships')
        .update({ usage: updates })
        .eq('user_id', userId)
    }
  }

  /**
   * 获取当前使用量
   */
  private async getCurrentUsage(userId: string, limitType: keyof MembershipLimits): Promise<number> {
    // 这里可以实现具体的查询逻辑
    // 例如查询监控的产品数量、保存的搜索数量等
    return 0
  }

  /**
   * 获取重置时间
   */
  private getResetTime(limitType: keyof MembershipLimits): string | undefined {
    const now = new Date()

    switch (limitType) {
      case 'maxApiCallsPerDay':
      case 'maxSearchResults':
        // 次日零点
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(0, 0, 0, 0)
        return tomorrow.toISOString()

      case 'maxExportRecordsPerMonth':
      case 'maxReportsPerMonth':
        // 下月1号
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        return nextMonth.toISOString()

      default:
        return undefined
    }
  }

  /**
   * 添加历史记录
   */
  private async addHistoryItem(userId: string, item: MembershipHistoryItem): Promise<void> {
    const supabase = await createClient()

    const { data: membership } = await supabase
      .from('user_memberships')
      .select('history')
      .eq('user_id', userId)
      .single()

    const history = membership?.history || []
    history.unshift(item)

    // 只保留最近20条记录
    if (history.length > 20) {
      history.pop()
    }

    await supabase
      .from('user_memberships')
      .update({ history })
      .eq('user_id', userId)
  }
}

// 导出单例
export const membershipService = new MembershipService()
