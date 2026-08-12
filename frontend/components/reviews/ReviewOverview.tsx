"use client";

import type { ReviewAggregateData, ReviewThemeData, ReviewInsightData } from "@/app/lib/discovery";

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

function trendColor(trend: string): string {
  const map: Record<string, string> = {
    improving: "var(--trend-up)",
    declining: "var(--trend-down)",
    stable: "var(--trend-flat)",
  };
  return map[trend] || "var(--trend-flat)";
}

interface ReviewOverviewProps {
  aggregate: ReviewAggregateData;
  themes: ReviewThemeData[];
  insights: ReviewInsightData[];
  loading?: boolean;
}

export function ReviewOverview({ aggregate, themes, insights, loading }: ReviewOverviewProps) {
  if (loading) {
    return (
      <div className="review-loading">
        <div className="skeleton" style={{ height: "2rem", width: "40%", marginBottom: "1.6rem" }} />
        <div className="skeleton" style={{ height: "1.4rem", width: "100%", marginBottom: "0.8rem" }} />
        <style jsx>{`
          .review-loading { opacity: 0.5; }
          .skeleton { background: var(--hairline); border-radius: 0.4rem; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="review-overview">
      {/* Summary Cards */}
      <div className="review-summary-grid">
        <div className="review-summary-card">
          <div className="review-summary-label">Average Rating</div>
          <div className="review-summary-value" style={{ color: aggregate.averageRating >= 4 ? "var(--status-excellent)" : aggregate.averageRating >= 3 ? "var(--status-fair)" : "var(--status-poor)" }}>
            {aggregate.averageRating}
          </div>
          <div className="review-summary-sub">{aggregate.totalReviews} reviews</div>
        </div>
        <div className="review-summary-card">
          <div className="review-summary-label">Positive</div>
          <div className="review-summary-value" style={{ color: "var(--status-excellent)" }}>{aggregate.positivePercentage}%</div>
          <div className="review-summary-sub">{aggregate.sentimentBreakdown.positive || 0} reviews</div>
        </div>
        <div className="review-summary-card">
          <div className="review-summary-label">Negative</div>
          <div className="review-summary-value" style={{ color: aggregate.negativePercentage > 20 ? "var(--status-poor)" : "var(--status-unknown)" }}>{aggregate.negativePercentage}%</div>
          <div className="review-summary-sub">{aggregate.sentimentBreakdown.negative || 0} reviews</div>
        </div>
        <div className="review-summary-card">
          <div className="review-summary-label">Response Rate</div>
          <div className="review-summary-value" style={{ color: aggregate.responseRate >= 80 ? "var(--status-excellent)" : aggregate.responseRate >= 50 ? "var(--status-fair)" : "var(--status-poor)" }}>{aggregate.responseRate}%</div>
          <div className="review-summary-sub">{aggregate.unreviewedCritical} critical unresponded</div>
        </div>
        <div className="review-summary-card">
          <div className="review-summary-label">Trend</div>
          <div className="review-summary-value" style={{ color: trendColor(aggregate.ratingTrend), fontSize: "1.8rem" }}>
            {aggregate.ratingTrend === "improving" ? "↑ Improving" : aggregate.ratingTrend === "declining" ? "↓ Declining" : "→ Stable"}
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="review-section">
        <h3 className="review-section-title">Rating Distribution</h3>
        <div className="review-bar-chart">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = aggregate.ratingDistribution[star] || 0;
            const pct = aggregate.totalReviews > 0 ? (count / aggregate.totalReviews) * 100 : 0;
            return (
              <div key={star} className="review-bar-item">
                <span className="review-bar-label">{star}★</span>
                <div className="review-bar-track">
                  <div
                    className="review-bar-fill"
                    style={{
                      width: `${pct}%`,
                      background: star >= 4 ? "var(--status-excellent)" : star === 3 ? "var(--status-fair)" : "var(--status-poor)",
                    }}
                  />
                </div>
                <span className="review-bar-count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Trend */}
      {aggregate.monthlyTrend.length > 0 && (
        <div className="review-section">
          <h3 className="review-section-title">Monthly Trend</h3>
          <div className="review-monthly-grid">
            {aggregate.monthlyTrend.map((m) => (
              <div key={m.month} className="review-monthly-item">
                <div className="review-monthly-month">{m.month}</div>
                <div className="review-monthly-rating" style={{ color: m.avgRating >= 4 ? "var(--status-excellent)" : m.avgRating >= 3 ? "var(--status-fair)" : "var(--status-poor)" }}>
                  {m.avgRating}
                </div>
                <div className="review-monthly-count">{m.count} reviews</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Themes */}
      {themes.length > 0 && (
        <div className="review-section">
          <h3 className="review-section-title">Themes ({themes.length})</h3>
          <div className="review-theme-list">
            {themes.map((theme, i) => (
              <div key={i} className="review-theme-item" style={{
                borderLeftColor: theme.sentiment === "positive" ? "var(--status-excellent)" : theme.sentiment === "negative" ? "var(--status-poor)" : "var(--status-unknown)",
              }}>
                <div className="review-theme-header">
                  <span className="review-theme-name">{theme.label}</span>
                  <span className="review-theme-count">{theme.mentionCount} mentions</span>
                  <span className="review-theme-sentiment" style={{
                    color: theme.sentiment === "positive" ? "var(--status-excellent)" : theme.sentiment === "negative" ? "var(--status-poor)" : "var(--status-unknown)",
                  }}>
                    {theme.sentiment}
                  </span>
                </div>
                {theme.sampleQuotes.length > 0 && (
                  <p className="review-theme-quote">"{theme.sampleQuotes[0].slice(0, 120)}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="review-section">
          <h3 className="review-section-title">Insights ({insights.length})</h3>
          <div className="review-insight-list">
            {insights.map((insight, i) => (
              <div key={i} className="review-insight-item" style={{ borderLeftColor: severityColor(insight.severity) }}>
                <div className="review-insight-header">
                  <span className="review-insight-icon" style={{ color: severityColor(insight.severity) }}>
                    {severityIcon(insight.severity)}
                  </span>
                  <span className="review-insight-title">{insight.title}</span>
                  <span className="review-insight-value">{String(insight.value)}</span>
                </div>
                <p className="review-insight-description">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .review-overview {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .review-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 1.2rem;
        }
        .review-summary-card {
          background: var(--white);
          border-radius: var(--radius-card);
          box-shadow: var(--shadow-card);
          padding: 1.6rem;
          text-align: center;
        }
        .review-summary-label {
          font-size: 1.2rem;
          color: var(--text-soft);
          margin-bottom: 0.4rem;
          font-weight: 500;
        }
        .review-summary-value {
          font-size: 2.4rem;
          font-weight: 700;
          line-height: 1.2;
        }
        .review-summary-sub {
          font-size: 1.2rem;
          color: var(--text-soft);
          margin-top: 0.2rem;
        }
        .review-section {
          background: var(--white);
          border-radius: var(--radius-card);
          box-shadow: var(--shadow-card);
          padding: 2rem 2.4rem;
        }
        .review-section-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-black);
          margin: 0 0 1.2rem 0;
        }
        .review-bar-chart {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .review-bar-item {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .review-bar-label {
          font-size: 1.3rem;
          color: var(--text-soft);
          min-width: 3rem;
        }
        .review-bar-track {
          flex: 1;
          height: 1.2rem;
          background: var(--hairline);
          border-radius: 0.6rem;
          overflow: hidden;
        }
        .review-bar-fill {
          height: 100%;
          border-radius: 0.6rem;
          transition: width 0.5s ease;
        }
        .review-bar-count {
          font-size: 1.3rem;
          font-weight: 600;
          color: var(--text-black);
          min-width: 2rem;
          text-align: right;
        }
        .review-monthly-grid {
          display: flex;
          gap: 1.2rem;
          overflow-x: auto;
          padding-bottom: 0.4rem;
        }
        .review-monthly-item {
          text-align: center;
          min-width: 6rem;
          padding: 0.8rem;
          background: var(--canvas);
          border-radius: var(--radius-sm);
        }
        .review-monthly-month {
          font-size: 1.1rem;
          color: var(--text-soft);
          margin-bottom: 0.2rem;
        }
        .review-monthly-rating {
          font-size: 1.8rem;
          font-weight: 700;
        }
        .review-monthly-count {
          font-size: 1.1rem;
          color: var(--text-soft);
        }
        .review-theme-list {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }
        .review-theme-item {
          border-left: 3px solid;
          padding: 1rem 1.2rem;
          background: var(--canvas);
          border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
        }
        .review-theme-header {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          margin-bottom: 0.4rem;
        }
        .review-theme-name {
          flex: 1;
          font-size: 1.4rem;
          font-weight: 600;
          color: var(--text-black);
        }
        .review-theme-count {
          font-size: 1.2rem;
          color: var(--text-soft);
        }
        .review-theme-sentiment {
          font-size: 1.2rem;
          font-weight: 600;
          text-transform: capitalize;
        }
        .review-theme-quote {
          font-size: 1.3rem;
          color: var(--text-soft);
          font-style: italic;
          margin: 0;
          line-height: 1.5;
        }
        .review-insight-list {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }
        .review-insight-item {
          border-left: 3px solid;
          padding: 1rem 1.2rem;
          background: var(--canvas);
          border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
        }
        .review-insight-header {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          margin-bottom: 0.4rem;
        }
        .review-insight-icon {
          font-size: 1.4rem;
          font-weight: 700;
        }
        .review-insight-title {
          flex: 1;
          font-size: 1.4rem;
          font-weight: 600;
          color: var(--text-black);
        }
        .review-insight-value {
          font-size: 1.3rem;
          font-weight: 500;
          color: var(--text-soft);
        }
        .review-insight-description {
          font-size: 1.3rem;
          color: var(--text-soft);
          margin: 0;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
