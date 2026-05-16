import { NextRequest, NextResponse } from 'next/server'
import {
  getCurrentUser, detectUserRole, checkTrackerPermission,
  incrementQuota, getGuestId, resetQuota
} from '@/lib/permissions-server'
import { readDataFile, writeDataFile } from '@/lib/data-store'

export async function POST(request: NextRequest) {
  const user = getCurrentUser(request)
  const role = detectUserRole(user)
  const userId = user?.id || getGuestId(request)

  const permCheck = checkTrackerPermission(userId, role)
  if (!permCheck.allowed) {
    return NextResponse.json({
      allowed: false,
      reason: permCheck.reason,
      quota: permCheck.quota,
    }, { status: 403 })
  }

  try {
    const { action, productId } = await request.json()

    if (!action) {
      return NextResponse.json({ error: 'Action required' }, { status: 400 })
    }

    if (action === 'add') {
      if (!productId) {
        return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
      }
      const quotaResult = incrementQuota(userId, role, 'trackerProducts')
      if (!quotaResult.allowed) {
        return NextResponse.json({
          allowed: false,
          reason: 'Tracker product limit reached',
          quota: { used: quotaResult.used, limit: quotaResult.limit, remaining: 0 },
        }, { status: 403 })
      }
      return NextResponse.json({
        allowed: true,
        action: 'add',
        productId,
        quota: { used: quotaResult.used, limit: quotaResult.limit, remaining: quotaResult.remaining },
      })
    }

    if (action === 'remove') {
      if (!productId) {
        return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
      }
      resetQuota(userId, 'trackerProducts')
      return NextResponse.json({ allowed: true, action: 'remove', productId })
    }

    if (action === 'check') {
      return NextResponse.json({
        allowed: permCheck.allowed,
        quota: permCheck.quota,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}