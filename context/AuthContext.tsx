
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "../lib/firebaseConfig";
import { onIdTokenChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Force token refresh to validate it's still valid
          await firebaseUser.getIdToken(true);
          
          // Check if user document exists in Firestore
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (!userDocSnap.exists()) {
            // User document doesn't exist - sign out
            console.error("User document not found in Firestore");
            await auth.signOut();
            document.cookie = "firebaseToken=; Max-Age=0; path=/; SameSite=Lax";
            document.cookie = "userRole=; Max-Age=0; path=/; SameSite=Lax";
            setUser(null);
            setLoading(false);
            return;
          }
          
          setUser(firebaseUser);
        } catch (error) {
          console.error("Token validation failed:", error);
          // Clear invalid session
          document.cookie = "firebaseToken=; Max-Age=0; path=/; SameSite=Lax";
          document.cookie = "userRole=; Max-Age=0; path=/; SameSite=Lax";
          setUser(null);
        }
      } else {
        // User not authenticated, clear cookies
        document.cookie = "firebaseToken=; Max-Age=0; path=/; SameSite=Lax";
        document.cookie = "userRole=; Max-Age=0; path=/; SameSite=Lax";
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

useEffect(() => {
  return onIdTokenChanged(auth, async (user) => {
    if (!user) {
      document.cookie = "firebaseToken=; Max-Age=0; path=/; SameSite=Lax";
      document.cookie = "userRole=; Max-Age=0; path=/; SameSite=Lax";
      return;
    }

    try {
      const token = await user.getIdToken();
      // Set cookie with 1 hour expiration (3600 seconds)
      document.cookie = `firebaseToken=${token}; Max-Age=3600; path=/; SameSite=Lax`;
    } catch (error) {
      console.error("Failed to get token:", error);
      document.cookie = "firebaseToken=; Max-Age=0; path=/; SameSite=Lax";
      document.cookie = "userRole=; Max-Age=0; path=/; SameSite=Lax";
    }
  });
}, []);

  // Token refresh mechanism - refresh token every 50 minutes (before 1 hour expiration)
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(async () => {
      try {
        const token = await user.getIdToken(true); // Force refresh
        document.cookie = `firebaseToken=${token}; Max-Age=3600; path=/; SameSite=Lax`;
        console.log("Token refreshed successfully");
      } catch (error) {
        console.error("Failed to refresh token:", error);
        // If refresh fails, clear session
        document.cookie = "firebaseToken=; Max-Age=0; path=/; SameSite=Lax";
        document.cookie = "userRole=; Max-Age=0; path=/; SameSite=Lax";
      }
    }, 50 * 60 * 1000); // 50 minutes

    return () => clearInterval(refreshInterval);
  }, [user]);

  // Inactivity timeout - auto-logout after 30 minutes of inactivity
  useEffect(() => {
    if (!user) return;

    let inactivityTimer: NodeJS.Timeout;

    const handleLogout = async () => {
      try {
        await auth.signOut();
        document.cookie = "firebaseToken=; Max-Age=0; path=/; SameSite=Lax";
        document.cookie = "userRole=; Max-Age=0; path=/; SameSite=Lax";
        console.log("Session expired due to inactivity");
      } catch (error) {
        console.error("Error during inactivity logout:", error);
      }
    };

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(handleLogout, 30 * 60 * 1000); // 30 minutes
    };

    // Reset timer on user activity
    const events = ['mousedown', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Initialize timer
    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// ✅ Named hook export – important
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
