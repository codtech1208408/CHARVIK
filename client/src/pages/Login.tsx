import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

export const Login: React.FC = () => {
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const { success } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUser || !password) {
      setErrorMessage('Please enter both your email or username and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await login(emailOrUser, password);
      success('Logged in successfully. Welcome back!');
      navigate('/admin/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid credentials. Please verify your login details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmailOrUser('admin@charvik.com');
    setPassword('admin123');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative navy gradient shapes in background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#142B4A]/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Logo and Brand */}
        <div className="text-center flex flex-col items-center">
          <div className="w-72 h-32 rounded-2xl bg-white p-3 shadow-xl border border-slate-200/80 mb-2 flex items-center justify-center">
            <img
              src="/logo.jpg"
              alt="Charvik Staffing Consultancy Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mt-3 border border-blue-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Authorized Fleet Administration Portal</span>
          </div>
        </div>

        {/* Card */}
        <div className="mt-6 bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-200/80">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 leading-relaxed animate-in fade-in">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
                Email or Username
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={emailOrUser}
                  onChange={(e) => setEmailOrUser(e.target.value)}
                  placeholder="admin@charvik.com"
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
                    <span>Sign In to Dashboard</span>
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
              <span>Auto-Fill Demo Credentials (admin@charvik.com)</span>
            </button>
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              Secured with Argon2 / bcrypt hashing & role-based authorization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
