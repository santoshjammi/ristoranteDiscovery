"use client";

import { AuthProvider, useAuth } from "@/app/lib/auth-context";
import { Sidebar } from "@/components/shared/Sidebar";
import { colors, spacing } from "@/lib/design-tokens";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { user, organization, token, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: colors.bg,
          color: colors.muted,
        }}
      >
        Loading...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: colors.bg }}>
      <Sidebar user={user} organization={organization} token={token} onSignOut={signOut} />
      <main style={{ flex: 1, padding: spacing["3xl"], overflow: "auto", maxWidth: 1200 }}>
        {children}
      </main>
    </div>
  );
}

export default function WorkspaceWrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider><WorkspaceLayout>{children}</WorkspaceLayout></AuthProvider>;
}
