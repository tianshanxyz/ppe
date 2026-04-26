import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email/service'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email, name } = body

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      )
    }

    if (email !== user.email) {
      return NextResponse.json(
        { error: 'Email must match authenticated user' },
        { status: 403 }
      )
    }

    const result = await sendWelcomeEmail(email, name)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    await supabase.from('email_logs').insert({
      email,
      type: 'welcome',
      status: 'sent',
      sent_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return NextResponse.json(
      { error: 'Failed to send welcome email' },
      { status: 500 }
    )
  }
}
