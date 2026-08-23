import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ristorante — Restaurant Visibility Intelligence",
  description: "AI-powered discoverability optimization for restaurants",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
