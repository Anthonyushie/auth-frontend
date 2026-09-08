"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api, { setAccessToken, getAccessToken } from "@/lib/axios";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface User {
  id: string;
  email: string;
  role: string;
  [key: string]: unknown; // allow extra fields from backend
}

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  loading: boolean; // true while we're checking if the user has a valid session
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // starts true — we attempt silent refresh

  // -----------------------------------------------------------------------
  // Silent Refresh on Mount
  // -----------------------------------------------------------------------
  // When the app loads (or the page is refreshed), there is no in-memory
  // access token. We call POST /refresh — the browser sends the HTTP-only
  // cookie automatically. If the cookie holds a valid refresh token the
  // backend returns a fresh access token and we restore the session.
  // -----------------------------------------------------------------------

  useEffect(() => {
    const attemptSilentRefresh = async () => {
      try {
        const { data } = await api.post("/refresh");
        setAccessToken(data.accessToken);

        // Fetch the user profile with the fresh token
        const profileRes = await api.get("/profile");
        setUser(profileRes.data.user ?? profileRes.data);
      } catch {
        // No valid refresh cookie — user is not logged in. That's fine.
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    attemptSilentRefresh();
  }, []);

  // -----------------------------------------------------------------------
  // Login
  // -----------------------------------------------------------------------

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post("/login", { email, password });

    // Store access token in memory (NEVER in localStorage).
    setAccessToken(data.accessToken);

    // The backend also sets the refresh token as an HTTP-only cookie — the
    // browser handles that automatically, we don't need to touch it.

    // Fetch user profile
    const profileRes = await api.get("/profile");
    setUser(profileRes.data.user ?? profileRes.data);
  }, []);

  // -----------------------------------------------------------------------
  // Register
  // -----------------------------------------------------------------------

  const register = useCallback(
    async (email: string, password: string, role: string) => {
      await api.post("/register", { email, password, role });
      // Registration doesn't auto-login — caller should redirect to /login.
    },
    []
  );

  // -----------------------------------------------------------------------
  // Logout
  // -----------------------------------------------------------------------

  const logout = useCallback(async () => {
    try {
      await api.post("/logout");
    } catch {
      // Even if the backend call fails, clear client state.
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, accessToken: getAccessToken(), loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}
