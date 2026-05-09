"use client";

import React, { useState, Suspense } from 'react';
import { auth } from '../../firebase';
import { confirmPasswordReset } from 'firebase/auth';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode');

  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode) return;

    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess("Your password has been successfully reset. You can now log in with your new password.");
      setNewPassword('');
    } catch (err: any) {
      setError(err.message || "Failed to reset password. The link might be invalid or expired.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!oobCode) {
    return (
      <div className="w-full max-w-[400px] p-8 mx-auto bg-surface-elevated border border-border rounded-xl">
        <h2 className="text-xl font-medium text-gray-900 mb-4 text-center">Invalid Link</h2>
        <p className="text-sm text-foreground-subtle mb-6 text-center">
          The password reset link is missing or invalid. Please request a new link.
        </p>
        <Link href="/" className="block w-full text-center px-4 py-2 bg-gray-900 text-foreground rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
          Return to Login
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full max-w-[400px] p-8 mx-auto bg-surface-elevated border border-border rounded-xl">
        <h2 className="text-xl font-medium text-gray-900 mb-4 text-center">Password Reset</h2>
        <div className="p-4 mb-6 text-sm text-success bg-green-50 rounded-lg text-center">
          {success}
        </div>
        <Link href="/" className="block w-full text-center px-4 py-2 bg-gray-900 text-foreground rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
          Return to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px] p-8 mx-auto bg-surface-elevated border border-border rounded-xl">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-medium text-gray-900">Reset Password</h2>
        <p className="text-sm text-foreground-subtle mt-2">Enter your new password below.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="new-password" className="sr-only">New Password</label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New Password"
            required
            minLength={6}
            className="w-full px-4 py-3 bg-gray-50 border border-border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="text-sm text-destructive text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !newPassword}
          className="w-full flex items-center justify-center px-4 py-3 bg-gray-900 text-foreground rounded-lg text-sm font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Reset Password'
          )}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4 font-sans">
      <Suspense fallback={
        <div className="w-full max-w-[400px] p-8 mx-auto bg-surface-elevated border border-border rounded-xl flex justify-center items-center h-64">
           <Loader2 className="w-8 h-8 animate-spin text-foreground-muted" />
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
