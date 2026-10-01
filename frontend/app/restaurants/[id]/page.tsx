"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  fetchRestaurant,
  generateFAQs,
  generateSchema,
  getSchemas,
  getSEOAudit,
  buildIndex,
  optimizeNames,
  optimizeLandmarks,
  RestaurantDetail,
  SEOMarkup,
} from "@/app/lib/api";

function ScoreGauge({ score, label, size = "md" }: { score: number; label: string; size?: "sm" | "md" | "lg" }) {
  const sz = size === "lg" ? "4rem" : size === "sm" ? "2.4rem" : "3.2rem";
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: sz, fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.01em", color: "var(--green-starbucks)" }}>
        {score}
      </div>
      <div className="small" style={{ color: "var(--text-soft)", marginTop: "0.2rem" }}>{label}</div>
    </div>
  );
}

function ActionButton({ onClick, label, loading }: { onClick: () => void; label: string; loading?: boolean }) {
  return (
    <button onClick={onClick} disabled={loading} className="btn-pearl" style={{ fontSize: "1.2rem" }}>
      {loading ? "…" : label}
    </button>
  );
}

function Tab({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "none", border: "none", cursor: "pointer",
        padding: "0.8rem 0", marginRight: "2.4rem",
        fontSize: "1.4rem", fontWeight: active ? 600 : 400,
        color: active ? "var(--green-starbucks)" : "var(--text-soft)",
        borderBottom: active ? "2px solid var(--green-accent)" : "2px solid transparent",
        fontFamily: "var(--font)", letterSpacing: "-0.01em",
        transition: "color 0.1s, border-color 0.1s",
      }}
    >
      {label}
    </button>
  );
}

export default function RestaurantDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [schemas, setSchemas] = useState<SEOMarkup[]>([]);
  const [audit, setAudit] = useState<any>(null);
  const [showSchema, setShowSchema] = useState<string | false>(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchRestaurant(id).then(setRestaurant).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const loadSchemas = async () => { if (!id) return; try { setSchemas(await getSchemas(id)); } catch {} };
  const loadAudit = async () => { if (!id) return; try { setAudit(await getSEOAudit(id)); } catch {} };

  const getAuthToken = (): string | null =>
    typeof window !== "undefined" ? window.localStorage.getItem("rdi_token") : null;

  const handleAction = async (action: string, fn: () => Promise<any>) => {
    setActionLoading(action);
    try {
      await fn();
      const updated = await fetchRestaurant(id);
      setRestaurant(updated);
      if (action === "schemas") loadSchemas();
      if (action === "audit") loadAudit();
    } catch (e) { console.error(e); } finally { setActionLoading(null); }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <p className="body" style={{ color: "var(--text-soft)" }}>Loading…</p>
      </div>
    );
  }
  if (!restaurant) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <p className="body" style={{ marginBottom: "1.6rem" }}>Restaurant not found</p>
          <Link href="/" className="link">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const tabs = ["overview", "menu", "reviews", "seo", "faq"];

  return (
    <>
      <nav className="global-nav">
        <div className="global-nav-inner">
          <ul className="global-nav-links">
            <li><Link href="/" style={{ fontWeight: 700, color: "var(--green-starbucks)" }}>Ristorante</Link></li>
            <li><Link href="/">Dashboard</Link></li>
          </ul>
          <div className="global-nav-actions">
            <Link href="/" className="btn-dark-outlined" style={{ fontSize: "1.3rem" }}>← Back</Link>
          </div>
        </div>
      </nav>
      <div style={{ height: "7.2rem" }} />

      {/* Sub-nav / Hero */}
      <section className="feature-band" style={{ padding: "3.2rem 0" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 var(--space-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "1.2rem", marginBottom: "0.4rem" }}>
                <h1 className="h1" style={{ color: "var(--text-white)", fontSize: "2.8rem", margin: 0 }}>{restaurant.name}</h1>
                {restaurant.regionalCuisine && (
                  <span className="small" style={{
                    background: "rgba(255,255,255,0.15)",
                    padding: "0.2rem 1rem",
                    borderRadius: "var(--radius-pill)",
                    color: "var(--text-white)",
                    fontWeight: 600,
                  }}>
                    {restaurant.regionalCuisine}
                  </span>
                )}
                <span className="small" style={{ color: "var(--text-white-soft)" }}>{restaurant.priceRange}</span>
              </div>
              <p className="small" style={{ color: "var(--text-white-soft)" }}>
                {restaurant.address}, {restaurant.city}{restaurant.state ? `, ${restaurant.state}` : ""}
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
              <ActionButton label="Optimize Names" onClick={() => handleAction("names", () => optimizeNames(id))} loading={actionLoading === "names"} />
              <ActionButton label="Sync Landmarks" onClick={() => handleAction("landmarks", () => optimizeLandmarks(id))} loading={actionLoading === "landmarks"} />
              <ActionButton label="Build Index" onClick={() => handleAction("index", () => buildIndex(id, getAuthToken() || undefined))} loading={actionLoading === "index"} />
              <Link href="/restaurants/new" className="btn-pearl" style={{ fontSize: "1.2rem" }}>
                Intake another restaurant
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tab Bar */}
      <div style={{ borderBottom: "1px solid var(--hairline)", background: "var(--white)" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 var(--space-4)" }}>
          <div style={{ display: "flex" }}>
            {tabs.map((t) => (
              <Tab key={t} active={activeTab === t} label={t.charAt(0).toUpperCase() + t.slice(1)} onClick={() => setActiveTab(t)} />
            ))}
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 1440, margin: "0 auto", padding: "var(--space-5) var(--space-4) var(--space-9)" }}>
        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div style={{ maxWidth: 980, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4.8rem", gap: "1.6rem", flexWrap: "wrap" }}>
              <ScoreGauge score={restaurant.discoverabilityScore} label="Overall" size="lg" />
              <ScoreGauge score={restaurant.aiVisibilityScore} label="AI Visibility" size="lg" />
              <ScoreGauge score={restaurant.localSearchScore} label="Local Search" size="lg" />
              <ScoreGauge score={restaurant.menuDiscoverabilityScore} label="Menu" size="lg" />
              <ScoreGauge score={restaurant.conversationalSearchScore} label="Conversational" size="lg" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.6rem", marginBottom: "4rem" }}>
              {[
                { label: "Menu Items", value: restaurant.menuSections.reduce((a, s) => a + s.items.length, 0) },
                { label: "Sections", value: restaurant.menuSections.length },
                { label: "FAQs", value: restaurant.faqs.length },
                { label: "Schemas", value: restaurant.schemas.length },
              ].map((s) => (
                <div key={s.label} className="card" style={{ padding: "1.6rem 2rem" }}>
                  <div className="small" style={{ color: "var(--text-soft)", marginBottom: "0.4rem" }}>{s.label}</div>
                  <div className="h1" style={{ fontSize: "2.8rem", color: "var(--text-black)" }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div className="card" style={{ padding: "2.4rem 2.8rem", marginBottom: "2.4rem" }}>
              <h2 className="body-strong" style={{ marginBottom: "1.6rem" }}>Restaurant Genome</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "2rem" }}>
                {[
                  { label: "Cuisine", value: restaurant.cuisineTypes?.join(", ") || "Not set" },
                  { label: "Regional", value: restaurant.regionalCuisine || "Not set" },
                  { label: "Price Range", value: restaurant.priceRange || "Not set" },
                  { label: "GBP Health", value: `${restaurant.gbpHealthScore}/100` },
                ].map((f) => (
                  <div key={f.label}>
                    <div className="small" style={{ color: "var(--text-soft)", marginBottom: "0.2rem" }}>{f.label}</div>
                    <div className="body">{f.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {restaurant.reviewAnalyses.length > 0 && (
              <div className="card" style={{ padding: "2.4rem 2.8rem" }}>
                <h2 className="body-strong" style={{ marginBottom: "1.2rem" }}>Review Intelligence</h2>
                <p className="body" style={{ color: "var(--text-soft)", marginBottom: "1.2rem" }}>
                  {restaurant.reviewAnalyses[0].sentimentSummary}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
                  {restaurant.reviewAnalyses[0].ambienceTags.map((tag, i) => (
                    <span key={i} className="small" style={{
                      background: "var(--green-light)", padding: "0.2rem 1rem",
                      borderRadius: "var(--radius-pill)", color: "var(--green-starbucks)", fontWeight: 600,
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MENU ── */}
        {activeTab === "menu" && (
          <div style={{ maxWidth: 980, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.4rem" }}>
              <h2 className="h2" style={{ fontSize: "2.8rem" }}>Menu Intelligence</h2>
              <div style={{ display: "flex", gap: "2.4rem" }}>
                <ScoreGauge score={restaurant.dishRetrievalScore} label="Dish Retrieval" size="sm" />
                <ScoreGauge score={restaurant.restaurantClarityScore} label="Clarity" size="sm" />
              </div>
            </div>

            {restaurant.menuSections.length === 0 ? (
              <div className="card" style={{ padding: "4.8rem", textAlign: "center" }}>
                <p className="body" style={{ color: "var(--text-soft)" }}>No menu data yet.</p>
              </div>
            ) : (
              restaurant.menuSections.map((section) => (
                <div key={section.id} className="card" style={{ overflow: "hidden", marginBottom: "1.6rem" }}>
                  <div style={{ padding: "1.6rem 2.4rem", background: "var(--green-light)", borderBottom: "1px solid var(--hairline)" }}>
                    <h3 className="body-strong" style={{ color: "var(--green-starbucks)" }}>{section.name}</h3>
                    {section.description && (
                      <p className="small" style={{ color: "var(--text-soft)", marginTop: "0.2rem" }}>{section.description}</p>
                    )}
                  </div>
                  {section.items.map((item) => (
                    <div key={item.id} style={{ padding: "1.2rem 2.4rem", borderBottom: "1px solid var(--hairline)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", flexWrap: "wrap" }}>
                          <span className="body-strong" style={{ fontSize: "1.5rem" }}>{item.name}</span>
                          {item.spiceLevel && (
                            <span className="small" style={{ background: "var(--green-light)", padding: "0.1rem 0.6rem", borderRadius: "var(--radius-pill)", color: "var(--green-starbucks)" }}>
                              {item.spiceLevel}
                            </span>
                          )}
                          {item.dietaryType?.slice(0, 2).map((d, i) => (
                            <span key={i} className="small" style={{ background: "var(--green-light)", padding: "0.1rem 0.6rem", borderRadius: "var(--radius-pill)", color: "var(--green-starbucks)" }}>
                              {d}
                            </span>
                          ))}
                        </div>
                        {item.description && (
                          <p className="small" style={{ color: "var(--text-soft)", marginTop: "0.4rem" }}>{item.description}</p>
                        )}
                        {item.ingredients?.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.6rem" }}>
                            {item.ingredients.map((ing, i) => (
                              <span key={i} className="small" style={{ background: "var(--canvas)", padding: "0.1rem 0.6rem", borderRadius: "var(--radius-pill)", color: "var(--text-soft)", fontSize: "1.2rem" }}>
                                {ing}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: "right", marginLeft: "1.6rem", whiteSpace: "nowrap" }}>
                        <div className="body-strong" style={{ fontSize: "1.5rem" }}>${item.price.toFixed(2)}</div>
                        {item.popularityScore > 0 && (
                          <div className="small" style={{ color: "var(--text-soft)" }}>★ {item.popularityScore.toFixed(1)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── REVIEWS ── */}
        {activeTab === "reviews" && (
          <div style={{ maxWidth: 980, margin: "0 auto" }}>
            {restaurant.reviewAnalyses.length === 0 ? (
              <div className="card" style={{ padding: "4.8rem", textAlign: "center" }}>
                <p className="body" style={{ color: "var(--text-soft)" }}>No review analysis yet.</p>
              </div>
            ) : (
              restaurant.reviewAnalyses.map((review) => (
                <div key={review.id}>
                  <div className="card" style={{ padding: "2.4rem 2.8rem", marginBottom: "1.6rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1.6rem", marginBottom: "1.2rem" }}>
                      <div style={{ fontSize: "4rem", fontWeight: 600, lineHeight: 1, color: review.overallSentiment >= 0 ? "var(--green-starbucks)" : "var(--text-soft)" }}>
                        {(review.overallSentiment * 100).toFixed(0)}%
                      </div>
                      <div>
                        <div className="body-strong">Overall Sentiment</div>
                        <div className="small" style={{ color: "var(--text-soft)" }}>From review analysis</div>
                      </div>
                    </div>
                    <p className="body" style={{ color: "var(--text-soft)" }}>{review.sentimentSummary}</p>
                  </div>

                  {review.popularDishes.length > 0 && (
                    <div className="card" style={{ padding: "2.4rem 2.8rem", marginBottom: "1.6rem" }}>
                      <h3 className="body-strong" style={{ marginBottom: "1.2rem" }}>Popular Dishes</h3>
                      {review.popularDishes.map((dish, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "0.8rem 0", borderBottom: "1px solid var(--hairline)" }}>
                          <span className="body">{dish.dishName}</span>
                          <div style={{ display: "flex", gap: "1.2rem" }}>
                            <span className="small" style={{ color: "var(--text-soft)" }}>{dish.sentiment}</span>
                            <span className="small" style={{ color: "var(--text-soft)" }}>{dish.mentions} mentions</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.6rem", marginBottom: "1.6rem" }}>
                    {review.ambienceTags.length > 0 && (
                      <div className="card" style={{ padding: "2rem 2.4rem" }}>
                        <h3 className="body-strong" style={{ marginBottom: "0.8rem" }}>Ambience</h3>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                          {review.ambienceTags.map((tag, i) => (
                            <span key={i} className="small" style={{ background: "var(--green-light)", padding: "0.2rem 0.8rem", borderRadius: "var(--radius-pill)", color: "var(--green-starbucks)", fontWeight: 600 }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {review.audienceProfile && Object.keys(review.audienceProfile).length > 0 && (
                      <div className="card" style={{ padding: "2rem 2.4rem" }}>
                        <h3 className="body-strong" style={{ marginBottom: "0.8rem" }}>Audience</h3>
                        {Object.entries(review.audienceProfile).map(([key, val]) => (
                          <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "0.2rem 0" }}>
                            <span className="small" style={{ color: "var(--text-soft)", textTransform: "capitalize" }}>{key}</span>
                            <span className="small" style={{ fontWeight: 600 }}>{val}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {review.complaints.length > 0 && (
                    <div className="card" style={{ padding: "2rem 2.4rem" }}>
                      <h3 className="body-strong" style={{ marginBottom: "0.8rem" }}>Common Complaints</h3>
                      {review.complaints.map((c, i) => (
                        <p key={i} className="small" style={{ color: "var(--text-soft)", padding: "0.2rem 0" }}>· {c}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── SEO ── */}
        {activeTab === "seo" && (
          <div style={{ maxWidth: 980, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.4rem" }}>
              <h2 className="h2" style={{ fontSize: "2.8rem" }}>SEO & Schema</h2>
              <div style={{ display: "flex", gap: "0.8rem" }}>
                <ActionButton label="Generate Schema" onClick={() => handleAction("schemas", () => generateSchema(id))} loading={actionLoading === "schemas"} />
                <ActionButton label="Run Audit" onClick={() => handleAction("audit", () => getSEOAudit(id))} loading={actionLoading === "audit"} />
              </div>
            </div>

            <div className="card" style={{ padding: "2.4rem 2.8rem", marginBottom: "1.6rem" }}>
              <h3 className="body-strong" style={{ marginBottom: "1.2rem" }}>Generated Schemas ({schemas.length})</h3>
              {schemas.length === 0 ? (
                <p className="body" style={{ color: "var(--text-soft)" }}>No schemas yet.</p>
              ) : (
                schemas.map((s) => (
                  <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.8rem 0", borderBottom: "1px solid var(--hairline)" }}>
                    <span className="body">{s.type}</span>
                    <button onClick={() => setShowSchema(showSchema === s.id ? false : s.id)} className="link" style={{ fontSize: "1.4rem" }}>
                      {showSchema === s.id ? "Hide" : "View"}
                    </button>
                  </div>
                ))
              )}
              {showSchema && schemas.find((s) => s.id === showSchema) && (
                <pre style={{ marginTop: "1.2rem", padding: "1.2rem", background: "var(--canvas)", borderRadius: "var(--radius-sm)", fontSize: "1.2rem", overflow: "auto", maxHeight: 300, color: "var(--text-soft)" }}>
                  {JSON.stringify(schemas.find((s) => s.id === showSchema)?.jsonld, null, 2)}
                </pre>
              )}
            </div>

            {audit && (
              <div className="card" style={{ padding: "2.4rem 2.8rem" }}>
                <h3 className="body-strong" style={{ marginBottom: "1.6rem" }}>SEO Audit</h3>
                {audit.scorecard && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.2rem", marginBottom: "2rem" }}>
                    {Object.entries(audit.scorecard).map(([key, val]) => (
                      <div key={key} style={{ textAlign: "center", padding: "1.2rem", background: "var(--canvas)", borderRadius: "var(--radius-sm)" }}>
                        <div style={{ fontSize: "2.4rem", fontWeight: 600, color: "var(--green-starbucks)" }}>{String(val)}%</div>
                        <div className="small" style={{ color: "var(--text-soft)", textTransform: "capitalize" }}>{key.replace(/([A-Z])/g, " $1").trim()}</div>
                      </div>
                    ))}
                  </div>
                )}
                {audit.actionItems && (
                  <div>
                    <h4 className="small-strong" style={{ color: "var(--text-soft)", textTransform: "uppercase", marginBottom: "0.8rem" }}>Action Items</h4>
                    {audit.actionItems.map((item: any, i: number) => (
                      <div key={i} style={{ padding: "0.8rem 0", borderBottom: "1px solid var(--hairline)" }}>
                        <p className="body" style={{ fontSize: "1.5rem" }}>{item.task}</p>
                        <p className="small" style={{ color: "var(--text-soft)" }}>{item.priority} · {item.impact}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── FAQ ── */}
        {activeTab === "faq" && (
          <div style={{ maxWidth: 980, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.4rem" }}>
              <h2 className="h2" style={{ fontSize: "2.8rem" }}>Conversational FAQ</h2>
              <ActionButton
                label="Generate FAQs"
                onClick={() => handleAction("faqs", () =>
                  generateFAQs(id, {
                    name: restaurant.name, address: restaurant.address,
                    cuisineTypes: restaurant.cuisineTypes, priceRange: restaurant.priceRange,
                  })
                )}
                loading={actionLoading === "faqs"}
              />
            </div>

            {restaurant.faqs.length === 0 ? (
              <div className="card" style={{ padding: "4.8rem", textAlign: "center" }}>
                <p className="body" style={{ color: "var(--text-soft)" }}>No FAQs yet.</p>
              </div>
            ) : (
              restaurant.faqs.map((faq) => (
                <div key={faq.id} className="card" style={{ overflow: "hidden", marginBottom: "1.2rem" }}>
                  <div style={{ padding: "1.6rem 2.4rem", background: "var(--green-light)", borderBottom: "1px solid var(--hairline)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="body-strong" style={{ fontSize: "1.5rem", color: "var(--green-starbucks)" }}>{faq.question}</span>
                    <span className="small" style={{ background: "var(--white)", padding: "0.2rem 0.8rem", borderRadius: "var(--radius-pill)", color: "var(--green-starbucks)", textTransform: "capitalize", fontWeight: 600 }}>
                      {faq.category}
                    </span>
                  </div>
                  <div style={{ padding: "1.6rem 2.4rem" }}>
                    <p className="body" style={{ color: "var(--text-soft)", fontSize: "1.5rem" }}>{faq.answer}</p>
                    {faq.voiceSnippet && (
                      <div style={{ marginTop: "0.8rem", padding: "0.8rem 1.2rem", background: "var(--canvas)", borderRadius: "var(--radius-sm)" }}>
                        <div className="small" style={{ color: "var(--text-soft)", marginBottom: "0.4rem" }}>🎤 Voice Snippet</div>
                        <p className="body" style={{ fontSize: "1.5rem" }}>{faq.voiceSnippet}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
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
