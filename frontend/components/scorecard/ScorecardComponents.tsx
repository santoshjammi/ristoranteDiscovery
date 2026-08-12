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

export function MasterScore({ score, status, liveFactors, totalFactors }: {
  score: number | null; status: FactorStatus; liveFactors: number; totalFactors: number;
}) {
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
    </div>
  );
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
