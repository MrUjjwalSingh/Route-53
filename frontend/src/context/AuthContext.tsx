"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import * as authApi from "@/lib/api/auth";
import { ApiError, setUnauthorizedHandler } from "@/lib/api/client";
import type { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const SESSION_EXPIRED_FLAG = "route53-clone-session-expired";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    // A 401 on any authenticated request (not the initial /auth/me probe)
    // means a previously-valid session just died — cookie deleted, server
    // restarted, expiry hit. Only fire if we actually had a session, so this
    // never fights with the ordinary "not logged in yet" path.
    setUnauthorizedHandler(() => {
      if (userRef.current) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(SESSION_EXPIRED_FLAG, "1");
        }
        setUser(null);
      }
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    authApi
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const loggedInUser = await authApi.login(email, password);
    setUser(loggedInUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        throw error;
      }
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
