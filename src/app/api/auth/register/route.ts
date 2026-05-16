import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createServiceClient } from '@/lib/supabase/service-client';
import { generateId, generateToken } from '@/lib/data-store';

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

    const supabase = createServiceClient();

    // Check if email already exists
    const { data: existing } = await supabase
      .from('mdlooker_users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    const userId = generateId('user');

    const newUser = {
      id: userId,
      email: email.toLowerCase().trim(),
      password_hash: hashedPassword,
      name: name.trim().substring(0, 100),
      company: (company || '').trim().substring(0, 200),
      role: 'user',
      membership: 'free',
    };

    const { error: insertError } = await supabase
      .from('mdlooker_users')
      .insert(newUser);

    if (insertError) {
      console.error('Register insert error:', insertError);
      return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
    }

    const userWithoutPassword = {
      id: userId,
      email: newUser.email,
      name: newUser.name,
      company: newUser.company,
      role: newUser.role,
      membership: newUser.membership,
      createdAt: new Date().toISOString(),
    };

    const token = generateToken(userWithoutPassword as any);
    return NextResponse.json({ user: userWithoutPassword, token }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}