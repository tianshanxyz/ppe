import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { readDataFile, writeDataFile, generateId, generateToken } from '@/lib/data-store';
import type { UserRecord } from '@/lib/data-store';

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, company } = await request.json();
    
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    if (password.length > 128) {
      return NextResponse.json({ error: 'Password too long' }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const users = readDataFile<UserRecord>('users.json');
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    
    const hashedPassword = await hashPassword(password);
    const newUser: UserRecord = {
      id: generateId('user'),
      email: email.toLowerCase().trim(),
      passwordHash: hashedPassword,
      name: name.trim().substring(0, 100),
      company: (company || '').trim().substring(0, 200),
      role: 'user',
      membership: 'free',
      createdAt: new Date().toISOString(),
    };
    
    users.push(newUser);
    writeDataFile('users.json', users);
    
    const { passwordHash, ...userWithoutPassword } = newUser;
    const token = generateToken(newUser);
    return NextResponse.json({ user: userWithoutPassword, token }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}