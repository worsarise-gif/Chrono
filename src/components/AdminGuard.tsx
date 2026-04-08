"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { Helix } from 'ldrs/react';
import 'ldrs/react/Helix.css';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isBanned, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user || isBanned) {
        router.push('/admin/login');
      } else if (!isAdmin) {
        router.push('/admin/login');
      }
    }
  }, [user, isAdmin, isBanned, loading, router]);

  if (loading || !user || !isAdmin || isBanned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Helix size="45" speed="2.5" color="var(--color-foreground)" />
      </div>
    );
  }

  return <>{children}</>;
}
