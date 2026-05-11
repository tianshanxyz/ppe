import { NextRequest, NextResponse } from 'next/server'
import {
  readDataFile, writeDataFile,
  getCurrentUser, isAdmin,
  ArticleRecord, AuditLogRecord, generateAuditId
} from '@/lib/data-store'

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'Article ID and action are required' }, { status: 400 })
    }

    const articles = readDataFile<ArticleRecord>('articles.json')
    const idx = articles.findIndex(a => a.id === id)

    if (idx === -1) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    const auditLogs = readDataFile<AuditLogRecord>('audit_log.json')

    if (action === 'approve') {
      articles[idx].status = 'published'
      articles[idx].publishedAt = new Date().toISOString()
      articles[idx].reviewedBy = user.id
      articles[idx].reviewComment = comment || 'Approved'

      auditLogs.push({
        id: generateAuditId(),
        targetType: 'article',
        targetId: id,
        oldValue: 'pending',
        newValue: 'published',
        action: 'published',
        performedBy: user.id,
        performedByName: user.name,
        note: comment,
        createdAt: new Date().toISOString(),
      })
    } else if (action === 'reject') {
      articles[idx].status = 'rejected'
      articles[idx].reviewedBy = user.id
      articles[idx].reviewComment = comment || 'Rejected'
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "approve" or "reject"' }, { status: 400 })
    }

    writeDataFile('articles.json', articles)
    writeDataFile('audit_log.json', auditLogs)

    return NextResponse.json({ article: articles[idx] })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}