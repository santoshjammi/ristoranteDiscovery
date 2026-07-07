import prisma from './config/db';
import { vectorService } from './services/vector.service';
import { seoOptimizerService } from './services/seo-optimizer.service';
import { searchController } from './controllers/search.controller';

async function runAdvancedValidation() {
  console.log('🧪 Starting RDI Advanced Phases 2, 3 & 4 Verification...\n');

  // Find or create test restaurant
  console.log('🏢 [Phase 3] Seeding restaurant: "Osteria Al Colosseo"');
  
  // Clean first
  await prisma.restaurant.deleteMany({
    where: { name: "Osteria Al Colosseo" }
  });

  const restaurant = await prisma.restaurant.create({
    data: {
      name: "Osteria Al Colosseo",
      address: "Piazza del Colosseo 1",
      city: "Rome",
      phone: "+39 06 777 5555",
      website: "https://osterialcolosseo.example.com",
      cuisineTypes: JSON.stringify(["Italian", "Roman"]),
      priceRange: "$$",
      dietarySupport: JSON.stringify(["Vegetarian", "Gluten-Free Pasta"]),
      amenities: JSON.stringify(["Outdoor Seating", "Colosseum View"]),
      ambience: JSON.stringify(["Cozy", "Lively"]),
      timings: JSON.stringify({ Monday: "12:00 PM - 11:00 PM" })
    }
  });

  console.log(`✅ Seeded restaurant with ID: ${restaurant.id}`);

  // Create section and menu items
  const section = await prisma.menuSection.create({
    data: {
      restaurantId: restaurant.id,
      name: "Pasta Specialties",
      order: 0
    }
  });

  await prisma.menuItem.create({
    data: {
      restaurantId: restaurant.id,
      sectionId: section.id,
      name: "Truffle Porcini Fettuccine",
      description: "House-made fettuccine ribbon pasta in cream porcini mushroom sauce with black truffle curls.",
      price: 21.00,
      ingredients: JSON.stringify(["Fettuccine", "Porcini Mushrooms", "Black Truffle", "Parmesan"]),
      dietaryType: JSON.stringify(["Vegetarian"]),
      allergens: JSON.stringify(["Gluten", "Dairy"]),
      spiceLevel: "None",
      mealType: JSON.stringify(["Lunch", "Dinner"])
    }
  });
  console.log('🍕 [Phase 1/2] Seeded menu items.');

  // Run Google Business Profile maps audit check
  console.log('\n🗺️ [Phase 2] Auditing Google Business Profile Maps optimization...');
  const audit = await seoOptimizerService.auditRestaurant({
    name: restaurant.name,
    address: restaurant.address,
    city: restaurant.city,
    cuisineTypes: ["Italian", "Roman"],
    amenities: ["Outdoor Seating", "Colosseum View"]
  });

  console.log(`✅ Maps Health Score generated: ${audit.scorecard.overallScore}%`);
  console.log(`✅ Nearby Landmarks Identified: ${audit.landmarks.join(', ')}`);
  console.log(`✅ Target Keyword Opportunities: ${audit.keywordOpportunities.join(', ')}`);
  console.log(`✅ Action Task: "${audit.actionItems[0]?.task || 'None'}"`);

  // Update restaurant with audit caching
  await prisma.restaurant.update({
    where: { id: restaurant.id },
    data: {
      gbpHealthScore: audit.scorecard.overallScore,
      nearbyLandmarks: JSON.stringify(audit.landmarks)
    }
  });

  // Run Vector Index Build (Phase 4 knowledge graph caching)
  console.log('\n🗂️ [Phase 4] Indexing restaurant metadata, menu items, and FAQs into vector storage...');
  const chunksCount = await vectorService.indexRestaurant(restaurant.id);
  console.log(`✅ Built vector storage index: ${chunksCount} text chunks cataloged and vectorized.`);

  // Test Cosine Similarity search retrieval
  console.log('\n🔍 [Phase 4] Testing Local Cosine Similarity semantic search...');
  const searchQuery = "find cozy romantic pasta near Colosseum";
  console.log(`   Query: "${searchQuery}"`);
  
  const searchResults = await vectorService.searchSemantic(searchQuery, 2);
  searchResults.forEach((res, idx) => {
    console.log(`   [Match #${idx + 1}] Similarity: ${res.similarity.toFixed(4)}`);
    console.log(`       Type: ${res.chunk.entityType}`);
    console.log(`       Chunk: "${res.chunk.textChunk.slice(0, 150)}..."`);
  });

  // Test RAG chat concierge endpoint
  console.log('\n🤖 [Phase 4] Invoking RAG Conversational Search Concierge...');
  
  // Create a mock Request/Response object to execute chat controller directly
  const mockReq = {
    body: { query: "I want romantic pasta near Colosseum view" }
  } as any;

  let jsonResult: any = null;
  const mockRes = {
    json: (data: any) => {
      jsonResult = data;
      return mockRes;
    },
    status: (code: number) => mockRes
  } as any;

  // Run controller method
  await searchController.chat(mockReq, mockRes);

  if (jsonResult) {
    console.log('✅ RAG Concierge successfully generated Cited Chat Message:');
    console.log(`   💬 Answer: "${jsonResult.answer}"`);
    console.log(`   📌 Citation Sources:`);
    jsonResult.citations.forEach((c: any, index: number) => {
      console.log(`      (${index + 1}) ${c.restaurantName} › ${c.entityName} (${c.details})`);
    });
  } else {
    throw new Error('RAG search controller did not return response.');
  }

  console.log('\n🎉 RDI Phases 2, 3, and 4 verification test successfully completed!');
}

runAdvancedValidation()
  .catch(err => {
    console.error('❌ Advanced Validation failed:', err);
    process.exit(1);
  });
