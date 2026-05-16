import { NextRequest, NextResponse } from 'next/server'
import {
  getCurrentUser, detectUserRole, getRolePermissions,
  getQuota, checkSearchPermission, checkDownloadPermission,
  checkTrackerPermission, getGuestId, setGuestIdCookie,
} from '@/lib/permissions-server'
import type { UserRole } from '@/lib/permissions-server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'status'
  const type = searchParams.get('type') || 'search'

  const user = getCurrentUser(request)
  const role = detectUserRole(user)
  let userId = user?.id || getGuestId(request)

  if (action === 'status') {
    const permissions = getRolePermissions(role)
    const searchQuota = await getQuota(userId, role, 'searches')
    const downloadQuota = await getQuota(userId, role, 'downloads')
    const trackerQuota = await getQuota(userId, role, 'trackerProducts')

    const response = NextResponse.json({
      role,
      permissions: {
        searches: searchQuota,
        downloads: downloadQuota,
        trackerProducts: trackerQuota,
        apiAccess: permissions.apiAccess,
        aiSearch: permissions.aiSearch,
        complianceTracker: permissions.complianceTracker,
        favorites: permissions.favorites,
        reports: permissions.reports,
      },
      limits: {
        searches: permissions.searches,
        downloads: permissions.downloads,
        trackerProducts: permissions.trackerProducts,
      }
    })

    if (role === 'guest') {
      const cookie = setGuestIdCookie(userId)
      response.cookies.set(cookie.name, cookie.value, { path: '/', maxAge: cookie.maxAge, sameSite: 'lax' })
    }

    return response
  }

  if (action === 'check') {
    let result
    switch (type) {
      case 'search': result = await checkSearchPermission(userId, role); break
      case 'download': result = await checkDownloadPermission(userId, role); break
      case 'tracker': result = await checkTrackerPermission(userId, role); break
      default: return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const response = NextResponse.json(result)
    if (role === 'guest') {
      const cookie = setGuestIdCookie(userId)
      response.cookies.set(cookie.name, cookie.value, { path: '/', maxAge: cookie.maxAge, sameSite: 'lax' })
    }
    return response
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}