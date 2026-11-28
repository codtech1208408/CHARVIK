import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Mail, Phone, Eye, EyeOff, ShieldCheck, ArrowRight, Compass, Users, Info, ArrowLeft, Key, CheckCircle, X, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';
import { supabase } from '../services/supabase';

interface LoginProps {
  defaultRole?: 'Admin' | 'Captain' | 'Operator';
}

export const Login: React.FC<LoginProps> = ({ defaultRole }) => {
  const [searchParams] = useSearchParams();
  const urlRole = searchParams.get('role');

  const initialRole: 'Admin' | 'Captain' | 'Operator' =
    defaultRole ||
    (urlRole === 'captain' || urlRole === 'manager'
      ? 'Captain'
      : urlRole === 'admin'
      ? 'Admin'
      : 'Operator');

  const [selectedRole, setSelectedRole] = useState<'Admin' | 'Captain' | 'Operator'>(initialRole);
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Forgot & Reset Password Modal States
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3 | 4>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [targetEmailMasked, setTargetEmailMasked] = useState('');

  const { login, logout, user } = useAuth();
  const navigate = useNavigate();
  const { success } = useToast();

  useEffect(() => {
    if (defaultRole) {
      setSelectedRole(defaultRole === ('Supporter' as any) ? 'Operator' : defaultRole);
    } else if (urlRole === 'captain' || urlRole === 'manager') {
      setSelectedRole('Captain');
    } else if (urlRole === 'operator' || urlRole === 'supporter') {
      setSelectedRole('Operator');
    }
  }, [defaultRole, urlRole]);

  // Only auto-forward to dashboard if already logged in with the MATCHING role for this portal
  useEffect(() => {
    if (user) {
      const userRole = (user.role || '').toLowerCase();
      const isAdmin = userRole.includes('admin');
      const isCaptain = userRole.includes('captain');
      const isManager = userRole.includes('manager');
      const isOperator = userRole.includes('support') || userRole.includes('operator');

      if (selectedRole === 'Captain') {
        if (isCaptain) {
          navigate('/captain/dashboard', { replace: true });
        } else if (isManager) {
          navigate('/operator/dashboard', { replace: true });
        }
      } else if (selectedRole === 'Operator' && (isOperator || isManager)) {
        navigate('/operator/dashboard', { replace: true });
      } else if (selectedRole === 'Admin' && isAdmin) {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [user, selectedRole, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUser || !password) {
      setErrorMessage('Please enter both your email or username and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const loggedUser = await login(emailOrUser, password);
      const roleName = loggedUser?.role === 'Support Staff' ? 'Operator' : (loggedUser?.role || selectedRole);
      success(`Welcome to Charvik Fleet Management! Logged in as ${roleName}.`);
      
      const normalizedRole = (loggedUser?.role || selectedRole).toLowerCase();
      if (normalizedRole.includes('captain')) {
        navigate('/captain/dashboard');
      } else if (normalizedRole.includes('manager') || normalizedRole.includes('support') || normalizedRole.includes('operator') || normalizedRole.includes('helper')) {
        navigate('/operator/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid credentials. Please verify your login details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    if (selectedRole === 'Captain') {
      setEmailOrUser('9701055555');
      setPassword('captain123');
    } else if (selectedRole === 'Operator') {
      setEmailOrUser('operator@charvik.com');
      setPassword('operator123');
    }
    setErrorMessage('');
  };

  const handleOpenForgotModal = () => {
    setIsForgotOpen(true);
    setForgotStep(1);
    setForgotOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotError('');
    setForgotSuccessMsg('');
    if (emailOrUser && emailOrUser.trim()) {
      setForgotEmail(emailOrUser.trim());
    } else if (selectedRole === 'Admin') {
      setForgotEmail('charvikstaffingconsulrancy@gmail.com');
    } else if (selectedRole === 'Operator') {
      setForgotEmail('operator@charvik.com');
    } else if (selectedRole === 'Captain') {
      setForgotEmail('captain@charvik.com');
    } else {
      setForgotEmail('');
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError(`Please enter your ${selectedRole === 'Captain' ? 'Captain / Manager' : selectedRole} username, email, or mobile.`);
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await api.forgotPassword({ email_or_username: forgotEmail.trim() });
      setForgotSuccessMsg(res.message || 'OTP verification code sent to your email.');
      if (res.target_email || res.maskedEmail) {
        setTargetEmailMasked(res.target_email || res.maskedEmail);
      }
      if (res.otpToken) {
        sessionStorage.setItem('charvik_reset_otp_token', res.otpToken);
      }
      setForgotStep(2);
    } catch (err: any) {
      setForgotError(err.message || 'Failed to send OTP code. Please check your email and network.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtp.trim()) {
      setForgotError('Please enter the 6-digit OTP verification code.');
      return;
    }
    if (forgotOtp.trim().length !== 6) {
      setForgotError('OTP code must be exactly 6 digits.');
      return;
    }

    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await api.verifyResetOtp({
        email_or_username: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        otpToken: sessionStorage.getItem('charvik_reset_otp_token') || undefined
      });
      setForgotSuccessMsg(res?.message || 'OTP verified successfully! Now set your new password.');
      setForgotStep(3);
    } catch (err: any) {
      setForgotError(err.message || 'Invalid or expired OTP code. Please check your email and try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match. Please re-enter.');
      return;
    }

    setForgotLoading(true);
    setForgotError('');
    try {
      await api.resetPassword({
        email_or_username: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        newPassword: newPassword,
        otpToken: sessionStorage.getItem('charvik_reset_otp_token') || undefined
      });

      // Immediately persist the custom password in local storage & Supabase
      const lower = forgotEmail.toLowerCase();
      let settingKey = 'admin_password';
      let localKey = 'charvik_custom_admin_password';

      if (selectedRole === 'Operator' || lower.includes('operator') || lower.includes('support')) {
        settingKey = 'operator_password';
        localKey = 'charvik_custom_operator_password';
      } else if (selectedRole === 'Captain' || lower.includes('captain') || lower.includes('manager')) {
        settingKey = 'captain_password';
        localKey = 'charvik_custom_captain_password';
      }

      localStorage.setItem(localKey, newPassword);
      try {
        await supabase.from('application_settings').upsert({
          key: settingKey,
          value: newPassword,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
      } catch (syncErr) {
        console.warn('Supabase password persistence note:', syncErr);
      }

      sessionStorage.removeItem('charvik_reset_otp_token');
      setForgotStep(4);
      success(`${selectedRole === 'Captain' ? 'Captain / Manager' : selectedRole} password reset successfully! You can now log in.`);
    } catch (err: any) {
      setForgotError(err.message || 'Failed to reset password. OTP may be invalid or expired.');
    } finally {
      setForgotLoading(false);
    }
  };

  const getRoleTheme = () => {
    switch (selectedRole) {
      case 'Captain':
        return {
          title: 'Captain & Manager Operational Portal',
          badgeText: 'Captain / Manager Portal',
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
          icon: Compass,
          notice: 'Authorized Employee Portal for Captains & Operations Managers. Please log in using your registered username, mobile number, or email and password provided by the Operator.',
          emailPlaceholder: 'e.g. captain_ops, manager@charvik.com, or Mobile'
        };
      case 'Operator':
        return {
          title: 'Operator Operational Portal',
          badgeText: 'Operator Portal',
          badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          icon: Key,
          notice: 'Notice: Operator login credentials are created directly by Admin in the Admin Panel. Please enter your authorized username or email and password.',
          emailPlaceholder: 'operator@charvik.com or Username'
        };
      default:
        return {
          title: 'Fleet Administration Portal',
          badgeText: 'Super Admin & Management Portal',
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: ShieldCheck,
          notice: null,
          emailPlaceholder: 'admin@charvik.com'
        };
    }
  };

  const currentTheme = getRoleTheme();
  const ThemeIcon = currentTheme.icon;

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative gradient shapes in background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#142B4A]/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Back to Home Link */}
        <div className="mb-4 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#142B4A] transition-colors bg-white/80 px-3.5 py-1.5 rounded-full shadow-xs border border-slate-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Public Website</span>
          </Link>
        </div>

        {/* Logo and Brand - Clean without box, matching Admin Dashboard */}
        <div className="text-center flex flex-col items-center">
          <Link to="/" className="flex items-center justify-center transition-transform hover:scale-[1.02] mb-2 cursor-pointer" title="Charvik Staffing Consultancy">
            <img
              src="/logo-navbar.png?v=20261119_clean_v6"
              alt="Charvik Staffing Consultancy Logo"
              className="h-24 sm:h-28 w-auto max-w-[340px] object-contain drop-shadow-xs"
            />
          </Link>

          {/* Portal Title Badge (Dedicated per portal - no /admin shown on captain or supporter) */}
          <div className="mt-3.5 flex items-center justify-center">
            <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold shadow-xs border ${currentTheme.badgeClass}`}>
              <ThemeIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{currentTheme.badgeText}</span>
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="mt-5 bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-200/80">
          {/* Individual Login Role Tabs — Operator & Captain / Manager only */}
          {selectedRole !== 'Admin' && (
            <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-100 rounded-xl mb-6 border border-slate-200/80">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('Operator');
                  setErrorMessage('');
                  setEmailOrUser('');
                  setPassword('');
                }}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  selectedRole === 'Operator'
                    ? 'bg-white text-emerald-800 shadow-sm border border-emerald-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Key className="w-3.5 h-3.5 text-emerald-600" />
                <span>Operator</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('Captain');
                  setErrorMessage('');
                  setEmailOrUser('');
                  setPassword('');
                }}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  selectedRole === 'Captain'
                    ? 'bg-white text-amber-900 shadow-sm border border-amber-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-amber-600" />
                <span>Captain / Manager</span>
              </button>
            </div>
          )}

          {/* Admin Credentials Info Notice for Supporter & Captain */}
          {currentTheme.notice && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5 leading-relaxed">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>{currentTheme.notice}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 leading-relaxed animate-in fade-in">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
                {selectedRole === 'Captain'
                  ? 'Username / Mobile / Email'
                  : 'Email / Username'}
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  {selectedRole === 'Captain' ? <Phone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                </div>
                <input
                  type="text"
                  value={emailOrUser}
                  onChange={(e) => setEmailOrUser(e.target.value)}
                  placeholder={currentTheme.emailPlaceholder}
                  className="block w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleOpenForgotModal}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-[#142B4A] hover:bg-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all duration-200 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Sign In as {selectedRole === 'Captain' ? 'Captain / Manager' : selectedRole}</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col items-center">
            <p className="text-[11px] text-slate-400 text-center">
              Protected portal with secure encrypted tokens &amp; role verification.
            </p>
          </div>
        </div>
      </div>

      {/* Forgot / Reset Password Modal */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#142B4A] to-[#1E3A5F] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Key className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">
                    {selectedRole === 'Admin' ? 'Admin' : selectedRole === 'Captain' ? 'Captain / Manager' : 'Operator'} Password Reset
                  </h3>
                  <p className="text-[11px] text-slate-300">Secure SMTP email verification via Gmail</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step Indicators */}
            <div className="px-6 pt-4 pb-2 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs">
              <div className={`flex items-center gap-1.5 font-bold ${forgotStep >= 1 ? 'text-blue-700' : 'text-slate-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${forgotStep > 1 ? 'bg-emerald-600 text-white' : forgotStep === 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {forgotStep > 1 ? '✓' : '1'}
                </span>
                <span>Send OTP</span>
              </div>
              <span className="w-5 h-[1px] bg-slate-200"></span>
              <div className={`flex items-center gap-1.5 font-bold ${forgotStep >= 2 ? 'text-blue-700' : 'text-slate-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${forgotStep > 2 ? 'bg-emerald-600 text-white' : forgotStep === 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {forgotStep > 2 ? '✓' : '2'}
                </span>
                <span>Verify OTP</span>
              </div>
              <span className="w-5 h-[1px] bg-slate-200"></span>
              <div className={`flex items-center gap-1.5 font-bold ${forgotStep >= 3 ? (forgotStep === 4 ? 'text-emerald-700' : 'text-blue-700') : 'text-slate-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${forgotStep === 4 ? 'bg-emerald-600 text-white' : forgotStep === 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {forgotStep === 4 ? '✓' : '3'}
                </span>
                <span>New Password</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {forgotError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 leading-relaxed">
                  {forgotError}
                </div>
              )}

              {/* STEP 1: Enter Email / Username */}
              {forgotStep === 1 && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Enter your {selectedRole === 'Admin' ? 'Admin' : selectedRole === 'Captain' ? 'Captain / Manager' : 'Operator'} username, email address, or registered mobile number. We will send a 6-digit verification code to the registered email address.
                  </p>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {selectedRole === 'Admin' ? 'Admin Email or Username' : selectedRole === 'Captain' ? 'Captain / Manager Username or Mobile' : 'Operator Username or Email'}
                    </label>
                    <div className="relative rounded-xl shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder={
                          selectedRole === 'Admin'
                            ? 'admin@charvik.com or charvikstaffingconsulrancy@gmail.com'
                            : selectedRole === 'Captain'
                            ? 'captain@charvik.com or 9701055555'
                            : 'operator@charvik.com or Username'
                        }
                        className="block w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsForgotOpen(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="px-5 py-2.5 text-xs font-bold text-white bg-[#142B4A] hover:bg-[#1E3A5F] rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {forgotLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Sending OTP...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Verification OTP</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: Enter & Verify 6-Digit OTP */}
              {forgotStep === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
                    <p className="font-semibold">{forgotSuccessMsg || 'Verification code sent!'}</p>
                    <p className="text-[11px] text-blue-700 mt-0.5">
                      Check your Gmail inbox/spam at: <strong>{targetEmailMasked || 'charvikstaffingconsulrancy@gmail.com'}</strong>
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        6-Digit OTP Code
                      </label>
                      <button
                        type="button"
                        onClick={() => handleSendOtp()}
                        disabled={forgotLoading}
                        className="text-[11px] font-semibold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${forgotLoading ? 'animate-spin' : ''}`} />
                        <span>Resend OTP</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="block w-full py-3 text-center text-xl font-mono font-bold tracking-[0.5em] bg-slate-50 border border-slate-300 rounded-xl text-[#142B4A] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-xs"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading || forgotOtp.length !== 6}
                      className="px-5 py-2.5 text-xs font-bold text-white bg-[#142B4A] hover:bg-[#1E3A5F] rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {forgotLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Verifying OTP...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify OTP Code</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: Enter New Password & Confirm Password (Shows ONLY AFTER entering & verifying OTP) */}
              {forgotStep === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 leading-relaxed flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-semibold">OTP Code Verified ({forgotOtp})</p>
                      <p className="text-[11px] text-emerald-700">Now enter and confirm your new password below:</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      New Password
                    </label>
                    <div className="relative rounded-xl shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="block w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                        required
                        minLength={6}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative rounded-xl shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="block w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setForgotStep(2)}
                      className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {forgotLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving New Password...</span>
                        </>
                      ) : (
                        <>
                          <span>Save &amp; Reset Password</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 4: Success Confirmation */}
              {forgotStep === 4 && (
                <div className="text-center py-4 space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">Password Reset Successful!</h4>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Your new {selectedRole === 'Captain' ? 'Captain / Manager' : selectedRole} password is now active. You can immediately log into the portal.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotOpen(false);
                        setEmailOrUser(forgotEmail);
                        setPassword(newPassword);
                      }}
                      className="w-full py-2.5 px-4 text-xs font-bold text-white bg-[#142B4A] hover:bg-[#1E3A5F] rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Proceed to Sign In</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
