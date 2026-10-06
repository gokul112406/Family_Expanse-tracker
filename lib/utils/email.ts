import nodemailer from 'nodemailer'

function createTransporter() {
  const user = process.env.EMAIL_USER
  const pass = process.env.EMAIL_PASS

  if (!user || !pass) {
    throw new Error('Email credentials not configured. Set EMAIL_USER and EMAIL_PASS in .env.local')
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })
}

export async function sendInviteEmail({
  toEmail,
  fromName,
  familyName,
  appUrl,
}: {
  toEmail: string
  fromName: string
  familyName: string
  appUrl: string
}) {
  const transporter = createTransporter()
  const signUpUrl = `${appUrl}/sign-up`

  await transporter.sendMail({
    from: `"Family Expense Tracker" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `${fromName} invited you to join "${familyName}" on Family Expense Tracker`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a2e;">You've been invited! 🎉</h2>
        <p style="color: #555; font-size: 16px;">
          <strong>${fromName}</strong> has invited you to join the family group 
          <strong>"${familyName}"</strong> on <strong>Family Expense Tracker</strong>.
        </p>
        <p style="color: #555; font-size: 16px;">
          Family Expense Tracker helps families manage and track shared expenses together.
        </p>
        <div style="margin: 32px 0; text-align: center;">
          <a href="${signUpUrl}" 
             style="background-color: #6c63ff; color: white; padding: 14px 32px; 
                    text-decoration: none; border-radius: 8px; font-size: 16px; 
                    font-weight: bold; display: inline-block;">
            Accept Invite &amp; Sign Up
          </a>
        </div>
        <p style="color: #888; font-size: 13px;">
          Sign up using this email address (<strong>${toEmail}</strong>) and you will 
          automatically be added to the family group.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #aaa; font-size: 12px; text-align: center;">
          Family Expense Tracker &bull; If you did not expect this invite, you can ignore this email.
        </p>
      </div>
    `,
    text: `
${fromName} invited you to join "${familyName}" on Family Expense Tracker.

Click the link below to sign up and automatically join the family group:
${signUpUrl}

Make sure to sign up using this email address: ${toEmail}

If you did not expect this invite, you can ignore this email.
    `,
  })
}
