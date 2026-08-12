"use client";

import type { ScorecardData, ScoreDimensionData } from "@/app/lib/discovery";

function scoreColor(score: number): string {
  if (score >= 70) return "var(--status-excellent)";
  if (score >= 40) return "var(--status-fair)";
  return "var(--status-poor)";
}

function ScoreDimensionRow({ dim }: { dim: ScoreDimensionData }) {
  const color = scoreColor(dim.score);
  return (
    <div className="score-dimension-row">
      <div className="score-dimension-header">
        <span className="score-dimension-name">{dim.name}</span>
        {dim.isInformational && <span className="score-dimension-badge">Info</span>}
      </div>
      <div className="score-dimension-bar-track">
        <div
          className="score-dimension-bar-fill"
          style={{ width: `${dim.score}%`, background: color }}
        />
      </div>
      <div className="score-dimension-value" style={{ color }}>
        {dim.score}
      </div>
      <style jsx>{`
        .score-dimension-row {
          display: flex;
          align-items: center;
          gap: 1.2rem;
          padding: 0.6rem 0;
        }
        .score-dimension-header {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          min-width: 18rem;
        }
        .score-dimension-name {
          font-size: 1.4rem;
          font-weight: 500;
          color: var(--text-black);
        }
        .score-dimension-badge {
          font-size: 1.1rem;
          background: var(--canvas);
          padding: 0.1rem 0.6rem;
          border-radius: var(--radius-pill);
          color: var(--text-soft);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .score-dimension-bar-track {
          flex: 1;
          height: 0.8rem;
          background: var(--hairline);
          border-radius: 0.4rem;
          overflow: hidden;
        }
        .score-dimension-bar-fill {
          height: 100%;
          border-radius: 0.4rem;
          transition: width 0.5s ease;
        }
        .score-dimension-value {
          font-size: 1.6rem;
          font-weight: 700;
          min-width: 3rem;
          text-align: right;
        }
      `}</style>
    </div>
  );
}

interface ScorecardProps {
  data: ScorecardData;
  loading?: boolean;
}

export function Scorecard({ data, loading }: ScorecardProps) {
  if (loading) {
    return (
      <div className="scorecard scorecard-loading">
        <div className="scorecard-skeleton-header" />
        <div className="scorecard-skeleton-row" />
        <div className="scorecard-skeleton-row" />
        <div className="scorecard-skeleton-row" />
        <style jsx>{`
          .scorecard-loading { opacity: 0.5; }
          .scorecard-skeleton-header {
            height: 2.4rem;
            width: 40%;
            background: var(--hairline);
            border-radius: 0.4rem;
            margin-bottom: 1.6rem;
          }
          .scorecard-skeleton-row {
            height: 1.6rem;
            width: 100%;
            background: var(--hairline);
            border-radius: 0.4rem;
            margin-bottom: 0.8rem;
          }
        `}</style>
      </div>
    );
  }

  const weightedDims = data.dimensions.filter((d) => !d.isInformational);
  const infoDims = data.dimensions.filter((d) => d.isInformational);
  const color = scoreColor(data.overallScore);
  const trendIcon = data.trend === "up" ? "↑" : data.trend === "down" ? "↓" : "→";
  const trendColor = data.trend === "up" ? "var(--trend-up)" : data.trend === "down" ? "var(--trend-down)" : "var(--trend-flat)";

  return (
    <div className="scorecard">
      <div className="scorecard-header">
        <div className="scorecard-title">Discoverability Score</div>
        <div className="scorecard-overall" style={{ color }}>
          <span className="scorecard-value">{data.overallScore}</span>
          <span className="scorecard-trend" style={{ color: trendColor }}>{trendIcon}</span>
        </div>
      </div>

      <div className="scorecard-dimensions">
        <div className="scorecard-section-label">Core Dimensions</div>
        {weightedDims.map((dim) => (
          <ScoreDimensionRow key={dim.name} dim={dim} />
        ))}
      </div>

      {infoDims.length > 0 && (
        <div className="scorecard-dimensions">
          <div className="scorecard-section-label">Informational</div>
          {infoDims.map((dim) => (
            <ScoreDimensionRow key={dim.name} dim={dim} />
          ))}
        </div>
      )}

      <style jsx>{`
        .scorecard {
          background: var(--white);
          border-radius: var(--radius-card);
          box-shadow: var(--shadow-card);
          padding: 2.4rem;
        }
        .scorecard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }
        .scorecard-title {
          font-size: 1.6rem;
          font-weight: 600;
          color: var(--text-black);
        }
        .scorecard-overall {
          display: flex;
          align-items: baseline;
          gap: 0.4rem;
        }
        .scorecard-value {
          font-size: 3.2rem;
          font-weight: 700;
          line-height: 1;
        }
        .scorecard-trend {
          font-size: 2rem;
        }
        .scorecard-dimensions {
          margin-bottom: 1.2rem;
        }
        .scorecard-section-label {
          font-size: 1.2rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-soft);
          margin-bottom: 0.4rem;
        }
      `}</style>
    </div>
  );
}
