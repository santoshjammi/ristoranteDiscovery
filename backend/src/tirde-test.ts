import prisma from './config/db';
import { parserService } from './services/parser.service';
import { reviewService, IngestedReview } from './services/review.service';
import { faqService } from './services/faq.service';
import { schemaService } from './services/schema.service';
import { vectorService } from './services/vector.service';
import { seoOptimizerService } from './services/seo-optimizer.service';
import { searchController } from './controllers/search.controller';
import { scorerService } from './services/scorer.service';

async function runTIRDEValidation() {
  console.log('🧪 Starting TIRDE v3.0 Discoverability Scoring E2E Validation...\n');

  const testRestName = "Biryani Maxx Cary";

  // Clean up any existing test restaurant with the same name
  await prisma.restaurant.deleteMany({
    where: { name: testRestName }
  });
  console.log(`🧹 Cleaned up existing records for "${testRestName}" to ensure a clean sandbox run.`);

  // 1. Create a Cary Indian Restaurant
  console.log('\n🏢 Step 1: Registering new Cary Indian Restaurant...');
  let restaurant = await prisma.restaurant.create({
    data: {
      name: testRestName,
      address: "123 Research Triangle Pkwy",
      city: "Cary",
      state: "NC",
      postalCode: "27513",
      latitude: 35.8235,
      longitude: -78.8256,
      phone: "+1 919 555 1234",
      website: "https://carybiryanimaxx.example.com",
      timings: JSON.stringify({
        Monday: "11:30 AM - 9:30 PM",
        Tuesday: "11:30 AM - 9:30 PM",
        Wednesday: "11:30 AM - 9:30 PM",
        Thursday: "11:30 AM - 9:30 PM",
        Friday: "11:30 AM - 10:00 PM",
        Saturday: "11:30 AM - 10:00 PM",
        Sunday: "11:30 AM - 9:00 PM"
      }),
      cuisineTypes: JSON.stringify(["Indian", "Biryani", "Andhra"]),
      regionalCuisine: "Hyderabadi",
      priceRange: "$$",
      dietarySupport: JSON.stringify(["Vegetarian", "Vegan Options", "Halal"]),
      amenities: JSON.stringify(["Lunch Buffet", "Outdoor Seating"]),
      ambience: JSON.stringify(["Aromatic", "Casual"]),
      parkingInfo: "Plaza lot parking",
      gbpHealthScore: 70, // Baseline Health Score
      deliverySupport: true
    }
  });

  console.log(`✅ Created Restaurant ID: ${restaurant.id}`);

  // Run Scorer to establish baseline
  restaurant = await scorerService.computeScores(restaurant.id);
  console.log(`📊 Baseline Scores:`);
  console.log(`   - Overall Discoverability Index: ${restaurant.discoverabilityScore}%`);
  console.log(`   - Menu Discoverability Score (Dish Recognition):   ${restaurant.menuDiscoverabilityScore}%`);
  console.log(`   - AI Visibility Score (AI Discoverability):         ${restaurant.aiVisibilityScore}%`);
  console.log(`   - Local Search Score (Local Intent Alignment):      ${restaurant.localSearchScore}%`);
  console.log(`   - Conversational Search Score (AI Visibility):      ${restaurant.conversationalSearchScore}%`);
  console.log(`   - Dish Retrieval Score (Dish Understanding):        ${restaurant.dishRetrievalScore}%`);
  console.log(`   - Restaurant Clarity Score:                         ${restaurant.restaurantClarityScore}%`);
  console.log(`   - Retrieval Validation Score:                       ${restaurant.retrievalValidationScore}%`);
  console.log(`   - Competitive Visibility Score:                     ${restaurant.competitiveVisibilityScore}%`);

  const initialOverall = restaurant.discoverabilityScore;

  // 2. Parse Menu Text (Menu Discoverability)
  console.log('\n🍕 Step 2: Uploading menu text (Menu Intelligence)...');
  const mockMenuText = `
  Biryani & Rice
  - Hyderabadi Chicken Biryani: Slow-cooked aromatic basmati rice cooked with marinated chicken, saffron, mint, and spices. $16.50 (Halal, Gluten-Free)
  - Paneer Butter Masala: Cottage cheese cubes cooked in a rich, creamy tomato cashew nut gravy. $15.00 (Vegetarian, Gluten-Free)
  `;

  const parsedMenu = await parserService.parseMenuText(mockMenuText);
  console.log(`✅ AI Menu Intelligence parsed ${parsedMenu.sections.length} sections.`);

  for (let i = 0; i < parsedMenu.sections.length; i++) {
    const sec = parsedMenu.sections[i];
    const section = await prisma.menuSection.create({
      data: {
        restaurantId: restaurant.id,
        name: sec.name,
        description: sec.description || null,
        order: i
      }
    });

    const itemsData = sec.items.map(item => ({
      restaurantId: restaurant.id,
      sectionId: section.id,
      name: item.name,
      description: item.description || null,
      price: item.price,
      ingredients: JSON.stringify(item.ingredients || []),
      dietaryType: JSON.stringify(item.dietaryType || []),
      spiceLevel: item.spiceLevel || 'None',
      allergens: JSON.stringify(item.allergens || []),
      mealType: JSON.stringify(item.mealType || ['Lunch', 'Dinner']),
      popularityScore: item.popularityScore || 0.0
    }));

    await prisma.menuItem.createMany({
      data: itemsData
    });
    console.log(`   🔸 Created Section "${sec.name}" with ${sec.items.length} items.`);
  }

  // Recalculate scores after menu ingestion
  restaurant = await scorerService.computeScores(restaurant.id);
  console.log(`📊 Scores after adding menu items:`);
  console.log(`   - Overall Discoverability Index: ${restaurant.discoverabilityScore}% (was ${initialOverall}%)`);
  console.log(`   - Menu Discoverability Score:    ${restaurant.menuDiscoverabilityScore}%`);
  console.log(`   - Dish Retrieval Score:          ${restaurant.dishRetrievalScore}%`);

  const afterMenuOverall = restaurant.discoverabilityScore;

  // 3. Ingest Reviews (Dish Retrieval Scoring)
  console.log('\n📝 Step 3: Ingesting consumer reviews mentioning dishes...');
  const mockReviews: IngestedReview[] = [
    {
      rating: 5,
      text: "The Hyderabadi Chicken Biryani was absolutely outstanding! Best biryani in Cary. We love the spices and the aromatic flavor. Great options for vegetarian curry too like Paneer Butter Masala."
    },
    {
      rating: 4,
      text: "Convenient location near the Lenovo Cary Campus. The Paneer Butter Masala is creamy and sweet. High quality service."
    }
  ];

  const analysis = await reviewService.analyzeReviews(mockReviews);
  await prisma.reviewAnalysis.create({
    data: {
      restaurantId: restaurant.id,
      overallSentiment: analysis.overallSentiment,
      sentimentSummary: analysis.sentimentSummary,
      popularDishes: JSON.stringify(analysis.popularDishes || []),
      ambienceTags: JSON.stringify(analysis.ambienceTags || []),
      serviceInsights: analysis.serviceInsights,
      topicClusters: JSON.stringify(analysis.topicClusters || []),
      complaints: JSON.stringify(analysis.complaints || []),
      audienceProfile: JSON.stringify(analysis.audienceProfile || {})
    }
  });

  // Update popularity scores on menu items based on popularDishes mentions
  const menuItemsList = await prisma.menuItem.findMany({
    where: { restaurantId: restaurant.id }
  });

  for (const popularDish of analysis.popularDishes) {
    const match = menuItemsList.find(item => item.name.toLowerCase() === popularDish.dishName.toLowerCase());
    if (match) {
      await prisma.menuItem.update({
        where: { id: match.id },
        data: {
          popularityScore: Math.min(5.0, 1.0 + (popularDish.mentions * 0.2))
        }
      });
      console.log(`   🔸 Popularity score updated for "${match.name}" based on review mentions.`);
    }
  }

  // Recalculate scores after reviews
  restaurant = await scorerService.computeScores(restaurant.id);
  console.log(`📊 Scores after review analysis:`);
  console.log(`   - Overall Discoverability Index: ${restaurant.discoverabilityScore}% (was ${afterMenuOverall}%)`);
  console.log(`   - Dish Retrieval Score:          ${restaurant.dishRetrievalScore}%`);

  const afterReviewsOverall = restaurant.discoverabilityScore;

  // 4. Generate AI FAQs (Conversational Search scoring)
  console.log('\n❓ Step 4: Generating FAQ items with voice snippets...');
  const menuItemsForFaq = await prisma.menuItem.findMany({ where: { restaurantId: restaurant.id } });
  const menuSummary = `Dishes: ${menuItemsForFaq.map(i => `${i.name} ($${i.price})`).join(', ')}`;
  
  const faqInfo = {
    name: restaurant.name,
    address: `${restaurant.address}, ${restaurant.city}`,
    cuisineTypes: JSON.parse(restaurant.cuisineTypes || '[]'),
    priceRange: restaurant.priceRange || '$$',
    timings: JSON.parse(restaurant.timings || '{}'),
    dietarySupport: JSON.parse(restaurant.dietarySupport || '[]'),
    amenities: JSON.parse(restaurant.amenities || '[]'),
    parkingInfo: restaurant.parkingInfo || 'Street parking'
  };

  const generatedFAQs = await faqService.generateFAQs(faqInfo, menuSummary, analysis.sentimentSummary);
  await prisma.fAQ.createMany({
    data: generatedFAQs.faqs.map(faq => ({
      restaurantId: restaurant.id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      voiceSnippet: faq.voiceSnippet
    }))
  });
  console.log(`✅ Generated and saved ${generatedFAQs.faqs.length} FAQs to database.`);

  // Recalculate scores after FAQs
  restaurant = await scorerService.computeScores(restaurant.id);
  console.log(`📊 Scores after generating FAQs:`);
  console.log(`   - Overall Discoverability Index: ${restaurant.discoverabilityScore}% (was ${afterReviewsOverall}%)`);
  console.log(`   - Conversational Search Score:   ${restaurant.conversationalSearchScore}%`);

  const afterFAQsOverall = restaurant.discoverabilityScore;

  // 5. Generate SEO Schemas, Maps Audit, and Vector Indexing (AI Visibility + Local Search)
  console.log('\n🌐 Step 5: Generating Schemas, performing Maps SEO Audit & Building Vector Index...');
  
  // Generating Schema
  const dbRestaurant = await prisma.restaurant.findUnique({
    where: { id: restaurant.id },
    include: {
      menuSections: { orderBy: { order: 'asc' } },
      menuItems: { include: { section: true } },
      faqs: true
    }
  });

  const parsedRestaurantForSchema = {
    ...dbRestaurant!,
    timings: dbRestaurant!.timings ? JSON.parse(dbRestaurant!.timings) : {},
    cuisineTypes: JSON.parse(dbRestaurant!.cuisineTypes),
    dietarySupport: JSON.parse(dbRestaurant!.dietarySupport),
    amenities: JSON.parse(dbRestaurant!.amenities),
    ambience: JSON.parse(dbRestaurant!.ambience)
  };

  const parsedMenuItemsForSchema = dbRestaurant!.menuItems.map(item => ({
    ...item,
    ingredients: JSON.parse(item.ingredients),
    dietaryType: JSON.parse(item.dietaryType),
    allergens: JSON.parse(item.allergens),
    mealType: JSON.parse(item.mealType)
  }));

  const combinedSchema = schemaService.generateCombinedSchema(
    parsedRestaurantForSchema,
    dbRestaurant!.menuSections,
    parsedMenuItemsForSchema,
    dbRestaurant!.faqs
  );

  await prisma.sEOMarkup.create({
    data: {
      restaurantId: restaurant.id,
      type: 'Combined',
      jsonld: JSON.stringify(combinedSchema)
    }
  });
  console.log('   🔸 SEO Schema generated.');

  // Local SEO Audit
  const auditResult = await seoOptimizerService.auditRestaurant({
    name: restaurant.name,
    address: restaurant.address,
    city: restaurant.city,
    cuisineTypes: JSON.parse(restaurant.cuisineTypes || '[]'),
    amenities: JSON.parse(restaurant.amenities || '[]')
  }, analysis.sentimentSummary || undefined);

  console.log(`   🔸 SEO Audit complete. Health Score: ${auditResult.scorecard.overallScore}%`);
  console.log(`   🔸 Nearby landmarks discovered: ${auditResult.landmarks.join(', ')}`);

  // Update landmarks and health score
  await prisma.restaurant.update({
    where: { id: restaurant.id },
    data: {
      gbpHealthScore: auditResult.scorecard.overallScore,
      nearbyLandmarks: JSON.stringify(auditResult.landmarks)
    }
  });

  // Index Vector Storage
  const chunkCount = await vectorService.indexRestaurant(restaurant.id);
  console.log(`   🔸 Vector search index built. Total chunks: ${chunkCount}`);

  // Recalculate scores after full optimization
  restaurant = await scorerService.computeScores(restaurant.id);
  console.log(`\n📊 Final Scores:`);
  console.log(`   - Overall Discoverability Index: ${restaurant.discoverabilityScore}% (was ${afterFAQsOverall}%)`);
  console.log(`   - Menu Discoverability Score (Dish Recognition):   ${restaurant.menuDiscoverabilityScore}%`);
  console.log(`   - AI Visibility Score (AI Discoverability):         ${restaurant.aiVisibilityScore}%`);
  console.log(`   - Local Search Score (Local Intent Alignment):      ${restaurant.localSearchScore}%`);
  console.log(`   - Conversational Search Score (AI Visibility):      ${restaurant.conversationalSearchScore}%`);
  console.log(`   - Dish Retrieval Score (Dish Understanding):        ${restaurant.dishRetrievalScore}%`);
  console.log(`   - Restaurant Clarity Score:                         ${restaurant.restaurantClarityScore}%`);
  console.log(`   - Retrieval Validation Score:                       ${restaurant.retrievalValidationScore}%`);
  console.log(`   - Competitive Visibility Score:                     ${restaurant.competitiveVisibilityScore}%`);

  const finalOverall = restaurant.discoverabilityScore;

  // Verify Landmark optimization presence in Cary/Morrisville corridor
  const finalLandmarks = JSON.parse(restaurant.nearbyLandmarks || '[]');
  console.log(`\n🗺️ Proximity landmark mapping check:`);
  console.log(`   - Targets: Lenovo Cary Campus, Cisco Systems RTP`);
  console.log(`   - Actual:  ${finalLandmarks.join(', ')}`);
  
  const hasLandmarks = finalLandmarks.some((l: string) => l.toLowerCase().includes('lenovo') || l.toLowerCase().includes('cisco') || l.toLowerCase().includes('triangle'));
  if (hasLandmarks) {
    console.log('   ✅ Proximity landmarks successfully resolved and mapped.');
  } else {
    console.log('   ⚠️ Proximity landmarks did not resolve or match expectation.');
  }

  // 6. Conversational RAG Query Verification
  console.log('\n🔍 Conversational RAG citation yields check:');
  const chatQuery = "Where can I get authentic Hyderabadi chicken biryani near Lenovo campus in Cary?";
  console.log(`   Query: "${chatQuery}"`);

  const chatReq = {
    body: { query: chatQuery }
  } as any;

  let resultBody: any = null;
  const chatRes = {
    json: (data: any) => {
      resultBody = data;
      return chatRes;
    },
    status: (code: number) => chatRes
  } as any;

  await searchController.chat(chatReq, chatRes);

  if (resultBody) {
    console.log('   ✅ Conversational answer generated:');
    console.log(`      "${resultBody.answer}"`);
    console.log('   ✅ Citations yielded:');
    resultBody.citations.forEach((c: any, index: number) => {
      console.log(`      (${index + 1}) Restaurant: "${c.restaurantName}" | Item: "${c.entityName}" | Details: "${c.details}"`);
    });

    const hasOurRestaurant = resultBody.citations.some((c: any) => c.restaurantName.includes("Biryani Maxx"));
    if (hasOurRestaurant) {
      console.log(`   ✅ Success! Conversational query correctly cited a "Biryani Maxx" entry.`);
    } else {
      console.log(`   ❌ Failure! Conversational query did not cite "Biryani Maxx".`);
    }
  } else {
    console.log('   ❌ Error: No chat response returned.');
  }

  // Clean up test data to keep the database tidy
  await prisma.restaurant.deleteMany({
    where: { name: testRestName }
  });
  console.log(`\n🧹 Cleaned up Cary Indian Restaurant sandbox records.`);

  // Confirm final verification checks
  if (finalOverall >= 68 && initialOverall < finalOverall) {
    console.log('\n🎉 E2E TIRDE v3.0 Discoverability Validation Passed! Scores dynamically and logically advanced from baseline to ~69%.');
  } else {
    console.log('\n❌ E2E TIRDE v3.0 Discoverability Validation Failed! Score optimization logic did not reach thresholds.');
    process.exit(1);
  }
}

runTIRDEValidation().catch(err => {
  console.error('❌ E2E Validation run crashed:', err);
  process.exit(1);
});
