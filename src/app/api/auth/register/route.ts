import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const USERS_FILE = path.join(process.cwd(), 'src', 'data', 'users.json');

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

function readUsers(): any[] {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeUsers(users: any[]): void {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
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

    const users = readUsers();
    
    if (users.find((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    
    const hashedPassword = await hashPassword(password);
    const newUser = {
      id: 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
      email: email.toLowerCase().trim(),
      passwordHash: hashedPassword,
      name: name.trim().substring(0, 100),
      company: (company || '').trim().substring(0, 200),
      role: 'user',
      membership: 'free',
      createdAt: new Date().toISOString(),
    };
    
    users.push(newUser);
    writeUsers(users);
    
    const { passwordHash, ...userWithoutPassword } = newUser;
    return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
