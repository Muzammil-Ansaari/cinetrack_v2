'use client';

import React, { useState } from 'react';
import { X, Mail, Lock, User, ShieldAlert, LogIn, CheckCircle2, KeyRound, RefreshCw, ArrowLeft, Key } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, login } = useApp();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'signin' | 'signup' | 'otp' | 'forgot' | 'reset_password'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'otp') {
        const res = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: pendingEmail || email, otp }),
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error || 'Invalid verification code. Please check and try again.');
          setLoading(false);
          return;
        }

        login(data.user, data.token);
        showToast('Account verified and logged in successfully!', 'success');
        resetForm();
        return;
      }

      if (mode === 'forgot') {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error || 'Failed to process forgot password request.');
          setLoading(false);
          return;
        }

        setPendingEmail(data.email || email);
        setMode('reset_password');
        setSuccessMsg(data.message || 'Password reset code sent to your email.');
        showToast('Password reset code sent to your email!', 'info');
        setLoading(false);
        return;
      }

      if (mode === 'reset_password') {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: pendingEmail || email,
            otp,
            newPassword,
          }),
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error || 'Failed to reset password.');
          setLoading(false);
          return;
        }

        showToast(data.message || 'Password reset successful! Please sign in.', 'success');
        setSuccessMsg(data.message || 'Password reset successful! You can now sign in.');
        setMode('signin');
        setPassword('');
        setNewPassword('');
        setOtp('');
        setLoading(false);
        return;
      }

      const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const body = mode === 'signup' ? { name, email, password } : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.requiresOtp) {
        setPendingEmail(data.email || email);
        setMode('otp');
        setSuccessMsg(data.message || 'Verification code sent to your email.');
        showToast('Verification code sent to your email!', 'info');
        setLoading(false);
        return;
      }

      if (!res.ok || !data.success) {
        setError(data.error || 'Authentication failed. Please check your credentials.');
        setLoading(false);
        return;
      }

      login(data.user, data.token);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setSuccessMsg('');
    setResending(true);

    try {
      const endpoint = mode === 'reset_password' ? '/api/auth/forgot-password' : '/api/auth/resend-otp';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail || email }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to resend code.');
        setResending(false);
        return;
      }

      setSuccessMsg(data.message || 'A new verification code has been sent.');
      showToast('A new code has been sent to your email.', 'info');
    } catch (err: any) {
      setError(err.message || 'Error resending verification code.');
    } finally {
      setResending(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setNewPassword('');
    setOtp('');
    setPendingEmail('');
    setError('');
    setSuccessMsg('');
    setMode('signin');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {mode !== 'signin' && mode !== 'signup' ? (
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setSuccessMsg('');
                  setMode('signin');
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                title="Back to Sign In"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold">
                C
              </div>
            )}
            <h3 className="text-xl font-extrabold text-white">
              {mode === 'otp'
                ? 'Verify Email'
                : mode === 'forgot'
                ? 'Reset Password'
                : mode === 'reset_password'
                ? 'Set New Password'
                : mode === 'signup'
                ? 'Create Account'
                : 'Welcome Back'}
            </h3>
          </div>
          <button
            onClick={() => {
              resetForm();
              closeAuthModal();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'otp' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                We sent a 6-digit OTP verification code to{' '}
                <strong className="text-white underline">{pendingEmail || email}</strong>. Please enter the code below:
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">6-Digit Verification Code</label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus-within:border-red-500 transition-colors">
                  <KeyRound className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="123456"
                    className="bg-transparent w-full outline-none text-base tracking-widest font-mono text-center placeholder-slate-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400">Didn&apos;t get the code?</span>
                <button
                  type="button"
                  disabled={resending}
                  onClick={handleResendOtp}
                  className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  <span>Resend Code</span>
                </button>
              </div>
            </div>
          ) : mode === 'forgot' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Enter your account email address below. We will send you a 6-digit verification code to reset your password.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus-within:border-red-500 transition-colors">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="bg-transparent w-full outline-none text-sm placeholder-slate-500"
                    required
                  />
                </div>
              </div>
            </div>
          ) : mode === 'reset_password' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                We sent a password reset code to <strong className="text-white underline">{pendingEmail || email}</strong>.
                Enter the code and your new password below:
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">6-Digit Reset Code</label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus-within:border-red-500 transition-colors">
                  <KeyRound className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="123456"
                    className="bg-transparent w-full outline-none text-base tracking-widest font-mono text-center placeholder-slate-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus-within:border-red-500 transition-colors">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min 6 chars)"
                    className="bg-transparent w-full outline-none text-sm placeholder-slate-500"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400">Didn&apos;t receive the code?</span>
                <button
                  type="button"
                  disabled={resending}
                  onClick={handleResendOtp}
                  className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  <span>Resend Code</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus-within:border-red-500 transition-colors">
                    <User className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="bg-transparent w-full outline-none text-sm placeholder-slate-500"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus-within:border-red-500 transition-colors">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="bg-transparent w-full outline-none text-sm placeholder-slate-500"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">Password</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setSuccessMsg('');
                        setMode('forgot');
                      }}
                      className="text-xs text-red-400 hover:text-red-300 font-bold hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus-within:border-red-500 transition-colors">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-transparent w-full outline-none text-sm placeholder-slate-500"
                    minLength={6}
                    required
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all mt-2 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>
                  {mode === 'otp'
                    ? 'Verify & Continue'
                    : mode === 'forgot'
                    ? 'Send Reset Code'
                    : mode === 'reset_password'
                    ? 'Reset Password & Sign In'
                    : mode === 'signup'
                    ? 'Create Account'
                    : 'Sign In'}
                </span>
              </>
            )}
          </button>
        </form>

        {/* Switch Mode */}
        {mode !== 'otp' && mode !== 'forgot' && mode !== 'reset_password' && (
          <div className="text-center text-xs text-slate-400 pt-2 border-t border-white/10">
            {mode === 'signup' ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setSuccessMsg('');
                    setMode('signin');
                  }}
                  className="text-red-400 font-bold hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setSuccessMsg('');
                    setMode('signup');
                  }}
                  className="text-red-400 font-bold hover:underline cursor-pointer"
                >
                  Create Account
                </button>
              </span>
            )}
          </div>
        )}

        {(mode === 'forgot' || mode === 'reset_password') && (
          <div className="text-center text-xs text-slate-400 pt-2 border-t border-white/10">
            Remembered your password?{' '}
            <button
              type="button"
              onClick={() => {
                setError('');
                setSuccessMsg('');
                setMode('signin');
              }}
              className="text-red-400 font-bold hover:underline cursor-pointer"
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
