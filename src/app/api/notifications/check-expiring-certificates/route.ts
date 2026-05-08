import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { sendCertificateExpiryReminder } from '@/lib/email/service'

// 这个路由应该由定时任务调用（如 Vercel Cron）
export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      return NextResponse.json(
        { error: 'Cron service not configured' },
        { status: 503 }
      )
    }
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    
    const supabase = await createClient()

    // 获取即将到期的证书（30天、7天、1天）
    const today = new Date()
    const thirtyDaysFromNow = new Date(today)
    thirtyDaysFromNow.setDate(today.getDate() + 30)
    
    const sevenDaysFromNow = new Date(today)
    sevenDaysFromNow.setDate(today.getDate() + 7)

    const oneDayFromNow = new Date(today)
    oneDayFromNow.setDate(today.getDate() + 1)

    // 查询即将到期的证书
    const { data: expiringCerts, error } = await supabase
      .from('compliance_certificates')
      .select(`
        *,
        user:user_id (email, full_name)
      `)
      .in('status', ['active', 'valid'])
      .or(`expiry_date.lte.${thirtyDaysFromNow.toISOString()},expiry_date.lte.${sevenDaysFromNow.toISOString()},expiry_date.lte.${oneDayFromNow.toISOString()}`)
      .not('notification_sent', 'eq', true)

    if (error) {
      console.error('Error fetching expiring certificates:', error)
      return NextResponse.json(
        { error: 'Failed to fetch certificates' },
        { status: 500 }
      )
    }

    const results = []

    for (const cert of expiringCerts || []) {
      const expiryDate = new Date(cert.expiry_date)
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      // 只在特定时间点发送提醒：30天、7天、1天
      if ([30, 7, 1].includes(daysUntilExpiry)) {
        const result = await sendCertificateExpiryReminder(
          cert.user.email,
          cert.certificate_number,
          cert.product_name,
          daysUntilExpiry
        )

        if (result.success) {
          // 标记通知已发送
          await supabase
            .from('compliance_certificates')
            .update({ notification_sent: true })
            .eq('id', cert.id)
        }

        results.push({
          certificateId: cert.id,
          email: cert.user.email,
          daysUntilExpiry,
          sent: result.success,
          error: result.error,
        })
      }
    }

    return NextResponse.json({
      success: true,
      checked: expiringCerts?.length || 0,
      notificationsSent: results.filter(r => r.sent).length,
      results,
    })
  } catch (error) {
    console.error('Error checking expiring certificates:', error)
    return NextResponse.json(
      { error: 'Failed to check certificates' },
      { status: 500 }
    )
  }
}
