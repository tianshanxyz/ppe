'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  UserRole,
  VipTier,
  RoleConfig,
  RoleFeatures,
  getRoleConfig,
  hasFeatureAccess,
  getFeatureAccessLevel,
  ROLE_CONFIG,
} from '../permissions/config'

interface CurrentUser {
  id: string
  email: string
  name: string
  role: UserRole
  vipTier?: VipTier
  membership: string
}

function getStoredUser(): CurrentUser | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem('mdlooker_user')
    if (!stored) return null
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export function usePermission() {
  const [user, setUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    setUser(getStoredUser())

    const handleStorage = () => setUser(getStoredUser())
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const role: UserRole = user?.role || 'guest'
  const vipTier: VipTier | undefined = user?.vipTier
  const config: RoleConfig = getRoleConfig(role, vipTier)

  const canAccess = useCallback(
    (feature: keyof RoleFeatures): boolean => {
      return hasFeatureAccess(role, vipTier, feature)
    },
    [role, vipTier]
  )

  const getAccessLevel = useCallback(
    (feature: keyof RoleFeatures) => {
      return getFeatureAccessLevel(role, vipTier, feature)
    },
    [role, vipTier]
  )

  const requireUpgrade = useCallback(
    (feature: keyof RoleFeatures): boolean => {
      const level = getFeatureAccessLevel(role, vipTier, feature)
      return level === false || level === 0
    },
    [role, vipTier]
  )

  const getRequiredTier = useCallback(
    (feature: keyof RoleFeatures): 'professional' | 'enterprise' | null => {
      if (hasFeatureAccess('vip', 'professional', feature)) return 'professional'
      if (hasFeatureAccess('vip', 'enterprise', feature)) return 'enterprise'
      return null
    },
    []
  )

  const isGuest = role === 'guest'
  const isUser = role === 'user'
  const isVip = role === 'vip'
  const isProfessional = vipTier === 'professional'
  const isEnterprise = vipTier === 'enterprise'

  return {
    user,
    role,
    vipTier,
    config,
    canAccess,
    getAccessLevel,
    requireUpgrade,
    getRequiredTier,
    isGuest,
    isUser,
    isVip,
    isProfessional,
    isEnterprise,
  }
}
