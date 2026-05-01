"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { auth } from '../../firebase';
import { applyActionCode } from 'firebase/auth';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

function VerifyEmailHandler() {
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    const verify = async () => {
      if (!oobCode) {
        setError('The verification link is missing or invalid.');
        setIsLoading(false);
        return;
      }

      try {
        await applyActionCode(auth, oobCode);
        setSuccess(true);
      } catch (err: any) {
        setError(err.message || "Failed to verify email. The link might be invalid or expired.");
      } finally {
        setIsLoading(false);
      }
    };

    verify();
  }, [oobCode]);

  if (isLoading) {
    return (
      <div className="w-full max-w-[400px] p-8 mx-auto bg-[#18181b] border border-white/10 rounded-xl flex flex-col justify-center items-center h-64 text-white font-[family-name:var(--font-auth)]">
         <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-4" />
         <p>Verifying your email...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-[400px] p-8 mx-auto bg-[#18181b] border border-white/10 rounded-xl font-[family-name:var(--font-auth)]">
        <h2 className="text-xl font-medium text-white mb-4 text-center">Verification Failed</h2>
        <p className="text-sm text-red-400 mb-6 text-center">
          {error}
        </p>
        <Link href="/" className="block w-full text-center px-4 py-3 bg-white text-black rounded-xl text-base font-medium hover:bg-gray-200 transition-colors">
          Return to Login
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full max-w-[400px] p-8 mx-auto bg-[#18181b] border border-white/10 rounded-xl font-[family-name:var(--font-auth)]">
        <h2 className="text-xl font-medium text-white mb-4 text-center">Email Verified</h2>
        <div className="p-4 mb-6 text-sm text-green-400 bg-green-900/20 border border-green-500/20 rounded-xl text-center">
          Your email has been successfully verified! You can now log in to your account.
        </div>
        <Link href="/" className="block w-full text-center px-4 py-3 bg-white text-black rounded-xl text-base font-medium hover:bg-gray-200 transition-colors">
          Return to Login
        </Link>
      </div>
    );
  }

  return null;
}

export default function VerifyEmailPage() {
  return (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-[#0a0a0a] p-4 text-white font-[family-name:var(--font-auth)] font-normal overflow-y-auto">
      <Suspense fallback={
        <div className="w-full max-w-[400px] p-8 mx-auto bg-[#18181b] border border-white/10 rounded-xl flex justify-center items-center h-64">
           <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      }>
        <VerifyEmailHandler />
      </Suspense>
    </div>
  );
}
