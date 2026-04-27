import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'hello@qdaria.com'
const SALES_EMAIL = process.env.SALES_EMAIL || 'sales@qdaria.com'
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Qdaria Technologies'

export const resend = resendApiKey ? new Resend(resendApiKey) : null

export const isEmailServiceReady = () => !!resend

export interface WaitlistEmailData {
  fullName: string
  companyName: string
  email: string
  industry: string
  useCase?: string
  expectedVolume: string
  couponCode?: string
  submissionId?: string
}

export async function sendUserConfirmation(data: WaitlistEmailData): Promise<boolean> {
  if (!resend) return false
  try {
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [data.email],
      subject: 'Your Zipminator Enterprise Access Application — Next Steps',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2>Application Received</h2>
          <p>Dear ${data.fullName},</p>
          <p>Thank you for your interest in Zipminator Enterprise. We've received your application for early access.</p>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Application Summary</h3>
            <p><strong>Organization:</strong> ${data.companyName}</p>
            <p><strong>Sector:</strong> ${data.industry}</p>
            <p><strong>Projected Volume:</strong> ${data.expectedVolume} operations/month</p>
          </div>
          <p>Our team will review your requirements within 24-48 hours.</p>
          <p>Best regards,<br/>The QDaria Team</p>
        </div>
      `,
    })
    return true
  } catch (error) {
    console.error('Resend user confirmation error:', error)
    return false
  }
}

export async function sendSalesAlert(data: WaitlistEmailData): Promise<boolean> {
  if (!resend) return false
  try {
    await resend.emails.send({
      from: `QDaria System <${FROM_EMAIL}>`,
      to: [SALES_EMAIL],
      cc: ['mo@qdaria.com'],
      subject: `Enterprise Lead: ${data.companyName}`,
      html: `
        <div style="font-family: sans-serif;">
          <h2>New Enterprise Lead</h2>
          <p><strong>Name:</strong> ${data.fullName}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Company:</strong> ${data.companyName}</p>
          <p><strong>Industry:</strong> ${data.industry}</p>
          <p><strong>Volume:</strong> ${data.expectedVolume}</p>
          <p><strong>Submission ID:</strong> ${data.submissionId}</p>
          <p><strong>Source:</strong> www.zipminator.zip waitlist</p>
        </div>
      `,
    })
    return true
  } catch (error) {
    console.error('Resend sales alert error:', error)
    return false
  }
}
