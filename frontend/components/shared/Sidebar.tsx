"use client";

import { spacing, radius, colors, typography } from "@/lib/design-tokens";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationBell } from "./NotificationBell";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  children?: { href: string; label: string }[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: "📊" },
  { href: "/dashboard/restaurants", label: "Restaurant", icon: "🍽️" },
  {
    href: "/dashboard/intelligence",
    label: "Intelligence",
    icon: "🧠",
    children: [
      { href: "/dashboard/intelligence", label: "Overview" },
      { href: "/dashboard/intelligence/analysis", label: "Analysis" },
      { href: "/dashboard/intelligence/recommendations", label: "Recommendations" },
      { href: "/dashboard/intelligence/visibility", label: "Visibility" },
      { href: "/dashboard/intelligence/competitors", label: "Competitors" },
      { href: "/dashboard/intelligence/reviews", label: "Reviews" },
      { href: "/dashboard/intelligence/website", label: "Website" },
      { href: "/dashboard/intelligence/search", label: "Search" },
    ],
  },
  {
    href: "/dashboard/actions",
    label: "Actions",
    icon: "✅",
    children: [
      { href: "/dashboard/actions", label: "Decision Center" },
      { href: "/dashboard/actions/tasks", label: "Tasks" },
      { href: "/dashboard/actions/outcomes", label: "Outcomes" },
    ],
  },
  {
    href: "/dashboard/reports",
    label: "Reports",
    icon: "📄",
    children: [
      { href: "/dashboard/reports", label: "Overview" },
      { href: "/dashboard/reports/weekly", label: "Weekly Report" },
      { href: "/dashboard/reports/history", label: "History" },
    ],
  },
  { href: "/dashboard/discover", label: "Discover", icon: "🔍" },
];

const bottomItems: NavItem[] = [
  { href: "/dashboard/team", label: "Team", icon: "👥" },
  { href: "/dashboard/connectors", label: "Connectors", icon: "🔌" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
  { href: "/dashboard/help", label: "Help", icon: "❓" },
];

function NavLink({ item, path, depth = 0 }: { item: NavItem; path: string; depth?: number }) {
  const active = path === item.href || path.startsWith(item.href + "/");
  const [expanded, setExpanded] = useState(active);

  return (
    <div>
      <Link
        href={item.href}
        onClick={(e) => {
          if (item.children) {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing.sm,
          padding: `${spacing.sm} ${spacing.md}`,
          borderRadius: radius.md,
          textDecoration: "none",
          fontSize: "0.9rem",
          fontWeight: active ? 700 : 500,
          color: active ? colors.primary : colors.text,
          background: active ? colors.primaryLight : "transparent",
          marginLeft: depth > 0 ? `${depth * 1.25}rem` : 0,
        }}
      >
        <span style={{ fontSize: "1rem" }}>{item.icon}</span>
        <span style={{ flex: 1 }}>{item.label}</span>
        {item.children && (
          <span style={{ fontSize: "0.75rem", color: colors.muted, transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>
            ▶
          </span>
        )}
      </Link>
      {item.children && expanded && (
        <div style={{ marginTop: spacing.xs }}>
          {item.children.map((child) => (
            <NavLink
              key={child.href}
              item={{ href: child.href, label: child.label, icon: "▸" }}
              path={path}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ user, organization, token, onSignOut }: { user: any; organization: any; token: string | null; onSignOut: () => void }) {
  const path = usePathname();

  return (
    <div
      className="workspace-sidebar"
      style={{
        width: 280,
        minHeight: "100vh",
        background: colors.surface,
        borderRight: `1px solid ${colors.border}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Brand */}
      <div style={{ padding: spacing.xl, borderBottom: `1px solid ${colors.border}` }}>
        <h2 style={{ ...typography.h2, margin: 0 }}>Ristorante</h2>
        {organization && (
          <p style={{ ...typography.caption, margin: "0.125rem 0 0" }}>{organization.name}</p>
        )}
      </div>

      {/* Search */}
      <div style={{ padding: spacing.md, borderBottom: `1px solid ${colors.border}` }}>
        <GlobalSearch token={token} />
      </div>

      {/* Main Nav */}
      <nav style={{ flex: 1, padding: spacing.md, display: "flex", flexDirection: "column", gap: spacing.xs, overflow: "auto" }}>
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} path={path} />
        ))}
      </nav>

      {/* Bottom Nav */}
      <div style={{ borderTop: `1px solid ${colors.border}`, padding: spacing.md, display: "flex", flexDirection: "column", gap: spacing.xs }}>
        {bottomItems.map((item) => (
          <NavLink key={item.href} item={item} path={path} />
        ))}
      </div>

      {/* User */}
      <div style={{ padding: `${spacing.lg} ${spacing.xl}`, borderTop: `1px solid ${colors.border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm }}>
          <div>
            <p style={{ ...typography.small, margin: 0, fontWeight: 500 }}>{user?.name}</p>
            <p style={{ ...typography.caption, margin: "0.125rem 0 0" }}>{user?.email}</p>
          </div>
          <NotificationBell token={token} />
        </div>
        <button
          onClick={onSignOut}
          style={{
            background: "none",
            border: `1px solid ${colors.border}`,
            color: colors.muted,
            padding: `${spacing.xs} ${spacing.md}`,
            borderRadius: radius.sm,
            cursor: "pointer",
            fontSize: "0.75rem",
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
