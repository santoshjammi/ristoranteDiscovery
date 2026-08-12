// Domain layer — Menu Intelligence bounded context
// Pure domain. Zero framework dependencies.

export { MenuItem, type MenuItemProps, type SpiceLevel, type MealType, type DietaryType } from './MenuItem';
export { MenuCategory, type MenuCategoryProps } from './MenuCategory';
export { Menu, type MenuProps, type MenuStatus } from './Menu';
export { MenuAnalyzed, MenuItemAdded, MenuDescriptionCoverageChanged } from './events';
