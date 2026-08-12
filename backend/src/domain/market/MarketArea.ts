// Domain entity — a market area with aggregated restaurant intelligence
// Pure domain — zero framework dependencies

export interface MarketAreaProps {
  readonly id: string;
  readonly name: string;
  readonly city: string;
  readonly centerLat: number;
  readonly centerLng: number;
  readonly restaurantCount: number;
  readonly cuisineDistribution: Record<string, number>;
  readonly priceDistribution: Record<string, number>;
  readonly averageScores: Record<string, number>;
  readonly totalReviews: number;
  readonly averageRating: number;
}

export class MarketArea {
  public readonly id: string;
  public readonly name: string;
  public readonly city: string;
  public readonly centerLat: number;
  public readonly centerLng: number;
  public readonly restaurantCount: number;
  public readonly cuisineDistribution: Record<string, number>;
  public readonly priceDistribution: Record<string, number>;
  public readonly averageScores: Record<string, number>;
  public readonly totalReviews: number;
  public readonly averageRating: number;

  constructor(props: MarketAreaProps) {
    this.id = props.id;
    this.name = props.name;
    this.city = props.city;
    this.centerLat = props.centerLat;
    this.centerLng = props.centerLng;
    this.restaurantCount = props.restaurantCount;
    this.cuisineDistribution = { ...props.cuisineDistribution };
    this.priceDistribution = { ...props.priceDistribution };
    this.averageScores = { ...props.averageScores };
    this.totalReviews = props.totalReviews;
    this.averageRating = props.averageRating;
  }

  get topCuisines(): Array<{ cuisine: string; count: number }> {
    return Object.entries(this.cuisineDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cuisine, count]) => ({ cuisine, count }));
  }

  get dominantPriceTier(): string | null {
    const entries = Object.entries(this.priceDistribution);
    if (entries.length === 0) return null;
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  }
}
