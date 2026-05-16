import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'src', 'data')

export function readDataFile<T = any>(filename: string): T[] {
  try {
    const filePath = path.join(DATA_DIR, filename)
    const data = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(data) as T[]
  } catch {
    return []
  }
}

export function writeDataFile<T = any>(filename: string, data: T[]): void {
  const filePath = path.join(DATA_DIR, filename)
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`
}

export function generateAuditId(): string {
  return `audit_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`
}

export interface UserRecord {
  id: string
  email: string
  passwordHash: string
  name: string
  company: string
  role: 'admin' | 'editor' | 'user' | 'vip'
  membership: 'free' | 'professional' | 'enterprise'
  createdAt: string
}

export interface ArticleRecord {
  id: string
  title: string
  title_zh?: string
  content: string
  content_zh?: string
  authorId: string
  authorName: string
  status: 'draft' | 'pending' | 'published' | 'rejected'
  category: string
  tags: string[]
  createdAt: string
  updatedAt: string
  publishedAt?: string
  reviewedBy?: string
  reviewComment?: string
}

export interface ContentChangeRecord {
  id: string
  targetType: 'product' | 'company'
  targetId: string
  targetName: string
  fieldName: string
  oldValue: any
  newValue: any
  submittedBy: string
  submittedByName: string
  status: 'pending' | 'approved' | 'rejected' | 'rolled_back'
  createdAt: string
  reviewedAt?: string
  reviewedBy?: string
  reviewComment?: string
  rollbackId?: string
}

export interface AuditLogRecord {
  id: string
  changeId?: string
  targetType: 'product' | 'company' | 'article'
  targetId: string
  fieldName?: string
  oldValue: any
  newValue: any
  action: 'approved' | 'rolled_back' | 'published'
  performedBy: string
  performedByName: string
  note?: string
  createdAt: string
}

export function getCurrentUser(request: Request): UserRecord | null {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null
    
    const token = authHeader.substring(7)
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const parts = decoded.split(':')
    if (parts.length < 2) return null
    
    const email = parts[0]
    const userId = parts[1]
    
    return {
      id: userId,
      email: email,
      passwordHash: '',
      name: '',
      company: '',
      role: 'user',
      membership: 'free',
      createdAt: new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export function generateToken(user: UserRecord): string {
  const payload = `${user.email}:${user.id}`
  return Buffer.from(payload).toString('base64')
}

export function isAdmin(user: UserRecord | null): boolean {
  return user?.role === 'admin'
}

export function isEditor(user: UserRecord | null): boolean {
  return user?.role === 'editor' || user?.role === 'admin'
}

export function canEditContent(user: UserRecord | null): boolean {
  return user?.role === 'user' || user?.role === 'vip' || user?.role === 'editor' || user?.role === 'admin'
}