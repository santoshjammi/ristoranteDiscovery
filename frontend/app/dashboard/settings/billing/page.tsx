"use client";

import { AuthProvider, useAuth } from "@/app/lib/auth-context";
import { useState, useEffect, useCallback } from "react";
import { colors, spacing, radius, typography } from "@/lib/design-tokens";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

import { API } from "@/app/lib/api-config";

interface Plan {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  maxRestaurants: number;
  maxMembers: number;
  features: string;
  isActive: boolean;
}

interface Subscription {
  id: string;
  organizationId: string;
  planId: string;
  plan: Plan;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  razorpayPaymentId: string | null;
}

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  dueAt: string;
  paidAt: string | null;
  invoiceUrl: string | null;
}

function BillingPage() {
  const { token } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const headers = { Authorization: `Bearer ${token}`, "x-org-id": "admin" };

      const [plansRes, subRes, invoicesRes] = await Promise.all([
        fetch(`${API}/api/subscription/plans`, { headers }),
        fetch(`${API}/api/subscription/current`, { headers }),
        fetch(`${API}/api/subscription/invoices`, { headers }),
      ]);

      if (!plansRes.ok) throw new Error("Failed to load plans");
      const plansData = await plansRes.json();
      setPlans(Array.isArray(plansData.data) ? plansData.data : []);

      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData.data || null);
      }

      if (invoicesRes.ok) {
        const invData = await invoicesRes.json();
        setInvoices(Array.isArray(invData.data) ? invData.data : []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchData();
    else setLoading(false);
  }, [token, fetchData]);

  const handleSubscribe = async (plan: Plan) => {
    if (!token) return;
    setSubscribing(plan.slug);
    setMessage(null);
    try {
      if (plan.priceMonthly === 0) {
        // Free plan — just activate directly
        const res = await fetch(`${API}/api/subscription/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "x-org-id": "admin" },
          body: JSON.stringify({ planSlug: plan.slug, razorpayOrderId: "free", razorpayPaymentId: "free", razorpaySignature: "free" }),
        });
        if (!res.ok) throw new Error("Failed to activate free plan");
        setMessage(`${plan.name} plan activated!`);
        await fetchData();
        return;
      }

      // Create Razorpay order
      const orderRes = await fetch(`${API}/api/subscription/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "x-org-id": "admin" },
        body: JSON.stringify({ planSlug: plan.slug }),
      });
      if (!orderRes.ok) throw new Error("Failed to create order");
      const orderData = await orderRes.json();
      const { orderId, amount, currency, keyId } = orderData.data;

      // Load Razorpay checkout script
      await new Promise<void>((resolve, reject) => {
        if ((window as any).Razorpay) { resolve(); return; }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Razorpay"));
        document.body.appendChild(script);
      });

      // Open Razorpay checkout
      const options = {
        key: keyId,
        amount,
        currency,
        name: "Ristorante Discovery",
        description: `${plan.name} Plan`,
        order_id: orderId,
        handler: async (response: any) => {
          // Verify payment
          const verifyRes = await fetch(`${API}/api/subscription/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "x-org-id": "admin" },
            body: JSON.stringify({
              planSlug: plan.slug,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          if (!verifyRes.ok) throw new Error("Payment verification failed");
          setMessage(`${plan.name} plan activated successfully!`);
          await fetchData();
        },
        modal: {
          ondismiss: () => setSubscribing(null),
        },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSubscribing(null);
    }
  };

  const handleCancel = async () => {
    if (!token) return;
    setCancelling(true);
    setMessage(null);
    try {
      const res = await fetch(`${API}/api/subscription/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "x-org-id": "admin" },
      });
      if (!res.ok) throw new Error("Failed to cancel");
      setMessage("Subscription cancelled. You'll have access until the end of the billing period.");
      setShowCancelConfirm(false);
      await fetchData();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);
  };

  const statusBadge = (status: string) => {
    const colors_map: Record<string, string> = {
      active: "#0a3d0a",
      canceled: colors.dangerLight,
      past_due: "#3d2a0a",
      trialing: "#0a1a3d",
    };
    const text_colors: Record<string, string> = {
      active: colors.success,
      canceled: colors.danger,
      past_due: "#cc8800",
      trialing: colors.primary,
    };
    return (
      <span style={{ fontSize: "0.75rem", padding: `2px ${spacing.sm}`, borderRadius: radius.sm, background: colors_map[status] || colors.muted, color: text_colors[status] || colors.mutedDarker, fontWeight: 500 }}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Billing</h1>
        <LoadingSkeleton count={4} height="6rem" width="100%" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Billing</h1>
        <div style={{ padding: spacing["3xl"], textAlign: "center", background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.dangerLight}` }}>
          <p style={{ fontSize: "1rem", color: colors.danger, margin: 0 }}>Failed to load billing data</p>
          <p style={{ ...typography.small, margin: `${spacing.sm} 0 ${spacing.lg}`, color: colors.muted }}>{error}</p>
          <button onClick={fetchData} style={{ padding: `${spacing.sm} ${spacing.lg}`, borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: "transparent", color: colors.text, cursor: "pointer" }}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ ...typography.h1, margin: `0 0 ${spacing.xs}` }}>Billing</h1>
      <p style={{ ...typography.small, margin: `0 0 ${spacing["2xl"]}`, color: colors.mutedDarker }}>
        Manage your subscription and payment history.
      </p>

      {message && (
        <div style={{ padding: spacing.md, marginBottom: spacing.lg, background: message.startsWith("Error") ? colors.dangerLight : "#0a3d0a", borderRadius: radius.md, border: `1px solid ${message.startsWith("Error") ? colors.danger : colors.success}`, color: message.startsWith("Error") ? colors.danger : colors.success, fontSize: "0.875rem" }}>
          {message}
        </div>
      )}

      {/* Current Plan Section */}
      <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, marginBottom: spacing.xl }}>
        <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.md}` }}>Current Plan</h3>
        {subscription ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: spacing.md, marginBottom: spacing.md }}>
              <span style={{ fontSize: "1.5rem" }}>⭐</span>
              <div>
                <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: colors.text }}>{subscription.plan.name}</p>
                <p style={{ ...typography.small, margin: `${spacing.xs} 0 0`, color: colors.muted }}>
                  {formatPrice(subscription.plan.priceMonthly)}/month · {statusBadge(subscription.status)}
                </p>
              </div>
            </div>
            <p style={{ ...typography.small, margin: `0 0 ${spacing.sm}`, color: colors.mutedDarker }}>
              Period: {formatDate(subscription.currentPeriodStart)} — {formatDate(subscription.currentPeriodEnd)}
            </p>
            {subscription.cancelAtPeriodEnd && (
              <p style={{ ...typography.small, margin: `0 0 ${spacing.md}`, color: "#cc8800" }}>
                Your subscription will be cancelled at the end of the billing period.
              </p>
            )}
            {subscription.status === "active" && !subscription.cancelAtPeriodEnd && (
              <button onClick={() => setShowCancelConfirm(true)} disabled={cancelling} style={{ padding: `${spacing.sm} ${spacing.lg}`, borderRadius: radius.sm, border: `1px solid ${colors.danger}`, background: "transparent", color: colors.danger, cursor: "pointer", fontSize: "0.8125rem" }}>
                {cancelling ? "Cancelling..." : "Cancel Subscription"}
              </button>
            )}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: spacing.xl }}>
            <p style={{ fontSize: "2rem", margin: `0 0 ${spacing.md}` }}>📋</p>
            <p style={{ ...typography.body, margin: `0 0 ${spacing.sm}`, color: colors.muted }}>No active plan</p>
            <p style={{ ...typography.small, margin: 0, color: colors.mutedDarker }}>Choose a plan below to get started.</p>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.xl, maxWidth: 400, width: "90%" }}>
            <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.md}` }}>Cancel Subscription?</h3>
            <p style={{ ...typography.small, margin: `0 0 ${spacing.xl}`, color: colors.muted }}>
              Your plan will remain active until the end of the current billing period. After that, you'll lose access to premium features.
            </p>
            <div style={{ display: "flex", gap: spacing.md, justifyContent: "flex-end" }}>
              <button onClick={() => setShowCancelConfirm(false)} style={{ padding: `${spacing.sm} ${spacing.lg}`, borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: "transparent", color: colors.text, cursor: "pointer", fontSize: "0.8125rem" }}>
                Keep Plan
              </button>
              <button onClick={handleCancel} disabled={cancelling} style={{ padding: `${spacing.sm} ${spacing.lg}`, borderRadius: radius.sm, border: "none", background: colors.danger, color: "#fff", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600 }}>
                {cancelling ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Selection */}
      <div style={{ marginBottom: spacing.xl }}>
        <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.md}` }}>Available Plans</h3>
        {plans.length === 0 ? (
          <div style={{ textAlign: "center", padding: spacing["3xl"], background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
            <p style={{ ...typography.small, color: colors.muted }}>No plans available at this time.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: spacing.md }}>
            {plans.map((plan) => {
              const isCurrentPlan = subscription?.planId === plan.id;
              const features = (() => { try { return JSON.parse(plan.features); } catch { return []; } })();
              return (
                <div key={plan.id} style={{ padding: spacing.xl, background: isCurrentPlan ? colors.primaryLight : colors.surface, borderRadius: radius.xl, border: `1px solid ${isCurrentPlan ? colors.primary : colors.border}`, position: "relative", opacity: isCurrentPlan ? 0.9 : 1 }}>
                  {isCurrentPlan && (
                    <span style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", padding: `${spacing.xs} ${spacing.lg}`, borderRadius: radius.full, background: colors.primary, color: "#fff", fontSize: "0.75rem", fontWeight: 600 }}>
                      Current Plan
                    </span>
                  )}
                  <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.xs}` }}>{plan.name}</h3>
                  <p style={{ margin: `0 0 ${spacing.sm}`, fontSize: "1.5rem", fontWeight: 700, color: colors.text }}>
                    {plan.priceMonthly === 0 ? "Free" : formatPrice(plan.priceMonthly)}
                    {plan.priceMonthly > 0 && <span style={{ fontSize: "0.75rem", color: colors.mutedDarker }}>/month</span>}
                  </p>
                  <p style={{ ...typography.small, margin: `0 0 ${spacing.md}`, color: colors.mutedDarker }}>{plan.description}</p>
                  <ul style={{ listStyle: "none", padding: 0, margin: `0 0 ${spacing.lg}`, display: "flex", flexDirection: "column", gap: spacing.xs }}>
                    {features.map((f: string) => (
                      <li key={f} style={{ ...typography.small, color: colors.muted, display: "flex", alignItems: "center", gap: spacing.sm }}>
                        <span style={{ color: colors.success }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  {!isCurrentPlan && (
                    <button onClick={() => handleSubscribe(plan)} disabled={subscribing === plan.slug} style={{ width: "100%", padding: `${spacing.sm} ${spacing.lg}`, borderRadius: radius.md, border: "none", background: colors.primary, color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", opacity: subscribing === plan.slug ? 0.6 : 1 }}>
                      {subscribing === plan.slug ? "Processing..." : plan.priceMonthly === 0 ? "Get Started" : "Subscribe"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment History */}
      <div>
        <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.md}` }}>Payment History</h3>
        {invoices.length === 0 ? (
          <div style={{ textAlign: "center", padding: spacing["3xl"], background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
            <p style={{ ...typography.small, color: colors.muted }}>No invoices yet.</p>
          </div>
        ) : (
          <div style={{ background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <th style={{ padding: spacing.md, textAlign: "left", fontSize: "0.75rem", color: colors.mutedDarker, fontWeight: 600, textTransform: "uppercase" }}>Date</th>
                  <th style={{ padding: spacing.md, textAlign: "left", fontSize: "0.75rem", color: colors.mutedDarker, fontWeight: 600, textTransform: "uppercase" }}>Amount</th>
                  <th style={{ padding: spacing.md, textAlign: "left", fontSize: "0.75rem", color: colors.mutedDarker, fontWeight: 600, textTransform: "uppercase" }}>Status</th>
                  <th style={{ padding: spacing.md, textAlign: "right", fontSize: "0.75rem", color: colors.mutedDarker, fontWeight: 600, textTransform: "uppercase" }}>Invoice</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: spacing.md, fontSize: "0.875rem", color: colors.text }}>{formatDate(inv.paidAt || inv.dueAt)}</td>
                    <td style={{ padding: spacing.md, fontSize: "0.875rem", color: colors.text }}>{formatPrice(inv.amount)}</td>
                    <td style={{ padding: spacing.md }}>{statusBadge(inv.status)}</td>
                    <td style={{ padding: spacing.md, textAlign: "right" }}>
                      {inv.invoiceUrl ? (
                        <a href={inv.invoiceUrl} target="_blank" rel="noopener noreferrer" style={{ color: colors.primary, fontSize: "0.8125rem", textDecoration: "none" }}>View →</a>
                      ) : (
                        <span style={{ color: colors.mutedDarker, fontSize: "0.8125rem" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Billing() {
  return <AuthProvider><BillingPage /></AuthProvider>;
}
