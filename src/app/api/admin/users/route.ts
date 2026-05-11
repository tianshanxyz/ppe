import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import {
  readDataFile, writeDataFile, generateId,
  getCurrentUser, isAdmin,
  UserRecord
} from '@/lib/data-store'

export async function GET(request: NextRequest) {
  const user = getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const users = readDataFile<UserRecord>('users.json')
  const safeUsers = users.map(u => {
    const { passwordHash, ...safe } = u
    return safe
  })

  return NextResponse.json({ users: safeUsers })
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
    const { id, role, membership, name, company, password } = await request.json()

    const users = readDataFile<UserRecord>('users.json')
    const idx = users.findIndex(u => u.id === id)

    if (idx === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (role && ['admin', 'editor', 'user', 'vip'].includes(role)) {
      users[idx].role = role
    }
    if (membership && ['free', 'professional', 'enterprise'].includes(membership)) {
      users[idx].membership = membership
    }
    if (name) users[idx].name = name
    if (company !== undefined) users[idx].company = company
    if (password && password.length >= 6) {
      users[idx].passwordHash = await bcrypt.hash(password, 12)
    }

    writeDataFile('users.json', users)

    const { passwordHash, ...safe } = users[idx]
    return NextResponse.json({ user: safe })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const user = getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isAdmin(user)) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }

  const users = readDataFile<UserRecord>('users.json')
  const idx = users.findIndex(u => u.id === id)

  if (idx === -1) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (users[idx].role === 'admin') {
    return NextResponse.json({ error: 'Cannot delete admin accounts' }, { status: 403 })
  }

  users.splice(idx, 1)
  writeDataFile('users.json', users)

  return NextResponse.json({ success: true })
}