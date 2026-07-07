"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("./config/db"));
const parser_service_1 = require("./services/parser.service");
const review_service_1 = require("./services/review.service");
const faq_service_1 = require("./services/faq.service");
const schema_service_1 = require("./services/schema.service");
async function runMVPTest() {
    console.log('🧪 Starting RDI Platform Phase 1 MVP E2E Validation...\n');
    // Clear previous data
    await db_1.default.restaurant.deleteMany();
    console.log('🧹 Cleaned existing database records.');
    // 1. Create a Restaurant
    console.log('\n🏢 1. Creating mock restaurant: "Trattoria Bella"');
    const restaurant = await db_1.default.restaurant.create({
        data: {
            name: "Trattoria Bella",
            address: "123 Piazza Navona",
            city: "Rome",
            state: "Lazio",
            postalCode: "00186",
            phone: "+39 06 123 4567",
            website: "https://trattoriabella.example.com",
            timings: JSON.stringify({
                Monday: "12:00 PM - 10:00 PM",
                Tuesday: "12:00 PM - 10:00 PM",
                Wednesday: "12:00 PM - 10:00 PM",
                Thursday: "12:00 PM - 10:00 PM",
                Friday: "12:00 PM - 11:00 PM",
                Saturday: "12:00 PM - 11:00 PM",
                Sunday: "12:00 PM - 9:00 PM"
            }),
            cuisineTypes: JSON.stringify(["Italian", "Tuscan", "Roman"]),
            priceRange: "$$",
            dietarySupport: JSON.stringify(["Vegetarian", "Vegan Options", "Gluten-Free Pasta"]),
            amenities: JSON.stringify(["Outdoor Seating", "Free Wi-Fi", "Wheelchair Accessible"]),
            ambience: JSON.stringify(["Cozy", "Rustic", "Romantic"]),
            parkingInfo: "Street parking and nearby garage valet",
            deliverySupport: true
        }
    });
    console.log(`✅ Restaurant created with ID: ${restaurant.id}`);
    // 2. Simulate Copy-Pasted Menu parsing (Menu Intelligence MVP)
    console.log('\n🍕 2. Simulating copy-pasted menu text parsing...');
    const mockMenuText = `
  Trattoria Bella Menu
  ---
  Appetizers
  - Bruschetta al Pomodoro: Grilled garlic-rubbed bread, cherry tomatoes, fresh basil, extra virgin olive oil. $9.50 (Vegan, Vegetarian, Gluten allergen)
  - Calamari Fritti: Crispy fried calamari rings served with lemon and garlic aioli. $14.00 (Dairy allergen, Seafood)
  
  Mains
  - Truffle Mushroom Risotto: Creamy Arborio rice with wild porcini mushrooms, parmesan, and black truffle oil. $24.00 (Vegetarian, Gluten-Free, Dairy allergen)
  - Margherita Pizza: San Marzano tomatoes, fresh mozzarella, basil, olive oil. $16.50 (Vegetarian, Dairy, Gluten)
  `;
    // Parse using parser service
    const parsedMenu = await parser_service_1.parserService.parseMenuText(mockMenuText);
    console.log(`✅ AI Menu Intelligence parsed ${parsedMenu.sections.length} sections.`);
    // Write parsed menu to DB (simulate transaction inside menu controller)
    for (let i = 0; i < parsedMenu.sections.length; i++) {
        const sec = parsedMenu.sections[i];
        const section = await db_1.default.menuSection.create({
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
        await db_1.default.menuItem.createMany({
            data: itemsData
        });
        console.log(`   🔸 Created Section "${sec.name}" with ${sec.items.length} items.`);
    }
    // 3. Simulate Review Ingestion & Intelligence MVP
    console.log('\n📝 3. Simulating review ingestion...');
    const mockReviews = [
        {
            rating: 5,
            text: "The Truffle Mushroom Risotto was absolutely fantastic! Hands down the best risotto in town. The romantic ambiance and candle-lit outdoor seating made our anniversary dinner very special. Service was prompt and friendly."
        },
        {
            rating: 4,
            text: "Lovely cozy vibe. The Bruschetta al Pomodoro was super fresh. However, there was a 25-minute wait to get a table even with a booking on Saturday night. Valet parking was easy to use."
        },
        {
            rating: 2,
            text: "The Margherita Pizza was okay, but the crust was a bit soggy. It was extremely noisy inside the dining hall on Friday, making it hard to talk. The servers seemed very rushed."
        }
    ];
    const analysis = await review_service_1.reviewService.analyzeReviews(mockReviews);
    console.log('✅ AI Review Intelligence Analysis Completed:');
    console.log(`   🔸 Overall Sentiment Score: ${analysis.overallSentiment}`);
    console.log(`   🔸 Sentiment Summary: ${analysis.sentimentSummary}`);
    console.log(`   🔸 Compliant Tags: ${analysis.complaints.join(', ')}`);
    console.log(`   🔸 Ambient Keywords: ${analysis.ambienceTags.join(', ')}`);
    // Save review analysis
    await db_1.default.reviewAnalysis.create({
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
    // Update popularity scores on menu items based on popularDishes mentions (in memory matching)
    const menuItemsList = await db_1.default.menuItem.findMany({
        where: { restaurantId: restaurant.id }
    });
    for (const popularDish of analysis.popularDishes) {
        const match = menuItemsList.find(item => item.name.toLowerCase() === popularDish.dishName.toLowerCase());
        if (match) {
            await db_1.default.menuItem.update({
                where: { id: match.id },
                data: {
                    popularityScore: Math.min(5.0, 1.0 + (popularDish.mentions * 0.2))
                }
            });
            console.log(`   🔸 Updated popularity score for "${match.name}" (${popularDish.mentions} mentions).`);
        }
    }
    // 4. Generate AI FAQs (FAQ Generator MVP)
    console.log('\n❓ 4. Generating search and voice-optimized FAQs...');
    const menuItems = await db_1.default.menuItem.findMany({ where: { restaurantId: restaurant.id } });
    const menuSummary = `Dishes: ${menuItems.slice(0, 10).map(i => `${i.name} ($${i.price})`).join(', ')}`;
    const reviewSummary = analysis.sentimentSummary;
    const faqInfo = {
        name: restaurant.name,
        address: `${restaurant.address}, ${restaurant.city}`,
        cuisineTypes: JSON.parse(restaurant.cuisineTypes),
        priceRange: restaurant.priceRange || '$$',
        timings: JSON.parse(restaurant.timings || '{}'),
        dietarySupport: JSON.parse(restaurant.dietarySupport),
        amenities: JSON.parse(restaurant.amenities),
        parkingInfo: restaurant.parkingInfo || 'Street parking'
    };
    const generatedFAQs = await faq_service_1.faqService.generateFAQs(faqInfo, menuSummary, reviewSummary);
    console.log(`✅ Generated ${generatedFAQs.faqs.length} FAQs:`);
    generatedFAQs.faqs.slice(0, 3).forEach((faq, index) => {
        console.log(`   [${index + 1}] Q: ${faq.question}`);
        console.log(`       A: ${faq.answer}`);
        console.log(`       Voice: "${faq.voiceSnippet}"`);
    });
    // Save FAQs to db
    await db_1.default.fAQ.createMany({
        data: generatedFAQs.faqs.map(faq => ({
            restaurantId: restaurant.id,
            question: faq.question,
            answer: faq.answer,
            category: faq.category,
            voiceSnippet: faq.voiceSnippet
        }))
    });
    // 5. Generate SEO Schemas (Schema Generator MVP)
    console.log('\n🌐 5. Generating Google-compliant JSON-LD SEO Schemas...');
    const dbRestaurant = await db_1.default.restaurant.findUnique({
        where: { id: restaurant.id },
        include: {
            menuSections: { orderBy: { order: 'asc' } },
            menuItems: { include: { section: true } },
            faqs: true
        }
    });
    const parsedRestaurant = {
        ...dbRestaurant,
        timings: dbRestaurant.timings ? JSON.parse(dbRestaurant.timings) : {},
        cuisineTypes: JSON.parse(dbRestaurant.cuisineTypes),
        dietarySupport: JSON.parse(dbRestaurant.dietarySupport),
        amenities: JSON.parse(dbRestaurant.amenities),
        ambience: JSON.parse(dbRestaurant.ambience)
    };
    const parsedMenuItems = dbRestaurant.menuItems.map(item => ({
        ...item,
        ingredients: JSON.parse(item.ingredients),
        dietaryType: JSON.parse(item.dietaryType),
        allergens: JSON.parse(item.allergens),
        mealType: JSON.parse(item.mealType)
    }));
    const combinedSchema = schema_service_1.schemaService.generateCombinedSchema(parsedRestaurant, dbRestaurant.menuSections, parsedMenuItems, dbRestaurant.faqs);
    console.log('✅ Combined Schema generated successfully!');
    console.log(JSON.stringify(combinedSchema, null, 2).slice(0, 800) + '\n... [TRUNCATED] ...');
    // Cache to db
    await db_1.default.sEOMarkup.create({
        data: {
            restaurantId: restaurant.id,
            type: 'Combined',
            jsonld: JSON.stringify(combinedSchema)
        }
    });
    console.log('\n🎉 MVP E2E Validation completed successfully! All Phase 1 engines operational.');
}
runMVPTest()
    .catch(err => {
    console.error('❌ MVP Validation failed:', err);
    process.exit(1);
});
