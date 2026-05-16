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

export {
  MEMBERSHIP_TIERS,
  getMembershipConfig,
  getAllMembershipConfigs,
  compareTiers,
  isHigherTier,
  getRequiredTierForFeature,
  membershipTierToUserRole,
  membershipTierToVipTier,
} from './types'

export { MembershipService, membershipService } from './service'

export { withPermission, withLimit, composeMiddleware } from './middleware'
