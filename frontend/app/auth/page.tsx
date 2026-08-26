"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

import { AuthProvider, useAuth } from "@/app/lib/auth-context";

function SignInForm({ onSuccess }: { onSuccess: () => void }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signIn(email, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 400, margin: "0 auto" }}>
      <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600, color: "var(--color-text, #f1f5f9)" }}>Sign In</h2>
      {error && <p style={{ color: "var(--color-danger, #ef4444)", fontSize: "0.875rem", margin: 0 }}>{error}</p>}
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
        style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--color-border, #334155)", background: "var(--color-bg, #0f172a)", color: "var(--color-text, #f1f5f9)", fontSize: "0.875rem" }} />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required
        style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--color-border, #334155)", background: "var(--color-bg, #0f172a)", color: "var(--color-text, #f1f5f9)", fontSize: "0.875rem" }} />
      <button type="submit" disabled={busy}
        style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "none", background: "var(--color-primary, #3b82f6)", color: "#fff", fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1 }}>
        {busy ? "Signing in..." : "Sign In"}
      </button>
      <p style={{ fontSize: "0.8125rem", color: "var(--color-muted, #94a3b8)", textAlign: "center", margin: 0 }}>
        Don't have an account?{" "}
        <Link
          href="/auth?mode=signup"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "rgba(59, 130, 246, 0.10)", border: "1px solid rgba(59, 130, 246, 0.25)", color: "var(--color-primary, #3b82f6)", cursor: "pointer", fontSize: "0.8125rem", padding: "0.35rem 0.7rem", borderRadius: "999px", fontWeight: 600, textDecoration: "none" }}
        >
          Sign Up
        </Link>
      </p>
    </form>
  );
}

function SignUpForm({ onSuccess }: { onSuccess: () => void }) {
  const { signUp, createOrganization } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signUp(email, password, name);
      await createOrganization(orgName || `${name}'s Restaurant Group`);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 400, margin: "0 auto" }}>
      <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600, color: "var(--color-text, #f1f5f9)" }}>Create Account</h2>
      {error && <p style={{ color: "var(--color-danger, #ef4444)", fontSize: "0.875rem", margin: 0 }}>{error}</p>}
      <input type="text" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} required
        style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--color-border, #334155)", background: "var(--color-bg, #0f172a)", color: "var(--color-text, #f1f5f9)", fontSize: "0.875rem" }} />
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
        style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--color-border, #334155)", background: "var(--color-bg, #0f172a)", color: "var(--color-text, #f1f5f9)", fontSize: "0.875rem" }} />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
        style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--color-border, #334155)", background: "var(--color-bg, #0f172a)", color: "var(--color-text, #f1f5f9)", fontSize: "0.875rem" }} />
      <input type="text" placeholder="Organization Name (e.g. My Restaurant Group)" value={orgName} onChange={e => setOrgName(e.target.value)}
        style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--color-border, #334155)", background: "var(--color-bg, #0f172a)", color: "var(--color-text, #f1f5f9)", fontSize: "0.875rem" }} />
      <button type="submit" disabled={busy}
        style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "none", background: "var(--color-primary, #3b82f6)", color: "#fff", fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1 }}>
        {busy ? "Creating account..." : "Create Account"}
      </button>
      <p style={{ fontSize: "0.8125rem", color: "var(--color-muted, #94a3b8)", textAlign: "center", margin: 0 }}>
        Already have an account?{" "}
        <Link
          href="/auth"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "rgba(59, 130, 246, 0.10)", border: "1px solid rgba(59, 130, 246, 0.25)", color: "var(--color-primary, #3b82f6)", cursor: "pointer", fontSize: "0.8125rem", padding: "0.35rem 0.7rem", borderRadius: "999px", fontWeight: 600, textDecoration: "none" }}
        >
          Sign In
        </Link>
      </p>
    </form>
  );
}

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "signup" ? "signup" : "signin";

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-bg, #0f172a)", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text, #f1f5f9)" }}>Ristorante</h1>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "var(--color-muted, #94a3b8)" }}>Restaurant Visibility Intelligence</p>
        </div>
        {mode === "signin" ? (
          <SignInForm onSuccess={() => router.push('/dashboard')} />
        ) : (
          <SignUpForm onSuccess={() => router.push('/dashboard')} />
        )}
      </div>
    </div>
  );
}

function AuthPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-bg, #0f172a)", color: "var(--color-muted, #94a3b8)" }}>
          Loading…
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}

export default function AuthWrapper() {
  return <AuthProvider bootstrapSession={false}><AuthPage /></AuthProvider>;
}
