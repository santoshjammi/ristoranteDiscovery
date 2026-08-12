"use client";

import type { RecommendationData } from "@/app/lib/discovery";

function priorityColor(priority: string): string {
  const map: Record<string, string> = {
    critical: "var(--priority-critical)",
    high: "var(--priority-high)",
    medium: "var(--priority-medium)",
    low: "var(--priority-low)",
  };
  return map[priority] || "var(--priority-low)";
}

function priorityLabel(priority: string): string {
  const map: Record<string, string> = {
    critical: "Critical",
    high: "High Priority",
    medium: "Medium",
    low: "Low",
  };
  return map[priority] || priority;
}

function confidenceColor(level: string): string {
  const map: Record<string, string> = {
    "very-high": "var(--confidence-very-high)",
    high: "var(--confidence-high)",
    medium: "var(--confidence-medium)",
    low: "var(--confidence-low)",
    "very-low": "var(--confidence-very-low)",
  };
  return map[level] || "var(--confidence-very-low)";
}

interface RecommendationCardProps {
  recommendation: RecommendationData;
  onAction?: () => void;
  onWhy?: () => void;
}

export function RecommendationCard({ recommendation: r, onAction, onWhy }: RecommendationCardProps) {
  const pColor = priorityColor(r.priority);
  const cColor = confidenceColor(r.confidence);

  return (
    <div className="rec-card">
      <div className="rec-card-header">
        <span className="rec-priority-badge" style={{ background: pColor }}>
          {priorityLabel(r.priority)}
        </span>
        <span className="rec-confidence-dot" style={{ background: cColor }} title={r.confidence} />
      </div>
      <h3 className="rec-title">{r.title}</h3>
      <p className="rec-description">{r.description}</p>
      <div className="rec-meta">
        <div className="rec-meta-item">
          <span className="rec-meta-label">Impact</span>
          <span className="rec-meta-value">{r.businessImpact}</span>
        </div>
        <div className="rec-meta-item">
          <span className="rec-meta-label">Effort</span>
          <span className="rec-meta-value">{r.implementationEffort}</span>
        </div>
        <div className="rec-meta-item">
          <span className="rec-meta-label">Score</span>
          <span className="rec-meta-value">{r.priorityScore.toFixed(0)}</span>
        </div>
      </div>
      <div className="rec-actions">
        {onAction && (
          <button className="rec-btn-primary" onClick={onAction}>
            Do This
          </button>
        )}
        {onWhy && (
          <button className="rec-btn-ghost" onClick={onWhy}>
            Why?
          </button>
        )}
      </div>
      <style jsx>{`
        .rec-card {
          background: var(--white);
          border-radius: var(--radius-card);
          box-shadow: var(--shadow-card);
          padding: 1.6rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }
        .rec-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .rec-priority-badge {
          font-size: 1.1rem;
          font-weight: 600;
          color: white;
          padding: 0.2rem 0.8rem;
          border-radius: var(--radius-pill);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .rec-confidence-dot {
          width: 0.8rem;
          height: 0.8rem;
          border-radius: 50%;
        }
        .rec-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-black);
          margin: 0;
        }
        .rec-description {
          font-size: 1.3rem;
          color: var(--text-soft);
          line-height: 1.5;
          margin: 0;
        }
        .rec-meta {
          display: flex;
          gap: 1.6rem;
          padding-top: 0.4rem;
          border-top: 1px solid var(--hairline);
        }
        .rec-meta-item {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .rec-meta-label {
          font-size: 1.1rem;
          color: var(--text-soft);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          font-weight: 500;
        }
        .rec-meta-value {
          font-size: 1.3rem;
          font-weight: 500;
          color: var(--text-black);
        }
        .rec-actions {
          display: flex;
          gap: 0.8rem;
          padding-top: 0.4rem;
        }
        .rec-btn-primary {
          background: var(--green-accent);
          color: white;
          border: none;
          border-radius: var(--radius-pill);
          padding: 0.6rem 1.6rem;
          font-family: var(--font);
          font-size: 1.3rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .rec-btn-primary:hover { opacity: 0.9; }
        .rec-btn-ghost {
          background: none;
          color: var(--green-accent);
          border: 1px solid var(--green-accent);
          border-radius: var(--radius-pill);
          padding: 0.6rem 1.6rem;
          font-family: var(--font);
          font-size: 1.3rem;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .rec-btn-ghost:hover { opacity: 0.7; }
      `}</style>
    </div>
  );
}
