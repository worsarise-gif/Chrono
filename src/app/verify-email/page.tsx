"use client";

import React, { useState, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase';

function VerifyOTPHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const password = sessionStorage.getItem('pending_registration_password');

      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, password: password || undefined })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify code.');
      }

      setSuccess('Email verified! Redirecting...');

      if (password) {
        // Automatically sign the user in
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (signInError) {
          console.error("Auto sign-in failed:", signInError);
          // Let them proceed to login manually if auto sign-in fails
        }
      }

      sessionStorage.removeItem('pending_registration_password');

      // Redirect to home/dashboard if signed in, otherwise to login
      setTimeout(() => {
        router.push(password ? '/' : '/login');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'An error occurred during verification.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px] p-8 mx-auto bg-[#18181b] border border-white/10 rounded-xl font-[family-name:var(--font-auth)]">
      <h2 className="text-2xl font-medium text-white mb-6 text-center">Verify your email</h2>

      <p className="text-sm text-gray-400 mb-6 text-center">
        We sent a 6-digit verification code to your email.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-300">Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={!!emailParam || isLoading}
            className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-white placeholder-gray-500 disabled:opacity-50"
            placeholder="Enter your email"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-300">6-Digit Code</label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            disabled={isLoading}
            className="w-full px-4 py-3 bg-[#0a0a0a] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-white placeholder-gray-500 text-center tracking-widest text-lg font-mono"
            placeholder="000000"
            maxLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || otp.length !== 6 || !email}
          className="w-full bg-white mt-4 text-black rounded-xl py-3 flex items-center justify-center gap-2 font-medium hover:bg-gray-200 transition-colors text-base disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
          Verify Code
          {!isLoading && <ArrowRight size={18} />}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/" className="text-sm text-gray-500 hover:text-white transition-colors">
          Return to Login
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-[#0a0a0a] p-4 text-white font-[family-name:var(--font-auth)] font-normal overflow-y-auto">
      <Suspense fallback={
        <div className="w-full max-w-[400px] p-8 mx-auto bg-[#18181b] border border-white/10 rounded-xl flex justify-center items-center h-64">
           <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      }>
        <VerifyOTPHandler />
      </Suspense>
    </div>
  );
}
