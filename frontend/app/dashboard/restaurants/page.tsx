"use client";

import { AuthProvider, useAuth } from "@/app/lib/auth-context";
import { useState, useEffect } from "react";
import { colors, spacing, radius, typography } from "@/lib/design-tokens";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useList } from "@/lib/useList";
import { SearchBar, SortButton, FilterDropdown, Pagination, ActiveFilters } from "@/components/shared/ListControls";
import { PortfolioCard, PortfolioSummaryBar, type Portfolio, type PortfolioRestaurant } from "@/components/scorecard/PortfolioCard";
import { PortfolioHeatMap, type HeatFilter } from "@/components/scorecard/PortfolioHeatMap";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8040";

function RestaurantList() {
  const { token, organization } = useAuth();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [cuisineTypes, setCuisineTypes] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [view, setView] = useState<"cards" | "heatmap">("cards");
  const [heatFilter, setHeatFilter] = useState<"all" | "critical" | "attention" | "healthy">("all");

  const fetchPortfolio = async () => {
    if (!token) return;
    setError("");
    try {
      const res = await fetch(`${API}/api/portfolio`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const data = await res.json();
      setPortfolio(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPortfolio(); }, [token]);

  const restaurants: PortfolioRestaurant[] = portfolio?.restaurants || [];

  const list = useList({
    items: restaurants,
    searchFields: ["name", "city", "cuisineTypes"],
    defaultSort: { key: "overallScore", direction: "desc" },
    pageSize: 10,
  });

  const createRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/restaurants`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, address, city, cuisineTypes: JSON.stringify(cuisineTypes.split(",").map((s) => s.trim())) }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to create"); }
      const data = await res.json();
      const newRestaurant = data.data || data;
      if (organization) {
        await fetch(`${API}/api/organizations/${organization.id}/restaurants`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ restaurantId: newRestaurant.id }),
        });
      }
      setShowForm(false);
      setName(""); setAddress(""); setCity(""); setCuisineTypes("");
      fetchPortfolio();
    } catch (err: any) { setFormError(err.message); }
    finally { setSubmitting(false); }
  };

  const deleteRestaurant = async (id: string) => {
    if (!token || !confirm("Remove this restaurant?")) return;
    setDeleting(id);
    try {
      await fetch(`${API}/api/restaurants/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPortfolio();
    } catch {} finally { setDeleting(null); }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <LoadingSkeleton count={1} height="1.5rem" width="30%" />
        <div style={{ marginTop: spacing.xl }}><LoadingSkeleton count={6} height="8rem" width="100%" /></div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ padding: spacing["3xl"], textAlign: "center", background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.dangerLight}` }}>
          <p style={{ fontSize: "1rem", color: colors.danger, margin: `0 0 ${spacing.sm}` }}>Failed to load portfolio</p>
          <p style={{ ...typography.small, margin: `0 0 ${spacing.lg}` }}>{error}</p>
          <button onClick={fetchPortfolio} style={{ padding: `${spacing.sm} ${spacing.lg}`, borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: "transparent", color: colors.text, cursor: "pointer", fontSize: "0.8125rem" }}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg }}>
        <div>
          <h1 style={{ ...typography.h1, margin: 0 }}>Restaurant Portfolio</h1>
          <p style={{ ...typography.small, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>
            {restaurants.length} locations · understand your entire portfolio at a glance
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: `${spacing.sm} ${spacing.lg}`, borderRadius: radius.md, border: "none", background: showForm ? colors.muted : colors.primary, color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "0.875rem" }}>
          {showForm ? "Cancel" : "+ Add Restaurant"}
        </button>
      </div>

      {/* Portfolio summary bar */}
      {portfolio && <PortfolioSummaryBar summary={portfolio.summary} />}

      {/* View toggle: Cards | Heat Map */}
      <div style={{ display: "flex", gap: spacing.sm, marginBottom: spacing.lg }}>
        {(["cards", "heatmap"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: `${spacing.sm} ${spacing.lg}`,
              borderRadius: radius.md,
              border: `1px solid ${view === v ? colors.primary : colors.border}`,
              background: view === v ? colors.primaryLight : "transparent",
              color: view === v ? colors.primary : colors.muted,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.8125rem",
            }}
          >
            {v === "cards" ? "Cards" : "Heat Map"}
          </button>
        ))}
      </div>

      {/* Heat map view */}
      {view === "heatmap" && (
        <div style={{ marginBottom: spacing.xl }}>
          <div style={{ display: "flex", gap: spacing.sm, marginBottom: spacing.md, flexWrap: "wrap" }}>
            {(["all", "critical", "attention", "healthy"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setHeatFilter(f)}
                style={{
                  padding: `${spacing.xs} ${spacing.md}`,
                  borderRadius: radius.sm,
                  border: `1px solid ${heatFilter === f ? colors.primary : colors.border}`,
                  background: heatFilter === f ? colors.primaryLight : "transparent",
                  color: heatFilter === f ? colors.primary : colors.muted,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  textTransform: "capitalize",
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <PortfolioHeatMap restaurants={restaurants} filter={heatFilter} />
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <form onSubmit={createRestaurant} style={{ display: "flex", flexDirection: "column", gap: spacing.md, padding: spacing.xl, background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}`, marginBottom: spacing.xl }}>
          <h3 style={{ ...typography.h3, margin: 0 }}>Add Restaurant</h3>
          {formError && <p style={{ color: colors.danger, fontSize: "0.8125rem", margin: 0 }}>{formError}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.md }}>
            <input placeholder="Restaurant Name" value={name} onChange={(e) => setName(e.target.value)} required style={{ padding: spacing.sm, borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: "0.875rem" }} />
            <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} required style={{ padding: spacing.sm, borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: "0.875rem" }} />
          </div>
          <input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} required style={{ padding: spacing.sm, borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: "0.875rem" }} />
          <input placeholder="Cuisine Types (comma-separated)" value={cuisineTypes} onChange={(e) => setCuisineTypes(e.target.value)} style={{ padding: spacing.sm, borderRadius: radius.sm, border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, fontSize: "0.875rem" }} />
          <button type="submit" disabled={submitting} style={{ padding: spacing.sm, borderRadius: radius.sm, border: "none", background: submitting ? colors.muted : colors.primary, color: "#fff", fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", fontSize: "0.875rem" }}>
            {submitting ? "Creating..." : "Create Restaurant"}
          </button>
        </form>
      )}

      {/* Search + Sort + Filter Bar */}
      <div style={{ display: "flex", gap: spacing.md, alignItems: "center", marginBottom: spacing.md, flexWrap: "wrap" }}>
        <SearchBar value={list.search} onChange={list.setSearch} placeholder="Search restaurants..." />
        <SortButton label="Score" sortKey="overallScore" current={list.sort} onToggle={list.toggleSort} />
        <SortButton label="Name" sortKey="name" current={list.sort} onToggle={list.toggleSort} />
        <SortButton label="City" sortKey="city" current={list.sort} onToggle={list.toggleSort} />
        <FilterDropdown label="Status" filterKey="overallStatus" options={[{ value: "excellent", label: "Excellent" }, { value: "good", label: "Good" }, { value: "fair", label: "Fair" }, { value: "needs_attention", label: "Needs Attention" }, { value: "critical", label: "Critical" }]} current={list.filters} onSet={list.setFilterValue} onClear={list.removeFilter} />
      </div>

      {/* Active Filters */}
      <ActiveFilters filters={list.filters} onRemove={list.removeFilter} onClear={list.clearFilters} />

      {/* Cards view */}
      {view === "cards" && (list.totalCount === 0 ? (
        <div style={{ textAlign: "center", padding: spacing["4xl"], background: colors.surface, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
          <p style={{ fontSize: "2rem", margin: `0 0 ${spacing.lg}` }}>🍽️</p>
          <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.sm}` }}>{restaurants.length === 0 ? "No restaurants yet" : "No matching restaurants"}</h3>
          <p style={{ ...typography.small, margin: `0 0 ${spacing.xl}`, color: colors.muted }}>
            {restaurants.length === 0 ? "Add your first restaurant to get started." : "Try adjusting your search or filters."}
          </p>
          {restaurants.length === 0 && (
            <button onClick={() => setShowForm(true)} style={{ padding: `${spacing.sm} ${spacing.xl}`, borderRadius: radius.md, border: "none", background: colors.primary, color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "0.875rem" }}>
              Add Your First Restaurant
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Results count */}
          <p style={{ ...typography.caption, margin: `0 0 ${spacing.md}` }}>
            Showing {list.paged.length} of {list.totalCount}
          </p>

          {/* Portfolio cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
            {list.paged.map((r) => (
              <div key={r.id} style={{ position: "relative" }}>
                <PortfolioCard restaurant={r} />
                <button
                  onClick={() => deleteRestaurant(r.id)}
                  disabled={deleting === r.id}
                  style={{
                    position: "absolute",
                    top: spacing.md,
                    right: spacing.md,
                    padding: `${spacing.xs} ${spacing.md}`,
                    borderRadius: radius.sm,
                    border: `1px solid ${colors.danger}40`,
                    background: "transparent",
                    color: colors.danger,
                    cursor: deleting === r.id ? "not-allowed" : "pointer",
                    fontSize: "0.75rem",
                    opacity: deleting === r.id ? 0.5 : 1,
                    zIndex: 2,
                  }}
                  title="Remove restaurant"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <Pagination page={list.page} totalPages={list.totalPages} totalCount={list.totalCount} onPageChange={list.setPage} />
        </>
      ))}
    </div>
  );
}

export default function RestaurantsPage() {
  return <AuthProvider><RestaurantList /></AuthProvider>;
}
