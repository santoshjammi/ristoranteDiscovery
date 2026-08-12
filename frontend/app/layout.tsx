import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ristorante — Restaurant Visibility Intelligence",
  description: "AI-powered discoverability optimization for restaurants",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "var(--color-bg, #0f172a)", color: "var(--color-text, #f1f5f9)", fontFamily: "system-ui, -apple-system, sans-serif" }}>{children}</body>
    </html>
  );
}
