import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { readDataFile, generateToken } from '@/lib/data-store';
import type { UserRecord } from '@/lib/data-store';

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }
    
    const users = readDataFile<UserRecord>('users.json');
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    
    const { passwordHash, ...userWithoutPassword } = user;
    const token = generateToken(user);
    return NextResponse.json({ user: userWithoutPassword, token });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
