"use client";

import { createContext, useContext, ReactNode, useState, useEffect, useRef } from "react";
import { mockAuth, type User } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (_email: string, _password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (initialized.current) return;
    initialized.current = true;

    // Check for existing session on mount (client-side only)
    if (typeof window !== "undefined") {
      try {
        const session = mockAuth.getSession();
        if (session && session.user) {
          setUser(session.user);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
    }
    
    // Always set loading to false after checking
    setIsLoading(false);
  }, []);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    const result = await mockAuth.signIn(email, password);
    if (result) {
      setUser(result.user);
      setIsLoading(false); // Ensure loading is false after sign in
      return true;
    }
    return false;
  };

  const signOut = async (): Promise<void> => {
    await mockAuth.signOut();
    setUser(null);
    // Clear cookie
    if (typeof document !== "undefined") {
      document.cookie = "auth_token=; path=/; max-age=0";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
