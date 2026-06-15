"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "./types";
import { USERS, DEMO_LOGIN } from "./seed";

// ============================================================
// Mock auth for the static demo.
//
// A signed-in user is tied to exactly one client (their tenant), so
// every dashboard view is naturally client-scoped. A super-admin will
// later "log in as" a client and get this same single-tenant view —
// there is intentionally no cross-client / aggregated view.
//
// Swap point: replace `signIn` with a real call to the auth API and
// persist a token instead of the user object.
// ============================================================

const SESSION_KEY = "rzx.session";

interface AuthState {
  user: User | null;
  /** True until we've checked localStorage on mount (avoids redirect flash). */
  ready: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (raw) setUser(JSON.parse(raw) as User);
    } catch {
      // ignore corrupt session
    }
    setReady(true);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 400)); // simulate request
    const match = USERS.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (
      !match ||
      email.trim().toLowerCase() !== DEMO_LOGIN.email ||
      password !== DEMO_LOGIN.password
    ) {
      return { error: "Invalid email or password." };
    }
    setUser(match);
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(match));
    return {};
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    window.localStorage.removeItem(SESSION_KEY);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, ready, signIn, signOut }),
    [user, ready, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
