'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/');
      return;
    }

    const checkAdmin = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        router.push('/');
      }
    };

    checkAdmin();
  }, [user, loading, router]);

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
            <h2 className="text-xl font-semibold mb-2">System Status</h2>
            <p className="text-green-500 font-medium">All systems operational</p>
          </div>
          <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Active Users</h2>
            <p className="text-3xl font-bold">124</p>
          </div>
          <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Total Requests</h2>
            <p className="text-3xl font-bold">8,492</p>
          </div>
        </div>
      </div>
    </div>
  );
}
