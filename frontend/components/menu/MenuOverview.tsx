"use client";

import type { MenuAnalysisData, MenuInsightData } from "@/app/lib/discovery";

function severityColor(severity: string): string {
  const map: Record<string, string> = {
    positive: "var(--status-excellent)",
    neutral: "var(--status-unknown)",
    warning: "var(--status-fair)",
    critical: "var(--status-poor)",
  };
  return map[severity] || "var(--status-unknown)";
}

function severityIcon(severity: string): string {
  const map: Record<string, string> = {
    positive: "✓",
    neutral: "→",
    warning: "!",
    critical: "✗",
  };
  return map[severity] || "→";
}

interface MenuOverviewProps {
  menu: MenuAnalysisData;
  insights: MenuInsightData[];
  loading?: boolean;
}

export function MenuOverview({ menu, insights, loading }: MenuOverviewProps) {
  if (loading) {
    return (
      <div className="menu-overview-loading">
        <div className="skeleton-block" style={{ height: "2rem", width: "40%", marginBottom: "1.6rem" }} />
        <div className="skeleton-block" style={{ height: "1.4rem", width: "100%", marginBottom: "0.8rem" }} />
        <div className="skeleton-block" style={{ height: "1.4rem", width: "80%", marginBottom: "0.8rem" }} />
        <style jsx>{`
          .menu-overview-loading { opacity: 0.5; }
          .skeleton-block { background: var(--hairline); border-radius: 0.4rem; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="menu-overview">
      {/* Summary Cards */}
      <div className="menu-summary-grid">
        <div className="menu-summary-card">
          <div className="menu-summary-label">Total Items</div>
          <div className="menu-summary-value">{menu.totalItems}</div>
        </div>
        <div className="menu-summary-card">
          <div className="menu-summary-label">Categories</div>
          <div className="menu-summary-value">{menu.categories}</div>
        </div>
        <div className="menu-summary-card">
          <div className="menu-summary-label">Avg Price</div>
          <div className="menu-summary-value">${menu.averagePrice.toFixed(2)}</div>
        </div>
        <div className="menu-summary-card">
          <div className="menu-summary-label">Price Range</div>
          <div className="menu-summary-value">${menu.minPrice.toFixed(2)}–${menu.maxPrice.toFixed(2)}</div>
        </div>
        <div className="menu-summary-card">
          <div className="menu-summary-label">Description Coverage</div>
          <div className="menu-summary-value" style={{ color: menu.descriptionCoverage >= 50 ? "var(--status-excellent)" : "var(--status-fair)" }}>
            {menu.descriptionCoverage}%
          </div>
        </div>
      </div>

      {/* Price Distribution */}
      <div className="menu-section">
        <h3 className="menu-section-title">Price Distribution</h3>
        <div className="menu-bar-chart">
          <div className="menu-bar-item">
            <span className="menu-bar-label">Budget (&lt;$10)</span>
            <div className="menu-bar-track">
              <div className="menu-bar-fill" style={{ width: `${(menu.priceDistribution.budget / menu.totalItems) * 100}%`, background: "var(--status-excellent)" }} />
            </div>
            <span className="menu-bar-count">{menu.priceDistribution.budget}</span>
          </div>
          <div className="menu-bar-item">
            <span className="menu-bar-label">Mid ($10–$20)</span>
            <div className="menu-bar-track">
              <div className="menu-bar-fill" style={{ width: `${(menu.priceDistribution.mid / menu.totalItems) * 100}%`, background: "var(--status-good)" }} />
            </div>
            <span className="menu-bar-count">{menu.priceDistribution.mid}</span>
          </div>
          <div className="menu-bar-item">
            <span className="menu-bar-label">Premium (&gt;$20)</span>
            <div className="menu-bar-track">
              <div className="menu-bar-fill" style={{ width: `${(menu.priceDistribution.premium / menu.totalItems) * 100}%`, background: "var(--status-fair)" }} />
            </div>
            <span className="menu-bar-count">{menu.priceDistribution.premium}</span>
          </div>
        </div>
      </div>

      {/* Dietary Breakdown */}
      {Object.keys(menu.dietaryBreakdown).length > 0 && (
        <div className="menu-section">
          <h3 className="menu-section-title">Dietary Options</h3>
          <div className="menu-tag-list">
            {Object.entries(menu.dietaryBreakdown).map(([key, count]) => (
              <span key={key} className="menu-tag" style={{ background: "var(--green-light)", color: "var(--green-starbucks)" }}>
                {key}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Spice Breakdown */}
      {Object.keys(menu.spiceBreakdown).length > 0 && (
        <div className="menu-section">
          <h3 className="menu-section-title">Spice Levels</h3>
          <div className="menu-tag-list">
            {Object.entries(menu.spiceBreakdown).map(([key, count]) => (
              <span key={key} className="menu-tag" style={{
                background: key === "hot" || key === "extra-hot" ? "var(--gold-lightest)" : "var(--green-light)",
                color: key === "hot" || key === "extra-hot" ? "var(--priority-critical)" : "var(--green-starbucks)",
              }}>
                {key}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Popular Items */}
      {menu.popularItems.length > 0 && (
        <div className="menu-section">
          <h3 className="menu-section-title">Popular Items</h3>
          <div className="menu-popular-list">
            {menu.popularItems.map((item, i) => (
              <div key={i} className="menu-popular-item">
                <span className="menu-popular-rank">#{i + 1}</span>
                <span className="menu-popular-name">{item.name}</span>
                <span className="menu-popular-price">${item.price.toFixed(2)}</span>
                <span className="menu-popular-score">★ {item.popularityScore.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="menu-section">
          <h3 className="menu-section-title">Insights ({insights.length})</h3>
          <div className="menu-insight-list">
            {insights.map((insight, i) => (
              <div key={i} className="menu-insight-item" style={{ borderLeftColor: severityColor(insight.severity) }}>
                <div className="menu-insight-header">
                  <span className="menu-insight-icon" style={{ color: severityColor(insight.severity) }}>
                    {severityIcon(insight.severity)}
                  </span>
                  <span className="menu-insight-title">{insight.title}</span>
                  <span className="menu-insight-value">{String(insight.value)}</span>
                </div>
                <p className="menu-insight-description">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .menu-overview {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .menu-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 1.2rem;
        }
        .menu-summary-card {
          background: var(--white);
          border-radius: var(--radius-card);
          box-shadow: var(--shadow-card);
          padding: 1.6rem;
          text-align: center;
        }
        .menu-summary-label {
          font-size: 1.2rem;
          color: var(--text-soft);
          margin-bottom: 0.4rem;
          font-weight: 500;
        }
        .menu-summary-value {
          font-size: 2.4rem;
          font-weight: 700;
          color: var(--text-black);
        }
        .menu-section {
          background: var(--white);
          border-radius: var(--radius-card);
          box-shadow: var(--shadow-card);
          padding: 2rem 2.4rem;
        }
        .menu-section-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-black);
          margin: 0 0 1.2rem 0;
        }
        .menu-bar-chart {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }
        .menu-bar-item {
          display: flex;
          align-items: center;
          gap: 1.2rem;
        }
        .menu-bar-label {
          font-size: 1.3rem;
          color: var(--text-soft);
          min-width: 10rem;
        }
        .menu-bar-track {
          flex: 1;
          height: 1.2rem;
          background: var(--hairline);
          border-radius: 0.6rem;
          overflow: hidden;
        }
        .menu-bar-fill {
          height: 100%;
          border-radius: 0.6rem;
          transition: width 0.5s ease;
        }
        .menu-bar-count {
          font-size: 1.4rem;
          font-weight: 600;
          color: var(--text-black);
          min-width: 2rem;
          text-align: right;
        }
        .menu-tag-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
        }
        .menu-tag {
          font-size: 1.3rem;
          padding: 0.3rem 1rem;
          border-radius: var(--radius-pill);
          font-weight: 500;
        }
        .menu-popular-list {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .menu-popular-item {
          display: flex;
          align-items: center;
          gap: 1.2rem;
          padding: 0.6rem 0;
          border-bottom: 1px solid var(--hairline);
        }
        .menu-popular-item:last-child { border-bottom: none; }
        .menu-popular-rank {
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--text-soft);
          min-width: 2rem;
        }
        .menu-popular-name {
          flex: 1;
          font-size: 1.4rem;
          font-weight: 500;
          color: var(--text-black);
        }
        .menu-popular-price {
          font-size: 1.3rem;
          color: var(--text-soft);
        }
        .menu-popular-score {
          font-size: 1.3rem;
          color: var(--gold);
          font-weight: 600;
        }
        .menu-insight-list {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }
        .menu-insight-item {
          border-left: 3px solid;
          padding: 1rem 1.2rem;
          background: var(--canvas);
          border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
        }
        .menu-insight-header {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          margin-bottom: 0.4rem;
        }
        .menu-insight-icon {
          font-size: 1.4rem;
          font-weight: 700;
        }
        .menu-insight-title {
          flex: 1;
          font-size: 1.4rem;
          font-weight: 600;
          color: var(--text-black);
        }
        .menu-insight-value {
          font-size: 1.3rem;
          font-weight: 500;
          color: var(--text-soft);
        }
        .menu-insight-description {
          font-size: 1.3rem;
          color: var(--text-soft);
          margin: 0;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
