import { NextRequest, NextResponse } from 'next/server'
import { readDataFile, AuditLogRecord } from '@/lib/data-store'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const targetType = searchParams.get('targetType')
  const targetId = searchParams.get('targetId')

  let logs = readDataFile<AuditLogRecord>('audit_log.json')

  if (targetType) {
    logs = logs.filter(l => l.targetType === targetType)
  }
  if (targetId) {
    logs = logs.filter(l => l.targetId === targetId)
  }

  // Only return approved logs for public viewing
  logs = logs.filter(l => l.action === 'approved' || l.action === 'rolled_back')
  logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return NextResponse.json({ logs })
}