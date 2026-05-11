import { NextRequest, NextResponse } from 'next/server'
import {
  readDataFile, writeDataFile, generateId,
  getCurrentUser, isEditor, isAdmin,
  UserRecord, ArticleRecord, AuditLogRecord, generateAuditId
} from '@/lib/data-store'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const category = searchParams.get('category')
  const authorId = searchParams.get('authorId')

  let articles = readDataFile<ArticleRecord>('articles.json')

  // For non-published articles, require authentication
  const requestedStatus = status || 'published'
  if (requestedStatus !== 'published') {
    const user = getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    // Only allow editors/admins to see pending articles, or the author to see their own
    if (requestedStatus === 'pending' && !isEditor(user)) {
      if (!authorId || authorId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
    if (!status) {
      // If no status filter, show published only for public
      articles = articles.filter(a => a.status === 'published')
    } else {
      articles = articles.filter(a => a.status === status)
    }
  } else {
    articles = articles.filter(a => a.status === 'published')
  }

  if (category) {
    articles = articles.filter(a => a.category === category)
  }
  if (authorId) {
    articles = articles.filter(a => a.authorId === authorId)
  }

  articles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return NextResponse.json({ articles })
}

export async function POST(request: NextRequest) {
  const user = getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isEditor(user)) {
    return NextResponse.json({ error: 'Only editors and admins can create articles' }, { status: 403 })
  }

  try {
    const { title, title_zh, content, content_zh, category, tags } = await request.json()

    if (!title || !content || !category) {
      return NextResponse.json({ error: 'Title, content and category are required' }, { status: 400 })
    }

    const article: ArticleRecord = {
      id: generateId('article'),
      title,
      title_zh,
      content,
      content_zh,
      authorId: user.id,
      authorName: user.name,
      status: 'pending',
      category,
      tags: tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const articles = readDataFile<ArticleRecord>('articles.json')
    articles.push(article)
    writeDataFile('articles.json', articles)

    return NextResponse.json({ article }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const user = getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id, title, title_zh, content, content_zh, category, tags } = await request.json()
    const articles = readDataFile<ArticleRecord>('articles.json')
    const idx = articles.findIndex(a => a.id === id)

    if (idx === -1) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    if (articles[idx].authorId !== user.id && !isAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (title) articles[idx].title = title
    if (title_zh !== undefined) articles[idx].title_zh = title_zh
    if (content) articles[idx].content = content
    if (content_zh !== undefined) articles[idx].content_zh = content_zh
    if (category) articles[idx].category = category
    if (tags) articles[idx].tags = tags
    articles[idx].updatedAt = new Date().toISOString()
    articles[idx].status = 'pending'

    writeDataFile('articles.json', articles)
    return NextResponse.json({ article: articles[idx] })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const user = getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Article ID required' }, { status: 400 })
  }

  const articles = readDataFile<ArticleRecord>('articles.json')
  const idx = articles.findIndex(a => a.id === id)

  if (idx === -1) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 })
  }

  if (articles[idx].authorId !== user.id && !isAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  articles.splice(idx, 1)
  writeDataFile('articles.json', articles)

  return NextResponse.json({ success: true })
}