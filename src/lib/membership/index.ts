/**
 * 会员等级系统 - 主入口
 *
 * B-001: 会员等级系统
 */

// 导出类型
export type {
  MembershipTier,
  MembershipConfig,
  MembershipLimits,
  MembershipPermissions,
  UserMembership,
  MembershipHistoryItem,
  GetMembershipResponse,
  UpgradeRequest,
  UpgradeResponse,
  DowngradeRequest,
  CancelRequest,
  CheckPermissionRequest,
  CheckPermissionResponse,
  CheckLimitRequest,
  CheckLimitResponse,
  FeatureAccessCheck,
  LimitCheck,
} from './types'

// 导出常量和工具函数
export {
  MEMBERSHIP_TIERS,
  getMembershipConfig,
  getAllMembershipConfigs,
  compareTiers,
  isHigherTier,
  getRequiredTierForFeature,
} from './types'

// 导出服务
export { MembershipService, membershipService } from './service'

// 导出中间件
export { withPermission, withLimit, composeMiddleware } from './middleware'
