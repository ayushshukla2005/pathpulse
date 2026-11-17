"use client";

import * as React from "react";
import type { CurrentUserProfile, LoginRequest, RegisterRequest } from "@pathpulse/shared-types";
import { setAccessToken } from "@/lib/api/client";

export interface SessionResult {
  authenticated: boolean;
  user: CurrentUserProfile | null;
  accessToken: string | null;
  error: string | null;
}

let inFlightSession: Promise<SessionResult> | null = null;

export async function loadSession(): Promise<SessionResult> {
  if (inFlightSession) {
    return inFlightSession;
  }

  inFlightSession = (async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.status === 503) {
        return {
          authenticated: false,
          user: null,
          accessToken: null,
          error: "Authentication service is temporarily unavailable.",
        };
      }
      if (res.ok) {
        const data = (await res.json()) as {
          authenticated: boolean;
          user?: CurrentUserProfile | null;
          accessToken?: string | null;
        };
        if (data.authenticated && data.user) {
          return {
            authenticated: true,
            user: data.user,
            accessToken: data.accessToken ?? null,
            error: null,
          };
        }
        return {
          authenticated: false,
          user: null,
          accessToken: null,
          error: null,
        };
      }
      return {
        authenticated: false,
        user: null,
        accessToken: null,
        error: "Failed to verify authentication status.",
      };
    } catch {
      return {
        authenticated: false,
        user: null,
        accessToken: null,
        error: "Network connection issue while verifying session.",
      };
    } finally {
      inFlightSession = null;
    }
  })();

  return inFlightSession;
}

interface AuthContextValue {
  user: CurrentUserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  reloadSession: () => Promise<void>;
  retrySession: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<CurrentUserProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchSession = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await loadSession();
    if (result.error) {
      if (!result.authenticated) {
        setError(result.error);
      }
    } else if (result.authenticated && result.user) {
      setUser(result.user);
      setAccessToken(result.accessToken);
      setError(null);
    } else {
      setUser(null);
      setAccessToken(null);
      setError(null);
    }
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const login = async (credentials: LoginRequest) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data = await res.json();
    if (!res.ok) {
      const msg = Array.isArray(data.message)
        ? data.message.join(", ")
        : data.message || "Invalid email or password.";
      throw new Error(msg);
    }

    setAccessToken(data.accessToken);
    setUser(data.user);
    setError(null);
  };

  const register = async (data: RegisterRequest) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const resData = await res.json();
    if (!res.ok) {
      const msg = Array.isArray(resData.message)
        ? resData.message.join(", ")
        : resData.message || "Registration failed. Please check your details.";
      throw new Error(msg);
    }

    setAccessToken(resData.accessToken);
    setUser(resData.user);
    setError(null);
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      setAccessToken(null);
      setUser(null);
      setError(null);
      window.location.href = "/";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        error,
        login,
        register,
        logout,
        reloadSession: fetchSession,
        retrySession: fetchSession,
        refreshUser: fetchSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
