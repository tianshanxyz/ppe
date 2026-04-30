import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@mdlooker.com'

let resend: Resend | null = null

if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY)
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

export interface EmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('Resend not configured, email not sent')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html || '',
      text: options.text,
    })

    if (error) {
      console.error('Failed to send email:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Error sending email:', err)
    return { success: false, error: 'Failed to send email' }
  }
}

export async function sendWelcomeEmail(email: string, name: string): Promise<{ success: boolean; error?: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #339999 0%, #2d8b8b 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to MDLooker!</h1>
      </div>
      <div style="padding: 40px 20px; background: #ffffff;">
        <h2 style="color: #333; margin-top: 0;">Hi ${escapeHtml(name)},</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Thank you for joining MDLooker - your trusted partner for PPE compliance.
        </p>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          With your free account, you can:
        </p>
        <ul style="color: #666; font-size: 16px; line-height: 1.8;">
          <li>Perform 3 free compliance checks per month</li>
          <li>Access our complete regulation knowledge base</li>
          <li>Receive email updates on compliance changes</li>
          <li>Track your certification status</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/market-access" 
             style="background: #339999; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Start Your First Check
          </a>
        </div>
        <p style="color: #999; font-size: 14px; margin-top: 30px;">
          If you have any questions, reply to this email or contact our support team.
        </p>
      </div>
      <div style="background: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 12px;">
        <p>© 2026 MDLooker. All rights reserved.</p>
        <p>PPE Compliance Platform</p>
      </div>
    </div>
  `

  return sendEmail({
    to: email,
    subject: 'Welcome to MDLooker - Your PPE Compliance Partner',
    html,
  })
}

export async function sendCertificateExpiryReminder(
  email: string,
  certificateNumber: string,
  productName: string,
  daysUntilExpiry: number
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #ff6b6b; padding: 30px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Certificate Expiry Alert</h1>
      </div>
      <div style="padding: 40px 20px; background: #ffffff;">
        <h2 style="color: #333; margin-top: 0;">Certificate Expiring Soon</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Your certificate for <strong>${escapeHtml(productName)}</strong> is expiring in <strong>${escapeHtml(String(daysUntilExpiry))} days</strong>.
        </p>
        <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;">
            <strong>Certificate Number:</strong> ${escapeHtml(certificateNumber)}<br>
            <strong>Product:</strong> ${escapeHtml(productName)}<br>
            <strong>Days Remaining:</strong> ${escapeHtml(String(daysUntilExpiry))}
          </p>
        </div>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Please take action to renew your certificate before it expires to maintain compliance.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/certificates" 
             style="background: #339999; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            View Certificates
          </a>
        </div>
      </div>
      <div style="background: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 12px;">
        <p>© 2026 MDLooker. All rights reserved.</p>
      </div>
    </div>
  `

  return sendEmail({
    to: email,
    subject: `⚠️ Certificate Expiring in ${daysUntilExpiry} Days - Action Required`,
    html,
  })
}

export async function sendComplianceCheckReport(
  email: string,
  productName: string,
  targetMarket: string,
  reportUrl: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #339999 0%, #2d8b8b 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Compliance Check Complete</h1>
      </div>
      <div style="padding: 40px 20px; background: #ffffff;">
        <h2 style="color: #333; margin-top: 0;">Your Compliance Report is Ready</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          We've completed the compliance check for <strong>${escapeHtml(productName)}</strong> targeting the <strong>${escapeHtml(targetMarket)}</strong> market.
        </p>
        <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 6px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0; color: #155724;">
            <strong>Product:</strong> ${escapeHtml(productName)}<br>
            <strong>Target Market:</strong> ${escapeHtml(targetMarket)}<br>
            <strong>Check Date:</strong> ${new Date().toLocaleDateString()}
          </p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${reportUrl}" 
             style="background: #339999; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            View Full Report
          </a>
        </div>
        <p style="color: #999; font-size: 14px; margin-top: 30px;">
          You can also access this report from your dashboard at any time.
        </p>
      </div>
      <div style="background: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 12px;">
        <p>© 2026 MDLooker. All rights reserved.</p>
      </div>
    </div>
  `

  return sendEmail({
    to: email,
    subject: `Compliance Report Ready - ${productName}`,
    html,
  })
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #339999 0%, #2d8b8b 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset Request</h1>
      </div>
      <div style="padding: 40px 20px; background: #ffffff;">
        <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          We received a request to reset your password. Click the button below to create a new password.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background: #339999; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="color: #999; font-size: 14px; margin-top: 30px;">
          If you didn't request this, you can safely ignore this email. The link will expire in 24 hours.
        </p>
      </div>
      <div style="background: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 12px;">
        <p>© 2026 MDLooker. All rights reserved.</p>
      </div>
    </div>
  `

  return sendEmail({
    to: email,
    subject: 'Password Reset Request - MDLooker',
    html,
  })
}
