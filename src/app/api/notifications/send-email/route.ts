import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, sendWelcomeEmail, sendCertificateExpiryReminder, sendComplianceCheckReport } from '@/lib/email/service'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    
    const supabase = await createClient()
    
    // 验证用户身份
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, to, data } = body

    let result

    switch (type) {
      case 'welcome':
        result = await sendWelcomeEmail(to, data.name)
        break
      case 'certificate_expiry':
        result = await sendCertificateExpiryReminder(
          to,
          data.certificateNumber,
          data.productName,
          data.daysUntilExpiry
        )
        break
      case 'compliance_report':
        result = await sendComplianceCheckReport(
          to,
          data.productName,
          data.targetMarket,
          data.reportUrl
        )
        break
      default:
        result = await sendEmail({
          to,
          subject: data.subject,
          html: data.html,
          text: data.text,
        })
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
