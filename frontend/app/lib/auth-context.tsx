"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  organization: Organization | null;
  organizations: Organization[];
  loading: boolean;
  connectionError: boolean;
  retryCount: number;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => void;
  createOrganization: (name: string) => Promise<Organization>;
  switchOrganization: (org: Organization) => void;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8040";
const AuthContext = createContext<AuthContextType>(null!);

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("rdi_token");
}

function getStoredOrg(): Organization | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("rdi_org");
  return raw ? JSON.parse(raw) : null;
}

/**
 * Health check with exponential backoff — retries up to `maxRetries` times.
 * Returns true if the backend responds within the retry window.
 */
async function healthCheck(maxRetries = 3): Promise<boolean> {
  let ok = false;
  const delays = [1000, 2000, 4000];
  for (let i = 0; i <= maxRetries; i++) {
    try {
      await fetch(`${API}/health/ready`, { signal: AbortSignal.timeout(3_000) });
      ok = true;
      break;
    } catch {
      if (i < maxRetries) {
        await new Promise(r => setTimeout(r, delays[i] ?? delays.at(-1)!));
      }
    }
  }
  return ok;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken);
  const [organization, setOrganization] = useState<Organization | null>(getStoredOrg);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const fetchProfile = useCallback(async (t: string) => {
    const res = await fetch(`${API}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!res.ok) throw new Error("Session expired");
    const json = await res.json();
    setUser(json.data);
  }, []);

  const fetchOrgs = useCallback(async (t: string) => {
    const res = await fetch(`${API}/api/organizations`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!res.ok) return;
    const json = await res.json();
    setOrganizations(json.data);
    if (!organization && json.data.length > 0) {
      setOrganization(json.data[0]);
      localStorage.setItem("rdi_org", JSON.stringify(json.data[0]));
    }
  }, [organization]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      // Reset per-session states
      setConnectionError(false);
      setRetryCount(0);

      // Phase 1 — health check before touching any auth endpoints
      const backendUp = await healthCheck(3);
      if (cancelled || backendUp) {
        setConnectionError(false);
      } else {
        setConnectionError(true);
        setLoading(false);
        return;
      }

      // Phase 2 — profile + org fetch with its own retry loop
      let retries = 0;
      const maxRetries = 3;
      let success = false;

      while (retries <= maxRetries && !cancelled) {
        if (retries > 0) {
          setRetryCount(retries); // expose to UI via context
        }
        try {
          await Promise.all([fetchProfile(token), fetchOrgs(token)]);
          success = true;
          break;
        } catch {
          retries++;
          if (retries <= maxRetries && !cancelled) {
            setRetryCount(retries); // still trying — UI can show "Reconnecting..."
          }
          if (retries <= maxRetries && !cancelled) {
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries - 1)));
          }
        }
      }

      if (!cancelled) {
        setLoading(false);
        if (!success) setConnectionError(true);
        else setRetryCount(0); // back to normal on success
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [token, fetchProfile, fetchOrgs]);

  const signIn = async (email: string, password: string) => {
    const res = await fetch(`${API}/api/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error("Invalid credentials");
    const json = await res.json();
    localStorage.setItem("rdi_token", json.data.token);
    setToken(json.data.token);
    setUser(json.data.user);
  };

  const signUp = async (email: string, password: string, name: string) => {
    const res = await fetch(`${API}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Sign up failed");
    }
    const json = await res.json();
    localStorage.setItem("rdi_token", json.data.token);
    setToken(json.data.token);
    setUser(json.data.user);
  };

  const signOut = () => {
    localStorage.removeItem("rdi_token");
    localStorage.removeItem("rdi_org");
    setToken(null);
    setUser(null);
    setOrganization(null);
    setOrganizations([]);
  };

  const createOrganization = async (name: string): Promise<Organization> => {
    const t = token || localStorage.getItem("rdi_token");
    const res = await fetch(`${API}/api/organizations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error("Failed to create organization");
    const json = await res.json();
    const org = json.data;
    setOrganizations(prev => [...prev, org]);
    setOrganization(org);
    localStorage.setItem("rdi_org", JSON.stringify(org));
    return org;
  };

  const switchOrganization = (org: Organization) => {
    setOrganization(org);
    localStorage.setItem("rdi_org", JSON.stringify(org));
  };

  return (
    <AuthContext.Provider value={{ user, token, organization, organizations, loading, connectionError, retryCount, signIn, signUp, signOut, createOrganization, switchOrganization }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
