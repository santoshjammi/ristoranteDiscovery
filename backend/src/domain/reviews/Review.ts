// Domain value object — a single customer review
// Pure domain — zero framework dependencies

export type ReviewSentiment = 'positive' | 'negative' | 'neutral' | 'mixed';

export interface ReviewProps {
  readonly id: string;
  readonly restaurantId: string;
  readonly rating: number; // 1-5
  readonly text: string;
  readonly date: Date;
  readonly source: string; // 'google', 'yelp', 'tripadvisor', etc.
  readonly responseText: string | null;
  readonly responseDate: Date | null;
}

export class Review {
  public readonly id: string;
  public readonly restaurantId: string;
  public readonly rating: number;
  public readonly text: string;
  public readonly date: Date;
  public readonly source: string;
  public readonly responseText: string | null;
  public readonly responseDate: Date | null;

  constructor(props: ReviewProps) {
    this.id = props.id;
    this.restaurantId = props.restaurantId;
    this.rating = props.rating;
    this.text = props.text;
    this.date = props.date;
    this.source = props.source;
    this.responseText = props.responseText;
    this.responseDate = props.responseDate;
    Object.freeze(this);
  }

  get sentiment(): ReviewSentiment {
    if (this.rating >= 4) return 'positive';
    if (this.rating === 3) return 'neutral';
    if (this.rating <= 2) return 'negative';
    return 'neutral';
  }

  get isResponded(): boolean {
    return this.responseText !== null && this.responseText.trim().length > 0;
  }

  get responseLatencyDays(): number | null {
    if (!this.responseDate || !this.isResponded) return null;
    return Math.round((this.responseDate.getTime() - this.date.getTime()) / (1000 * 60 * 60 * 24));
  }

  get isRecent(): boolean {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return this.date >= thirtyDaysAgo;
  }

  get isCritical(): boolean {
    return this.rating <= 2;
  }
}
