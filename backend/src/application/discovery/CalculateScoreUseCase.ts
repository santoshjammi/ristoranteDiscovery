// Application use case: Calculate scores for a restaurant
// Orchestrates domain logic — no framework dependencies

import { Scorecard, ScoreDimension } from '../../domain/discovery';
import { FrictionFunction } from '../../domain/discovery/FrictionFunction';
import { DigitalTwin } from '../../domain/discovery/DigitalTwin';
import { ScoresRecalculated, ScoreThresholdCrossed } from '../../domain/discovery/events';
import { DigitalTwinRepository, ScorecardRepository, EvidenceRepository } from './repositories';

export interface ScoreInput {
  restaurantId: string;
  rawScores: Array<{
  name: string;
  rawScore: number | null;
  weight: number;
  evidenceIds: string[];
  isInformational: boolean;
  }>;
}

export interface CalculateScoreResult {
  twin: DigitalTwin;
  scorecard: Scorecard;
  events: Array<ScoresRecalculated | ScoreThresholdCrossed>;
}

export class CalculateScoreUseCase {
  constructor(
    private twinRepo: DigitalTwinRepository,
    private scorecardRepo: ScorecardRepository,
    private evidenceRepo: EvidenceRepository,
  ) {}

  async execute(input: ScoreInput): Promise<CalculateScoreResult> {
    // 1. Get or create Digital Twin
    let twin = await this.twinRepo.findByRestaurantId(input.restaurantId);
    if (!twin) {
      twin = DigitalTwin.create(input.restaurantId);
    }

    // 2. Get or create previous scorecard
    let previousScorecard = await this.scorecardRepo.findByRestaurantId(input.restaurantId);

    // 3. Calculate new scorecard (pure domain logic)
    const dimensions = input.rawScores.map(r => new ScoreDimension({
      name: r.name,
      rawScore: r.rawScore,
      finalScore: FrictionFunction.apply(r.rawScore),
      weight: r.weight,
      evidenceIds: r.evidenceIds,
      isInformational: r.isInformational,
    }));

    const newScorecard = previousScorecard
      ? Scorecard.recalculate(previousScorecard, input.rawScores)
      : Scorecard.create(input.restaurantId, dimensions);

    // 4. Generate events
    const events: Array<ScoresRecalculated | ScoreThresholdCrossed> = [];

    events.push(new ScoresRecalculated(
      newScorecard.id,
      input.restaurantId,
      previousScorecard?.overallScore ?? null,
      newScorecard.overallScore,
      this.getChangedDimensions(previousScorecard, newScorecard),
    ));

    // Check for threshold crossings
    for (const dim of newScorecard.weightedDimensions) {
      const prevDim = previousScorecard?.dimensions.find((d: ScoreDimension) => d.name === dim.name);
      if (prevDim && prevDim.finalScore !== null && dim.finalScore !== null) {
        const thresholds = [30, 50, 70, 85];
        for (const threshold of thresholds) {
          const crossedUp = prevDim.finalScore < threshold && dim.finalScore >= threshold;
          const crossedDown = prevDim.finalScore >= threshold && dim.finalScore < threshold;
          if (crossedUp || crossedDown) {
            events.push(new ScoreThresholdCrossed(
              newScorecard.id,
              input.restaurantId,
              dim.name,
              prevDim.finalScore,
              dim.finalScore,
              threshold,
            ));
          }
        }
      }
    }

    // 5. Persist
    await this.scorecardRepo.save(newScorecard);
    twin = twin.withScorecard(newScorecard);
    await this.twinRepo.save(twin);

    return { twin, scorecard: newScorecard, events };
  }

  private getChangedDimensions(previous: Scorecard | null, current: Scorecard): string[] {
    if (!previous) return current.weightedDimensions.map(d => d.name);
    return current.weightedDimensions
      .filter((d: ScoreDimension) => {
        const prev = previous.dimensions.find((p: ScoreDimension) => p.name === d.name);
        return !prev || prev.finalScore !== d.finalScore;
      })
      .map((d: ScoreDimension) => d.name);
  }
}
