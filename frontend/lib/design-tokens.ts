// ── Design System Tokens ──
// Single source of truth for colors, spacing, typography, shadows

export const colors = {
  // Backgrounds
  bg: '#0f172a',
  surface: '#1e293b',
  surfaceHover: '#334155',

  // Text
  text: '#f1f5f9',
  textSecondary: '#cbd5e1',
  muted: '#94a3b8',
  mutedDarker: '#64748b',

  // Borders
  border: '#334155',
  borderLight: '#475569',

  // Primary
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  primaryLight: 'rgba(59, 130, 246, 0.1)',

  // Semantic
  success: '#22c55e',
  successLight: 'rgba(34, 197, 94, 0.1)',
  warning: '#f59e0b',
  warningLight: 'rgba(245, 158, 11, 0.1)',
  danger: '#ef4444',
  dangerLight: 'rgba(239, 68, 68, 0.1)',

  // Severity
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#3b82f6',
  low: '#6b7280',
} as const;

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '2rem',
  '4xl': '3rem',
} as const;

export const typography = {
  h1: { fontSize: '1.5rem', fontWeight: 700, color: colors.text },
  h2: { fontSize: '1.25rem', fontWeight: 600, color: colors.text },
  h3: { fontSize: '1rem', fontWeight: 600, color: colors.text },
  body: { fontSize: '0.875rem', color: colors.text },
  small: { fontSize: '0.8125rem', color: colors.muted },
  caption: { fontSize: '0.75rem', color: colors.muted },
  label: { fontSize: '0.75rem', color: colors.muted, textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
} as const;

export const radius = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  full: '9999px',
} as const;

export const shadows = {
  card: '0 1px 3px rgba(0, 0, 0, 0.3)',
  elevated: '0 4px 12px rgba(0, 0, 0, 0.4)',
} as const;

export function scoreColor(score: number): string {
  if (score >= 70) return colors.success;
  if (score >= 40) return colors.warning;
  return colors.danger;
}

export function scoreLabel(score: number): string {
  if (score >= 70) return 'Good';
  if (score >= 40) return 'Needs Work';
  return 'Critical';
}

export function severityColor(severity: string): string {
  const map: Record<string, string> = {
    critical: colors.critical,
    high: colors.high,
    medium: colors.medium,
    low: colors.low,
  };
  return map[severity] || colors.low;
}

export function severityLabel(severity: string): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}
