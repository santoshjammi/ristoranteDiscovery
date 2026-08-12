// Domain value object — a single menu item
// Pure domain — zero framework dependencies

export type SpiceLevel = 'mild' | 'medium' | 'hot' | 'extra-hot' | 'none';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'late-night';
export type DietaryType = 'vegetarian' | 'vegan' | 'gluten-free' | 'halal' | 'kosher' | 'none';

export interface MenuItemProps {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly price: number;
  readonly currency: string;
  readonly ingredients: readonly string[];
  readonly dietaryTypes: readonly DietaryType[];
  readonly spiceLevel: SpiceLevel;
  readonly allergens: readonly string[];
  readonly mealTypes: readonly MealType[];
  readonly popularityScore: number;
  readonly categoryId: string;
}

export class MenuItem {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string | null;
  public readonly price: number;
  public readonly currency: string;
  public readonly ingredients: readonly string[];
  public readonly dietaryTypes: readonly DietaryType[];
  public readonly spiceLevel: SpiceLevel;
  public readonly allergens: readonly string[];
  public readonly mealTypes: readonly MealType[];
  public readonly popularityScore: number;
  public readonly categoryId: string;

  constructor(props: MenuItemProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.price = props.price;
    this.currency = props.currency;
    this.ingredients = Object.freeze([...props.ingredients]);
    this.dietaryTypes = Object.freeze([...props.dietaryTypes]);
    this.spiceLevel = props.spiceLevel;
    this.allergens = Object.freeze([...props.allergens]);
    this.mealTypes = Object.freeze([...props.mealTypes]);
    this.popularityScore = props.popularityScore;
    this.categoryId = props.categoryId;
    Object.freeze(this);
  }

  get hasDescription(): boolean {
    return this.description !== null && this.description.trim().length > 10;
  }

  get priceCategory(): 'budget' | 'mid' | 'premium' {
    if (this.price < 10) return 'budget';
    if (this.price < 20) return 'mid';
    return 'premium';
  }
}
