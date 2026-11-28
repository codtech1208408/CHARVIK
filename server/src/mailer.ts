import nodemailer from 'nodemailer';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

export function getSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = port === 465;
  const user = (process.env.SMTP_USER || 'charvikstaffingconsulrancy@gmail.com').trim();
  const pass = (process.env.SMTP_PASSWORD || 'xjxt hfmz wgqt dsgz').replace(/\s+/g, '');
  const from = process.env.SMTP_FROM || `"Charvik Staffing Consultancy" <${user}>`;

  return { host, port, secure, user, pass, from };
}

export function createMailerTransporter() {
  const config = getSmtpConfig();
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

/**
 * Sends a password reset OTP email to the registered administrator
 */
export async function sendPasswordResetOtpEmail(
  toEmail: string,
  otp: string,
  adminName: string = 'Administrator'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = createMailerTransporter();
    const config = getSmtpConfig();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Charvik Password Reset</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.07); border: 1px solid #e2e8f0;">
          
          <!-- Top Navy Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #032B69 0%, #004B9E 50%, #0072E5 100%); padding: 28px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase;">
                CHARVIK STAFFING CONSULTANCY
              </h1>
              <p style="color: #bae6fd; margin: 6px 0 0 0; font-size: 12px; font-weight: 600; letter-spacing: 0.5px;">
                FLEET &amp; EMPLOYEE MANAGEMENT SYSTEM
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 30px 24px 30px;">
              <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">
                Password Reset Request
              </h2>
              
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
                Hello <strong>${adminName}</strong>,
              </p>

              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
                We received a request to reset the password for your <strong>Charvik Admin Account</strong>. Use the 6-digit verification code below to complete your password reset:
              </p>

              <!-- OTP Code Display Card -->
              <div style="background-color: #f8fafc; border: 2px dashed #0284c7; border-radius: 14px; padding: 22px 16px; text-align: center; margin: 0 0 24px 0;">
                <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #0369a1; letter-spacing: 1px; display: block; margin-bottom: 8px;">
                  Your One-Time Password (OTP)
                </span>
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 900; color: #032B69; letter-spacing: 8px; display: inline-block;">
                  ${otp}
                </span>
                <span style="display: block; font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 600;">
                  ⏳ This code expires in <strong>15 minutes</strong>
                </span>
              </div>

              <!-- Security Information Note -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 14px; border-radius: 6px; margin: 0 0 24px 0;">
                <p style="margin: 0; font-size: 12px; color: #92400e; line-height: 1.5;">
                  <strong>Security Note:</strong> Do not share this OTP with anyone. Charvik Support will never ask for your password or verification code. If you did not request this password reset, please ignore this email.
                </p>
              </div>

              <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0;">
                Best regards,<br>
                <strong style="color: #0f172a;">Charvik Fleet Administration Security Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 30px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
              <p style="margin: 0 0 4px 0;">
                Charvik Staffing Consultancy &bull; Phone: +91 9505151527 &bull; Hyderabad, Telangana
              </p>
              <p style="margin: 0;">
                This is an automated administrative notification. Replies to this email are routed to ${config.user}.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const info = await transporter.sendMail({
      from: config.from,
      to: toEmail,
      subject: `Charvik Admin - Password Reset Verification Code: ${otp}`,
      html: htmlContent,
      text: `Hello ${adminName},\n\nYour Charvik Admin password reset OTP is: ${otp}\n\nThis code will expire in 15 minutes.\n\nIf you did not request this, please ignore this email.`
    });

    console.log(`[SMTP] Password reset OTP sent to ${toEmail}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error('[SMTP] Failed to send password reset email:', err);
    return { success: false, error: err.message || 'Failed to send reset email' };
  }
}
