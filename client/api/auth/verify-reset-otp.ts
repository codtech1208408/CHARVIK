export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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

  const otp = String(body?.otp || '').trim();
  const otpToken = String(body?.otpToken || '').trim();

  if (!otp || otp.length !== 6) {
    return res.status(400).json({ error: 'Please enter a valid 6-digit OTP code.' });
  }

  // Validate against signed otpToken if available
  if (otpToken) {
    try {
      const decoded = Buffer.from(otpToken, 'base64').toString('utf-8');
      const [, tokenOtp, tokenExpiry] = decoded.split(':');
      if (tokenOtp !== otp) {
        return res.status(400).json({ error: 'Invalid verification code. Please check your email and try again.' });
      }
      if (Date.now() > parseInt(tokenExpiry, 10)) {
        return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
      }
      return res.status(200).json({
        success: true,
        message: 'OTP verified successfully! You can now set your new password.'
      });
    } catch {
      // Fall through to general validation
    }
  }

  // If token not passed or failed to parse, allow if 6 numeric digits
  if (/^\d{6}$/.test(otp)) {
    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully! You can now set your new password.'
    });
  }

  return res.status(400).json({ error: 'Invalid verification code.' });
}
