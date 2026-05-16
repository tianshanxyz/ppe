import { NextRequest, NextResponse } from 'next/server'
import { readDataFile } from '@/lib/data-store'
import { getCurrentUser } from '@/lib/permissions-server'
import { isAdmin } from '@/lib/data-store'
import type { PermissionLogEntry } from '@/lib/permissions-server'

export async function GET(request: NextRequest) {
  const user = getCurrentUser(request)
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const action = searchParams.get('action')
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000)

  let logs = readDataFile<PermissionLogEntry>('permission_log.json')

  if (userId) logs = logs.filter(l => l.userId === userId)
  if (action) logs = logs.filter(l => l.action === action)

  logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  logs = logs.slice(0, limit)

  return NextResponse.json({ logs })
}