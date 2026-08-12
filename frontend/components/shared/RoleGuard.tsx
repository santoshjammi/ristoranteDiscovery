"use client";

import { colors, spacing, radius } from "@/lib/design-tokens";

interface RoleGuardProps {
  userRole?: string;
  requiredRole?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ userRole, requiredRole = "admin", children, fallback }: RoleGuardProps) {
  if (!requiredRole) return <>{children}</>;

  const roleHierarchy: Record<string, number> = {
    viewer: 0,
    member: 1,
    manager: 2,
    admin: 3,
  };

  const userLevel = roleHierarchy[userRole || "viewer"] ?? 0;
  const requiredLevel = roleHierarchy[requiredRole] ?? 3;

  if (userLevel >= requiredLevel) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <div
      style={{
        padding: spacing["3xl"],
        textAlign: "center",
        background: colors.surface,
        borderRadius: radius.lg,
        border: `1px solid ${colors.border}`,
      }}
    >
      <p style={{ fontSize: "1.5rem", margin: `0 0 ${spacing.md}` }}>🔒</p>
      <h3 style={{ margin: `0 0 ${spacing.sm}`, fontSize: "1rem", fontWeight: 600, color: colors.text }}>
        Access Restricted
      </h3>
      <p style={{ margin: 0, fontSize: "0.8125rem", color: colors.muted }}>
        You need {requiredRole} access to view this page.
      </p>
    </div>
  );
}
