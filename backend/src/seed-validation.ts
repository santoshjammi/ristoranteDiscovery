// Seed script: Add diverse restaurants for Menu Intelligence validation
// Run: npx tsx src/seed-validation.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MenuSeed {
  name: string;
  description: string | null;
  items: Array<{
    name: string;
    description: string | null;
    price: number;
    ingredients: string[];
    dietaryType: string[];
    spiceLevel: string;
    allergens: string[];
    mealType: string[];
    popularityScore: number;
  }>;
}

interface RestaurantSeed {
  name: string;
  address: string;
  city: string;
  state: string;
  cuisineTypes: string[];
  regionalCuisine: string | null;
  priceRange: string;
  dietarySupport: string[];
  amenities: string[];
  ambience: string[];
  nearbyLandmarks: string[];
  gbpHealthScore: number;
  menuSections: MenuSeed[];
}

const seeds: RestaurantSeed[] = [
  // ── Seafood (3) ──
  {
    name: 'The Crab Shack',
    address: '4505 Capital Blvd',
    city: 'Raleigh',
    state: 'NC',
    cuisineTypes: ['Seafood', 'American', 'Cajun'],
    regionalCuisine: 'Coastal',
    priceRange: '$$',
    dietarySupport: ['Gluten-Free', 'Dairy-Free'],
    amenities: ['Outdoor Seating', 'Parking', 'Takeout'],
    ambience: ['Casual', 'Family-Friendly'],
    nearbyLandmarks: ['Crabtree Valley Mall', 'I-440'],
    gbpHealthScore: 75,
    menuSections: [
      {
        name: 'Appetizers',
        description: 'Start your meal',
        items: [
          { name: 'Crab Cakes', description: 'Pan-seared Maryland-style crab cakes with remoulade', price: 14.99, ingredients: ['crab', 'breadcrumbs', 'eggs', 'mayonnaise'], dietaryType: ['Dairy-Free'], spiceLevel: 'mild', allergens: ['Shellfish', 'Eggs', 'Gluten'], mealType: ['Dinner'], popularityScore: 4.5 },
          { name: 'Fried Calamari', description: 'Crispy calamari with marinara', price: 11.99, ingredients: ['calamari', 'flour', 'marinara'], dietaryType: [], spiceLevel: 'mild', allergens: ['Shellfish', 'Gluten'], mealType: ['Dinner'], popularityScore: 4.2 },
          { name: 'Shrimp Cocktail', description: 'Chilled jumbo shrimp with cocktail sauce', price: 13.99, ingredients: ['shrimp', 'cocktail sauce', 'lemon'], dietaryType: ['Gluten-Free', 'Dairy-Free'], spiceLevel: 'mild', allergens: ['Shellfish'], mealType: ['Dinner'], popularityScore: 4.0 },
        ],
      },
      {
        name: 'Mains',
        description: 'Fresh catches daily',
        items: [
          { name: 'Grilled Salmon', description: 'Atlantic salmon with lemon butter sauce', price: 24.99, ingredients: ['salmon', 'butter', 'lemon', 'garlic'], dietaryType: ['Gluten-Free'], spiceLevel: 'mild', allergens: ['Fish', 'Dairy'], mealType: ['Dinner'], popularityScore: 4.8 },
          { name: 'Lobster Roll', description: 'New England style lobster roll', price: 19.99, ingredients: ['lobster', 'bun', 'butter', 'celery'], dietaryType: [], spiceLevel: 'mild', allergens: ['Shellfish', 'Gluten', 'Dairy'], mealType: ['Lunch', 'Dinner'], popularityScore: 4.6 },
          { name: 'Fish & Chips', description: 'Beer-battered cod with fries', price: 16.99, ingredients: ['cod', 'beer batter', 'potatoes'], dietaryType: [], spiceLevel: 'mild', allergens: ['Fish', 'Gluten'], mealType: ['Lunch', 'Dinner'], popularityScore: 4.3 },
        ],
      },
    ],
  },
  {
    name: 'Ocean Blue Grill',
    address: '800 Market St',
    city: 'Chapel Hill',
    state: 'NC',
    cuisineTypes: ['Seafood', 'Mediterranean', 'Fine Dining'],
    regionalCuisine: 'Mediterranean',
    priceRange: '$$$',
    dietarySupport: ['Gluten-Free', 'Vegan', 'Dairy-Free'],
    amenities: ['Valet Parking', 'Full Bar', 'Reservations'],
    ambience: ['Upscale', 'Romantic', 'Quiet'],
    nearbyLandmarks: ['UNC Chapel Hill', 'Franklin Street'],
    gbpHealthScore: 85,
    menuSections: [
      {
        name: 'Starters',
        description: null,
        items: [
          { name: 'Tuna Tartare', description: 'Ahi tuna with avocado and sesame', price: 18.00, ingredients: ['tuna', 'avocado', 'sesame oil', 'soy sauce'], dietaryType: ['Gluten-Free', 'Dairy-Free'], spiceLevel: 'mild', allergens: ['Fish', 'Soy', 'Sesame'], mealType: ['Dinner'], popularityScore: 4.7 },
          { name: 'Grilled Octopus', description: 'Charred octopus with olive oil and herbs', price: 16.00, ingredients: ['octopus', 'olive oil', 'lemon', 'oregano'], dietaryType: ['Gluten-Free', 'Dairy-Free', 'Vegan'], spiceLevel: 'mild', allergens: ['Shellfish'], mealType: ['Dinner'], popularityScore: 4.4 },
        ],
      },
      {
        name: 'Entrees',
        description: 'Chef specialties',
        items: [
          { name: 'Pan-Seared Sea Bass', description: 'Mediterranean sea bass with saffron risotto', price: 32.00, ingredients: ['sea bass', 'risotto', 'saffron', 'white wine'], dietaryType: ['Gluten-Free'], spiceLevel: 'mild', allergens: ['Fish', 'Dairy'], mealType: ['Dinner'], popularityScore: 4.9 },
          { name: 'Lobster Linguine', description: 'Fresh lobster with house-made pasta', price: 28.00, ingredients: ['lobster', 'pasta', 'garlic', 'tomato'], dietaryType: [], spiceLevel: 'medium', allergens: ['Shellfish', 'Gluten', 'Dairy'], mealType: ['Dinner'], popularityScore: 4.5 },
        ],
      },
    ],
  },
  {
    name: 'Bayou Boil House',
    address: '1200 Buck Jones Rd',
    city: 'Raleigh',
    state: 'NC',
    cuisineTypes: ['Seafood', 'Cajun', 'Southern'],
    regionalCuisine: 'Cajun',
    priceRange: '$$',
    dietarySupport: ['Gluten-Free'],
    amenities: ['Outdoor Seating', 'BYOB', 'Parking'],
    ambience: ['Lively', 'Casual', 'Family-Friendly'],
    nearbyLandmarks: ['Crossroads Plaza', 'I-40'],
    gbpHealthScore: 70,
    menuSections: [
      {
        name: 'Boils',
        description: 'Choose your catch and spice level',
        items: [
          { name: 'Crawfish Boil', description: null, price: 18.99, ingredients: ['crawfish', 'corn', 'potatoes', 'sausage'], dietaryType: ['Gluten-Free'], spiceLevel: 'hot', allergens: ['Shellfish'], mealType: ['Dinner'], popularityScore: 4.6 },
          { name: 'Shrimp Boil', description: null, price: 16.99, ingredients: ['shrimp', 'corn', 'potatoes', 'sausage'], dietaryType: ['Gluten-Free'], spiceLevel: 'medium', allergens: ['Shellfish'], mealType: ['Dinner'], popularityScore: 4.3 },
        ],
      },
    ],
  },

  // ── Fine Dining (3) ──
  {
    name: 'The Oak Room',
    address: '200 W Morgan St',
    city: 'Raleigh',
    state: 'NC',
    cuisineTypes: ['American', 'Fine Dining', 'Contemporary'],
    regionalCuisine: 'American',
    priceRange: '$$$$',
    dietarySupport: ['Gluten-Free', 'Vegan', 'Dairy-Free', 'Kosher'],
    amenities: ['Valet Parking', 'Full Bar', 'Private Dining', 'Reservations'],
    ambience: ['Upscale', 'Romantic', 'Quiet', 'Elegant'],
    nearbyLandmarks: ['Raleigh Convention Center', 'Fayetteville Street'],
    gbpHealthScore: 90,
    menuSections: [
      {
        name: 'Tasting Menu',
        description: 'Chef\'s seasonal tasting menu',
        items: [
          { name: 'Amuse Bouche', description: 'Chef\'s daily selection', price: 0, ingredients: ['seasonal'], dietaryType: ['Gluten-Free'], spiceLevel: 'mild', allergens: [], mealType: ['Dinner'], popularityScore: 4.8 },
          { name: 'Foie Gras Torchon', description: 'With brioche and fig compote', price: 28.00, ingredients: ['foie gras', 'brioche', 'figs'], dietaryType: [], spiceLevel: 'mild', allergens: ['Gluten', 'Dairy'], mealType: ['Dinner'], popularityScore: 4.5 },
          { name: 'Wagyu Strip Loin', description: '8oz A5 Japanese wagyu with truffle mash', price: 95.00, ingredients: ['wagyu beef', 'truffle', 'potatoes', 'butter'], dietaryType: ['Gluten-Free'], spiceLevel: 'mild', allergens: ['Dairy'], mealType: ['Dinner'], popularityScore: 4.9 },
        ],
      },
      {
        name: 'Desserts',
        description: null,
        items: [
          { name: 'Chocolate Soufflé', description: 'Warm Valrhona chocolate with vanilla cream', price: 18.00, ingredients: ['chocolate', 'eggs', 'cream', 'sugar'], dietaryType: ['Gluten-Free'], spiceLevel: 'none', allergens: ['Dairy', 'Eggs'], mealType: ['Dinner'], popularityScore: 4.7 },
        ],
      },
    ],
  },
  {
    name: 'La Maison',
    address: '100 Europa Dr',
    city: 'Chapel Hill',
    state: 'NC',
    cuisineTypes: ['French', 'Fine Dining', 'European'],
    regionalCuisine: 'French',
    priceRange: '$$$$',
    dietarySupport: ['Gluten-Free', 'Vegan'],
    amenities: ['Valet Parking', 'Full Bar', 'Reservations', 'Wine Cellar'],
    ambience: ['Upscale', 'Romantic', 'Intimate'],
    nearbyLandmarks: ['University Place', 'I-40'],
    gbpHealthScore: 88,
    menuSections: [
      {
        name: 'Entrées',
        description: 'Appetizers',
        items: [
          { name: 'Escargots de Bourgogne', description: 'Burgundy snails with garlic herb butter', price: 16.00, ingredients: ['snails', 'butter', 'garlic', 'parsley'], dietaryType: ['Gluten-Free'], spiceLevel: 'mild', allergens: ['Dairy'], mealType: ['Dinner'], popularityScore: 4.3 },
          { name: 'Salade Niçoise', description: 'Seared tuna, haricots verts, olives', price: 19.00, ingredients: ['tuna', 'green beans', 'olives', 'eggs'], dietaryType: ['Gluten-Free', 'Dairy-Free'], spiceLevel: 'mild', allergens: ['Fish', 'Eggs'], mealType: ['Lunch', 'Dinner'], popularityScore: 4.1 },
        ],
      },
      {
        name: 'Plats Principaux',
        description: 'Main courses',
        items: [
          { name: 'Coq au Vin', description: 'Braised chicken in Burgundy wine', price: 34.00, ingredients: ['chicken', 'red wine', 'mushrooms', 'bacon'], dietaryType: ['Gluten-Free'], spiceLevel: 'mild', allergens: ['Dairy'], mealType: ['Dinner'], popularityScore: 4.6 },
          { name: 'Bouillabaisse', description: 'Traditional Provençal seafood stew', price: 38.00, ingredients: ['fish', 'shellfish', 'saffron', 'fennel'], dietaryType: ['Gluten-Free'], spiceLevel: 'medium', allergens: ['Fish', 'Shellfish'], mealType: ['Dinner'], popularityScore: 4.4 },
        ],
      },
    ],
  },
  {
    name: 'Sakura Omakase',
    address: '3000 Wake Forest Rd',
    city: 'Raleigh',
    state: 'NC',
    cuisineTypes: ['Japanese', 'Fine Dining', 'Sushi'],
    regionalCuisine: 'Japanese',
    priceRange: '$$$$',
    dietarySupport: ['Gluten-Free', 'Vegan', 'Dairy-Free'],
    amenities: ['Reservations', 'Full Bar', 'Private Dining'],
    ambience: ['Upscale', 'Quiet', 'Intimate', 'Minimalist'],
    nearbyLandmarks: ['North Hills', 'I-440'],
    gbpHealthScore: 92,
    menuSections: [
      {
        name: 'Omakase',
        description: 'Chef\'s selection — 12 courses',
        items: [
          { name: 'Sashimi Course', description: 'Chef\'s selection of 5 seasonal fish', price: 45.00, ingredients: ['tuna', 'salmon', 'yellowtail', 'mackerel', 'shrimp'], dietaryType: ['Gluten-Free', 'Dairy-Free'], spiceLevel: 'mild', allergens: ['Fish', 'Shellfish'], mealType: ['Dinner'], popularityScore: 4.9 },
          { name: 'Nigiri Course', description: '8 pieces of chef-selected nigiri', price: 55.00, ingredients: ['rice', 'fish', 'seaweed', 'wasabi'], dietaryType: ['Dairy-Free'], spiceLevel: 'medium', allergens: ['Fish', 'Shellfish', 'Gluten'], mealType: ['Dinner'], popularityScore: 4.8 },
        ],
      },
    ],
  },

  // ── Fast Food (3) ──
  {
    name: 'Burger Republic',
    address: '4325 Glenwood Ave',
    city: 'Raleigh',
    state: 'NC',
    cuisineTypes: ['American', 'Fast Food', 'Burgers'],
    regionalCuisine: 'American',
    priceRange: '$',
    dietarySupport: ['Vegetarian', 'Gluten-Free'],
    amenities: ['Drive-Thru', 'Parking', 'Takeout'],
    ambience: ['Casual', 'Family-Friendly', 'Lively'],
    nearbyLandmarks: ['Crabtree Valley Mall', 'Glenwood South'],
    gbpHealthScore: 65,
    menuSections: [
      {
        name: 'Burgers',
        description: 'Hand-pressed patties',
        items: [
          { name: 'Classic Cheeseburger', description: null, price: 6.99, ingredients: ['beef patty', 'cheese', 'bun', 'lettuce', 'tomato'], dietaryType: [], spiceLevel: 'mild', allergens: ['Gluten', 'Dairy'], mealType: ['Lunch', 'Dinner'], popularityScore: 4.5 },
          { name: 'Bacon Double', description: null, price: 8.99, ingredients: ['beef patty', 'bacon', 'cheese', 'bun'], dietaryType: [], spiceLevel: 'mild', allergens: ['Gluten', 'Dairy'], mealType: ['Lunch', 'Dinner'], popularityScore: 4.3 },
          { name: 'Veggie Burger', description: 'Plant-based patty with all toppings', price: 7.99, ingredients: ['plant patty', 'bun', 'lettuce', 'tomato'], dietaryType: ['Vegetarian'], spiceLevel: 'mild', allergens: ['Gluten'], mealType: ['Lunch', 'Dinner'], popularityScore: 4.0 },
        ],
      },
      {
        name: 'Sides',
        description: null,
        items: [
          { name: 'French Fries', description: null, price: 2.99, ingredients: ['potatoes', 'oil', 'salt'], dietaryType: ['Vegan', 'Gluten-Free'], spiceLevel: 'none', allergens: [], mealType: ['Lunch', 'Dinner'], popularityScore: 4.6 },
          { name: 'Onion Rings', description: null, price: 3.99, ingredients: ['onions', 'batter', 'oil'], dietaryType: ['Vegetarian'], spiceLevel: 'none', allergens: ['Gluten'], mealType: ['Lunch', 'Dinner'], popularityScore: 4.1 },
        ],
      },
    ],
  },
  {
    name: 'Taco Fiesta Express',
    address: '2100 Avent Ferry Rd',
    city: 'Raleigh',
    state: 'NC',
    cuisineTypes: ['Mexican', 'Fast Food', 'Tex-Mex'],
    regionalCuisine: 'Mexican',
    priceRange: '$',
    dietarySupport: ['Vegetarian', 'Vegan', 'Gluten-Free'],
    amenities: ['Drive-Thru', 'Parking', 'Takeout'],
    ambience: ['Casual', 'Lively'],
    nearbyLandmarks: ['NC State University', 'Hillsborough Street'],
    gbpHealthScore: 72,
    menuSections: [
      {
        name: 'Tacos',
        description: 'Choose your filling',
        items: [
          { name: 'Carne Asada Taco', description: null, price: 3.50, ingredients: ['beef', 'corn tortilla', 'cilantro', 'onion'], dietaryType: ['Gluten-Free', 'Dairy-Free'], spiceLevel: 'medium', allergens: [], mealType: ['Lunch', 'Dinner'], popularityScore: 4.4 },
          { name: 'Al Pastor Taco', description: null, price: 3.50, ingredients: ['pork', 'pineapple', 'corn tortilla'], dietaryType: ['Gluten-Free', 'Dairy-Free'], spiceLevel: 'medium', allergens: [], mealType: ['Lunch', 'Dinner'], popularityScore: 4.3 },
          { name: 'Veggie Taco', description: null, price: 3.00, ingredients: ['beans', 'corn tortilla', 'lettuce', 'tomato'], dietaryType: ['Vegan', 'Gluten-Free', 'Dairy-Free'], spiceLevel: 'mild', allergens: [], mealType: ['Lunch', 'Dinner'], popularityScore: 3.9 },
        ],
      },
      {
        name: 'Burritos',
        description: 'Giant flour tortilla',
        items: [
          { name: 'Super Burrito', description: null, price: 8.99, ingredients: ['rice', 'beans', 'meat', 'cheese', 'sour cream'], dietaryType: [], spiceLevel: 'medium', allergens: ['Dairy', 'Gluten'], mealType: ['Lunch', 'Dinner'], popularityScore: 4.5 },
        ],
      },
    ],
  },
  {
    name: 'Pizza Nova',
    address: '6000 Falls of Neuse Rd',
    city: 'Raleigh',
    state: 'NC',
    cuisineTypes: ['Italian', 'Fast Food', 'Pizza'],
    regionalCuisine: 'Italian-American',
    priceRange: '$',
    dietarySupport: ['Vegetarian', 'Vegan', 'Gluten-Free'],
    amenities: ['Delivery', 'Takeout', 'Parking'],
    ambience: ['Casual', 'Family-Friendly'],
    nearbyLandmarks: ['Falls River', 'I-540'],
    gbpHealthScore: 68,
    menuSections: [
      {
        name: 'Pizza',
        description: 'Hand-tossed 12" pizzas',
        items: [
          { name: 'Cheese Pizza', description: null, price: 9.99, ingredients: ['dough', 'cheese', 'sauce'], dietaryType: ['Vegetarian'], spiceLevel: 'none', allergens: ['Gluten', 'Dairy'], mealType: ['Lunch', 'Dinner'], popularityScore: 4.5 },
          { name: 'Pepperoni Pizza', description: null, price: 11.99, ingredients: ['dough', 'cheese', 'sauce', 'pepperoni'], dietaryType: [], spiceLevel: 'mild', allergens: ['Gluten', 'Dairy'], mealType: ['Lunch', 'Dinner'], popularityScore: 4.7 },
          { name: 'Veggie Pizza', description: null, price: 10.99, ingredients: ['dough', 'cheese', 'sauce', 'peppers', 'onions', 'mushrooms'], dietaryType: ['Vegetarian'], spiceLevel: 'mild', allergens: ['Gluten', 'Dairy'], mealType: ['Lunch', 'Dinner'], popularityScore: 4.1 },
        ],
      },
      {
        name: 'Wings',
        description: null,
        items: [
          { name: 'Buffalo Wings', description: null, price: 8.99, ingredients: ['chicken wings', 'buffalo sauce'], dietaryType: ['Gluten-Free'], spiceLevel: 'hot', allergens: [], mealType: ['Dinner'], popularityScore: 4.3 },
        ],
      },
    ],
  },

  // ── Café/Bakery (3) ──
  {
    name: 'Morning Light Café',
    address: '200 Park Dr',
    city: 'Cary',
    state: 'NC',
    cuisineTypes: ['Café', 'Bakery', 'Breakfast'],
    regionalCuisine: 'American',
    priceRange: '$',
    dietarySupport: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free'],
    amenities: ['Outdoor Seating', 'Free WiFi', 'Parking'],
    ambience: ['Cozy', 'Quiet', 'Casual'],
    nearbyLandmarks: ['Cary Towne Center', 'I-40'],
    gbpHealthScore: 80,
    menuSections: [
      {
        name: 'Coffee & Drinks',
        description: 'Artisan beverages',
        items: [
          { name: 'Latte', description: 'Espresso with steamed oat milk', price: 5.50, ingredients: ['espresso', 'oat milk'], dietaryType: ['Vegan', 'Dairy-Free'], spiceLevel: 'none', allergens: [], mealType: ['Breakfast', 'Lunch'], popularityScore: 4.6 },
          { name: 'Cold Brew', description: '24-hour steeped cold brew coffee', price: 4.50, ingredients: ['coffee', 'water'], dietaryType: ['Vegan', 'Gluten-Free', 'Dairy-Free'], spiceLevel: 'none', allergens: [], mealType: ['Breakfast', 'Lunch'], popularityScore: 4.4 },
          { name: 'Matcha Latte', description: 'Ceremonial grade matcha with oat milk', price: 6.00, ingredients: ['matcha', 'oat milk'], dietaryType: ['Vegan', 'Dairy-Free'], spiceLevel: 'none', allergens: [], mealType: ['Breakfast', 'Lunch'], popularityScore: 4.3 },
        ],
      },
      {
        name: 'Pastries',
        description: 'Baked fresh daily',
        items: [
          { name: 'Croissant', description: 'Buttery, flaky French croissant', price: 3.50, ingredients: ['flour', 'butter', 'yeast', 'sugar'], dietaryType: ['Vegetarian'], spiceLevel: 'none', allergens: ['Gluten', 'Dairy'], mealType: ['Breakfast'], popularityScore: 4.7 },
          { name: 'Blueberry Muffin', description: null, price: 3.00, ingredients: ['flour', 'blueberries', 'sugar', 'eggs'], dietaryType: ['Vegetarian'], spiceLevel: 'none', allergens: ['Gluten', 'Eggs'], mealType: ['Breakfast'], popularityScore: 4.2 },
          { name: 'Avocado Toast', description: 'Sourdough with smashed avocado and chili flakes', price: 8.00, ingredients: ['sourdough', 'avocado', 'chili', 'lemon'], dietaryType: ['Vegan', 'Dairy-Free'], spiceLevel: 'medium', allergens: ['Gluten'], mealType: ['Breakfast', 'Lunch'], popularityScore: 4.5 },
        ],
      },
    ],
  },
  {
    name: 'Sweet Bean Bakery',
    address: '300 Fayetteville St',
    city: 'Raleigh',
    state: 'NC',
    cuisineTypes: ['Bakery', 'Café', 'Desserts'],
    regionalCuisine: 'French',
    priceRange: '$$',
    dietarySupport: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Nut-Free'],
    amenities: ['Outdoor Seating', 'Free WiFi', 'Parking'],
    ambience: ['Cozy', 'Charming', 'Casual'],
    nearbyLandmarks: ['City Market', 'Moore Square'],
    gbpHealthScore: 85,
    menuSections: [
      {
        name: 'Cakes',
        description: 'Whole cakes by the slice',
        items: [
          { name: 'Chocolate Layer Cake', description: 'Rich dark chocolate with ganache', price: 7.00, ingredients: ['flour', 'chocolate', 'butter', 'sugar', 'eggs'], dietaryType: ['Vegetarian'], spiceLevel: 'none', allergens: ['Gluten', 'Dairy', 'Eggs'], mealType: ['Breakfast', 'Lunch'], popularityScore: 4.8 },
          { name: 'Vegan Carrot Cake', description: 'Dairy-free carrot cake with cashew frosting', price: 7.50, ingredients: ['flour', 'carrots', 'cashews', 'coconut oil'], dietaryType: ['Vegan', 'Dairy-Free', 'Nut-Free'], spiceLevel: 'none', allergens: ['Gluten', 'Nuts'], mealType: ['Breakfast', 'Lunch'], popularityScore: 4.5 },
          { name: 'Gluten-Free Lemon Tart', description: 'Almond flour crust with lemon curd', price: 8.00, ingredients: ['almond flour', 'lemon', 'eggs', 'sugar'], dietaryType: ['Gluten-Free', 'Vegetarian'], spiceLevel: 'none', allergens: ['Nuts', 'Eggs'], mealType: ['Breakfast', 'Lunch'], popularityScore: 4.3 },
        ],
      },
      {
        name: 'Cookies',
        description: 'Fresh-baked daily',
        items: [
          { name: 'Chocolate Chip Cookie', description: null, price: 2.50, ingredients: ['flour', 'chocolate chips', 'butter', 'sugar'], dietaryType: ['Vegetarian'], spiceLevel: 'none', allergens: ['Gluten', 'Dairy'], mealType: ['Breakfast', 'Lunch'], popularityScore: 4.6 },
        ],
      },
    ],
  },
  {
    name: 'Brew & Bean',
    address: '100 E Franklin St',
    city: 'Chapel Hill',
    state: 'NC',
    cuisineTypes: ['Café', 'Coffee Shop', 'Light Fare'],
    regionalCuisine: 'American',
    priceRange: '$',
    dietarySupport: ['Vegetarian', 'Vegan', 'Gluten-Free'],
    amenities: ['Free WiFi', 'Outdoor Seating', 'Study Area'],
    ambience: ['Cozy', 'Casual', 'Studious'],
    nearbyLandmarks: ['UNC Campus', 'Franklin Street'],
    gbpHealthScore: 78,
    menuSections: [
      {
        name: 'Coffee',
        description: 'Locally roasted',
        items: [
          { name: 'Drip Coffee', description: null, price: 2.50, ingredients: ['coffee', 'water'], dietaryType: ['Vegan', 'Gluten-Free', 'Dairy-Free'], spiceLevel: 'none', allergens: [], mealType: ['Breakfast', 'Lunch'], popularityScore: 4.3 },
          { name: 'Cappuccino', description: null, price: 4.50, ingredients: ['espresso', 'milk'], dietaryType: ['Vegetarian'], spiceLevel: 'none', allergens: ['Dairy'], mealType: ['Breakfast', 'Lunch'], popularityScore: 4.4 },
        ],
      },
      {
        name: 'Light Bites',
        description: null,
        items: [
          { name: 'Bagel with Cream Cheese', description: null, price: 4.00, ingredients: ['bagel', 'cream cheese'], dietaryType: ['Vegetarian'], spiceLevel: 'none', allergens: ['Gluten', 'Dairy'], mealType: ['Breakfast', 'Lunch'], popularityScore: 4.0 },
          { name: 'Granola Bowl', description: 'House-made granola with yogurt and berries', price: 7.00, ingredients: ['granola', 'yogurt', 'berries', 'honey'], dietaryType: ['Vegetarian'], spiceLevel: 'none', allergens: ['Gluten', 'Dairy', 'Nuts'], mealType: ['Breakfast'], popularityScore: 4.2 },
        ],
      },
    ],
  },

  // ── Cloud Kitchen (2) ──
  {
    name: 'Wok Star (Cloud Kitchen)',
    address: '4500 Industrial Dr',
    city: 'Raleigh',
    state: 'NC',
    cuisineTypes: ['Chinese', 'Asian', 'Cloud Kitchen'],
    regionalCuisine: 'Chinese',
    priceRange: '$$',
    dietarySupport: ['Vegetarian', 'Gluten-Free'],
    amenities: ['Delivery Only', 'Takeout'],
    ambience: ['None'],
    nearbyLandmarks: ['I-40', 'RTP'],
    gbpHealthScore: 60,
    menuSections: [
      {
        name: 'Noodles & Rice',
        description: null,
        items: [
          { name: 'Kung Pao Chicken', description: 'Spicy stir-fried chicken with peanuts', price: 12.99, ingredients: ['chicken', 'peanuts', 'chili', 'soy sauce'], dietaryType: ['Dairy-Free'], spiceLevel: 'hot', allergens: ['Peanuts', 'Soy'], mealType: ['Lunch', 'Dinner'], popularityScore: 4.5 },
          { name: 'Vegetable Lo Mein', description: null, price: 10.99, ingredients: ['noodles', 'vegetables', 'soy sauce'], dietaryType: ['Vegetarian', 'Dairy-Free'], spiceLevel: 'medium', allergens: ['Gluten', 'Soy'], mealType: ['Lunch', 'Dinner'], popularityScore: 4.1 },
          { name: 'Fried Rice', description: null, price: 9.99, ingredients: ['rice', 'eggs', 'vegetables', 'soy sauce'], dietaryType: ['Vegetarian', 'Dairy-Free'], spiceLevel: 'mild', allergens: ['Eggs', 'Soy'], mealType: ['Lunch', 'Dinner'], popularityScore: 4.3 },
        ],
      },
    ],
  },
  {
    name: 'FitFuel Kitchen',
    address: '2000 Perimeter Park Dr',
    city: 'Morrisville',
    state: 'NC',
    cuisineTypes: ['Health Food', 'Cloud Kitchen', 'Meal Prep'],
    regionalCuisine: 'American',
    priceRange: '$$',
    dietarySupport: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Paleo'],
    amenities: ['Delivery Only'],
    ambience: ['None'],
    nearbyLandmarks: ['RTP', 'I-540'],
    gbpHealthScore: 55,
    menuSections: [
      {
        name: 'Protein Bowls',
        description: 'Macro-balanced meals',
        items: [
          { name: 'Grilled Chicken Bowl', description: 'Herb-marinated chicken with quinoa and roasted vegetables', price: 13.99, ingredients: ['chicken', 'quinoa', 'broccoli', 'sweet potato'], dietaryType: ['Gluten-Free', 'Dairy-Free'], spiceLevel: 'mild', allergens: [], mealType: ['Lunch', 'Dinner'], popularityScore: 4.4 },
          { name: 'Vegan Buddha Bowl', description: 'Tofu, brown rice, kale, tahini dressing', price: 12.99, ingredients: ['tofu', 'brown rice', 'kale', 'tahini'], dietaryType: ['Vegan', 'Gluten-Free', 'Dairy-Free'], spiceLevel: 'mild', allergens: ['Soy', 'Sesame'], mealType: ['Lunch', 'Dinner'], popularityScore: 4.2 },
          { name: 'Keto Steak Bowl', description: 'Grass-fed steak with cauliflower rice and avocado', price: 15.99, ingredients: ['steak', 'cauliflower', 'avocado', 'olive oil'], dietaryType: ['Gluten-Free', 'Dairy-Free', 'Keto'], spiceLevel: 'medium', allergens: [], mealType: ['Lunch', 'Dinner'], popularityScore: 4.6 },
        ],
      },
    ],
  },
];

async function seed() {
  console.log('Seeding validation restaurants...\n');

  for (const seed of seeds) {
    const existing = await prisma.restaurant.findFirst({ where: { name: seed.name } });
    if (existing) {
      console.log(`  SKIP: ${seed.name} (already exists)`);
      continue;
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        name: seed.name,
        address: seed.address,
        city: seed.city,
        state: seed.state,
        cuisineTypes: JSON.stringify(seed.cuisineTypes),
        regionalCuisine: seed.regionalCuisine,
        priceRange: seed.priceRange,
        dietarySupport: JSON.stringify(seed.dietarySupport),
        amenities: JSON.stringify(seed.amenities),
        ambience: JSON.stringify(seed.ambience),
        nearbyLandmarks: JSON.stringify(seed.nearbyLandmarks),
        gbpHealthScore: seed.gbpHealthScore,
        discoverabilityScore: 50,
        aiVisibilityScore: 50,
        localSearchScore: 50,
        menuDiscoverabilityScore: 50,
        conversationalSearchScore: 50,
        dishRetrievalScore: 50,
        restaurantClarityScore: 50,
        retrievalValidationScore: 50,
        competitiveVisibilityScore: 30,
        optimizationCompleteness: 50,
        retrievalConfidence: 40,
      },
    });

    for (let si = 0; si < seed.menuSections.length; si++) {
      const section = seed.menuSections[si];
      const createdSection = await prisma.menuSection.create({
        data: {
          restaurantId: restaurant.id,
          name: section.name,
          description: section.description,
          order: si,
        },
      });

      for (const item of section.items) {
        await prisma.menuItem.create({
          data: {
            restaurantId: restaurant.id,
            sectionId: createdSection.id,
            name: item.name,
            description: item.description,
            price: item.price,
            ingredients: JSON.stringify(item.ingredients),
            dietaryType: JSON.stringify(item.dietaryType),
            spiceLevel: item.spiceLevel,
            allergens: JSON.stringify(item.allergens),
            mealType: JSON.stringify(item.mealType),
            popularityScore: item.popularityScore,
          },
        });
      }
    }

    console.log(`  CREATED: ${seed.name} (${seed.cuisineTypes[0]}) — ${seed.menuSections.length} sections`);
  }

  const total = await prisma.restaurant.count();
  console.log(`\nTotal restaurants: ${total}`);
  await prisma.$disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
