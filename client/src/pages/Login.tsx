import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Mail, Phone, Eye, EyeOff, ShieldCheck, ArrowRight, Compass, Users, Info, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

interface LoginProps {
  defaultRole?: 'Admin' | 'Captain' | 'Supporter';
}

export const Login: React.FC<LoginProps> = ({ defaultRole }) => {
  const [searchParams] = useSearchParams();
  const urlRole = searchParams.get('role');

  const initialRole: 'Admin' | 'Captain' | 'Supporter' =
    defaultRole ||
    (urlRole === 'captain' ? 'Captain' : urlRole === 'supporter' ? 'Supporter' : 'Admin');

  const [selectedRole, setSelectedRole] = useState<'Admin' | 'Captain' | 'Supporter'>(initialRole);
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login, logout, user } = useAuth();
  const navigate = useNavigate();
  const { success } = useToast();

  useEffect(() => {
    if (defaultRole) {
      setSelectedRole(defaultRole);
    } else if (urlRole === 'captain') {
      setSelectedRole('Captain');
    } else if (urlRole === 'supporter') {
      setSelectedRole('Supporter');
    }
  }, [defaultRole, urlRole]);

  // If already logged in, seamlessly forward directly to dashboard
  useEffect(() => {
    if (user) {
      const normalizedRole = (user.role || '').toLowerCase();
      if (normalizedRole.includes('captain')) {
        navigate('/captain/dashboard', { replace: true });
      } else if (normalizedRole.includes('support') || normalizedRole.includes('helper')) {
        navigate('/supporter/dashboard', { replace: true });
      } else {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

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
      const roleName = loggedUser?.role || selectedRole;
      success(`Welcome to Charvik Fleet Management! Logged in as ${roleName}.`);
      
      const normalizedRole = (loggedUser?.role || selectedRole).toLowerCase();
      if (normalizedRole.includes('captain')) {
        navigate('/captain/dashboard');
      } else if (normalizedRole.includes('support') || normalizedRole.includes('helper')) {
        navigate('/supporter/dashboard');
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
    } else if (selectedRole === 'Supporter') {
      setEmailOrUser('supporter@charvik.com');
      setPassword('supporter123');
    } else {
      setEmailOrUser('admin@charvik.com');
      setPassword('admin123');
    }
    setErrorMessage('');
  };

  const getRoleTheme = () => {
    switch (selectedRole) {
      case 'Captain':
        return {
          title: 'Captain & Route Lead Portal',
          badgeText: 'Fleet Captain Portal',
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
          icon: Compass,
          notice: 'Authorized Route Captain Portal. Please log in using your registered mobile number and password provided by Fleet Admin.',
          emailPlaceholder: 'e.g. 9701055555 (Registered Mobile)'
        };
      case 'Supporter':
        return {
          title: 'Support Staff & Crew Portal',
          badgeText: 'Supporter & Crew Portal',
          badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          icon: Users,
          notice: 'Notice: Supporter login credentials are created directly by Admin. Please enter your authorized username or email and password.',
          emailPlaceholder: 'supporter@charvik.com'
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

        {/* Logo and Brand */}
        <div className="text-center flex flex-col items-center">
          <div className="w-72 h-28 rounded-2xl bg-white p-3 shadow-xl border border-slate-200/80 mb-2 flex items-center justify-center">
            <img
              src="/logo.jpg"
              alt="Charvik Staffing Consultancy Logo"
              className="w-full h-full object-contain"
            />
          </div>

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
                  ? 'Registered Mobile Number'
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
                    <span>Sign In as {selectedRole}</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Credentials Fill Button */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col items-center">
            <button
              type="button"
              onClick={handleDemoFill}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/80 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <span>Auto-Fill Demo Credentials ({currentTheme.emailPlaceholder})</span>
            </button>
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              Protected portal with secure encrypted tokens & role verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
