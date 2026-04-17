import React, { useState } from 'react';
import { auth, loginWithGoogle } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { ChevronDown, Mail, ArrowRight, Loader2, Key } from 'lucide-react';
import { PlanetLogo } from './PlanetLogo';

type AuthMode = 'login' | 'register' | 'forgot_password';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setIsLoading(true);

    try {
      if (mode === 'login') {
        if (!email || !password) throw new Error('Email and password are required.');
        await signInWithEmailAndPassword(auth, email, password);
      } else if (mode === 'register') {
        if (!email || !password) throw new Error('Email and password are required.');
        if (password.length < 6) throw new Error('Password should be at least 6 characters.');
        await createUserWithEmailAndPassword(auth, email, password);
      } else if (mode === 'forgot_password') {
        if (!email) throw new Error('Please enter your email address.');
        await sendPasswordResetEmail(auth, email);
        setSuccess('Password reset link sent! Check your email.');
        // Don't auto-redirect, let the user read the success message
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
         setError('An account with this email already exists.');
      } else {
        setError(err.message || 'An error occurred during authentication.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[100dvh] w-full bg-[#0a0a0a] text-white font-sans font-extralight overflow-hidden">
      {/* Left Side - Login Form */}
      <div className="w-full md:w-1/2 h-full flex flex-col relative z-10 bg-[#0a0a0a]">
        {/* Header */}
        <div className="flex justify-between items-center p-6">
          <div className="flex items-center">
            <PlanetLogo className="!text-white" />
          </div>
          <div className="flex items-center gap-2 border border-white/10 rounded-full px-4 py-1.5 text-sm font-medium text-gray-300 shadow-sm cursor-pointer hover:bg-white/5 transition-colors">
            You are signing into 
            <span className="flex items-center gap-1 text-white font-semibold">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
              Chris
            </span>
            <ChevronDown size={14} className="text-gray-500 ml-1" />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 max-w-[400px] mx-auto w-full">
          <h1 className="text-[32px] font-normal mb-8 text-center text-white">
            {mode === 'login' && 'Log into your account'}
            {mode === 'register' && 'Create an account'}
            {mode === 'forgot_password' && 'Reset your password'}
          </h1>
          
          <form className="w-full space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-900/20 border border-red-500/20 rounded-xl">
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-3 text-sm text-green-400 bg-green-900/20 border border-green-500/20 rounded-xl">
                {success}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-500" />
                  </div>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-3 bg-[#18181b] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all outline-none text-white placeholder-gray-500"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {mode !== 'forgot_password' && (
                <div className="space-y-1">
                   <div className="flex justify-between items-center pl-1">
                    <label className="text-sm font-medium text-gray-300">Password</label>
                    {mode === 'login' && (
                      <button 
                        type="button" 
                        onClick={() => { setMode('forgot_password'); resetMessages(); }}
                        className="text-xs text-gray-500 hover:text-white transition-colors"
                      >
                        Forgot?
                      </button>
                    )}
                   </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key size={18} className="text-gray-500" />
                    </div>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="w-full pl-10 pr-4 py-3 bg-[#18181b] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all outline-none text-white placeholder-gray-500"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-white mt-2 text-black rounded-xl py-3 flex items-center justify-center gap-2 font-medium hover:bg-gray-200 transition-colors text-[15px] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
              {mode === 'login' ? 'Continue' : mode === 'register' ? 'Sign Up' : 'Send Reset Link'}
              {!isLoading && mode !== 'forgot_password' && <ArrowRight size={18} />}
            </button>
          </form>

          {mode !== 'forgot_password' && (
            <div className="w-full mt-6">
              <div className="flex items-center my-4 w-full">
                <div className="flex-1 border-t border-white/10"></div>
                <span className="px-4 text-sm text-gray-500 bg-[#0a0a0a]">OR</span>
                <div className="flex-1 border-t border-white/10"></div>
              </div>

              <button 
                type="button"
                onClick={async () => {
                  resetMessages();
                  try {
                    await loginWithGoogle();
                  } catch (err: any) {
                    if (err.code === 'auth/popup-closed-by-user') {
                       setError('Google sign-in cancelled.');
                    } else {
                       setError(err.message || 'Error signing in with Google.');
                    }
                  }
                }}
                className="w-full bg-[#18181b] text-white border border-white/10 rounded-xl py-3 flex items-center justify-center gap-2 font-medium hover:bg-white/5 transition-colors text-[15px]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </div>
          )}

          <div className="mt-8 text-[15px] text-gray-500 w-full text-center">
            {mode === 'login' ? (
              <p>
                Don't have an account? <button type="button" onClick={() => { setMode('register'); resetMessages(); }} className="text-white font-medium hover:underline">Sign up</button>
              </p>
            ) : (
              <p>
                Already have an account? <button type="button" onClick={() => { setMode('login'); resetMessages(); }} className="text-white font-medium hover:underline">Log in</button>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center text-[13px] text-gray-500">
          By continuing, you agree to Chris's <a href="#" className="text-white hover:underline">Terms of Service</a> and <a href="#" className="text-white hover:underline">Privacy Policy</a>.
        </div>
      </div>

      <div className="hidden md:block md:w-1/2 h-full bg-black relative overflow-hidden">
        {/* Abstract gradient graphic */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full max-w-[800px] max-h-[800px]">

            {/* Base glow - behind everything */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] 
                            bg-gradient-to-r from-transparent via-[#3b4a5a]/30 to-[#8ba3b8]/50 
                            blur-3xl rounded-full opacity-60 z-0"></div>

            {/* Planet Logo - now clearly visible on top */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <PlanetLogo className="!text-white" />
            </div>

            {/* Right side bright edge */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 
                            bg-gradient-to-l from-[#dbe6f0] to-transparent 
                            opacity-40 blur-2xl mix-blend-screen z-5"></div>

          </div>
        </div>
      </div>
    </div>
  );
}
