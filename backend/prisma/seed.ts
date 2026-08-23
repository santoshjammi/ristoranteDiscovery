import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding NC Triangle Indian restaurants...');

  // Clean up Rome demo data
  const romeRestaurants = await prisma.restaurant.findMany({ where: { city: 'Rome' } });
  for (const r of romeRestaurants) {
    await prisma.vectorCache.deleteMany({ where: { restaurantId: r.id } });
    await prisma.sEOMarkup.deleteMany({ where: { restaurantId: r.id } });
    await prisma.fAQ.deleteMany({ where: { restaurantId: r.id } });
    await prisma.reviewAnalysis.deleteMany({ where: { restaurantId: r.id } });
    await prisma.menuItem.deleteMany({ where: { restaurantId: r.id } });
    await prisma.menuSection.deleteMany({ where: { restaurantId: r.id } });
    await prisma.restaurant.delete({ where: { id: r.id } });
    console.log(`  🗑️  Deleted Rome demo: ${r.name}`);
  }

  // =============================================
  // 1. BIRYANI MAXX - Morrisville (near Lenovo)
  // =============================================
  const biryaniMaxx = await prisma.restaurant.upsert({
    where: { id: 'demo-biryani-maxx' },
    update: {},
    create: {
      id: 'demo-biryani-maxx',
      name: 'Biryani Maxx',
      address: '1001 Airport Blvd, Suite 100',
      city: 'Morrisville',
      state: 'NC',
      postalCode: '27560',
      latitude: 35.8345,
      longitude: -78.8256,
      phone: '(919) 555-0101',
      website: 'https://biryanimaxx.com',
      cuisineTypes: JSON.stringify(['Indian', 'Hyderabadi', 'Biryani', 'Mughlai']),
      regionalCuisine: 'Hyderabadi',
      priceRange: '$$',
      dietarySupport: JSON.stringify(['Halal', 'Vegetarian options', 'Non-vegetarian']),
      amenities: JSON.stringify(['Lunch Buffet', 'Takeout', 'Dine-in', 'Catering', 'Parking']),
      ambience: JSON.stringify(['Casual', 'Family-friendly', 'Lively', 'Aromatic']),
      parkingInfo: 'Free parking lot',
      nearbyLandmarks: JSON.stringify(['Lenovo Cary Campus', 'Cisco Systems RTP', 'MetLife Cary Offices', 'RTP Corridor']),
      deliverySupport: true,
      gbpHealthScore: 82,
    },
  });

  // Menu Sections & Items
  const bmSections = [
    {
      name: 'Biryani & Rice Specials',
      description: 'Aromatic slow-cooked basmati rice specials',
      order: 1,
      items: [
        { name: 'Hyderabadi Chicken Biryani', description: 'Aromatic basmati rice slow-cooked with marinated chicken, saffron, mint, and regional spices. Served with raita.', price: 16.50, ingredients: JSON.stringify(['Basmati Rice', 'Chicken', 'Yogurt', 'Saffron', 'Mint', 'Spices']), dietaryType: JSON.stringify(['Halal']), spiceLevel: 'Hot', allergens: JSON.stringify(['Dairy']), mealType: JSON.stringify(['Lunch', 'Dinner']), popularityScore: 4.9 },
        { name: 'Mutton Biryani', description: 'Tender goat meat slow-cooked with fragrant basmati rice and authentic Hyderabadi spices.', price: 18.99, ingredients: JSON.stringify(['Basmati Rice', 'Goat Meat', 'Yogurt', 'Saffron', 'Spices']), dietaryType: JSON.stringify(['Halal']), spiceLevel: 'Hot', allergens: JSON.stringify(['Dairy']), mealType: JSON.stringify(['Lunch', 'Dinner']), popularityScore: 4.5 },
        { name: 'Vegetable Biryani', description: 'Fresh seasonal vegetables layered with aromatic basmati rice and mild spices.', price: 13.99, ingredients: JSON.stringify(['Basmati Rice', 'Mixed Vegetables', 'Yogurt', 'Saffron', 'Spices']), dietaryType: JSON.stringify(['Vegetarian', 'Halal']), spiceLevel: 'Medium', allergens: JSON.stringify(['Dairy']), mealType: JSON.stringify(['Lunch', 'Dinner']), popularityScore: 4.2 },
        { name: 'Chicken 65 Biryani', description: 'Spicy fried chicken pieces layered with basmati rice — a fusion favorite.', price: 17.50, ingredients: JSON.stringify(['Basmati Rice', 'Chicken', 'Red Chili', 'Yogurt', 'Spices']), dietaryType: JSON.stringify(['Halal']), spiceLevel: 'Extra Hot', allergens: JSON.stringify(['Dairy']), mealType: JSON.stringify(['Dinner']), popularityScore: 4.3 },
      ],
    },
    {
      name: 'Starters',
      description: 'Perfect beginnings to your meal',
      order: 0,
      items: [
        { name: 'Chicken 65', description: 'Crispy deep-fried chicken marinated in spicy yogurt and chili sauce.', price: 12.99, ingredients: JSON.stringify(['Chicken', 'Yogurt', 'Red Chili', 'Curry Leaves', 'Spices']), dietaryType: JSON.stringify(['Halal']), spiceLevel: 'Hot', allergens: JSON.stringify(['Dairy']), mealType: JSON.stringify(['Dinner']), popularityScore: 4.6 },
        { name: 'Samosa (3 pcs)', description: 'Crispy triangular pastry filled with spiced potatoes and peas.', price: 6.99, ingredients: JSON.stringify(['Potato', 'Peas', 'Flour', 'Cumin', 'Spices']), dietaryType: JSON.stringify(['Vegetarian', 'Vegan']), spiceLevel: 'Medium', allergens: JSON.stringify(['Gluten']), mealType: JSON.stringify(['Lunch', 'Dinner']), popularityScore: 4.1 },
        { name: 'Chicken Tikka', description: 'Tender chicken pieces marinated in yogurt and spices, cooked in tandoor.', price: 14.99, ingredients: JSON.stringify(['Chicken', 'Yogurt', 'Ginger', 'Garlic', 'Spices']), dietaryType: JSON.stringify(['Halal']), spiceLevel: 'Medium', allergens: JSON.stringify(['Dairy']), mealType: JSON.stringify(['Dinner']), popularityScore: 4.4 },
      ],
    },
  ];

  for (const sec of bmSections) {
    const section = await prisma.menuSection.create({
      data: {
        restaurantId: biryaniMaxx.id,
        name: sec.name,
        description: sec.description,
        order: sec.order,
      },
    });
    for (const item of sec.items) {
      await prisma.menuItem.create({
        data: { ...item, restaurantId: biryaniMaxx.id, sectionId: section.id, currency: 'USD' },
      });
    }
  }

  // Review Analysis
  await prisma.reviewAnalysis.create({
    data: {
      restaurantId: biryaniMaxx.id,
      overallSentiment: 0.88,
      sentimentSummary: 'Customers highly praise the authenticity of the Hyderabadi Biryani and the wide variety in the lunch buffet. A few reviews mention long queues during Sunday lunch rushes, but note the service is friendly and the staff is attentive.',
      popularDishes: JSON.stringify([
        { dishName: 'Hyderabadi Chicken Biryani', sentiment: 'Positive', mentions: 22 },
        { dishName: 'Chicken 65', sentiment: 'Positive', mentions: 14 },
        { dishName: 'Mutton Biryani', sentiment: 'Positive', mentions: 8 },
      ]),
      ambienceTags: JSON.stringify(['family-friendly', 'lively', 'aromatic', 'casual']),
      serviceInsights: 'Service is prompt during the week, but wait times increase by 15 minutes during the Sunday buffet rush. Staff is courteous and helpful with menu recommendations.',
      topicClusters: JSON.stringify([
        { topic: 'Authenticity', summary: 'Strong praise for regional spices and traditional Hyderabadi preparation methods.' },
        { topic: 'Buffet Value', summary: 'Excellent pricing for over 25 varieties of dishes during lunch buffet.' },
        { topic: 'Wait Times', summary: 'Crowded on weekends. Early arrival recommended for Sunday lunch.' },
      ]),
      complaints: JSON.stringify(['Long wait times during Sunday lunch buffet', 'Parking lot gets full during weekday lunch hours']),
      audienceProfile: JSON.stringify({ families: '45%', couples: '25%', business: '20%', solo: '10%' }),
    },
  });

  // FAQs
  const bmFaqs = [
    { question: 'Does Biryani Maxx offer a lunch buffet?', answer: 'Yes! We serve our Grand Indian Lunch Buffet daily from 11:30 AM to 2:30 PM. It features a rotating menu of over 25 regional tandoori items, curries, biryanis, and desserts.', category: 'hours', voiceSnippet: 'Our Grand Indian Lunch Buffet is served daily from eleven thirty AM to two thirty PM.' },
    { question: 'Is Biryani Maxx Halal certified?', answer: 'Yes, all our meat dishes are prepared with Halal-certified chicken and goat meat. We take dietary compliance seriously.', category: 'dietary', voiceSnippet: 'Yes, all our meat is Halal-certified.' },
    { question: 'What is the spice level of your biryani?', answer: 'Our Hyderabadi Biryani is prepared at a Hot spice level by default. We offer Mild, Medium, Hot, and Indian Hot options — please specify when ordering.', category: 'general', voiceSnippet: 'We offer four spice levels from Mild to Indian Hot.' },
    { question: 'Do you have vegetarian options?', answer: 'Absolutely! We offer Vegetable Biryani, Paneer dishes, Dal Makhani, and multiple vegetarian starters. Over 40% of our menu is vegetarian-friendly.', category: 'dietary', voiceSnippet: 'Yes, over forty percent of our menu is vegetarian.' },
    { question: 'Are you near the Lenovo campus?', answer: 'Yes! We are located just 2 miles from the Lenovo Cary Campus on Airport Blvd, making us a popular lunch spot for Lenovo and Cisco RTP employees.', category: 'general', voiceSnippet: 'Yes, we are two miles from the Lenovo Cary Campus.' },
  ];
  for (const faq of bmFaqs) {
    await prisma.fAQ.create({ data: { ...faq, restaurantId: biryaniMaxx.id } });
  }

  // =============================================
  // 2. DHARANI - Cary (South Indian)
  // =============================================
  const dharani = await prisma.restaurant.upsert({
    where: { id: 'demo-dharani-cary' },
    update: {},
    create: {
      id: 'demo-dharani-cary',
      name: 'Dharani',
      address: '2100 N Harrison Ave, Suite 100',
      city: 'Cary',
      state: 'NC',
      postalCode: '27513',
      latitude: 35.7895,
      longitude: -78.7895,
      phone: '(919) 555-0202',
      website: 'https://dharani-cary.com',
      cuisineTypes: JSON.stringify(['Indian', 'South Indian', 'Andhra', 'Vegetarian']),
      regionalCuisine: 'South Indian',
      priceRange: '$$',
      dietarySupport: JSON.stringify(['Vegetarian', 'Vegan options', 'Gluten-Free options']),
      amenities: JSON.stringify(['Lunch Buffet', 'Takeout', 'Dine-in', 'Catering', 'Parking', 'Weekend Brunch']),
      ambience: JSON.stringify(['Family-friendly', 'Warm', 'Traditional', 'Quiet']),
      parkingInfo: 'Free parking in shared lot',
      nearbyLandmarks: JSON.stringify(['Cary Towne Center', 'Downtown Cary', 'SAS Campus', 'Lake Crabtree']),
      deliverySupport: true,
      gbpHealthScore: 88,
    },
  });

  const dhSections = [
    {
      name: 'Dosa Specialties',
      description: 'Crispy, golden rice-lentil crepes',
      order: 0,
      items: [
        { name: 'Masala Dosa', description: 'Crispy golden dosa filled with spiced potato masala. Served with coconut chutney and sambar.', price: 11.00, ingredients: JSON.stringify(['Rice', 'Urad Dal', 'Potato', 'Onion', 'Spices']), dietaryType: JSON.stringify(['Vegetarian', 'Vegan', 'Gluten-Free']), spiceLevel: 'Mild', allergens: JSON.stringify([]), mealType: JSON.stringify(['Breakfast', 'Lunch', 'Dinner']), popularityScore: 4.8 },
        { name: 'Rava Dosa', description: 'Crispy semolina dosa with onions, green chilies, and curry leaves.', price: 12.00, ingredients: JSON.stringify(['Semolina', 'Rice Flour', 'Onion', 'Green Chili', 'Curry Leaves']), dietaryType: JSON.stringify(['Vegetarian', 'Vegan']), spiceLevel: 'Medium', allergens: JSON.stringify(['Gluten']), mealType: JSON.stringify(['Breakfast', 'Lunch', 'Dinner']), popularityScore: 4.5 },
        { name: 'Onion Uttappam', description: 'Thick rice-lentil pancake topped with onions, tomatoes, and green chilies.', price: 10.50, ingredients: JSON.stringify(['Rice', 'Urad Dal', 'Onion', 'Tomato', 'Green Chili']), dietaryType: JSON.stringify(['Vegetarian', 'Vegan', 'Gluten-Free']), spiceLevel: 'Medium', allergens: JSON.stringify([]), mealType: JSON.stringify(['Breakfast', 'Lunch']), popularityScore: 4.3 },
        { name: 'Ghee Roast Dosa', description: 'Crispy dosa roasted in pure ghee, served with a generous layer of red chili chutney.', price: 13.00, ingredients: JSON.stringify(['Rice', 'Urad Dal', 'Ghee', 'Red Chili']), dietaryType: JSON.stringify(['Vegetarian', 'Gluten-Free']), spiceLevel: 'Hot', allergens: JSON.stringify(['Dairy']), mealType: JSON.stringify(['Dinner']), popularityScore: 4.6 },
      ],
    },
    {
      name: 'South Indian Meals',
      description: 'Traditional thali-style meals',
      order: 1,
      items: [
        { name: 'Andhra Meal', description: 'Complete traditional Andhra thali with rice, sambar, rasam, pappu, two curries, pickle, and payasam.', price: 15.99, ingredients: JSON.stringify(['Rice', 'Toor Dal', 'Tamarind', 'Vegetables', 'Ghee']), dietaryType: JSON.stringify(['Vegetarian', 'Gluten-Free']), spiceLevel: 'Hot', allergens: JSON.stringify(['Dairy']), mealType: JSON.stringify(['Lunch', 'Dinner']), popularityScore: 4.7 },
        { name: 'Sambar Rice', description: 'Comforting rice mixed with lentil-based vegetable stew, tempered with mustard seeds and curry leaves.', price: 10.99, ingredients: JSON.stringify(['Rice', 'Toor Dal', 'Vegetables', 'Tamarind', 'Spices']), dietaryType: JSON.stringify(['Vegetarian', 'Vegan', 'Gluten-Free']), spiceLevel: 'Medium', allergens: JSON.stringify([]), mealType: JSON.stringify(['Lunch', 'Dinner']), popularityScore: 4.1 },
      ],
    },
  ];

  for (const sec of dhSections) {
    const section = await prisma.menuSection.create({
      data: {
        restaurantId: dharani.id,
        name: sec.name,
        description: sec.description,
        order: sec.order,
      },
    });
    for (const item of sec.items) {
      await prisma.menuItem.create({
        data: { ...item, restaurantId: dharani.id, sectionId: section.id, currency: 'USD' },
      });
    }
  }

  await prisma.reviewAnalysis.create({
    data: {
      restaurantId: dharani.id,
      overallSentiment: 0.92,
      sentimentSummary: 'Dharani is beloved for its authentic South Indian flavors, especially the crispy Masala Dosa and traditional Andhra Meal. Customers appreciate the consistent quality, generous portions, and warm service. The weekend brunch buffet is particularly popular with families.',
      popularDishes: JSON.stringify([
        { dishName: 'Masala Dosa', sentiment: 'Positive', mentions: 28 },
        { dishName: 'Andhra Meal', sentiment: 'Positive', mentions: 15 },
        { dishName: 'Ghee Roast Dosa', sentiment: 'Positive', mentions: 10 },
      ]),
      ambienceTags: JSON.stringify(['family-friendly', 'warm', 'traditional', 'quiet', 'clean']),
      serviceInsights: 'Service is consistently warm and attentive. Staff is knowledgeable about the menu and happy to explain dishes to first-time visitors.',
      topicClusters: JSON.stringify([
        { topic: 'Authenticity', summary: 'Customers consistently praise the authentic South Indian and Andhra flavors.' },
        { topic: 'Value', summary: 'Generous portions at reasonable prices. The lunch buffet is considered excellent value.' },
        { topic: 'Consistency', summary: 'Regular customers note the food quality has remained consistently high over years.' },
      ]),
      complaints: JSON.stringify(['Weekend wait times can be 20-30 minutes', 'Limited parking during peak hours']),
      audienceProfile: JSON.stringify({ families: '50%', couples: '20%', business: '15%', solo: '15%' }),
    },
  });

  const dhFaqs = [
    { question: 'Is Dharani fully vegetarian?', answer: 'Yes! Dharani is a pure vegetarian restaurant. All our dishes are prepared without meat, fish, or eggs.', category: 'dietary', voiceSnippet: 'Yes, Dharani is a pure vegetarian restaurant.' },
    { question: 'Do you serve breakfast?', answer: 'Yes, we serve traditional South Indian breakfast items like Dosa, Vada, and Idli from 8:00 AM to 11:00 AM daily.', category: 'hours', voiceSnippet: 'We serve South Indian breakfast from eight AM to eleven AM daily.' },
    { question: 'What is the Andhra Meal?', answer: 'Our Andhra Meal is a traditional thali featuring rice, sambar, rasam, pappu (lentil dish), two seasonal vegetable curries, pickle, and payasam for dessert.', category: 'general', voiceSnippet: 'The Andhra Meal is a traditional thali with rice, sambar, rasam, and multiple curries.' },
    { question: 'Do you have vegan options?', answer: 'Yes! Many of our dishes are naturally vegan, including Masala Dosa, Sambar, and Uttappam. We use plant-based oils and can accommodate vegan requests.', category: 'dietary', voiceSnippet: 'Yes, many dishes like Masala Dosa and Sambar are naturally vegan.' },
  ];
  for (const faq of dhFaqs) {
    await prisma.fAQ.create({ data: { ...faq, restaurantId: dharani.id } });
  }

  // =============================================
  // 3. TANDOORI FLAME - Raleigh (North Indian)
  // =============================================
  const tandooriFlame = await prisma.restaurant.upsert({
    where: { id: 'demo-tandoori-flame' },
    update: {},
    create: {
      id: 'demo-tandoori-flame',
      name: 'Tandoori Flame',
      address: '4500 Creedmoor Rd, Suite 200',
      city: 'Raleigh',
      state: 'NC',
      postalCode: '27612',
      latitude: 35.8550,
      longitude: -78.6960,
      phone: '(919) 555-0303',
      website: 'https://tandooriflame.com',
      cuisineTypes: JSON.stringify(['Indian', 'North Indian', 'Punjabi', 'Mughlai', 'Tandoori']),
      regionalCuisine: 'Punjabi',
      priceRange: '$$$',
      dietarySupport: JSON.stringify(['Halal', 'Vegetarian options', 'Gluten-Free options', 'Non-vegetarian']),
      amenities: JSON.stringify(['Full Bar', 'Dine-in', 'Takeout', 'Catering', 'Private Events', 'Outdoor Seating', 'Valet Parking']),
      ambience: JSON.stringify(['Upscale', 'Romantic', 'Elegant', 'Warm', 'Dim-lit']),
      parkingInfo: 'Valet parking available, free lot parking',
      nearbyLandmarks: JSON.stringify(['North Hills Mall', 'Raleigh Convention Center', 'NC State University', 'PNC Arena']),
      deliverySupport: true,
      gbpHealthScore: 90,
    },
  });

  const tfSections = [
    {
      name: 'Tandoori Specialties',
      description: 'Clay oven-crafted delicacies',
      order: 0,
      items: [
        { name: 'Butter Chicken (Murgh Makhani)', description: 'Tender tandoor-cooked chicken pieces simmered in a rich, creamy tomato and cashew gravy with butter and cream.', price: 18.99, ingredients: JSON.stringify(['Chicken', 'Tomato', 'Butter', 'Cream', 'Cashew', 'Spices']), dietaryType: JSON.stringify(['Halal', 'Gluten-Free']), spiceLevel: 'Medium', allergens: JSON.stringify(['Dairy', 'Nuts']), mealType: JSON.stringify(['Dinner']), popularityScore: 4.9 },
        { name: 'Dal Makhani', description: 'Slow-cooked black lentils simmered overnight with butter, cream, and aromatic spices.', price: 14.99, ingredients: JSON.stringify(['Black Lentils', 'Butter', 'Cream', 'Tomato', 'Spices']), dietaryType: JSON.stringify(['Vegetarian', 'Gluten-Free']), spiceLevel: 'Mild', allergens: JSON.stringify(['Dairy']), mealType: JSON.stringify(['Lunch', 'Dinner']), popularityScore: 4.7 },
        { name: 'Paneer Tikka Masala', description: 'Cubes of cottage cheese marinated in spiced yogurt, cooked in tandoor, then simmered in rich onion-tomato gravy.', price: 16.99, ingredients: JSON.stringify(['Paneer', 'Yogurt', 'Tomato', 'Onion', 'Cream', 'Spices']), dietaryType: JSON.stringify(['Vegetarian', 'Gluten-Free']), spiceLevel: 'Medium', allergens: JSON.stringify(['Dairy']), mealType: JSON.stringify(['Dinner']), popularityScore: 4.6 },
        { name: 'Chicken Tikka Masala', description: 'Marinated chicken pieces cooked in tandoor and served in a rich, spiced tomato-cream sauce.', price: 17.99, ingredients: JSON.stringify(['Chicken', 'Yogurt', 'Tomato', 'Cream', 'Spices']), dietaryType: JSON.stringify(['Halal', 'Gluten-Free']), spiceLevel: 'Medium', allergens: JSON.stringify(['Dairy']), mealType: JSON.stringify(['Dinner']), popularityScore: 4.5 },
      ],
    },
    {
      name: 'Breads',
      description: 'Fresh from the tandoor',
      order: 1,
      items: [
        { name: 'Garlic Naan', description: 'Soft leavened bread brushed with garlic butter and fresh coriander.', price: 4.50, ingredients: JSON.stringify(['Flour', 'Garlic', 'Butter', 'Coriander']), dietaryType: JSON.stringify(['Vegetarian']), spiceLevel: 'Mild', allergens: JSON.stringify(['Gluten', 'Dairy']), mealType: JSON.stringify(['Lunch', 'Dinner']), popularityScore: 4.8 },
        { name: 'Butter Naan', description: 'Classic soft naan bread brushed with melted butter.', price: 3.50, ingredients: JSON.stringify(['Flour', 'Butter']), dietaryType: JSON.stringify(['Vegetarian']), spiceLevel: 'None', allergens: JSON.stringify(['Gluten', 'Dairy']), mealType: JSON.stringify(['Lunch', 'Dinner']), popularityScore: 4.6 },
      ],
    },
  ];

  for (const sec of tfSections) {
    const section = await prisma.menuSection.create({
      data: {
        restaurantId: tandooriFlame.id,
        name: sec.name,
        description: sec.description,
        order: sec.order,
      },
    });
    for (const item of sec.items) {
      await prisma.menuItem.create({
        data: { ...item, restaurantId: tandooriFlame.id, sectionId: section.id, currency: 'USD' },
      });
    }
  }

  await prisma.reviewAnalysis.create({
    data: {
      restaurantId: tandooriFlame.id,
      overallSentiment: 0.90,
      sentimentSummary: 'Tandoori Flame is a favorite for special occasions and date nights. The Butter Chicken and Dal Makhani receive consistent praise. The elegant ambience and full bar set it apart from casual Indian restaurants. Service is professional and attentive.',
      popularDishes: JSON.stringify([
        { dishName: 'Butter Chicken', sentiment: 'Positive', mentions: 25 },
        { dishName: 'Dal Makhani', sentiment: 'Positive', mentions: 18 },
        { dishName: 'Garlic Naan', sentiment: 'Positive', mentions: 20 },
      ]),
      ambienceTags: JSON.stringify(['upscale', 'romantic', 'elegant', 'warm', 'dim-lit', 'date-night']),
      serviceInsights: 'Professional, well-trained staff. Attentive without being intrusive. Knowledgeable about wine pairings and menu modifications.',
      topicClusters: JSON.stringify([
        { topic: 'Date Night', summary: 'Popular choice for romantic dinners. The dim-lit ambience and full bar create a sophisticated atmosphere.' },
        { topic: 'Butter Chicken', summary: 'Widely considered the best Butter Chicken in Raleigh. Rich, creamy, perfectly spiced.' },
        { topic: 'Service', summary: 'Staff is professional and attentive. Knowledgeable about the menu and dietary restrictions.' },
      ]),
      complaints: JSON.stringify(['Prices are higher than casual Indian restaurants', 'Reservations recommended on weekends']),
      audienceProfile: JSON.stringify({ couples: '40%', families: '25%', business: '25%', solo: '10%' }),
    },
  });

  const tfFaqs = [
    { question: 'Does Tandoori Flame have a full bar?', answer: 'Yes! We have a full bar featuring an extensive wine list, craft cocktails, and premium spirits. Our bar is open during restaurant hours.', category: 'general', voiceSnippet: 'Yes, we have a full bar with wine, cocktails, and spirits.' },
    { question: 'Is Tandoori Flame good for a date night?', answer: 'Absolutely! Our elegant ambience, dim lighting, full bar, and premium North Indian cuisine make us one of Raleigh\'s top date-night destinations.', category: 'general', voiceSnippet: 'Yes, we are one of Raleigh\'s top date-night destinations.' },
    { question: 'Do you accommodate dietary restrictions?', answer: 'Yes, we offer gluten-free, vegetarian, and Jain options. Our staff is trained to handle dietary modifications. Please inform your server when ordering.', category: 'dietary', voiceSnippet: 'Yes, we accommodate gluten-free, vegetarian, and Jain dietary needs.' },
    { question: 'Do you offer catering?', answer: 'Yes, we offer full catering services for events of 10-200 people. Our catering menu includes our signature Butter Chicken, Dal Makhani, and assorted breads.', category: 'general', voiceSnippet: 'Yes, we cater events from ten to two hundred people.' },
  ];
  for (const faq of tfFaqs) {
    await prisma.fAQ.create({ data: { ...faq, restaurantId: tandooriFlame.id } });
  }

  // =============================================
  // 4. ANAND BHAVAN - Morrisville (Vegetarian)
  // =============================================
  const anandBhavan = await prisma.restaurant.upsert({
    where: { id: 'demo-anand-bhavan' },
    update: {},
    create: {
      id: 'demo-anand-bhavan',
      name: 'Anand Bhavan',
      address: '1100 Aviation Pkwy, Suite A',
      city: 'Morrisville',
      state: 'NC',
      postalCode: '27560',
      latitude: 35.8400,
      longitude: -78.8200,
      phone: '(919) 555-0404',
      website: 'https://anandbhavan.com',
      cuisineTypes: JSON.stringify(['Indian', 'South Indian', 'Vegetarian', 'Gujarati']),
      regionalCuisine: 'South Indian & Gujarati',
      priceRange: '$',
      dietarySupport: JSON.stringify(['Vegetarian', 'Vegan', 'Gluten-Free', 'Jain']),
      amenities: JSON.stringify(['Lunch Buffet', 'Takeout', 'Dine-in', 'Catering', 'Free Parking', 'Weekend Specials']),
      ambience: JSON.stringify(['Casual', 'Family-friendly', 'Bright', 'Clean']),
      parkingInfo: 'Free parking lot',
      nearbyLandmarks: JSON.stringify(['Lenovo Cary Campus', 'RTP Corridor', 'Morrisville Town Center']),
      deliverySupport: true,
      gbpHealthScore: 85,
    },
  });

  const abSections = [
    {
      name: 'South Indian Favorites',
      description: 'Classic dishes from South India',
      order: 0,
      items: [
        { name: 'Masala Dosa', description: 'Crispy golden dosa with spiced potato filling. Served with coconut chutney and sambar.', price: 9.50, ingredients: JSON.stringify(['Rice', 'Urad Dal', 'Potato', 'Spices']), dietaryType: JSON.stringify(['Vegetarian', 'Vegan', 'Gluten-Free']), spiceLevel: 'Mild', allergens: JSON.stringify([]), mealType: JSON.stringify(['Breakfast', 'Lunch', 'Dinner']), popularityScore: 4.7 },
        { name: 'Idli Sambar', description: 'Steamed rice-lentil cakes served with lentil soup (sambar) and coconut chutney.', price: 7.99, ingredients: JSON.stringify(['Rice', 'Urad Dal', 'Toor Dal', 'Vegetables', 'Spices']), dietaryType: JSON.stringify(['Vegetarian', 'Vegan', 'Gluten-Free']), spiceLevel: 'Mild', allergens: JSON.stringify([]), mealType: JSON.stringify(['Breakfast', 'Lunch']), popularityScore: 4.5 },
        { name: 'Vada', description: 'Crispy lentil donuts served with sambar and chutney.', price: 6.99, ingredients: JSON.stringify(['Urad Dal', 'Curry Leaves', 'Spices']), dietaryType: JSON.stringify(['Vegetarian', 'Vegan', 'Gluten-Free']), spiceLevel: 'Mild', allergens: JSON.stringify([]), mealType: JSON.stringify(['Breakfast', 'Lunch']), popularityScore: 4.3 },
      ],
    },
    {
      name: 'North Indian & Gujarati',
      description: 'Hearty vegetarian dishes',
      order: 1,
      items: [
        { name: 'Paneer Butter Masala', description: 'Cottage cheese cubes in a rich, creamy tomato-cashew gravy.', price: 12.99, ingredients: JSON.stringify(['Paneer', 'Tomato', 'Cashew', 'Butter', 'Cream', 'Spices']), dietaryType: JSON.stringify(['Vegetarian', 'Gluten-Free']), spiceLevel: 'Medium', allergens: JSON.stringify(['Dairy', 'Nuts']), mealType: JSON.stringify(['Lunch', 'Dinner']), popularityScore: 4.6 },
        { name: 'Gujarati Thali', description: 'Complete Gujarati meal with roti, dal, rice, shaak (vegetable curry), khichdi, and sweet dish.', price: 13.99, ingredients: JSON.stringify(['Wheat Flour', 'Toor Dal', 'Rice', 'Mixed Vegetables', 'Spices']), dietaryType: JSON.stringify(['Vegetarian', 'Vegan', 'Jain']), spiceLevel: 'Mild', allergens: JSON.stringify(['Gluten']), mealType: JSON.stringify(['Lunch', 'Dinner']), popularityScore: 4.4 },
      ],
    },
  ];

  for (const sec of abSections) {
    const section = await prisma.menuSection.create({
      data: {
        restaurantId: anandBhavan.id,
        name: sec.name,
        description: sec.description,
        order: sec.order,
      },
    });
    for (const item of sec.items) {
      await prisma.menuItem.create({
        data: { ...item, restaurantId: anandBhavan.id, sectionId: section.id, currency: 'USD' },
      });
    }
  }

  await prisma.reviewAnalysis.create({
    data: {
      restaurantId: anandBhavan.id,
      overallSentiment: 0.85,
      sentimentSummary: 'Anand Bhavan is a go-to spot for affordable, authentic South Indian vegetarian food. The Masala Dosa and Idli are consistently excellent. The lunch buffet offers great value. Popular with families and the Indian community.',
      popularDishes: JSON.stringify([
        { dishName: 'Masala Dosa', sentiment: 'Positive', mentions: 20 },
        { dishName: 'Idli Sambar', sentiment: 'Positive', mentions: 12 },
        { dishName: 'Gujarati Thali', sentiment: 'Positive', mentions: 8 },
      ]),
      ambienceTags: JSON.stringify(['casual', 'family-friendly', 'bright', 'clean', 'bustling']),
      serviceInsights: 'Fast and efficient service. The staff is friendly and accommodating to dietary requests.',
      topicClusters: JSON.stringify([
        { topic: 'Value', summary: 'Excellent value for money. Generous portions at affordable prices.' },
        { topic: 'Authenticity', summary: 'Authentic South Indian and Gujarati flavors that remind customers of home.' },
        { topic: 'Buffet', summary: 'The lunch buffet is popular with office workers from nearby RTP companies.' },
      ]),
      complaints: JSON.stringify(['Can get crowded during lunch hours', 'Limited seating during peak times']),
      audienceProfile: JSON.stringify({ families: '40%', solo: '30%', business: '20%', couples: '10%' }),
    },
  });

  const abFaqs = [
    { question: 'Is Anand Bhavan fully vegetarian?', answer: 'Yes! Anand Bhavan is a pure vegetarian restaurant. All dishes are prepared without meat, fish, or eggs.', category: 'dietary', voiceSnippet: 'Yes, we are a pure vegetarian restaurant.' },
    { question: 'Do you have Jain options?', answer: 'Yes, we offer Jain-friendly options that exclude onion, garlic, and root vegetables. Please inform your server.', category: 'dietary', voiceSnippet: 'Yes, we offer Jain-friendly options.' },
    { question: 'What is the lunch buffet price?', answer: 'Our lunch buffet is $11.99 per person and includes unlimited servings of dosa, idli, sambar, curries, rice, and dessert.', category: 'general', voiceSnippet: 'Our lunch buffet is eleven ninety-nine per person.' },
    { question: 'Are you near the RTP offices?', answer: 'Yes! We are located on Aviation Parkway in Morrisville, just 3 miles from the RTP corridor and 2 miles from the Lenovo campus.', category: 'general', voiceSnippet: 'Yes, we are three miles from the RTP corridor.' },
  ];
  for (const faq of abFaqs) {
    await prisma.fAQ.create({ data: { ...faq, restaurantId: anandBhavan.id } });
  }

  const restaurantUsers = [
    { email: 'alpha.manager@ristorante.local', name: 'Alpha Manager', passwordHash: 'seeded', restaurantId: biryaniMaxx.id, role: 'owner' },
    { email: 'alpha.editor@ristorante.local', name: 'Alpha Editor', passwordHash: 'seeded', restaurantId: biryaniMaxx.id, role: 'editor' },
    { email: 'dharani.viewer@ristorante.local', name: 'Dharani Viewer', passwordHash: 'seeded', restaurantId: dharani.id, role: 'viewer' },
  ];

  for (const u of restaurantUsers) {
    const user = await (prisma as any).user.upsert({
      where: { email: u.email },
      update: { name: u.name },
      create: { email: u.email, name: u.name, passwordHash: u.passwordHash, emailVerified: true },
    });
    await (prisma as any).restaurantMember.upsert({
      where: { restaurantId_userId: { restaurantId: u.restaurantId, userId: user.id } },
      update: { role: u.role },
      create: { restaurantId: u.restaurantId, userId: user.id, role: u.role },
    });
  }

  console.log('✅ Seeding complete!');
  console.log('');
  console.log('Restaurants seeded:');
  for (const r of await prisma.restaurant.findMany()) {
    const items = await prisma.menuItem.count({ where: { restaurantId: r.id } });
    const faqs = await prisma.fAQ.count({ where: { restaurantId: r.id } });
    console.log(`  🍽️  ${r.name} (${r.city}) — ${items} items, ${faqs} FAQs`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
