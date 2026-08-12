// Application service: Normalization Pipeline
// Converts raw observations into standardized evidence using rules
// Deterministic — same raw data → same evidence
// No AI dependency

import { NormalizationRule } from '../../domain/normalization/NormalizationRule';

export interface NormalizationRuleRepository {
  save(rule: NormalizationRule): Promise<void>;
  findAll(): Promise<NormalizationRule[]>;
  findBySourceType(sourceType: string): Promise<NormalizationRule[]>;
  findByName(name: string): Promise<NormalizationRule | null>;
}

export class NormalizationPipeline {
  constructor(private readonly repository: NormalizationRuleRepository) {}

  /**
   * Register a normalization rule.
   */
  async registerRule(input: {
    name: string;
    description: string;
    sourceType: string;
    inputField: string;
    outputField: string;
    transform: string;
    version: string;
    config?: Record<string, unknown>;
  }): Promise<NormalizationRule> {
    const rule = new NormalizationRule({
      id: `nrm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: input.name,
      description: input.description,
      sourceType: input.sourceType,
      inputField: input.inputField,
      outputField: input.outputField,
      transform: input.transform,
      version: input.version,
      config: input.config ?? {},
    });

    await this.repository.save(rule);
    return rule;
  }

  /**
   * Normalize raw data using rules for the given source type.
   * Returns a normalized payload.
   */
  normalize(rawData: Record<string, unknown>, sourceType: string, rules: NormalizationRule[]): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const applicableRules = rules.filter(r => r.sourceType === sourceType);

    for (const rule of applicableRules) {
      const rawValue = this.getValue(rawData, rule.inputField);
      if (rawValue === undefined) continue;

      const transformed = this.applyTransform(rawValue, rule.transform, rule.config);
      if (transformed !== undefined) {
        this.setValue(result, rule.outputField, transformed);
      }
    }

    return result;
  }

  /**
   * Get all rules for a source type.
   */
  async getRulesForSourceType(sourceType: string): Promise<NormalizationRule[]> {
    return this.repository.findBySourceType(sourceType);
  }

  private getValue(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: any = obj;
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') return undefined;
      current = current[part];
    }
    return current;
  }

  private setValue(obj: Record<string, unknown>, path: string, value: unknown): void {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
        current[parts[i]] = {};
      }
      current = current[parts[i]] as Record<string, unknown>;
    }
    current[parts[parts.length - 1]] = value;
  }

  private applyTransform(value: unknown, transform: string, config: Record<string, unknown>): unknown {
    switch (transform) {
      case 'identity':
        return value;
      case 'lowercase':
        return typeof value === 'string' ? value.toLowerCase() : value;
      case 'uppercase':
        return typeof value === 'string' ? value.toUpperCase() : value;
      case 'trim':
        return typeof value === 'string' ? value.trim() : value;
      case 'parse-number':
        return typeof value === 'string' ? parseFloat(value) : value;
      case 'parse-boolean':
        if (typeof value === 'string') return value.toLowerCase() === 'true' || value === '1';
        return Boolean(value);
      case 'parse-json':
        if (typeof value === 'string') {
          try { return JSON.parse(value); } catch { return value; }
        }
        return value;
      case 'map':
        if (typeof value === 'string' && config.mapping) {
          const mapping = config.mapping as Record<string, string>;
          return mapping[value.toLowerCase()] || value;
        }
        return value;
      case 'array':
        if (typeof value === 'string') {
          const separator = (config.separator as string) || ',';
          return value.split(separator).map(s => s.trim()).filter(Boolean);
        }
        if (Array.isArray(value)) return value;
        return [value];
      default:
        return value;
    }
  }
}
