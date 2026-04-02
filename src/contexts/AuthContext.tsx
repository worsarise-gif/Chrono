"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firebaseErrorHandler';
import { handleError } from '../utils/errorHandler';
import { Helix } from 'ldrs/react';
import 'ldrs/react/Helix.css';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AuthProvider: Initializing onAuthStateChanged...");
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn("AuthProvider: Auth state check timed out after 10s. Forcing loading to false.");
        setLoading(false);
      }
    }, 10000);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("AuthProvider: Auth state changed:", currentUser?.uid || "No user");
      clearTimeout(timeoutId);
      setUser(currentUser);
      
      if (currentUser) {
        // Ensure user document exists
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
      }
      
      setLoading(false);
    });

    return () => {
      unsubscribe();
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
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
