import React, { useState } from 'react';
import { GraduationCap, Loader2, Mail, Lock, User as UserIcon, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, signup, enterDemo, loginError } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [requestedRole, setRequestedRole] = useState('student');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setNotice(null);
    if (isSignup) {
      const res = await signup(email.trim(), password, fullName.trim(), requestedRole);
      if (res.ok) {
        setNotice(res.message);
        setIsSignup(false);
      } else {
        setNotice(res.message);
      }
    } else {
      await login(email.trim(), password);
    }
    setBusy(false);
  };

  const inputCls =
    'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition';

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
              research and events. Backed by a real API: real accounts,
              real teams, real messages.
            </p>
            <div className="space-y-3 max-w-md">
              {[
                'Verified .edu institutional accounts with role-based access',
                'Real project applications — accepted requests create true memberships',
                'Persistent direct messaging, notifications and event RSVPs',
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

              <h2 className="text-xl font-bold tracking-tight mb-1">
                {isSignup ? 'Create your account' : 'Welcome back'}
              </h2>
              <p className="text-sm text-zinc-500 mb-6">
                {isSignup
                  ? 'Join the verified campus network.'
                  : 'Sign in to your campus account.'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={isSignup ? 8 : 1}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isSignup ? 'At least 8 characters' : 'Your password'}
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
