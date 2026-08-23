// Application use case: Generate a visibility report from the Digital Twin
// Pure domain logic — no framework dependencies

import { DigitalTwin } from '../../domain/discovery/DigitalTwin';
import { Recommendation } from '../../domain/discovery/Recommendation';

export interface ReportSection {
  title: string;
  content: string[];
  metrics: Array<{ label: string; value: string; trend?: 'up' | 'down' | 'stable' }>;
}

export interface VisibilityReport {
  restaurantId: string;
  restaurantName: string;
  generatedAt: Date;
  period: string;
  executiveSummary: {
    overallScore: number;
    trend: 'up' | 'down' | 'stable';
    topFindings: string[];
    topRecommendations: string[];
  };
  sections: ReportSection[];
}

export class GenerateReportUseCase {
  execute(twin: DigitalTwin, recommendations: Recommendation[], restaurantName: string): VisibilityReport {
    const score = twin.scorecard;

    const topFindings: string[] = [];
    if (score) {
      const lowest = [...score.weightedDimensions]
        .filter(d => d.finalScore !== null)
        .sort((a, b) => (a.finalScore as number) - (b.finalScore as number))[0];
      if (lowest) {
        topFindings.push(`Lowest dimension: ${lowest.name} (${lowest.finalScore}/100)`);
      }
      if (score.trend === 'down') {
        topFindings.push(`Score declined ${Math.abs(score.scoreChange)} points this period`);
      }
    }
    topFindings.push(`${twin.evidenceCount} evidence data points collected`);

    const sections: ReportSection[] = [];

    // Scorecard section
    if (score) {
      sections.push({
        title: 'Scorecard Overview',
        content: [
          `Overall Discoverability Score: ${score.overallScore}/100`,
          `Trend: ${score.trend === 'up' ? 'Improving' : score.trend === 'down' ? 'Declining' : 'Stable'}`,
          `${score.weightedDimensions.length} weighted dimensions tracked`,
        ],
        metrics: score.weightedDimensions.map(d => ({
          label: d.name,
          value: `${d.finalScore}/100`,
        })),
      });
    }

    // Evidence section
    sections.push({
      title: 'Evidence Summary',
      content: [
        `${twin.evidenceCount} evidence items collected`,
        ...twin.evidence.slice(0, 5).map(e => `• ${e.description}`),
      ],
      metrics: [
        { label: 'Total Evidence', value: String(twin.evidenceCount) },
        { label: 'High Confidence', value: String(twin.evidence.filter(e => e.isHighConfidence).length) },
      ],
    });

    // Recommendations section
    if (recommendations.length > 0) {
      sections.push({
        title: 'Top Recommendations',
        content: recommendations.slice(0, 5).map(r =>
          `• ${r.title} — Impact: ${r.businessImpact}, Effort: ${r.implementationEffort}`
        ),
        metrics: [
          { label: 'Total Recommendations', value: String(recommendations.length) },
          { label: 'High Priority', value: String(recommendations.filter(r => r.priority === 'high' || r.priority === 'critical').length) },
        ],
      });
    }

    return {
      restaurantId: twin.restaurantId,
      restaurantName,
      generatedAt: new Date(),
      period: 'Current',
      executiveSummary: {
        overallScore: score?.overallScore ?? 0,
        trend: score?.trend ?? 'stable',
        topFindings,
        topRecommendations: recommendations.slice(0, 3).map(r => r.title),
      },
      sections,
    };
  }
}
