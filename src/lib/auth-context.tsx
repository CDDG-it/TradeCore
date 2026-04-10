"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { mockUser } from "@/lib/mock/data";
import type { User } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isDemo: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isDemo: true,
  signOut: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  useEffect(() => {
    if (isDemo) {
      setUser(mockUser);
      setIsLoading(false);
      return;
    }

    // Real Supabase auth would go here
    // const supabase = createClient();
    // supabase.auth.getUser().then(...)
    setIsLoading(false);
  }, [isDemo]);

  const signOut = () => {
    if (isDemo) {
      window.location.href = "/login";
      return;
    }
    // supabase.auth.signOut()
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isDemo, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
