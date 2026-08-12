"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createRestaurant } from "@/app/lib/api";

export default function NewRestaurantPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", address: "", city: "", state: "", postalCode: "",
    phone: "", website: "", cuisineTypes: "", regionalCuisine: "", priceRange: "$$",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.address || !form.city) {
      setError("Name, address, and city are required.");
      return;
    }
    setSaving(true); setError("");
    try {
      const r = await createRestaurant({
        ...form,
        cuisineTypes: form.cuisineTypes ? form.cuisineTypes.split(",").map((s) => s.trim()) : [],
      });
      router.push(`/restaurants/${r.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create restaurant");
    } finally { setSaving(false); }
  };

  const fields: Array<{ key: string; label: string; placeholder: string; colSpan?: number; hint?: string }> = [
    { key: "name", label: "Restaurant Name *", placeholder: "e.g., Dharani Cary", colSpan: 2 },
    { key: "address", label: "Address *", placeholder: "e.g., 123 Main Street", colSpan: 2 },
    { key: "city", label: "City *", placeholder: "e.g., Cary" },
    { key: "state", label: "State", placeholder: "e.g., NC" },
    { key: "postalCode", label: "Postal Code", placeholder: "e.g., 27513" },
    { key: "phone", label: "Phone", placeholder: "e.g., (919) 555-0123" },
    { key: "website", label: "Website", placeholder: "https://example.com" },
    { key: "cuisineTypes", label: "Cuisine Types", placeholder: "Indian, South Indian, Vegetarian", hint: "Comma-separated" },
    { key: "regionalCuisine", label: "Regional Cuisine", placeholder: "e.g., South Indian, Hyderabadi" },
  ];

  return (
    <>
      <nav className="global-nav">
        <div className="global-nav-inner">
          <ul className="global-nav-links">
            <li><a href="/" style={{ fontWeight: 700, color: "var(--green-starbucks)" }}>Ristorante</a></li>
            <li><a href="/">Dashboard</a></li>
          </ul>
          <div className="global-nav-actions">
            <Link href="/" className="btn-dark-outlined" style={{ fontSize: "1.3rem" }}>← Back</Link>
          </div>
        </div>
      </nav>
      <div style={{ height: "7.2rem" }} />

      <section className="feature-band" style={{ padding: "3.2rem 0" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 var(--space-4)" }}>
          <h1 className="h1" style={{ color: "var(--text-white)", fontSize: "2.8rem", margin: 0 }}>Add Restaurant</h1>
          <p className="small" style={{ color: "var(--text-white-soft)", marginTop: "0.4rem" }}>
            Add a new restaurant to start tracking discoverability
          </p>
        </div>
      </section>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "var(--space-5) var(--space-4) var(--space-9)" }}>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="card" style={{ padding: "1.2rem 2rem", marginBottom: "2rem", border: "1px solid var(--red)" }}>
              <p className="body" style={{ color: "var(--red)", fontSize: "1.5rem" }}>{error}</p>
            </div>
          )}

          <div className="card" style={{ padding: "2.8rem 3.2rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
              {fields.map((f) => (
                <div key={f.key} style={{ gridColumn: "colSpan" in f && f.colSpan === 2 ? "1 / -1" : undefined }}>
                  <label className="small-strong" style={{ display: "block", marginBottom: "0.6rem", color: "var(--text-black)" }}>
                    {f.label}
                  </label>
                  <input
                    type="text"
                    value={(form as any)[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    style={{
                      width: "100%",
                      padding: "1rem 1.4rem",
                      border: "1px solid var(--input-border)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "1.5rem",
                      fontFamily: "var(--font)",
                      color: "var(--text-black)",
                      background: "var(--white)",
                      outline: "none",
                    }}
                  />
                  {"hint" in f && f.hint && (
                    <p className="small" style={{ color: "var(--text-soft)", marginTop: "0.4rem" }}>{f.hint}</p>
                  )}
                </div>
              ))}

              <div>
                <label className="small-strong" style={{ display: "block", marginBottom: "0.6rem", color: "var(--text-black)" }}>
                  Price Range
                </label>
                <select
                  value={form.priceRange}
                  onChange={(e) => setForm({ ...form, priceRange: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "1rem 1.4rem",
                    border: "1px solid var(--input-border)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "1.5rem",
                    fontFamily: "var(--font)",
                    color: "var(--text-black)",
                    background: "var(--white)",
                    outline: "none",
                  }}
                >
                  <option value="$">$ (Inexpensive)</option>
                  <option value="$$">$$ (Moderate)</option>
                  <option value="$$$">$$$ (Expensive)</option>
                  <option value="$$$$">$$$$ (Very Expensive)</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1.2rem", marginTop: "2.8rem" }}>
              <Link href="/" className="btn-pearl" style={{ fontSize: "1.4rem" }}>Cancel</Link>
              <button type="submit" disabled={saving} className="btn-primary" style={{ fontSize: "1.5rem" }}>
                {saving ? "Creating…" : "Add Restaurant"}
              </button>
            </div>
          </div>
        </form>
      </main>

      <footer className="footer">
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 var(--space-4)" }}>
          <p className="small-strong" style={{ color: "var(--text-white)", marginBottom: "0.4rem" }}>Ristorante</p>
          <p className="small" style={{ color: "var(--text-white-soft)" }}>
            Restaurant Visibility Intelligence for the NC Triangle. Powered by local AI.
          </p>
        </div>
      </footer>
    </>
  );
}
