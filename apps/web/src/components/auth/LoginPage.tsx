import React, { useState } from 'react';
import { GraduationCap, Loader2, Mail, Lock, User as UserIcon, ArrowRight, Sparkles, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api/client';
import { setAccessToken } from '../../services/api/session';

type Flow = 'password' | 'otp-code';
type CodePurpose = 'verify' | 'login' | 'reset';

export const LoginPage: React.FC = () => {
  const { login, signup, otpLogin, enterDemo, loginError } = useAuth();

  // Which credential flow the user is on
  const [flow, setFlow] = useState<Flow>('password');
  const [isSignup, setIsSignup] = useState(false);

  // Shared fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [requestedRole, setRequestedRole] = useState('student');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // OTP flow state — codePurpose drives what verification does:
  // verify = account created by password signup (pending → ACTIVE)
  // login  = passwordless sign-in · reset = forgot-password
  const [otpSent, setOtpSent] = useState(false);
  const [codePurpose, setCodePurpose] = useState<CodePurpose>('login');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const inputCls =
    'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition';

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setNotice(null);
    if (isSignup) {
      // The account is created pending_verification → an OTP code is emailed
      // → the VERIFY step appears right here: enter the code, only then in.
      const res = await signup(email.trim(), password, fullName.trim(), requestedRole);
      if (res.ok) {
        setNotice(undefined);
        await sendCode('verify');
      } else {
        setNotice(describeError({ message: res.message }));
      }
    } else {
      // A pending_verification login → 403 EMAIL_NOT_VERIFIED → the verify
      // step (the code we emailed them). Otherwise: signed in.
      const ok = await login(email.trim(), password);
      if (!ok) {
        const pending = loginError?.includes('Verify your email');
        if (pending) await sendCode('verify');
      }
    }
    setBusy(false);
  };

  /** Forgot password → a reset code is emailed → the new password form. */
  const handleForgot = async () => {
    await sendCode('reset');
  };

  /** Reset the password with the code → signed in. */
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || code.trim().length !== 6 || newPassword.length < 8) return;
    setBusy(true);
    setOtpError(null);
    try {
      const res = await apiFetch<{ accessToken: string }>('/auth/otp/reset', {
        method: 'POST',
        body: { email: email.trim(), code: code.trim(), newPassword },
        skipAuthRetry: true,
      });
      setAccessToken(res.accessToken);
      // The auth context restores the session via its login path — the
      // password is now the new one:
      const ok = await login(email.trim(), newPassword);
      if (!ok) setBusy(false);
    } catch (err) {
      setOtpError(describeError(err));
      setBusy(false);
    }
  };

  /** Field-aware error message — the API's validation errors carry the
   * failing fields; "Invalid request payload" alone tells the user nothing. */
  const describeError = (err: unknown): string => {
    if (!(err && typeof err === 'object')) return 'Something went wrong.';
    const e = err as { message?: string; fields?: Record<string, string> };
    if (e.fields && Object.keys(e.fields).length > 0) {
      const parts = Object.entries(e.fields).map(([k, v]) => `${k}: ${v}`);
      return parts.join(' · ');
    }
    return e.message ?? 'Something went wrong.';
  };

  /** Send the one-time code for a purpose:
   * verify → an account created by password signup (verifies it)
   * login  → passwordless sign-in · reset → forgot-password */
  const sendCode = async (purpose: CodePurpose | 'signup') => {
    if (busy || !email.trim()) return;
    setBusy(true);
    setOtpError(null);
    setNotice(null);
    setCode('');
    setNewPassword('');
    try {
      const res = await apiFetch<{ devCode?: string }>('/auth/otp/request', {
        method: 'POST',
        body: {
          email: email.trim(),
          purpose,
          ...(purpose === 'verify' ? {} : purpose === 'login' ? {} : {}),
        },
        skipAuthRetry: true,
      });
      setOtpSent(true);
      setCodePurpose(purpose === 'signup' ? 'verify' : purpose);
      setFlow('otp-code');
      setDevCode(res.devCode ?? null);
      setNotice(
        res.devCode
          ? undefined
          : 'A 6-digit code was sent to your email — it expires in 10 minutes.',
      );
    } catch (err) {
      setOtpError(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  /** Sign up with a password → the account is created pending_verification
   * → an OTP code is emailed → the verify step appears in the UI. */
  const handleSendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    await sendCode('login');
  };

  /** Verify the 6-digit code → the account is created (signup) or logged in
   * — the tokens come straight from the verify response. */
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || code.trim().length !== 6) return;
    setBusy(true);
    setOtpError(null);
    const ok = await otpLogin(email.trim(), code.trim());
    if (!ok) setBusy(false);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-zinc-900 flex flex-col font-sans selection:bg-zinc-900 selection:text-white">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-10 items-center">
          {/* Brand panel */}
          <div className="hidden lg:block">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-9 h-9 rounded-lg bg-zinc-900 flex items-center justify-center text-white">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg tracking-tight">UniCollab Campus</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight leading-[1.1] mb-4">
              Who should you know about
              <span className="block text-zinc-500">right now?</span>
            </h1>
            <p className="text-zinc-600 leading-relaxed mb-8 max-w-md">
              The university-scoped collaboration network — discover people, projects,
              research, events and services. Backed by a real API: real accounts,
              real teams, real messages.
            </p>
            <div className="space-y-3 max-w-md">
              {[
                'Password-free option: sign in with a one-time email code',
                'Verified .edu institutional accounts with role-based access',
                'Real project applications — accepted requests create true memberships',
              ].map((line) => (
                <div key={line} className="flex items-start gap-2.5 text-sm text-zinc-700">
                  <Sparkles className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Form panel */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-7">
              <div className="lg:hidden flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span className="font-bold">UniCollab Campus</span>
              </div>

              {/* ============ OTP CODE ENTRY ============ */}
              {flow === 'otp-code' ? (
                <>
                  <h2 className="text-xl font-bold tracking-tight mb-1">
                    {codePurpose === 'reset' ? 'Reset your password' : codePurpose === 'verify' ? 'Verify your email' : 'Enter the code'}
                  </h2>
                  <p className="text-sm text-zinc-500 mb-5">
                    {codePurpose === 'reset'
                      ? `Enter the 6-digit code we emailed to ${email}.`
                      : codePurpose === 'verify'
                        ? `Almost there — enter the 6-digit code we emailed to ${email} to activate your account.`
                        : `Check your email for the 6-digit code.`}
                  </p>

                  <form onSubmit={codePurpose === 'reset' ? handleReset : handleVerifyCode} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">6-digit code</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        required
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                        className={`${inputCls} text-center text-2xl tracking-[0.6em] font-bold`}
                      />
                    </div>

                    {codePurpose === 'reset' && (
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1.5">New password</label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="password"
                            required
                            minLength={8}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="At least 8 characters"
                            className={`${inputCls} pl-9`}
                          />
                        </div>
                      </div>
                    )}

                    {devCode && (
                      <div className="rounded-lg px-3.5 py-2.5 text-xs bg-amber-50 text-amber-800 border border-amber-200">
                        Dev mode — emails aren't actually sent. Your code: <strong>{devCode}</strong>
                      </div>
                    )}
                    {(otpError || notice) && (
                      <div className={`rounded-lg px-3.5 py-2.5 text-xs leading-relaxed ${
                        otpError
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {otpError ?? notice}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={busy || code.length !== 6 || (codePurpose === 'reset' && newPassword.length < 8)}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-zinc-900 text-white py-2.5 text-sm font-semibold hover:bg-zinc-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      {codePurpose === 'reset'
                        ? 'Set new password & sign in'
                        : codePurpose === 'verify'
                          ? 'Verify & continue'
                          : 'Verify & sign in'}
                    </button>
                  </form>

                  <div className="mt-5 pt-5 border-t border-zinc-200 flex items-center justify-between text-sm text-zinc-600">
                    <button
                      onClick={() => {
                        setFlow('password');
                        setOtpSent(false);
                        setCode('');
                        setDevCode(null);
                        setOtpError(null);
                        setNewPassword('');
                      }}
                      className="hover:text-zinc-900 transition"
                    >
                      ← Use a password
                    </button>
                    <button
                      onClick={() => sendCode(codePurpose)}
                      disabled={busy}
                      className="hover:text-zinc-900 transition font-medium"
                    >
                      Resend code
                    </button>
                  </div>
                </>
              ) : (
                /* ============ CREDENTIAL ENTRY (password or email-code) ============ */
                <>
                  <h2 className="text-xl font-bold tracking-tight mb-1">
                    {isSignup ? 'Create your account' : 'Welcome back'}
                  </h2>
                  <p className="text-sm text-zinc-500 mb-5">
                    {isSignup
                      ? 'Join the verified campus network.'
                      : 'Sign in with a password or a one-time email code.'}
                  </p>

                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    {isSignup && (
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Full name</label>
                        <div className="relative">
                          <UserIcon className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Ada Sharma"
                            className={`${inputCls} pl-9`}
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Email</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@university.edu"
                          className={`${inputCls} pl-9`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                        Password{' '}
                        {!isSignup && <span className="text-zinc-400 font-normal">— at least 8 characters</span>}
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          required
                          minLength={isSignup ? 8 : 1}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={isSignup ? 'At least 8 characters — or skip with a code below' : 'Your password'}
                          className={`${inputCls} pl-9`}
                        />
                      </div>
                    </div>

                    {isSignup && (
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1.5">I am a…</label>
                        <select
                          value={requestedRole}
                          onChange={(e) => setRequestedRole(e.target.value)}
                          className={inputCls}
                        >
                          <option value="student">Student</option>
                          <option value="professor">Professor</option>
                          <option value="researcher">Researcher</option>
                          <option value="professional">Professional</option>
                        </select>
                      </div>
                    )}

                    {(loginError || notice) && (
                      <div
                        className={`rounded-lg px-3.5 py-2.5 text-xs leading-relaxed ${
                          loginError
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {loginError ?? notice}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-zinc-900 text-white py-2.5 text-sm font-semibold hover:bg-zinc-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {busy ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          {isSignup ? 'Create account' : 'Sign in'}
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* The one-time code option */}
                  <div className="mt-5 pt-5 border-t border-zinc-200">
                    <button
                      onClick={() => (isSignup ? sendCode('signup') : sendCode('login'))}
                      disabled={busy || !email.trim()}
                      className="w-full flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white text-zinc-800 py-2.5 text-sm font-semibold hover:bg-zinc-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      title={isSignup ? 'Password-free: we email you a code' : 'Password-free sign-in'}
                    >
                      <KeyRound className="w-4 h-4 text-indigo-600" />
                      {isSignup ? 'Sign up with a one-time code' : 'Email me a one-time code'}
                    </button>
                    {!isSignup && (
                      <button
                        onClick={handleForgot}
                        disabled={busy || !email.trim()}
                        className="w-full text-center text-xs text-zinc-500 hover:text-zinc-900 transition py-1"
                      >
                        Forgot password? Email me a reset code
                      </button>
                    )}
                  </div>

                  <div className="mt-5 pt-5 border-t border-zinc-200">
                    <button
                      onClick={() => {
                        setIsSignup((v) => !v);
                        setNotice(null);
                      }}
                      className="text-sm text-zinc-600 hover:text-zinc-900 transition"
                    >
                      {isSignup ? (
                        <>Already have an account? <span className="font-semibold text-zinc-900">Sign in</span></>
                      ) : (
                        <>New to campus? <span className="font-semibold text-zinc-900">Create an account</span></>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={enterDemo}
              className="mt-4 w-full text-center text-sm text-zinc-500 hover:text-zinc-900 transition py-2"
            >
              Just exploring? <span className="font-semibold text-zinc-700">Try the demo mode →</span>
            </button>
          </div>
        </div>
      </div>

      <footer className="py-6 text-center text-xs text-zinc-400">
        University Collaboration Network — Academic & Student Innovation Marketplace
      </footer>
    </div>
  );
};
