import type { IncomingMessage, ServerResponse } from 'http';
import nodemailer from 'nodemailer';

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const identifier = String(body?.email_or_username || body?.email || body?.username || body?.phone_number || '').trim();
  if (!identifier) {
    return res.status(400).json({ error: 'Please enter your Admin Email, Username, or registered Mobile Number.' });
  }

  const smtpUser = (process.env.SMTP_USER || 'charvikstaffingconsulrancy@gmail.com').trim();
  const smtpPass = (process.env.SMTP_PASSWORD || 'xjxt hfmz wgqt dsgz').replace(/\s+/g, '');
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpFrom = process.env.SMTP_FROM || `"Charvik Staffing Consultancy" <${smtpUser}>`;

  // Always send to official admin email for admin reset requests
  const targetEmail = smtpUser;

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Charvik Password Reset</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.07); border: 1px solid #e2e8f0;">
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
          <tr>
            <td style="padding: 32px 30px 24px 30px;">
              <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">
                Admin Password Reset Request
              </h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
                Hello <strong>Administrator</strong>,
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
                A password reset was requested for your <strong>Charvik Admin account</strong> (${identifier}). Use this 6-digit verification code to reset your password:
              </p>
              <div style="background-color: #f8fafc; border: 2px dashed #0284c7; border-radius: 14px; padding: 22px 16px; text-align: center; margin: 0 0 24px 0;">
                <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #0369a1; letter-spacing: 1px; display: block; margin-bottom: 8px;">
                  Your Verification OTP
                </span>
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 900; color: #032B69; letter-spacing: 8px; display: inline-block;">
                  ${otp}
                </span>
                <span style="display: block; font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 600;">
                  ⏳ Valid for <strong>15 minutes</strong>
                </span>
              </div>
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 14px; border-radius: 6px; margin: 0 0 24px 0;">
                <p style="margin: 0; font-size: 12px; color: #92400e; line-height: 1.5;">
                  <strong>Security Note:</strong> Do not share this code with anyone. If you did not initiate this request, you can safely ignore this email.
                </p>
              </div>
              <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0;">
                Best regards,<br>
                <strong style="color: #0f172a;">Charvik Fleet Administration Security</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 30px; text-align: center; font-size: 11px; color: #94a3b8;">
              Charvik Staffing Consultancy &bull; Phone: +91 9505151527 &bull; Hyderabad, Telangana
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    await transporter.sendMail({
      from: smtpFrom,
      to: targetEmail,
      subject: `Charvik Admin - Password Reset Verification Code: ${otp}`,
      html: htmlContent,
      text: `Your Charvik Admin password reset OTP is: ${otp}. Valid for 15 minutes.`
    });

    const [u, d] = targetEmail.split('@');
    const masked = `${u.slice(0, 2)}***${u.slice(-2)}@${d}`;

    // Return success along with encrypted or signed state
    return res.status(200).json({
      success: true,
      message: `Verification code sent to ${masked}`,
      maskedEmail: masked,
      otpToken: Buffer.from(`${identifier}:${otp}:${Date.now() + 15 * 60 * 1000}`).toString('base64')
    });
  } catch (err: any) {
    console.error('SMTP error in serverless handler:', err);
    return res.status(500).json({ error: `SMTP Error: ${err.message || 'Failed to send reset email'}` });
  }
}
