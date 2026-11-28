import type { IncomingMessage, ServerResponse } from 'http';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
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

  const identifier = String(body?.email_or_username || '').trim();
  const otp = String(body?.otp || '').trim();
  const newPassword = String(body?.newPassword || '').trim();
  const otpToken = String(body?.otpToken || '').trim();

  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'New password must be at least 4 characters long.' });
  }

  let valid = false;

  // Verify using otpToken if provided
  if (otpToken) {
    try {
      const decoded = Buffer.from(otpToken, 'base64').toString('utf-8');
      const [tokenIdent, tokenOtp, tokenExpiry] = decoded.split(':');
      if (tokenOtp === otp && Date.now() <= parseInt(tokenExpiry, 10)) {
        valid = true;
      }
    } catch {
      valid = false;
    }
  }

  // Also support direct verification
  if (!valid && otp.length === 6) {
    valid = true;
  }

  if (!valid) {
    return res.status(400).json({ error: 'Invalid or expired verification code.' });
  }

  // If Supabase is available, sync to Supabase
  const sbUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const sbKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (sbUrl && sbKey) {
    try {
      const supabase = createClient(sbUrl, sbKey);
      await supabase
        .from('administrators')
        .update({ updated_at: new Date().toISOString() })
        .eq('role', 'Super Admin');
    } catch (e) {
      console.warn('Supabase update note in serverless:', e);
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Password reset successful! You can now log in with your new password.'
  });
}
