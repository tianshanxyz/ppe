import { NextRequest, NextResponse } from 'next/server'
import {
  getCurrentUserWithRole,
  detectUserRole,
  detectVipTier,
  getRoleConfig,
  getQuota,
  checkSearchPermission,
  checkDownloadPermission,
  checkTrackerPermission,
  checkComplianceCheckPermission,
  checkAiChatPermission,
  checkApiPermission,
  getGuestId,
  setGuestIdCookie,
} from '@/lib/permissions'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'status'
  const type = searchParams.get('type') || 'search'

  const user = await getCurrentUserWithRole(request)
  const role = user?.role || 'guest'
  const vipTier = user?.vipTier
  const userId = user?.id || getGuestId(request)

  if (action === 'status') {
    const config = getRoleConfig(role, vipTier)
    const searchQuota = await getQuota(userId, role, vipTier, 'searches')
    const downloadQuota = await getQuota(userId, role, vipTier, 'downloads')
    const trackerQuota = await getQuota(userId, role, vipTier, 'trackerProducts')
    const complianceCheckQuota = await getQuota(userId, role, vipTier, 'complianceChecks')
    const aiChatQuota = await getQuota(userId, role, vipTier, 'aiChat')
    const apiQuota = await getQuota(userId, role, vipTier, 'apiCalls')

    const response = NextResponse.json({
      role,
      vipTier: vipTier || null,
      permissions: {
        searches: searchQuota,
        downloads: downloadQuota,
        trackerProducts: trackerQuota,
        complianceChecks: complianceCheckQuota,
        aiChat: aiChatQuota,
        apiCalls: apiQuota,
        features: config.features,
        exportFormats: config.exportFormats,
      },
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
      case 'search': result = await checkSearchPermission(userId, role, vipTier); break
      case 'download': result = await checkDownloadPermission(userId, role, vipTier); break
      case 'tracker': result = await checkTrackerPermission(userId, role, vipTier); break
      case 'compliance': result = await checkComplianceCheckPermission(userId, role, vipTier); break
      case 'aiChat': result = await checkAiChatPermission(userId, role, vipTier); break
      case 'api': result = await checkApiPermission(userId, role, vipTier); break
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
