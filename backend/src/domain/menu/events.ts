// Domain events for the Menu Intelligence bounded context
// Past-tense, typed, carry defined payloads

import { BaseDomainEvent } from '../discovery/events';

export class MenuAnalyzed extends BaseDomainEvent {
  public readonly eventName = 'menu.analyzed';

  constructor(
    aggregateId: string,
    public readonly restaurantId: string,
    public readonly totalItems: number,
    public readonly categories: number,
    public readonly descriptionCoverage: number,
    public readonly averagePrice: number,
  ) {
    super(aggregateId);
  }
}

export class MenuItemAdded extends BaseDomainEvent {
  public readonly eventName = 'menu.item.added';

  constructor(
    aggregateId: string,
    public readonly restaurantId: string,
    public readonly itemName: string,
    public readonly categoryName: string,
    public readonly price: number,
  ) {
    super(aggregateId);
  }
}

export class MenuDescriptionCoverageChanged extends BaseDomainEvent {
  public readonly eventName = 'menu.description-coverage.changed';

  constructor(
    aggregateId: string,
    public readonly restaurantId: string,
    public readonly previousCoverage: number,
    public readonly newCoverage: number,
  ) {
    super(aggregateId);
  }
}
