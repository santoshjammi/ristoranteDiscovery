// Domain entity — a menu category (section)
// Pure domain — zero framework dependencies

import { MenuItem } from './MenuItem';

export interface MenuCategoryProps {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly order: number;
  readonly items: readonly MenuItem[];
}

export class MenuCategory {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string | null;
  public readonly order: number;
  public readonly items: readonly MenuItem[];

  constructor(props: MenuCategoryProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.order = props.order;
    this.items = Object.freeze([...props.items]);
    Object.freeze(this);
  }

  get itemCount(): number {
    return this.items.length;
  }

  get averagePrice(): number {
    if (this.items.length === 0) return 0;
    return this.items.reduce((sum, i) => sum + i.price, 0) / this.items.length;
  }

  get minPrice(): number {
    if (this.items.length === 0) return 0;
    return Math.min(...this.items.map(i => i.price));
  }

  get maxPrice(): number {
    if (this.items.length === 0) return 0;
    return Math.max(...this.items.map(i => i.price));
  }

  get itemsWithDescriptions(): MenuItem[] {
    return this.items.filter(i => i.hasDescription);
  }

  get itemsWithoutDescriptions(): MenuItem[] {
    return this.items.filter(i => !i.hasDescription);
  }

  get descriptionCoverage(): number {
    if (this.items.length === 0) return 0;
    return Math.round((this.itemsWithDescriptions.length / this.items.length) * 100);
  }
}
