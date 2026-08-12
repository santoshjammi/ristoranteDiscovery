"use client";

import { colors, spacing, radius, typography } from "@/lib/design-tokens";

export type FactorStatus = 'excellent' | 'good' | 'fair' | 'needs_attention' | 'critical' | 'pending_observation';

export interface SubSignal {
  id: string;
  name: string;
  score: number | null;
  status: FactorStatus;
  evidence: string[];
}

export interface FactorScore {
  id: string; name: string; description: string;
  score: number | null; status: FactorStatus;
  trend: 'up' | 'down' | 'stable' | null;
  confidence: number | null; lastUpdated: string | null;
  businessImpact: string; evidenceCount: number;
  subSignals: SubSignal[];
  connectorRequired?: string;
  recommendedActions: string[]; expectedImprovement: string;
}

export interface CategoryScore {
  id: string; name: string; description: string;
  score: number | null; factors: FactorScore[];
  healthyCount: number; attentionCount: number; criticalCount: number; pendingCount: number;
  trend: 'up' | 'down' | 'stable' | null; confidence: number | null;
}

export interface ScorecardData {
  restaurantId: string; restaurantName: string;
  overallScore: number | null; overallStatus: FactorStatus;
  categories: CategoryScore[];
  totalFactors: number; liveFactors: number; pendingFactors: number;
  lastUpdated: string;
}

function statusColor(status: FactorStatus): string {
  switch (status) {
    case 'excellent': return colors.success;
    case 'good': return colors.primary;
    case 'fair': return colors.warning;
    case 'needs_attention': return colors.dangerLight;
    case 'critical': return colors.danger;
    case 'pending_observation': return colors.mutedDarker;
  }
}

export { statusColor };

function statusBg(status: FactorStatus): string {
  switch (status) {
    case 'excellent': return colors.successLight;
    case 'good': return colors.primaryLight;
    case 'fair': return colors.warningLight;
    case 'needs_attention': return `${colors.dangerLight}20`;
    case 'critical': return colors.dangerLight;
    case 'pending_observation': return colors.border;
  }
}

function statusLabel(status: FactorStatus): string {
  switch (status) {
    case 'excellent': return 'Excellent';
    case 'good': return 'Good';
    case 'fair': return 'Fair';
    case 'needs_attention': return 'Needs Attention';
    case 'critical': return 'Critical';
    case 'pending_observation': return 'Pending Observation';
  }
}

export function MasterScore({ score, status, liveFactors, totalFactors, lastUpdated }: {
  score: number | null; status: FactorStatus; liveFactors: number; totalFactors: number; lastUpdated?: string | null;
}) {
  const freshness = lastUpdated ? formatFreshness(lastUpdated) : null;
  return (
    <div style={{ textAlign: 'center', padding: spacing['3xl'], background: colors.surface, borderRadius: radius.xl, border: `1px solid ${colors.border}` }}>
      <p style={{ ...typography.label, margin: 0, color: colors.mutedDarker, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Restaurant Intelligence</p>
      <p style={{ margin: `${spacing.md} 0 0`, fontSize: '4rem', fontWeight: 700, lineHeight: 1, color: score !== null ? statusColor(status) : colors.mutedDarker }}>
        {score !== null ? score : '—'}
        <span style={{ fontSize: '1.5rem', color: colors.mutedDarker }}>/100</span>
      </p>
      <span style={{ display: 'inline-block', marginTop: spacing.md, padding: `${spacing.xs} ${spacing.lg}`, borderRadius: radius.full, fontSize: '0.8125rem', fontWeight: 600, background: statusBg(status), color: statusColor(status) }}>
        {statusLabel(status)}
      </span>
      <p style={{ ...typography.small, margin: `${spacing.md} 0 0`, color: colors.mutedDarker }}>
        {liveFactors} of {totalFactors} factors measured · {totalFactors - liveFactors} pending
      </p>
      {freshness && (
        <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>
          Last updated {freshness}
        </p>
      )}
    </div>
  );
}

// ── Category score strip (5 compact cards in a row) ──
export function CategoryScoreStrip({ categories, onSelect }: {
  categories: CategoryScore[]; onSelect?: (id: string) => void;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: spacing.md }}>
      {categories.map((cat) => {
        const isPending = cat.score === null;
        const color = isPending ? colors.mutedDarker : statusColor(cat.factors.find(f => f.status !== 'pending_observation')?.status || 'pending_observation');
        return (
          <div
            key={cat.id}
            onClick={() => onSelect?.(cat.id)}
            style={{
              padding: spacing.lg, background: colors.surface, borderRadius: radius.lg,
              border: `1px solid ${colors.border}`, cursor: onSelect ? 'pointer' : 'default',
              transition: 'border-color 0.15s, transform 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: colors.mutedDarker, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{cat.name}</p>
            <p style={{ margin: `${spacing.sm} 0 0`, fontSize: '2rem', fontWeight: 700, lineHeight: 1, color }}>
              {isPending ? '—' : cat.score}
            </p>
            {/* Mini status bar */}
            <div style={{ display: 'flex', gap: 2, marginTop: spacing.sm }}>
              {cat.healthyCount > 0 && <div style={{ flex: cat.healthyCount, height: 3, background: colors.success, borderRadius: 2 }} />}
              {cat.attentionCount > 0 && <div style={{ flex: cat.attentionCount, height: 3, background: colors.warning, borderRadius: 2 }} />}
              {cat.criticalCount > 0 && <div style={{ flex: cat.criticalCount, height: 3, background: colors.danger, borderRadius: 2 }} />}
              {cat.pendingCount > 0 && <div style={{ flex: cat.pendingCount, height: 3, background: colors.mutedDarker, borderRadius: 2, opacity: 0.3 }} />}
            </div>
            <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>
              {cat.healthyCount} healthy · {cat.pendingCount} pending
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ── Expandable factor card with sub-signals, evidence, confidence, freshness ──
export function ExpandableFactorCard({ factor, expanded, onToggle }: {
  factor: FactorScore; expanded: boolean; onToggle: (id: string) => void;
}) {
  const isPending = factor.status === 'pending_observation';
  const freshness = factor.lastUpdated ? formatFreshness(factor.lastUpdated) : null;
  return (
    <div
      style={{
        padding: spacing.lg, background: colors.surface, borderRadius: radius.lg,
        border: `1px solid ${isPending ? colors.border : statusBg(factor.status)}`,
        cursor: 'pointer', transition: 'border-color 0.15s',
        opacity: isPending ? 0.75 : 1,
      }}
      onClick={() => onToggle(factor.id)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs }}>
        <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: colors.text, flex: 1 }}>{factor.name}</p>
        {isPending ? (
          <span style={{ padding: `${spacing.xs} ${spacing.sm}`, borderRadius: radius.sm, fontSize: '0.625rem', fontWeight: 600, background: colors.border, color: colors.mutedDarker }}>Pending</span>
        ) : (
          <span style={{ fontSize: '1.125rem', fontWeight: 700, color: statusColor(factor.status) }}>{factor.score}</span>
        )}
      </div>
      <p style={{ ...typography.caption, margin: `0 0 ${spacing.sm}`, color: colors.mutedDarker }}>{factor.description}</p>

      {/* Evidence / confidence / freshness row */}
      {!isPending && (
        <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.xs }}>
          {factor.trend && <span style={{ ...typography.caption, color: factor.trend === 'up' ? colors.success : factor.trend === 'down' ? colors.danger : colors.muted }}>{factor.trend === 'up' ? '↑' : factor.trend === 'down' ? '↓' : '→'}</span>}
          {factor.confidence !== null && <span style={{ ...typography.caption, color: colors.muted }}>{factor.confidence}% conf</span>}
          {factor.evidenceCount > 0 && <span style={{ ...typography.caption, color: colors.muted }}>{factor.evidenceCount} sources</span>}
          {freshness && <span style={{ ...typography.caption, color: colors.muted }}>· {freshness}</span>}
        </div>
      )}
      {isPending && factor.connectorRequired && (
        <p style={{ ...typography.caption, margin: 0, color: colors.mutedDarker, fontStyle: 'italic' }}>Requires: {factor.connectorRequired}</p>
      )}

      {/* Expandable sub-signals */}
      {expanded && (
        <div style={{ marginTop: spacing.md, paddingTop: spacing.md, borderTop: `1px solid ${colors.border}` }}>
          {factor.subSignals.length > 0 ? (
            <>
              <p style={{ ...typography.caption, margin: `0 0 ${spacing.sm}`, color: colors.mutedDarker, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Sub-Signals</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                {factor.subSignals.map((s) => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: spacing.sm, background: colors.bg, borderRadius: radius.md }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: colors.text }}>{s.name}</p>
                      {s.evidence.length > 0 && (
                        <ul style={{ margin: `${spacing.xs} 0 0`, paddingLeft: spacing.lg, fontSize: '0.625rem', color: colors.mutedDarker }}>
                          {s.evidence.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                      )}
                      {s.evidence.length === 0 && (
                        <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker, fontStyle: 'italic' }}>No evidence yet</p>
                      )}
                    </div>
                    <span style={{ marginLeft: spacing.sm, fontSize: '0.8125rem', fontWeight: 700, color: s.score !== null ? statusColor(s.status) : colors.mutedDarker }}>
                      {s.score !== null ? s.score : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p style={{ ...typography.caption, margin: 0, color: colors.mutedDarker, fontStyle: 'italic' }}>No sub-signals for this factor.</p>
          )}
          {/* Recommended actions */}
          {factor.recommendedActions.length > 0 && (
            <div style={{ marginTop: spacing.md }}>
              <p style={{ ...typography.caption, margin: `0 0 ${spacing.xs}`, color: colors.mutedDarker, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Recommended Actions</p>
              <ul style={{ margin: 0, paddingLeft: spacing.lg, fontSize: '0.6875rem', color: colors.muted }}>
                {factor.recommendedActions.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Problem factors (top 3-5 needs_attention / critical) ──
export function ProblemFactors({ factors, onSelect }: {
  factors: FactorScore[]; onSelect: (id: string) => void;
}) {
  const problems = factors
    .filter((f) => f.status === 'needs_attention' || f.status === 'critical')
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .slice(0, 5);
  if (problems.length === 0) return null;
  return (
    <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.xl, border: `1px solid ${colors.dangerLight}` }}>
      <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.md}`, color: colors.danger }}>⚠️ Top Problem Factors</h3>
      <p style={{ ...typography.small, margin: `0 0 ${spacing.lg}`, color: colors.mutedDarker }}>
        These factors are holding back your score the most. Fixing them delivers the fastest improvement.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        {problems.map((f) => (
          <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, background: colors.bg, borderRadius: radius.md, cursor: 'pointer' }}
            onClick={() => onSelect(f.id)}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: colors.text }}>{f.name}</p>
              <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>{f.expectedImprovement}</p>
            </div>
            <div style={{ textAlign: 'right', marginLeft: spacing.md }}>
              <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: statusColor(f.status) }}>{f.score}</p>
              <span style={{ ...typography.caption, color: f.status === 'critical' ? colors.danger : colors.warning }}>{f.status === 'critical' ? 'Critical' : 'Needs Attention'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Pending Observation factors (clearly separated) ──
export function PendingFactors({ factors, onSelect }: {
  factors: FactorScore[]; onSelect: (id: string) => void;
}) {
  const pending = factors.filter((f) => f.status === 'pending_observation');
  if (pending.length === 0) return null;
  return (
    <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.xl, border: `1px dashed ${colors.border}` }}>
      <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.xs}`, color: colors.mutedDarker }}>Pending Observation</h3>
      <p style={{ ...typography.small, margin: `0 0 ${spacing.lg}`, color: colors.mutedDarker }}>
        These factors need a data connector to be measured. Connect a source to unlock them.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: spacing.sm }}>
        {pending.map((f) => (
          <div key={f.id} style={{ padding: spacing.md, background: colors.bg, borderRadius: radius.md, border: `1px solid ${colors.border}`, cursor: 'pointer', opacity: 0.8 }}
            onClick={() => onSelect(f.id)}>
            <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: colors.text }}>{f.name}</p>
            <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>{f.description}</p>
            {f.connectorRequired && (
              <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker, fontStyle: 'italic' }}>Requires: {f.connectorRequired}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Helper: human-readable freshness ──
function formatFreshness(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const mins = Math.floor((now - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function FactorCard({ factor, onSelect }: { factor: FactorScore; onSelect?: (id: string) => void }) {
  const isPending = factor.status === 'pending_observation';
  return (
    <div
      onClick={() => onSelect?.(factor.id)}
      style={{
        padding: spacing.lg,
        background: colors.surface,
        borderRadius: radius.lg,
        border: `1px solid ${isPending ? colors.border : statusBg(factor.status)}`,
        cursor: onSelect ? 'pointer' : 'default',
        transition: 'border-color 0.15s',
        opacity: isPending ? 0.7 : 1,
      }}
      onMouseEnter={(e) => { if (onSelect) e.currentTarget.style.borderColor = colors.primary; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = isPending ? colors.border : statusBg(factor.status); }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs }}>
        <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: colors.text }}>{factor.name}</p>
        {isPending ? (
          <span style={{ padding: `${spacing.xs} ${spacing.sm}`, borderRadius: radius.sm, fontSize: '0.625rem', fontWeight: 600, background: colors.border, color: colors.mutedDarker }}>Pending</span>
        ) : (
          <span style={{ fontSize: '1rem', fontWeight: 700, color: statusColor(factor.status) }}>{factor.score}</span>
        )}
      </div>
      <p style={{ ...typography.caption, margin: `0 0 ${spacing.sm}`, color: colors.mutedDarker }}>{factor.description}</p>
      {isPending && factor.connectorRequired && (
        <p style={{ ...typography.caption, margin: 0, color: colors.mutedDarker, fontStyle: 'italic' }}>Requires: {factor.connectorRequired}</p>
      )}
      {!isPending && (
        <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
          {factor.trend && <span style={{ ...typography.caption, color: factor.trend === 'up' ? colors.success : factor.trend === 'down' ? colors.danger : colors.muted }}>{factor.trend === 'up' ? '↑' : factor.trend === 'down' ? '↓' : '→'}</span>}
          {factor.confidence !== null && <span style={{ ...typography.caption, color: colors.muted }}>{factor.confidence}% confidence</span>}
          {factor.evidenceCount > 0 && <span style={{ ...typography.caption, color: colors.muted }}>{factor.evidenceCount} sources</span>}
        </div>
      )}
    </div>
  );
}

export function CategoryCard({ category, onFactorSelect }: { category: CategoryScore; onFactorSelect?: (id: string) => void }) {
  const isPending = category.score === null;
  return (
    <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.xl, border: `1px solid ${colors.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
        <div>
          <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: colors.text }}>{category.name}</p>
          <p style={{ ...typography.small, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>{category.description}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          {isPending ? (
            <span style={{ padding: `${spacing.xs} ${spacing.md}`, borderRadius: radius.sm, fontSize: '0.75rem', fontWeight: 600, background: colors.border, color: colors.mutedDarker }}>Pending</span>
          ) : (
            <>
              <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: statusColor(category.factors.find(f => f.status !== 'pending_observation')?.status || 'pending_observation') }}>{category.score}</p>
              <p style={{ ...typography.caption, margin: 0, color: colors.mutedDarker }}>/100</p>
            </>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div style={{ display: 'flex', gap: spacing.xs, marginBottom: spacing.md }}>
        {category.healthyCount > 0 && <div style={{ flex: category.healthyCount, height: 4, background: colors.success, borderRadius: radius.sm }} title={`${category.healthyCount} healthy`} />}
        {category.attentionCount > 0 && <div style={{ flex: category.attentionCount, height: 4, background: colors.warning, borderRadius: radius.sm }} title={`${category.attentionCount} need attention`} />}
        {category.criticalCount > 0 && <div style={{ flex: category.criticalCount, height: 4, background: colors.danger, borderRadius: radius.sm }} title={`${category.criticalCount} critical`} />}
        {category.pendingCount > 0 && <div style={{ flex: category.pendingCount, height: 4, background: colors.mutedDarker, borderRadius: radius.sm, opacity: 0.3 }} title={`${category.pendingCount} pending`} />}
      </div>

      {/* Factor grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: spacing.sm }}>
        {category.factors.map((f) => (
          <FactorCard key={f.id} factor={f} onSelect={onFactorSelect} />
        ))}
      </div>
    </div>
  );
}
