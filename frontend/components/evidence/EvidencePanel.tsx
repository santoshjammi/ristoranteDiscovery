"use client";

import { useState } from "react";
import type { EvidenceData } from "@/app/lib/discovery";

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

function confidenceLabel(level: string): string {
  const map: Record<string, string> = {
    "very-high": "Very High",
    high: "High",
    medium: "Medium",
    low: "Low",
    "very-low": "Very Low",
  };
  return map[level] || level;
}

function EvidenceRow({ evidence }: { evidence: EvidenceData }) {
  const [expanded, setExpanded] = useState(false);
  const color = confidenceColor(evidence.confidence);

  return (
    <div className="evidence-row">
      <button className="evidence-row-header" onClick={() => setExpanded(!expanded)}>
        <span className="evidence-confidence-dot" style={{ background: color }} />
        <span className="evidence-description">{evidence.description}</span>
        <span className="evidence-expand-icon">{expanded ? "▾" : "▸"}</span>
      </button>
      {expanded && (
        <div className="evidence-detail">
          <div className="evidence-detail-item">
            <span className="evidence-detail-label">Source</span>
            <span className="evidence-detail-value">
              {evidence.source.entityType}.{evidence.source.field}
            </span>
          </div>
          <div className="evidence-detail-item">
            <span className="evidence-detail-label">Value</span>
            <span className="evidence-detail-value evidence-detail-value--truncated">
              {evidence.source.value}
            </span>
          </div>
          <div className="evidence-detail-item">
            <span className="evidence-detail-label">Confidence</span>
            <span className="evidence-detail-value" style={{ color }}>
              {confidenceLabel(evidence.confidence)}
            </span>
          </div>
        </div>
      )}
      <style jsx>{`
        .evidence-row {
          border-bottom: 1px solid var(--hairline);
        }
        .evidence-row:last-child {
          border-bottom: none;
        }
        .evidence-row-header {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          width: 100%;
          padding: 1rem 0;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          font-family: var(--font);
          font-size: 1.4rem;
          color: var(--text-black);
        }
        .evidence-row-header:hover {
          opacity: 0.8;
        }
        .evidence-confidence-dot {
          width: 0.8rem;
          height: 0.8rem;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .evidence-description {
          flex: 1;
          line-height: 1.4;
        }
        .evidence-expand-icon {
          font-size: 1.2rem;
          color: var(--text-soft);
          flex-shrink: 0;
        }
        .evidence-detail {
          padding: 0 0 1rem 1.6rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .evidence-detail-item {
          display: flex;
          gap: 0.8rem;
          font-size: 1.3rem;
        }
        .evidence-detail-label {
          color: var(--text-soft);
          min-width: 8rem;
          font-weight: 500;
        }
        .evidence-detail-value {
          color: var(--text-black);
          word-break: break-all;
        }
        .evidence-detail-value--truncated {
          max-height: 3.6rem;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </div>
  );
}

interface EvidencePanelProps {
  evidence: EvidenceData[];
  loading?: boolean;
  maxItems?: number;
}

export function EvidencePanel({ evidence, loading, maxItems = 10 }: EvidencePanelProps) {
  if (loading) {
    return (
      <div className="evidence-panel evidence-panel-loading">
        <div className="evidence-skeleton-title" />
        <div className="evidence-skeleton-row" />
        <div className="evidence-skeleton-row" />
        <style jsx>{`
          .evidence-panel-loading { opacity: 0.5; }
          .evidence-skeleton-title {
            height: 2rem; width: 30%;
            background: var(--hairline); border-radius: 0.4rem;
            margin-bottom: 1.2rem;
          }
          .evidence-skeleton-row {
            height: 1.4rem; width: 100%;
            background: var(--hairline); border-radius: 0.4rem;
            margin-bottom: 0.6rem;
          }
        `}</style>
      </div>
    );
  }

  const display = evidence.slice(0, maxItems);
  const highConfidence = evidence.filter((e) => e.confidence === "very-high" || e.confidence === "high").length;

  return (
    <div className="evidence-panel">
      <div className="evidence-panel-header">
        <div className="evidence-panel-title">Evidence ({evidence.length})</div>
        <div className="evidence-panel-meta">{highConfidence} high confidence</div>
      </div>
      <div className="evidence-list">
        {display.map((e) => (
          <EvidenceRow key={e.id} evidence={e} />
        ))}
      </div>
      {evidence.length > maxItems && (
        <div className="evidence-more">
          +{evidence.length - maxItems} more items
        </div>
      )}
      <style jsx>{`
        .evidence-panel {
          background: var(--white);
          border-radius: var(--radius-card);
          box-shadow: var(--shadow-card);
          padding: 2rem 2.4rem;
        }
        .evidence-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.8rem;
        }
        .evidence-panel-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-black);
        }
        .evidence-panel-meta {
          font-size: 1.2rem;
          color: var(--text-soft);
        }
        .evidence-list {
          max-height: 40rem;
          overflow-y: auto;
        }
        .evidence-more {
          text-align: center;
          font-size: 1.3rem;
          color: var(--text-soft);
          padding-top: 0.8rem;
          border-top: 1px solid var(--hairline);
          margin-top: 0.4rem;
        }
      `}</style>
    </div>
  );
}
