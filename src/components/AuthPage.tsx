import React, { useState } from 'react';
import { auth } from '../firebase';
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
    <div className="flex h-[100dvh] w-full bg-white text-black font-sans font-extralight overflow-hidden">
      {/* Left Side - Login Form */}
      <div className="w-full md:w-1/2 h-full flex flex-col relative z-10 bg-white">
        {/* Header */}
        <div className="flex justify-between items-center p-6">
          <div className="flex items-center">
            <div className="font-bold text-xl tracking-tight text-black">Chris</div>
          </div>
          <div className="flex items-center gap-2 border border-gray-200 rounded-full px-4 py-1.5 text-sm font-medium text-gray-700 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
            You are signing into 
            <span className="flex items-center gap-1 text-black font-semibold">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
              Chris
            </span>
            <ChevronDown size={14} className="text-gray-500 ml-1" />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 max-w-[400px] mx-auto w-full">
          <h1 className="text-[32px] font-normal mb-8 text-center text-black">
            {mode === 'login' && 'Log into your account'}
            {mode === 'register' && 'Create an account'}
            {mode === 'forgot_password' && 'Reset your password'}
          </h1>
          
          <form className="w-full space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl">
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl">
                {success}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" />
                  </div>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {mode !== 'forgot_password' && (
                <div className="space-y-1">
                   <div className="flex justify-between items-center pl-1">
                    <label className="text-sm font-medium text-gray-700">Password</label>
                    {mode === 'login' && (
                      <button 
                        type="button" 
                        onClick={() => { setMode('forgot_password'); resetMessages(); }}
                        className="text-xs text-gray-500 hover:text-black transition-colors"
                      >
                        Forgot?
                      </button>
                    )}
                   </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key size={18} className="text-gray-400" />
                    </div>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-black mt-2 text-white rounded-xl py-3 flex items-center justify-center gap-2 font-medium hover:bg-black/90 transition-colors text-[15px] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
              {mode === 'login' ? 'Continue' : mode === 'register' ? 'Sign Up' : 'Send Reset Link'}
              {!isLoading && mode !== 'forgot_password' && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-8 text-[15px] text-gray-500 w-full text-center">
            {mode === 'login' ? (
              <p>
                Don't have an account? <button type="button" onClick={() => { setMode('register'); resetMessages(); }} className="text-black font-medium hover:underline">Sign up</button>
              </p>
            ) : (
              <p>
                Already have an account? <button type="button" onClick={() => { setMode('login'); resetMessages(); }} className="text-black font-medium hover:underline">Log in</button>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center text-[13px] text-gray-500">
          By continuing, you agree to Chris's <a href="#" className="text-black hover:underline">Terms of Service</a> and <a href="#" className="text-black hover:underline">Privacy Policy</a>.
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
              <PlanetLogo />
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
