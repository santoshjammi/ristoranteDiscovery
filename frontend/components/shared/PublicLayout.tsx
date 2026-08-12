"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { colors, spacing, radius } from "@/lib/design-tokens";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/pricing", label: "Pricing" },
  { href: "/success-stories", label: "Success Stories" },
  { href: "/learn", label: "Learn" },
];

export function PublicHeader() {
  const path = usePathname();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: colors.bg,
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: `${spacing.lg} ${spacing["3xl"]}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: spacing.sm }}>
          <span style={{ fontSize: "1.25rem" }}>🍽️</span>
          <span style={{ fontSize: "1.125rem", fontWeight: 700, color: colors.text }}>Ristorante</span>
        </Link>

        {/* Nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: spacing.xl }}>
          {navLinks.map((link) => {
            const active = path === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  fontWeight: active ? 600 : 400,
                  color: active ? colors.primary : colors.muted,
                  borderBottom: active ? `2px solid ${colors.primary}` : "2px solid transparent",
                  paddingBottom: spacing.xs,
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: spacing.md }}>
          <Link
            href="/auth"
            style={{
              padding: `${spacing.sm} ${spacing.lg}`,
              borderRadius: radius.md,
              border: `1px solid ${colors.border}`,
              color: colors.text,
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Sign In
          </Link>
          <Link
            href="/auth"
            style={{
              padding: `${spacing.sm} ${spacing.lg}`,
              borderRadius: radius.md,
              background: colors.primary,
              color: "#fff",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            Run Free Audit
          </Link>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer
      style={{
        borderTop: `1px solid ${colors.border}`,
        padding: `${spacing["3xl"]} ${spacing["3xl"]}`,
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <p style={{ fontSize: "0.8125rem", color: colors.muted, margin: 0 }}>
          Ristorante — Restaurant Visibility Intelligence. Know what&apos;s wrong. Know what to do next. Measure the improvement.
        </p>
      </div>
    </footer>
  );
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: colors.bg, display: "flex", flexDirection: "column" }}>
      <PublicHeader />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
    </div>
  );
}
