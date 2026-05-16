'use client'

import React from 'react'
import { usePermission } from '@/lib/permissions/use-permission'
import type { RoleFeatures } from '@/lib/permissions/config'
import { UpgradePrompt } from './UpgradePrompt'

interface PermissionGuardProps {
  feature: keyof RoleFeatures
  children: React.ReactNode
  fallback?: React.ReactNode
  showUpgradePrompt?: boolean
}

export function PermissionGuard({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
}: PermissionGuardProps) {
  const { canAccess, requireUpgrade, getRequiredTier, isGuest } = usePermission()

  if (canAccess(feature)) {
    return <>{children}</>
  }

  if (showUpgradePrompt && requireUpgrade(feature)) {
    const requiredTier = getRequiredTier(feature)
    return <UpgradePrompt feature={feature} requiredTier={requiredTier} />
  }

  if (isGuest) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-[#339999]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#339999]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign in required</h3>
          <p className="text-gray-600 mb-4">Please sign in or create an account to access this feature.</p>
          <a
            href="/auth/register"
            className="inline-flex items-center px-4 py-2 bg-[#339999] text-white rounded-lg hover:bg-[#2d8b8b] transition-colors"
          >
            Sign Up Free
          </a>
        </div>
      </div>
    )
  }

  if (fallback) {
    return <>{fallback}</>
  }

  return null
}
