import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const USERS_FILE = path.join(process.cwd(), 'src', 'data', 'users.json');

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'ppe_salt_2026').digest('hex');
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
    
    // Validation
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    
    const users = readUsers();
    
    // Check if email exists
    if (users.find((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    
    // Create user
    const newUser = {
      id: 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      name,
      company: company || '',
      role: 'user',
      membership: 'free',
      createdAt: new Date().toISOString(),
    };
    
    users.push(newUser);
    writeUsers(users);
    
    // Return user without password
    const { passwordHash, ...userWithoutPassword } = newUser;
    return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
