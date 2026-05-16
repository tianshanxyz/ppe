import { createClient } from '@/lib/supabase/client'
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
  membershipTierToUserRole,
  membershipTierToVipTier,
} from './types'
import type { UserRole, VipTier, RoleConfig } from '../permissions/config'
import { getRoleConfig } from '../permissions/config'

export class MembershipService {
  async getUserMembership(userId: string): Promise<GetMembershipResponse> {
    const supabase = createClient()

    try {
      const { data: membership, error } = await supabase
        .from('user_memberships')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          const newMembership = await this.createFreeMembership(userId)
          return {
            success: true,
            membership: newMembership,
            config: getMembershipConfig('free'),
            usagePercentage: { apiCalls: 0, exports: 0, reports: 0 },
          }
        }
        throw error
      }

      await this.checkAndResetUsage(userId, membership)

      const config = getMembershipConfig(membership.current_tier)
      const roleConfig = getRoleConfig(
        membershipTierToUserRole(membership.current_tier),
        membershipTierToVipTier(membership.current_tier)
      )
      const usagePercentage = {
        apiCalls: roleConfig.quotas.apiCalls.limit > 0
          ? ((membership.usage?.api_calls_today || 0) / roleConfig.quotas.apiCalls.limit) * 100
          : 0,
        exports: roleConfig.quotas.downloads.limit > 0
          ? ((membership.usage?.exports_this_month || 0) / roleConfig.quotas.downloads.limit) * 100
          : 0,
        reports: roleConfig.quotas.reports.limit > 0
          ? ((membership.usage?.reports_this_month || 0) / roleConfig.quotas.reports.limit) * 100
          : 0,
      }

      const userMembership: UserMembership = {
        userId: membership.user_id,
        currentTier: membership.current_tier,
        role: membershipTierToUserRole(membership.current_tier),
        vipTier: membershipTierToVipTier(membership.current_tier),
        subscription: membership.subscription,
        usage: membership.usage,
        history: membership.history || [],
        metadata: membership.metadata || {},
      }

      return { success: true, membership: userMembership, config, usagePercentage }
    } catch (error) {
      console.error('获取会员信息失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '获取会员信息失败' }
    }
  }

  async checkPermission(
    userId: string,
    permission: keyof MembershipPermissions
  ): Promise<CheckPermissionResponse> {
    const { success, membership } = await this.getUserMembership(userId)

    if (!success || !membership) {
      return { success: false, allowed: false, currentTier: 'free', message: '无法获取会员信息' }
    }

    const config = getMembershipConfig(membership.currentTier)
    const tierOrder: MembershipTier[] = ['free', 'professional', 'enterprise']
    const currentIdx = tierOrder.indexOf(membership.currentTier)
    const minIdx = permission.startsWith('canUse') || permission.startsWith('canAccess')
      ? (permission === 'canAccessBasicData' ? 0 : permission.includes('Advanced') || permission.includes('Historical') || permission.includes('RealTime') ? 1 : 0)
      : (permission === 'canExportData' || permission === 'canCreateAlerts' || permission === 'canGenerateReports' || permission === 'canUseComparisonTool' ? 1 : 2)
    const allowed = currentIdx >= minIdx

    if (allowed) {
      return { success: true, allowed: true, currentTier: membership.currentTier }
    }

    const requiredTier = getRequiredTierForFeature(permission)

    return {
      success: true,
      allowed: false,
      currentTier: membership.currentTier,
      requiredTier: requiredTier || 'professional',
      message: `此功能需要${requiredTier === 'enterprise' ? '企业版' : '专业版'}会员`,
    }
  }

  async checkLimit(
    userId: string,
    limitType: keyof MembershipLimits,
    requestedAmount: number = 1
  ): Promise<CheckLimitResponse> {
    const { success, membership } = await this.getUserMembership(userId)

    if (!success || !membership) {
      return { success: false, allowed: false, currentUsage: 0, limit: 0, remaining: 0, message: '无法获取会员信息' }
    }

    const roleConfig = getRoleConfig(
      membershipTierToUserRole(membership.currentTier),
      membershipTierToVipTier(membership.currentTier)
    )

    const limitMap: Record<string, number> = {
      maxApiCallsPerDay: roleConfig.quotas.apiCalls.limit,
      maxExportRecordsPerMonth: roleConfig.quotas.downloads.limit,
      maxReportsPerMonth: roleConfig.quotas.reports.limit,
      maxSearchResults: roleConfig.quotas.searches.limit,
      maxComplianceChecksPerDay: roleConfig.quotas.complianceChecks.limit,
      maxAiChatPerDay: roleConfig.quotas.aiChat.limit,
      maxMonitoredProducts: roleConfig.quotas.trackerProducts.limit,
      maxAlertRules: roleConfig.quotas.alertRules.limit,
      maxSavedSearches: roleConfig.quotas.savedSearches,
      maxTeamMembers: roleConfig.quotas.teamMembers,
    }

    const limit = limitMap[limitType] ?? 0

    if (limit === -1) {
      return { success: true, allowed: true, currentUsage: 0, limit: -1, remaining: -1 }
    }

    let currentUsage = 0
    switch (limitType) {
      case 'maxApiCallsPerDay': currentUsage = membership.usage?.apiCallsToday || 0; break
      case 'maxExportRecordsPerMonth': currentUsage = membership.usage?.exportsThisMonth || 0; break
      case 'maxReportsPerMonth': currentUsage = membership.usage?.reportsThisMonth || 0; break
      case 'maxSearchResults': currentUsage = membership.usage?.searchesToday || 0; break
      default: currentUsage = await this.getCurrentUsage(userId, limitType)
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

  async incrementUsage(
    userId: string,
    limitType: keyof MembershipLimits,
    amount: number = 1
  ): Promise<boolean> {
    const supabase = createClient()

    try {
      let updateField = ''
      switch (limitType) {
        case 'maxApiCallsPerDay': updateField = 'usage.api_calls_today'; break
        case 'maxExportRecordsPerMonth': updateField = 'usage.exports_this_month'; break
        case 'maxReportsPerMonth': updateField = 'usage.reports_this_month'; break
        case 'maxSearchResults': updateField = 'usage.searches_today'; break
        default: return false
      }

      const { error } = await supabase.rpc('increment_membership_usage', {
        p_user_id: userId,
        p_field: updateField,
        p_amount: amount,
      })

      if (error) {
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

  async upgradeMembership(
    userId: string,
    targetTier: MembershipTier,
    billingCycle: 'monthly' | 'yearly'
  ): Promise<{ success: boolean; error?: string }> {
    const { success, membership } = await this.getUserMembership(userId)

    if (!success || !membership) {
      return { success: false, error: '无法获取当前会员信息' }
    }

    if (!isHigherTier(targetTier, membership.currentTier)) {
      return { success: false, error: '目标等级必须高于当前等级' }
    }

    const supabase = createClient()

    try {
      const now = new Date()
      const expiresAt = new Date(now)
      if (billingCycle === 'monthly') {
        expiresAt.setMonth(expiresAt.getMonth() + 1)
      } else {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1)
      }

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
      return { success: false, error: error instanceof Error ? error.message : '升级失败' }
    }
  }

  async downgradeMembership(
    userId: string,
    targetTier: MembershipTier,
    effectiveAt: 'immediately' | 'period_end' = 'period_end'
  ): Promise<{ success: boolean; error?: string }> {
    const { success, membership } = await this.getUserMembership(userId)

    if (!success || !membership) {
      return { success: false, error: '无法获取当前会员信息' }
    }

    if (isHigherTier(targetTier, membership.currentTier)) {
      return { success: false, error: '目标等级必须低于当前等级' }
    }

    const supabase = createClient()

    try {
      const now = new Date()

      if (effectiveAt === 'immediately') {
        const { error } = await supabase
          .from('user_memberships')
          .update({
            current_tier: targetTier,
            subscription: { ...membership.subscription, status: 'active' },
            metadata: { ...membership.metadata, downgraded_at: now.toISOString() },
            updated_at: now.toISOString(),
          })
          .eq('user_id', userId)

        if (error) throw error
      } else {
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
      return { success: false, error: error instanceof Error ? error.message : '降级失败' }
    }
  }

  async cancelMembership(
    userId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()

    try {
      const now = new Date()

      const { error } = await supabase
        .from('user_memberships')
        .update({
          subscription: { status: 'cancelled' },
          metadata: { cancelled_at: now.toISOString(), cancellation_reason: reason },
          updated_at: now.toISOString(),
        })
        .eq('user_id', userId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('取消订阅失败:', error)
      return { success: false, error: error instanceof Error ? error.message : '取消失败' }
    }
  }

  private async createFreeMembership(userId: string): Promise<UserMembership> {
    const supabase = createClient()
    const now = new Date()

    const membership: UserMembership = {
      userId,
      currentTier: 'free',
      role: 'user',
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
        complianceChecksToday: 0,
        aiChatToday: 0,
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

  private async checkAndResetUsage(userId: string, membership: any): Promise<void> {
    const lastReset = new Date(membership.usage?.last_reset_at || 0)
    const now = new Date()
    const supabase = createClient()

    let needsUpdate = false
    const updates: any = { ...membership.usage }

    if (lastReset.getDate() !== now.getDate() || lastReset.getMonth() !== now.getMonth()) {
      updates.api_calls_today = 0
      updates.searches_today = 0
      updates.compliance_checks_today = 0
      updates.ai_chat_today = 0
      needsUpdate = true
    }

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

  private async getCurrentUsage(userId: string, limitType: keyof MembershipLimits): Promise<number> {
    return 0
  }

  private getResetTime(limitType: keyof MembershipLimits): string | undefined {
    const now = new Date()

    switch (limitType) {
      case 'maxApiCallsPerDay':
      case 'maxSearchResults':
      case 'maxComplianceChecksPerDay':
      case 'maxAiChatPerDay': {
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(0, 0, 0, 0)
        return tomorrow.toISOString()
      }

      case 'maxExportRecordsPerMonth':
      case 'maxReportsPerMonth': {
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        return nextMonth.toISOString()
      }

      default:
        return undefined
    }
  }

  private async addHistoryItem(userId: string, item: MembershipHistoryItem): Promise<void> {
    const supabase = createClient()

    const { data: membership } = await supabase
      .from('user_memberships')
      .select('history')
      .eq('user_id', userId)
      .single()

    const history = membership?.history || []
    history.unshift(item)

    if (history.length > 20) {
      history.pop()
    }

    await supabase
      .from('user_memberships')
      .update({ history })
      .eq('user_id', userId)
  }
}

export const membershipService = new MembershipService()
