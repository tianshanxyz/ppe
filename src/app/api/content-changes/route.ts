import { NextRequest, NextResponse } from 'next/server'
import {
  readDataFile, writeDataFile, generateId,
  getCurrentUser, canEditContent, isAdmin,
  ContentChangeRecord, AuditLogRecord, generateAuditId
} from '@/lib/data-store'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const targetType = searchParams.get('targetType')
  const submittedBy = searchParams.get('submittedBy')
  const targetId = searchParams.get('targetId')

  let changes = readDataFile<ContentChangeRecord>('content_changes.json')

  if (status) changes = changes.filter(c => c.status === status)
  if (targetType) changes = changes.filter(c => c.targetType === targetType)
  if (submittedBy) changes = changes.filter(c => c.submittedBy === submittedBy)
  if (targetId) changes = changes.filter(c => c.targetId === targetId)

  changes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return NextResponse.json({ changes })
}

export async function POST(request: NextRequest) {
  const user = getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!canEditContent(user)) {
    return NextResponse.json({ error: 'Your account does not have edit permissions' }, { status: 403 })
  }

  try {
    const { targetType, targetId, targetName, fieldName, oldValue, newValue } = await request.json()

    if (!targetType || !targetId || !targetName || !fieldName || newValue === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (targetType !== 'product' && targetType !== 'company') {
      return NextResponse.json({ error: 'targetType must be "product" or "company"' }, { status: 400 })
    }

    const change: ContentChangeRecord = {
      id: generateId('change'),
      targetType,
      targetId,
      targetName,
      fieldName,
      oldValue: oldValue ?? '',
      newValue,
      submittedBy: user.id,
      submittedByName: user.name,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    const changes = readDataFile<ContentChangeRecord>('content_changes.json')
    changes.push(change)
    writeDataFile('content_changes.json', changes)

    return NextResponse.json({ change }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const user = getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  try {
    const { id, action, comment } = await request.json()

    if (!id || !action) {
      return NextResponse.json({ error: 'Change ID and action are required' }, { status: 400 })
    }

    const changes = readDataFile<ContentChangeRecord>('content_changes.json')
    const idx = changes.findIndex(c => c.id === id)

    if (idx === -1) {
      return NextResponse.json({ error: 'Change not found' }, { status: 404 })
    }

    const change = changes[idx]
    const auditLogs = readDataFile<AuditLogRecord>('audit_log.json')

    if (action === 'approve') {
      change.status = 'approved'
      change.reviewedAt = new Date().toISOString()
      change.reviewedBy = user.id
      change.reviewComment = comment || 'Approved'

      auditLogs.push({
        id: generateAuditId(),
        changeId: change.id,
        targetType: change.targetType,
        targetId: change.targetId,
        fieldName: change.fieldName,
        oldValue: change.oldValue,
        newValue: change.newValue,
        action: 'approved',
        performedBy: user.id,
        performedByName: user.name,
        note: `${new Date().toLocaleDateString('zh-CN')} ${change.submittedByName} 对"${change.fieldName}"进行了修改`,
        createdAt: new Date().toISOString(),
      })
    } else if (action === 'reject') {
      change.status = 'rejected'
      change.reviewedAt = new Date().toISOString()
      change.reviewedBy = user.id
      change.reviewComment = comment || 'Rejected'
    } else if (action === 'rollback') {
      change.status = 'rolled_back'
      change.reviewedAt = new Date().toISOString()
      change.reviewedBy = user.id
      change.reviewComment = comment || 'Rolled back'

      auditLogs.push({
        id: generateAuditId(),
        changeId: change.id,
        targetType: change.targetType,
        targetId: change.targetId,
        fieldName: change.fieldName,
        oldValue: change.newValue,
        newValue: change.oldValue,
        action: 'rolled_back',
        performedBy: user.id,
        performedByName: user.name,
        note: `${new Date().toLocaleDateString('zh-CN')} ${user.name} 回滚了"${change.fieldName}"的修改`,
        createdAt: new Date().toISOString(),
      })
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "approve", "reject", or "rollback"' }, { status: 400 })
    }

    writeDataFile('content_changes.json', changes)
    writeDataFile('audit_log.json', auditLogs)

    return NextResponse.json({ change })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}