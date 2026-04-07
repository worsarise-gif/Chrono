"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firebaseErrorHandler';
import { handleError } from '../utils/errorHandler';
import { Helix } from 'ldrs/react';
import 'ldrs/react/Helix.css';

interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: 'admin' | 'user';
  createdAt: any;
  updatedAt?: any;
}

interface AuthContextType {
  user: (User & { profile?: UserProfile }) | null;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, isAdmin: false, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<(User & { profile?: UserProfile }) | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = !!(
    user?.profile?.role === 'admin' || 
    (user?.email === 'johnkerveelayese@gmail.com' && user?.emailVerified)
  );

  useEffect(() => {
    console.log("AuthProvider: Initializing onAuthStateChanged...");
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn("AuthProvider: Auth state check timed out after 10s. Forcing loading to false.");
        setLoading(false);
      }
    }, 10000);

    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("AuthProvider: Auth state changed:", currentUser?.uid || "No user");
      clearTimeout(timeoutId);
      
      // Clean up previous profile listener if it exists
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (currentUser) {
        // Listen to user document
        const userRef = doc(db, 'users', currentUser.uid);
        
        unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;
            setUser({ ...currentUser, profile } as any);
          } else {
            // Document doesn't exist yet, handle creation
            setUser(currentUser as any);
            initializeUserDocument(currentUser);
          }
          setLoading(false);
        }, (error) => {
          console.error("AuthProvider: Profile snapshot error:", error);
          setUser(currentUser as any);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    const initializeUserDocument = async (currentUser: User) => {
      const userRef = doc(db, 'users', currentUser.uid);
      try {
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          console.log("AuthProvider: Creating new user document...");
          const userData: any = {
            uid: currentUser.uid,
            email: currentUser.email || '',
            createdAt: serverTimestamp()
          };
          
          // Use Google profile picture as default for new users
          const photoURL = currentUser.photoURL || currentUser.providerData[0]?.photoURL;
          const displayName = currentUser.displayName || currentUser.providerData[0]?.displayName;

          if (displayName) userData.displayName = displayName;
          if (photoURL) userData.photoURL = photoURL;
          
          await setDoc(userRef, userData);
        }
      } catch (error) {
        console.error("AuthProvider: Error checking/creating user document:", error);
        try {
          handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
        } catch (e) {
          handleError(e, "Failed to initialize user profile");
        }
      }
    };

    return () => {
      unsubscribe();
      if (unsubscribeProfile) unsubscribeProfile();
      clearTimeout(timeoutId);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] w-full bg-background text-foreground">
        <div className="mb-4">
          <Helix size="45" speed="2.5" color="var(--color-foreground)" />
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
