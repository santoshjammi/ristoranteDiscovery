// Seed script: Add review analyses to all restaurants for Review Intelligence validation
// Run: npx tsx src/seed-review-validation.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ReviewSeed {
  overallSentiment: number;
  sentimentSummary: string;
  popularDishes: Array<{ dishName: string; sentiment: string; mentions: number }>;
  ambienceTags: string[];
  serviceInsights: string;
  topicClusters: Array<{ topic: string; summary: string }>;
  complaints: string[];
  audienceProfile: Record<string, string>;
}

const reviewSeeds: Record<string, ReviewSeed[]> = {
  // ── Seafood ──
  'The Crab Shack': [
    { overallSentiment: 0.75, sentimentSummary: 'Customers love the fresh seafood and generous portions. The crab cakes are a standout. Some complaints about wait times on weekends.', popularDishes: [{ dishName: 'Crab Cakes', sentiment: 'Positive', mentions: 12 }, { dishName: 'Grilled Salmon', sentiment: 'Positive', mentions: 8 }, { dishName: 'Lobster Roll', sentiment: 'Positive', mentions: 6 }], ambienceTags: ['casual', 'family-friendly', 'lively'], serviceInsights: 'Friendly staff but sometimes slow during peak hours.', topicClusters: [{ topic: 'Food Quality', summary: 'Fresh seafood consistently praised.' }, { topic: 'Wait Times', summary: 'Weekend waits can exceed 30 minutes.' }], complaints: ['Long wait times on weekends', 'Parking can be difficult'], audienceProfile: { families: '40%', couples: '30%', business: '10%', solo: '20%' } },
    { overallSentiment: 0.80, sentimentSummary: 'Another great experience. The salmon was perfectly cooked. Slightly noisy but worth it.', popularDishes: [{ dishName: 'Grilled Salmon', sentiment: 'Positive', mentions: 10 }, { dishName: 'Crab Cakes', sentiment: 'Positive', mentions: 7 }], ambienceTags: ['casual', 'lively'], serviceInsights: 'Service has improved since last visit.', topicClusters: [{ topic: 'Food Quality', summary: 'Consistently good seafood.' }], complaints: ['Noise level can be high'], audienceProfile: { families: '35%', couples: '35%', business: '15%', solo: '15%' } },
  ],
  'Ocean Blue Grill': [
    { overallSentiment: 0.90, sentimentSummary: 'Exceptional fine dining experience. The sea bass is outstanding. Impeccable service. Worth every penny.', popularDishes: [{ dishName: 'Pan-Seared Sea Bass', sentiment: 'Positive', mentions: 15 }, { dishName: 'Tuna Tartare', sentiment: 'Positive', mentions: 9 }], ambienceTags: ['upscale', 'romantic', 'quiet', 'elegant'], serviceInsights: 'Attentive and knowledgeable staff. Excellent wine pairings.', topicClusters: [{ topic: 'Food Quality', summary: 'Exceptional preparation and presentation.' }, { topic: 'Service', summary: 'Impeccable, professional service.' }], complaints: ['Reservations hard to get', 'Very expensive'], audienceProfile: { families: '10%', couples: '60%', business: '20%', solo: '10%' } },
  ],
  'Bayou Boil House': [
    { overallSentiment: 0.60, sentimentSummary: 'Fun, casual spot for crawfish boils. The spice level is authentic. Service can be slow when busy.', popularDishes: [{ dishName: 'Crawfish Boil', sentiment: 'Positive', mentions: 11 }, { dishName: 'Shrimp Boil', sentiment: 'Positive', mentions: 5 }], ambienceTags: ['lively', 'casual'], serviceInsights: 'Friendly but can be slow during rush.', topicClusters: [{ topic: 'Food Quality', summary: 'Authentic Cajun flavors.' }, { topic: 'Service Speed', summary: 'Slow during peak hours.' }], complaints: ['Slow service', 'Noisy'], audienceProfile: { families: '30%', couples: '25%', business: '5%', solo: '40%' } },
  ],

  // ── Fine Dining ──
  'The Oak Room': [
    { overallSentiment: 0.92, sentimentSummary: 'A truly memorable dining experience. The wagyu is exceptional. Every course is thoughtfully prepared. Perfect for special occasions.', popularDishes: [{ dishName: 'Wagyu Strip Loin', sentiment: 'Positive', mentions: 18 }, { dishName: 'Chocolate Soufflé', sentiment: 'Positive', mentions: 12 }], ambienceTags: ['upscale', 'romantic', 'quiet', 'elegant'], serviceInsights: 'World-class service. Attentive without being intrusive.', topicClusters: [{ topic: 'Food Quality', summary: 'Exceptional ingredients and preparation.' }, { topic: 'Service', summary: 'Impeccable, professional.' }], complaints: ['Extremely expensive', 'Hard to get reservation'], audienceProfile: { families: '5%', couples: '55%', business: '30%', solo: '10%' } },
  ],
  'La Maison': [
    { overallSentiment: 0.88, sentimentSummary: 'Beautiful French cuisine in an intimate setting. The coq au vin is fantastic. Excellent wine list.', popularDishes: [{ dishName: 'Coq au Vin', sentiment: 'Positive', mentions: 10 }, { dishName: 'Bouillabaisse', sentiment: 'Positive', mentions: 7 }], ambienceTags: ['upscale', 'romantic', 'intimate'], serviceInsights: 'Professional French service style.', topicClusters: [{ topic: 'Food Quality', summary: 'Authentic French cuisine.' }, { topic: 'Ambiance', summary: 'Romantic and intimate.' }], complaints: ['Small portions for the price'], audienceProfile: { families: '10%', couples: '50%', business: '25%', solo: '15%' } },
  ],
  'Sakura Omakase': [
    { overallSentiment: 0.95, sentimentSummary: 'The best sushi in the Triangle. The omakase experience is incredible. Each piece is a work of art.', popularDishes: [{ dishName: 'Sashimi Course', sentiment: 'Positive', mentions: 20 }, { dishName: 'Nigiri Course', sentiment: 'Positive', mentions: 16 }], ambienceTags: ['upscale', 'quiet', 'intimate', 'minimalist'], serviceInsights: 'Chef explains each course. Very personalized.', topicClusters: [{ topic: 'Food Quality', summary: 'Exceptional quality and presentation.' }, { topic: 'Experience', summary: 'A true culinary journey.' }], complaints: ['Very expensive', 'Limited seating'], audienceProfile: { families: '5%', couples: '45%', business: '35%', solo: '15%' } },
  ],

  // ── Fast Food ──
  'Burger Republic': [
    { overallSentiment: 0.55, sentimentSummary: 'Decent burgers for the price. The classic cheeseburger is reliable. Sometimes the fries are cold.', popularDishes: [{ dishName: 'Classic Cheeseburger', sentiment: 'Positive', mentions: 15 }, { dishName: 'Bacon Double', sentiment: 'Positive', mentions: 8 }], ambienceTags: ['casual', 'family-friendly'], serviceInsights: 'Fast but sometimes forgets special requests.', topicClusters: [{ topic: 'Food Quality', summary: 'Consistent quality for fast food.' }, { topic: 'Service', summary: 'Quick but occasionally inaccurate.' }], complaints: ['Cold fries sometimes', 'Order accuracy issues'], audienceProfile: { families: '45%', couples: '20%', business: '15%', solo: '20%' } },
    { overallSentiment: 0.50, sentimentSummary: 'Hit or miss. Sometimes great, sometimes disappointing. The veggie burger is decent.', popularDishes: [{ dishName: 'Veggie Burger', sentiment: 'Neutral', mentions: 5 }], ambienceTags: ['casual'], serviceInsights: 'Inconsistent service quality.', topicClusters: [{ topic: 'Consistency', summary: 'Quality varies between visits.' }], complaints: ['Inconsistent quality', 'Long drive-thru lines'], audienceProfile: { families: '40%', couples: '25%', business: '10%', solo: '25%' } },
  ],
  'Taco Fiesta Express': [
    { overallSentiment: 0.65, sentimentSummary: 'Great value tacos. The al pastor is fantastic. Quick service. Can get crowded at lunch.', popularDishes: [{ dishName: 'Al Pastor Taco', sentiment: 'Positive', mentions: 14 }, { dishName: 'Carne Asada Taco', sentiment: 'Positive', mentions: 10 }], ambienceTags: ['casual', 'lively'], serviceInsights: 'Fast counter service.', topicClusters: [{ topic: 'Value', summary: 'Great food for the price.' }, { topic: 'Food Quality', summary: 'Fresh and flavorful.' }], complaints: ['Limited seating', 'Can be crowded'], audienceProfile: { families: '25%', couples: '20%', business: '30%', solo: '25%' } },
  ],
  'Pizza Nova': [
    { overallSentiment: 0.45, sentimentSummary: 'Average pizza. The pepperoni is decent but nothing special. Delivery is reliable but slow.', popularDishes: [{ dishName: 'Pepperoni Pizza', sentiment: 'Neutral', mentions: 20 }, { dishName: 'Cheese Pizza', sentiment: 'Neutral', mentions: 12 }], ambienceTags: ['casual'], serviceInsights: 'Delivery drivers are friendly but often late.', topicClusters: [{ topic: 'Food Quality', summary: 'Average pizza, nothing special.' }, { topic: 'Delivery', summary: 'Reliable but slow.' }], complaints: ['Delivery takes too long', 'Pizza is sometimes undercooked'], audienceProfile: { families: '50%', couples: '15%', business: '5%', solo: '30%' } },
    { overallSentiment: 0.40, sentimentSummary: 'Disappointing lately. Quality has gone down. The wings are good but the pizza is hit or miss.', popularDishes: [{ dishName: 'Buffalo Wings', sentiment: 'Positive', mentions: 6 }], ambienceTags: ['casual'], serviceInsights: 'Inconsistent quality.', topicClusters: [{ topic: 'Quality Decline', summary: 'Regulars notice a decline.' }], complaints: ['Quality has declined', 'Delivery times are worse'], audienceProfile: { families: '45%', couples: '20%', business: '5%', solo: '30%' } },
  ],

  // ── Café/Bakery ──
  'Morning Light Café': [
    { overallSentiment: 0.85, sentimentSummary: 'Charming café with excellent coffee and pastries. The croissants are perfectly flaky. Great place to work.', popularDishes: [{ dishName: 'Croissant', sentiment: 'Positive', mentions: 14 }, { dishName: 'Latte', sentiment: 'Positive', mentions: 12 }, { dishName: 'Avocado Toast', sentiment: 'Positive', mentions: 8 }], ambienceTags: ['cozy', 'quiet', 'casual'], serviceInsights: 'Friendly baristas who remember regulars.', topicClusters: [{ topic: 'Coffee Quality', summary: 'Excellent espresso drinks.' }, { topic: 'Pastries', summary: 'Freshly baked daily.' }], complaints: ['Limited parking', 'Gets crowded on weekends'], audienceProfile: { families: '15%', couples: '25%', business: '20%', solo: '40%' } },
  ],
  'Sweet Bean Bakery': [
    { overallSentiment: 0.82, sentimentSummary: 'Beautiful cakes and pastries. The chocolate layer cake is divine. Vegan options are surprisingly good.', popularDishes: [{ dishName: 'Chocolate Layer Cake', sentiment: 'Positive', mentions: 16 }, { dishName: 'Vegan Carrot Cake', sentiment: 'Positive', mentions: 9 }], ambienceTags: ['cozy', 'charming', 'casual'], serviceInsights: 'Helpful staff who know the products.', topicClusters: [{ topic: 'Cakes', summary: 'Beautiful and delicious cakes.' }, { topic: 'Dietary Options', summary: 'Good vegan and GF options.' }], complaints: ['Expensive for the portion size'], audienceProfile: { families: '20%', couples: '30%', business: '10%', solo: '40%' } },
  ],
  'Brew & Bean': [
    { overallSentiment: 0.70, sentimentSummary: 'Solid coffee shop near campus. Good study spot. Coffee is decent but not exceptional. Bagels are fresh.', popularDishes: [{ dishName: 'Drip Coffee', sentiment: 'Neutral', mentions: 20 }, { dishName: 'Bagel with Cream Cheese', sentiment: 'Positive', mentions: 8 }], ambienceTags: ['cozy', 'casual', 'studious'], serviceInsights: 'Quick service, good for studying.', topicClusters: [{ topic: 'Study Environment', summary: 'Great place to work or study.' }, { topic: 'Coffee', summary: 'Decent but not exceptional.' }], complaints: ['Limited food options', 'Outlets can be hard to find'], audienceProfile: { families: '5%', couples: '15%', business: '10%', solo: '70%' } },
  ],

  // ── Cloud Kitchen ──
  'Wok Star (Cloud Kitchen)': [
    { overallSentiment: 0.55, sentimentSummary: 'Decent Chinese delivery. The kung pao chicken has good flavor. Portions are reasonable. Delivery times vary.', popularDishes: [{ dishName: 'Kung Pao Chicken', sentiment: 'Positive', mentions: 10 }, { dishName: 'Fried Rice', sentiment: 'Neutral', mentions: 8 }], ambienceTags: ['none'], serviceInsights: 'Delivery only, no dine-in.', topicClusters: [{ topic: 'Food Quality', summary: 'Decent Chinese food.' }, { topic: 'Delivery', summary: 'Delivery times are inconsistent.' }], complaints: ['Delivery times vary widely', 'Sometimes cold upon arrival'], audienceProfile: { families: '20%', couples: '20%', business: '30%', solo: '30%' } },
    { overallSentiment: 0.50, sentimentSummary: 'Hit or miss. Some orders are great, others are disappointing. The vegetable lo mein is reliable.', popularDishes: [{ dishName: 'Vegetable Lo Mein', sentiment: 'Neutral', mentions: 6 }], ambienceTags: ['none'], serviceInsights: 'No customer service issues.', topicClusters: [{ topic: 'Consistency', summary: 'Quality varies between orders.' }], complaints: ['Inconsistent quality', 'Late deliveries'], audienceProfile: { families: '15%', couples: '25%', business: '25%', solo: '35%' } },
  ],
  'FitFuel Kitchen': [
    { overallSentiment: 0.78, sentimentSummary: 'Great healthy meal prep option. The keto bowl is excellent. Portions are generous for the price. Delivery is reliable.', popularDishes: [{ dishName: 'Keto Steak Bowl', sentiment: 'Positive', mentions: 12 }, { dishName: 'Grilled Chicken Bowl', sentiment: 'Positive', mentions: 9 }], ambienceTags: ['none'], serviceInsights: 'Reliable delivery, good packaging.', topicClusters: [{ topic: 'Food Quality', summary: 'Fresh, healthy, and tasty.' }, { topic: 'Value', summary: 'Good value for healthy meals.' }], complaints: ['Limited menu variety', 'No customization options'], audienceProfile: { families: '10%', couples: '20%', business: '40%', solo: '30%' } },
  ],

  // ── Indian (seed) ──
  'Anand Bhavan': [
    { overallSentiment: 0.82, sentimentSummary: 'Excellent South Indian vegetarian food. The masala dosa is authentic and delicious. Clean restaurant, friendly service.', popularDishes: [{ dishName: 'Masala Dosa', sentiment: 'Positive', mentions: 20 }, { dishName: 'Idli Sambar', sentiment: 'Positive', mentions: 15 }, { dishName: 'Vada', sentiment: 'Positive', mentions: 8 }], ambienceTags: ['casual', 'family-friendly', 'clean'], serviceInsights: 'Friendly staff, quick service during lunch.', topicClusters: [{ topic: 'Food Authenticity', summary: 'Authentic South Indian flavors.' }, { topic: 'Value', summary: 'Great value for the quality.' }], complaints: ['Weekend wait times', 'Limited parking'], audienceProfile: { families: '50%', couples: '20%', business: '15%', solo: '15%' } },
  ],
  'Tandoori Flame': [
    { overallSentiment: 0.78, sentimentSummary: 'Great North Indian food. The butter chicken is fantastic. Tandoori items are well-prepared. Good for groups.', popularDishes: [{ dishName: 'Butter Chicken', sentiment: 'Positive', mentions: 18 }, { dishName: 'Garlic Naan', sentiment: 'Positive', mentions: 14 }, { dishName: 'Dal Makhani', sentiment: 'Positive', mentions: 10 }], ambienceTags: ['casual', 'family-friendly', 'lively'], serviceInsights: 'Attentive staff, good for large parties.', topicClusters: [{ topic: 'Food Quality', summary: 'Consistently good North Indian.' }, { topic: 'Service', summary: 'Good service for groups.' }], complaints: ['Can be noisy', 'Spice levels inconsistent'], audienceProfile: { families: '40%', couples: '25%', business: '20%', solo: '15%' } },
  ],
  'Dharani': [
    { overallSentiment: 0.80, sentimentSummary: 'Excellent Andhra cuisine. The spice level is authentic. Ghee roast dosa is a must-try. Vegetarian paradise.', popularDishes: [{ dishName: 'Ghee Roast Dosa', sentiment: 'Positive', mentions: 16 }, { dishName: 'Andhra Meal', sentiment: 'Positive', mentions: 12 }], ambienceTags: ['casual', 'family-friendly'], serviceInsights: 'Efficient service, especially during lunch buffet.', topicClusters: [{ topic: 'Food Authenticity', summary: 'Authentic Andhra flavors.' }, { topic: 'Value', summary: 'Great lunch buffet value.' }], complaints: ['Very spicy for some', 'Limited dessert options'], audienceProfile: { families: '45%', couples: '20%', business: '20%', solo: '15%' } },
  ],
  'Biryani Maxx': [
    { overallSentiment: 0.88, sentimentSummary: 'Customers highly praise the authenticity of the Hyderabadi Biryani. The chicken 65 is a crowd favorite. Generous portions and reasonable prices.', popularDishes: [{ dishName: 'Hyderabadi Chicken Biryani', sentiment: 'Positive', mentions: 25 }, { dishName: 'Chicken 65', sentiment: 'Positive', mentions: 12 }], ambienceTags: ['casual', 'family-friendly'], serviceInsights: 'Friendly staff, quick service.', topicClusters: [{ topic: 'Biryani Quality', summary: 'Best Hyderabadi biryani in the area.' }, { topic: 'Value', summary: 'Great portions for the price.' }], complaints: ['Can get crowded', 'Parking is tight'], audienceProfile: { families: '35%', couples: '30%', business: '15%', solo: '20%' } },
  ],
  'Grrove 9': [
    { overallSentiment: 0.72, sentimentSummary: 'Good Indian food with generous portions. The biryani is solid. Service is friendly but can be slow during peak hours.', popularDishes: [{ dishName: 'Biryani', sentiment: 'Positive', mentions: 8 }, { dishName: 'Curries', sentiment: 'Positive', mentions: 6 }], ambienceTags: ['casual'], serviceInsights: 'Friendly but sometimes slow.', topicClusters: [{ topic: 'Food Quality', summary: 'Solid Indian food.' }, { topic: 'Service', summary: 'Can be slow during peak.' }], complaints: ['Slow service during dinner rush'], audienceProfile: { families: '30%', couples: '25%', business: '20%', solo: '25%' } },
  ],
  'Urban Turban Indian Grill and Bar': [
    { overallSentiment: 0.75, sentimentSummary: 'Great fusion Indian food with a full bar. The biryani is excellent. Good atmosphere for a night out.', popularDishes: [{ dishName: 'Biryani', sentiment: 'Positive', mentions: 10 }, { dishName: 'Curries', sentiment: 'Positive', mentions: 7 }], ambienceTags: ['lively', 'casual', 'bar'], serviceInsights: 'Good service, full bar available.', topicClusters: [{ topic: 'Food Quality', summary: 'Good fusion Indian.' }, { topic: 'Atmosphere', summary: 'Great for a night out.' }], complaints: ['Can be loud', 'Prices on the higher side'], audienceProfile: { families: '20%', couples: '35%', business: '25%', solo: '20%' } },
  ],
  'Dwarakamaayee': [
    { overallSentiment: 0.70, sentimentSummary: 'Decent Indian food. The biryani is good but not exceptional. Service is friendly. Good for a quick lunch.', popularDishes: [{ dishName: 'Biryani', sentiment: 'Neutral', mentions: 7 }, { dishName: 'Curries', sentiment: 'Positive', mentions: 5 }], ambienceTags: ['casual'], serviceInsights: 'Friendly, quick lunch service.', topicClusters: [{ topic: 'Food Quality', summary: 'Decent Indian food.' }, { topic: 'Value', summary: 'Good lunch specials.' }], complaints: ['Nothing special', 'Limited menu variety'], audienceProfile: { families: '25%', couples: '20%', business: '30%', solo: '25%' } },
  ],
};

async function seed() {
  console.log('Seeding review analyses...\n');

  const restaurants = await prisma.restaurant.findMany();
  let total = 0;

  for (const restaurant of restaurants) {
    const seeds = reviewSeeds[restaurant.name];
    if (!seeds) {
      console.log(`  SKIP: ${restaurant.name} (no review seed data)`);
      continue;
    }

    for (const seed of seeds) {
      await prisma.reviewAnalysis.create({
        data: {
          restaurantId: restaurant.id,
          overallSentiment: seed.overallSentiment,
          sentimentSummary: seed.sentimentSummary,
          popularDishes: JSON.stringify(seed.popularDishes),
          ambienceTags: JSON.stringify(seed.ambienceTags),
          serviceInsights: seed.serviceInsights,
          topicClusters: JSON.stringify(seed.topicClusters),
          complaints: JSON.stringify(seed.complaints),
          audienceProfile: JSON.stringify(seed.audienceProfile),
        },
      });
      total++;
    }

    console.log(`  SEEDED: ${restaurant.name} (${seeds.length} analyses)`);
  }

  const totalAnalyses = await prisma.reviewAnalysis.count();
  console.log(`\nTotal review analyses: ${totalAnalyses}`);
  await prisma.$disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
