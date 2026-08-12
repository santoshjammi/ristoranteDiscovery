"use client";

import { PublicLayout } from "@/components/shared/PublicLayout";
import Link from "next/link";

export default function LandingPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "6rem 2rem 3rem", textAlign: "center" }}>
        <div
          style={{
            display: "inline-block",
            padding: "0.375rem 1rem",
            borderRadius: "9999px",
            background: "rgba(59, 130, 246, 0.1)",
            color: "#60a5fa",
            fontSize: "0.8125rem",
            fontWeight: 600,
            marginBottom: "1.5rem",
            letterSpacing: "0.02em",
          }}
        >
          Free Visibility Audit — See Where You Stand
        </div>
        <h1
          style={{
            fontSize: "2.75rem",
            fontWeight: 700,
            color: "var(--color-text, #f1f5f9)",
            margin: "0 0 0.75rem",
            lineHeight: 1.15,
            maxWidth: 700,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Know What&apos;s Wrong. Know What to Do Next. Measure the Improvement.
        </h1>
        <p
          style={{
            fontSize: "1.125rem",
            color: "var(--color-muted, #94a3b8)",
            margin: "0 0 2rem",
            maxWidth: 600,
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.6,
          }}
        >
          Get a free visibility audit for your restaurant. We analyze your menu, reviews, SEO, competitors, and market position — then show you exactly what to fix first.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <Link
            href="/auth"
            style={{
              padding: "0.75rem 2rem",
              borderRadius: "0.5rem",
              background: "var(--color-primary, #3b82f6)",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "1rem",
            }}
          >
            Get Your Free Audit
          </Link>
          <a
            href="#how-it-works"
            style={{
              padding: "0.75rem 2rem",
              borderRadius: "0.5rem",
              border: "1px solid var(--color-border, #334155)",
              color: "var(--color-text, #f1f5f9)",
              textDecoration: "none",
              fontWeight: 500,
              fontSize: "1rem",
            }}
          >
            How It Works
          </a>
        </div>
      </div>

      {/* How It Works */}
      <div id="how-it-works" style={{ maxWidth: 1000, margin: "0 auto", padding: "3rem 2rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text, #f1f5f9)", textAlign: "center", margin: "0 0 2rem" }}>
          How It Works
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
          {[
            { step: "1", title: "Add Your Restaurant", desc: "Enter your restaurant name, address, and cuisine type. Takes 2 minutes." },
            { step: "2", title: "We Run the Audit", desc: "Our intelligence engines analyze your menu, reviews, SEO, competitors, and market position." },
            { step: "3", title: "See Your Top 5 Issues", desc: "Get a clear report showing exactly what's hurting your visibility and what to fix first." },
            { step: "4", title: "Subscribe for Continuous Monitoring", desc: "Get weekly updates, prioritized recommendations, and measurable improvement tracking." },
          ].map((item) => (
            <div
              key={item.step}
              style={{
                padding: "1.5rem",
                background: "var(--color-surface, #1e293b)",
                borderRadius: "0.75rem",
                border: "1px solid var(--color-border, #334155)",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "var(--color-primary, #3b82f6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  marginBottom: "0.75rem",
                }}
              >
                {item.step}
              </div>
              <h3 style={{ margin: "0 0 0.25rem", fontSize: "1rem", fontWeight: 600, color: "var(--color-text, #f1f5f9)" }}>{item.title}</h3>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-muted, #94a3b8)" }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* What the Audit Tells You */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "3rem 2rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text, #f1f5f9)", textAlign: "center", margin: "0 0 2rem" }}>
          What Your Audit Will Tell You
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
          {[
            { icon: "🔍", title: "Your Visibility Score", desc: "How findable is your restaurant across search, maps, and AI?" },
            { icon: "🍽️", title: "Menu Issues", desc: "Missing descriptions, dietary tags, or pricing gaps that hurt discoverability." },
            { icon: "⭐", title: "Review Insights", desc: "What customers are saying — and what you're missing." },
            { icon: "🏆", title: "Competitive Position", desc: "How you compare to nearby competitors across every dimension." },
            { icon: "🔧", title: "Prioritized Fixes", desc: "The top 5 things to fix, ranked by business impact." },
            { icon: "📈", title: "Growth Opportunities", desc: "Underserved cuisines and locations in your market." },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                padding: "1.25rem",
                background: "var(--color-surface, #1e293b)",
                borderRadius: "0.75rem",
                border: "1px solid var(--color-border, #334155)",
              }}
            >
              <p style={{ fontSize: "1.5rem", margin: "0 0 0.5rem" }}>{item.icon}</p>
              <h3 style={{ margin: "0 0 0.25rem", fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text, #f1f5f9)" }}>{item.title}</h3>
              <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-muted, #94a3b8)" }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "3rem 2rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text, #f1f5f9)", textAlign: "center", margin: "0 0 2rem" }}>
          Simple Pricing
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div
            style={{
              padding: "2rem",
              background: "var(--color-surface, #1e293b)",
              borderRadius: "0.75rem",
              border: "1px solid var(--color-border, #334155)",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "0.75rem", color: "var(--color-muted, #94a3b8)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 0.5rem" }}>
              Free
            </p>
            <p style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--color-text, #f1f5f9)", margin: "0" }}>₹0</p>
            <p style={{ fontSize: "0.875rem", color: "var(--color-muted, #94a3b8)", margin: "0.5rem 0 1.5rem" }}>
              One-time visibility audit
            </p>
            <Link
              href="/auth"
              style={{
                padding: "0.75rem 2rem",
                borderRadius: "0.5rem",
                background: "var(--color-primary, #3b82f6)",
                color: "#fff",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "1rem",
                display: "inline-block",
              }}
            >
              Get Free Audit
            </Link>
          </div>
          <div
            style={{
              padding: "2rem",
              background: "var(--color-surface, #1e293b)",
              borderRadius: "0.75rem",
              border: "2px solid var(--color-primary, #3b82f6)",
              textAlign: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-0.75rem",
                left: "50%",
                transform: "translateX(-50%)",
                padding: "0.25rem 0.75rem",
                background: "var(--color-primary, #3b82f6)",
                borderRadius: "9999px",
                color: "#fff",
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
            >
              Most Popular
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--color-muted, #94a3b8)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 0.5rem" }}>
              Growth
            </p>
            <p style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--color-text, #f1f5f9)", margin: "0" }}>
              ₹999<span style={{ fontSize: "1rem", color: "var(--color-muted, #94a3b8)", fontWeight: 400 }}>/month</span>
            </p>
            <p style={{ fontSize: "0.875rem", color: "var(--color-muted, #94a3b8)", margin: "0.5rem 0 1.5rem" }}>
              Per restaurant. Continuous monitoring + recommendations.
            </p>
            <Link
              href="/auth"
              style={{
                padding: "0.75rem 2rem",
                borderRadius: "0.5rem",
                background: "var(--color-primary, #3b82f6)",
                color: "#fff",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "1rem",
                display: "inline-block",
              }}
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
