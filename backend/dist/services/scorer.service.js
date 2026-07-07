"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scorerService = exports.ScorerService = void 0;
const db_1 = __importDefault(require("../config/db"));
class ScorerService {
    /**
     * Calculates distance between two points in miles using the Haversine formula.
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 3958.8; // Radius of Earth in miles
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    /**
     * Applies progressive difficulty friction to raw score progressions.
     * - 0 to 40: easy (100% value)
     * - 40 to 70: moderate (80% value)
     * - 70 to 85: difficult (60% value)
     * - 85 to 100: extremely difficult (40% value)
     */
    applyFriction(rawScore) {
        if (rawScore <= 40)
            return Math.round(rawScore);
        let score = 40;
        let remaining = rawScore - 40;
        // 40 to 70 range (30 pts max)
        if (remaining <= 30) {
            score += remaining * 0.80;
            return Math.round(score);
        }
        score += 30 * 0.80; // +24 pts (total 64)
        remaining -= 30;
        // 70 to 85 range (15 pts max)
        if (remaining <= 15) {
            score += remaining * 0.60;
            return Math.round(score);
        }
        score += 15 * 0.60; // +9 pts (total 73)
        remaining -= 15;
        // 85 to 100 range (15 pts max)
        score += remaining * 0.40; // +6 pts max (total 79)
        return Math.round(score);
    }
    /**
     * Evaluates ingestion and schema benchmarks to calculate discoverability scores (0-100)
     * under the TIRDE v3.5 discoverability calibration rules.
     * Automatically updates the restaurant record in the database.
     */
    async computeScores(restaurantId) {
        const restaurant = await db_1.default.restaurant.findUnique({
            where: { id: restaurantId },
            include: {
                menuItems: true,
                menuSections: true,
                faqs: true,
                reviewAnalyses: { orderBy: { createdAt: 'desc' }, take: 1 },
                schemas: true,
                vectorCaches: true
            }
        });
        if (!restaurant) {
            throw new Error(`Restaurant ${restaurantId} not found`);
        }
        const itemsCount = restaurant.menuItems.length;
        const sectionsCount = restaurant.menuSections.length;
        const faqsCount = restaurant.faqs.length;
        const hasSchema = restaurant.schemas.length > 0;
        const latestReview = restaurant.reviewAnalyses[0];
        // Helper checks
        const parseJSONList = (str) => {
            if (!str)
                return [];
            try {
                const parsed = JSON.parse(str);
                return Array.isArray(parsed) ? parsed : [];
            }
            catch {
                return str.split(',').map(s => s.trim()).filter(Boolean);
            }
        };
        const cuisines = parseJSONList(restaurant.cuisineTypes);
        const dietary = parseJSONList(restaurant.dietarySupport);
        const amenities = parseJSONList(restaurant.amenities);
        const ambience = parseJSONList(restaurant.ambience);
        const landmarks = parseJSONList(restaurant.nearbyLandmarks);
        // ========================================================
        // CRITICAL ISSUE #4: ONTOLOGY AMBIGUITY AUDIT
        // ========================================================
        let ambiguityPenalty = 0;
        if (itemsCount > 0) {
            restaurant.menuItems.forEach(item => {
                const nameLower = item.name.toLowerCase().trim();
                const highAmbiguity = ['curry', 'meals', 'special', 'masala', 'chaman'];
                const medAmbiguity = ['korma', 'fry', '65'];
                if (highAmbiguity.some(word => nameLower === word || (nameLower.endsWith(' ' + word) && nameLower.split(' ').length <= 2))) {
                    ambiguityPenalty += 15;
                }
                else if (medAmbiguity.some(word => nameLower === word || (nameLower.endsWith(' ' + word) && nameLower.split(' ').length <= 2))) {
                    ambiguityPenalty += 8;
                }
            });
        }
        // ==========================================
        // 1. DISH RECOGNITION (0-100) - Weight: 18%
        // ==========================================
        let dishRecognitionRaw = 0;
        if (itemsCount > 0) {
            // canonical_dish_match: 25%
            let canonicalMatchCount = 0;
            const canonicalKeywords = ['biryani', 'dosa', 'curry', 'samosa', 'korma', 'paneer', 'naan', 'tikka', 'chana', 'gobi', 'chicken 65', 'chaat', 'kabab', 'pulao'];
            restaurant.menuItems.forEach(item => {
                const nameLower = item.name.toLowerCase();
                if (canonicalKeywords.some(keyword => nameLower.includes(keyword))) {
                    canonicalMatchCount++;
                }
            });
            const canonicalScore = (canonicalMatchCount / itemsCount) * 100;
            dishRecognitionRaw += canonicalScore * 0.25;
            // dish_alias_coverage: 15%
            let aliasMatchCount = 0;
            restaurant.menuItems.forEach(item => {
                const descLower = (item.description || '').toLowerCase();
                if ((item.name.toLowerCase().includes('butter chicken') && descLower.includes('makhani')) ||
                    (item.name.toLowerCase().includes('makhani') && descLower.includes('butter')) ||
                    (item.name.toLowerCase().includes('pulao') && descLower.includes('pilaf')) ||
                    (item.name.toLowerCase().includes('paneer') && descLower.includes('cottage cheese'))) {
                    aliasMatchCount++;
                }
            });
            const aliasScore = itemsCount > 0 ? (aliasMatchCount / itemsCount) * 100 : 0;
            dishRecognitionRaw += Math.min(100, aliasScore + 40) * 0.15;
            // cuisine_origin_clarity: 20%
            let originScore = 0;
            if (restaurant.regionalCuisine && restaurant.regionalCuisine.trim().length > 2) {
                originScore += 60;
                const validRegions = ['andhra', 'south indian', 'hyderabadi', 'punjabi', 'gujarati', 'north indian', 'telangana', 'kerala', 'tamil'];
                if (validRegions.some(r => restaurant.regionalCuisine.toLowerCase().includes(r))) {
                    originScore += 40;
                }
            }
            dishRecognitionRaw += originScore * 0.20;
            // menu_structure_quality: 20%
            let structureScore = 0;
            if (sectionsCount > 1) {
                structureScore += 60;
                if (sectionsCount >= 3)
                    structureScore += 40;
            }
            dishRecognitionRaw += structureScore * 0.20;
            // discoverable_naming_quality: 20%
            let namingScore = 0;
            let detailedNames = 0;
            restaurant.menuItems.forEach(item => {
                if (item.name.split(' ').length >= 2)
                    detailedNames++;
            });
            namingScore = (detailedNames / itemsCount) * 100;
            dishRecognitionRaw += namingScore * 0.20;
            // Apply Ambiguity Penalty
            dishRecognitionRaw = Math.max(0, dishRecognitionRaw - Math.min(40, ambiguityPenalty));
        }
        const dishRecognition = this.applyFriction(dishRecognitionRaw);
        // ==========================================
        // 2. AI DISCOVERABILITY (0-100) - Weight: 18%
        // ==========================================
        let aiDiscoverabilityRaw = 0;
        // conversational_faq_quality: 25%
        let faqQuality = 0;
        if (faqsCount > 0) {
            faqQuality += 50;
            let longAnswers = 0;
            restaurant.faqs.forEach(f => {
                if (f.answer.split(' ').length >= 10)
                    longAnswers++;
            });
            faqQuality += (longAnswers / faqsCount) * 50;
        }
        aiDiscoverabilityRaw += faqQuality * 0.25;
        // semantic_richness: 25%
        let semanticRichness = 0;
        if (itemsCount > 0) {
            let richCount = 0;
            restaurant.menuItems.forEach(item => {
                try {
                    const ing = JSON.parse(item.ingredients || '[]');
                    if (ing.length >= 3)
                        richCount++;
                }
                catch {
                    if (item.ingredients && item.ingredients.split(',').length >= 3)
                        richCount++;
                }
            });
            semanticRichness = (richCount / itemsCount) * 100;
        }
        aiDiscoverabilityRaw += semanticRichness * 0.25;
        // ai_snippet_quality: 20%
        let snippetScore = 0;
        if (hasSchema) {
            const combined = restaurant.schemas.find(s => s.type === 'Combined');
            if (combined && combined.jsonld.includes('servesCuisine') && combined.jsonld.includes('priceRange')) {
                snippetScore = 100;
            }
            else {
                snippetScore = 60;
            }
        }
        aiDiscoverabilityRaw += snippetScore * 0.20;
        // voice_search_readiness: 15%
        let voiceScore = 0;
        if (faqsCount > 0) {
            let voiceSnippets = 0;
            restaurant.faqs.forEach(f => {
                if (f.voiceSnippet && f.voiceSnippet.trim().length > 8)
                    voiceSnippets++;
            });
            voiceScore = (voiceSnippets / faqsCount) * 100;
        }
        aiDiscoverabilityRaw += voiceScore * 0.15;
        // structured_metadata_quality: 15%
        let schemaScore = 0;
        if (restaurant.schemas.length > 0) {
            schemaScore += 50;
            if (restaurant.schemas.length >= 2)
                schemaScore += 30;
            if (restaurant.schemas.some(s => s.type === 'Combined'))
                schemaScore += 20;
        }
        aiDiscoverabilityRaw += schemaScore * 0.15;
        const aiDiscoverability = this.applyFriction(aiDiscoverabilityRaw);
        // ==========================================
        // 3. RESTAURANT CLARITY (0-100) - Weight: 14%
        // ==========================================
        let restaurantClarityRaw = 0;
        // cuisine_identity_clarity: 25%
        let identityScore = 0;
        if (cuisines.length > 0) {
            identityScore += 60;
            if (cuisines.length >= 2)
                identityScore += 40;
        }
        restaurantClarityRaw += identityScore * 0.25;
        // ambience_definition: 20%
        let ambienceScore = 0;
        if (ambience.length > 0) {
            ambienceScore += 70;
            if (ambience.length >= 2)
                ambienceScore += 30;
        }
        restaurantClarityRaw += ambienceScore * 0.20;
        // audience_definition: 15%
        let audienceScore = 0;
        if (latestReview) {
            try {
                const profile = JSON.parse(latestReview.audienceProfile || '{}');
                if (Object.keys(profile).length > 0)
                    audienceScore = 100;
            }
            catch {
                audienceScore = 50;
            }
        }
        restaurantClarityRaw += audienceScore * 0.15;
        // dining_intent_mapping: 20%
        let intentScore = 0;
        const validIntents = ['buffet', 'lunch', 'dinner', 'takeout', 'seating', 'catering', 'family'];
        let matchedIntents = 0;
        amenities.forEach(a => {
            if (validIntents.some(i => a.toLowerCase().includes(i)))
                matchedIntents++;
        });
        intentScore = Math.min(100, matchedIntents * 25);
        restaurantClarityRaw += intentScore * 0.20;
        // menu_organization: 20%
        let menuOrgScore = 0;
        if (sectionsCount > 0) {
            menuOrgScore += 50;
            if (sectionsCount >= 3)
                menuOrgScore += 50;
        }
        restaurantClarityRaw += menuOrgScore * 0.20;
        const restaurantClarity = this.applyFriction(restaurantClarityRaw);
        // ==========================================
        // 4. AI SEARCH VISIBILITY (0-100) - Weight: 18%
        // ==========================================
        let aiSearchVisibilityRaw = 0;
        // conversational_query_match: 30%
        let queryMatchScore = 0;
        const testQueries = ['biryani', 'dosa', 'buffet', 'halal', 'vegan', 'lunch', 'cary', 'morrisville'];
        let vectorMatchedText = 0;
        if (restaurant.vectorCaches.length > 0) {
            restaurant.vectorCaches.forEach(v => {
                const text = v.textChunk.toLowerCase();
                if (testQueries.some(q => text.includes(q)))
                    vectorMatchedText++;
            });
            queryMatchScore = Math.min(100, (vectorMatchedText / restaurant.vectorCaches.length) * 100 + 30);
        }
        aiSearchVisibilityRaw += queryMatchScore * 0.30;
        // long_tail_query_alignment: 20%
        let longTailScore = 0;
        if (latestReview) {
            const summary = (latestReview.sentimentSummary || '').toLowerCase();
            const longTailTerms = ['authenticity', 'weekend dinner', 'slow cooked', 'convenient location', 'buffet setup'];
            let termMatches = 0;
            longTailTerms.forEach(t => {
                if (summary.includes(t))
                    termMatches++;
            });
            longTailScore = Math.min(100, termMatches * 30 + 40);
        }
        aiSearchVisibilityRaw += longTailScore * 0.20;
        // locality_query_alignment: 20%
        let geoAlignment = 0;
        const localLocalities = ['cary', 'morrisville', 'raleigh', 'rtp'];
        let locMatches = 0;
        if (restaurant.city && localLocalities.includes(restaurant.city.toLowerCase()))
            locMatches += 2;
        landmarks.forEach(l => {
            if (localLocalities.some(loc => l.toLowerCase().includes(loc)))
                locMatches++;
        });
        geoAlignment = Math.min(100, locMatches * 25);
        aiSearchVisibilityRaw += geoAlignment * 0.20;
        // dish_level_retrieval: 15%
        let dishRetrievalScore = 0;
        if (latestReview) {
            try {
                const pop = JSON.parse(latestReview.popularDishes || '[]');
                if (pop.length > 0) {
                    dishRetrievalScore = Math.min(100, pop.length * 30 + 20);
                }
            }
            catch { }
        }
        aiSearchVisibilityRaw += dishRetrievalScore * 0.15;
        // semantic_consistency: 15%
        let semConsistency = 0;
        if (latestReview) {
            semConsistency = Math.round(((latestReview.overallSentiment + 1) / 2) * 100);
        }
        aiSearchVisibilityRaw += semConsistency * 0.15;
        const aiSearchVisibility = this.applyFriction(aiSearchVisibilityRaw);
        // ==========================================
        // 5. DISH UNDERSTANDING (0-100) - Weight: 14%
        // ==========================================
        let dishUnderstandingRaw = 0;
        if (itemsCount > 0) {
            // ingredient_clarity: 25%
            let ingClarityCount = 0;
            restaurant.menuItems.forEach(item => {
                const ingredientsArr = parseJSONList(item.ingredients);
                if (ingredientsArr.length >= 2)
                    ingClarityCount++;
            });
            const ingClarityScore = (ingClarityCount / itemsCount) * 100;
            dishUnderstandingRaw += ingClarityScore * 0.25;
            // cuisine_context: 20%
            let itemCuisineScore = 0;
            if (restaurant.regionalCuisine) {
                itemCuisineScore = 100;
            }
            else {
                itemCuisineScore = 40;
            }
            dishUnderstandingRaw += itemCuisineScore * 0.20;
            // spice_level_detection: 10%
            let spiceCount = 0;
            restaurant.menuItems.forEach(item => {
                if (item.spiceLevel && ['mild', 'medium', 'hot', 'extra hot'].includes(item.spiceLevel.toLowerCase())) {
                    spiceCount++;
                }
            });
            const spiceScore = (spiceCount / itemsCount) * 100;
            dishUnderstandingRaw += spiceScore * 0.10;
            // dietary_classification: 15%
            let dietaryCount = 0;
            restaurant.menuItems.forEach(item => {
                const dietsArr = parseJSONList(item.dietaryType);
                if (dietsArr.length > 0)
                    dietaryCount++;
            });
            const dietaryScore = (dietaryCount / itemsCount) * 100;
            dishUnderstandingRaw += dietaryScore * 0.15;
            // pairing_relationships: 15%
            let pairingCount = 0;
            restaurant.menuItems.forEach(item => {
                const desc = (item.description || '').toLowerCase();
                if (desc.includes('served') || desc.includes('cooked with') || desc.includes('with') || desc.includes('basmati') || desc.includes('gravy')) {
                    pairingCount++;
                }
            });
            const pairingScore = (pairingCount / itemsCount) * 100;
            dishUnderstandingRaw += pairingScore * 0.15;
            // semantic_description_quality: 15%
            let qualityDescCount = 0;
            restaurant.menuItems.forEach(item => {
                if (item.description && item.description.trim().length > 15) {
                    qualityDescCount++;
                }
            });
            const qualityScore = (qualityDescCount / itemsCount) * 100;
            dishUnderstandingRaw += qualityScore * 0.15;
        }
        const dishUnderstanding = this.applyFriction(dishUnderstandingRaw);
        // ==========================================
        // 6. LOCAL INTENT ALIGNMENT (0-100) - Weight: 10%
        // ==========================================
        let localIntentAlignmentRaw = 0;
        // locality_mapping: 25%
        let localityMapScore = 0;
        if (restaurant.address && restaurant.city)
            localityMapScore += 70;
        if (restaurant.postalCode)
            localityMapScore += 30;
        localIntentAlignmentRaw += localityMapScore * 0.25;
        // landmark_relevance: 20%
        let virtualLandmarksCount = landmarks.length;
        if (restaurant.latitude && restaurant.longitude) {
            const distLenovo = this.calculateDistance(restaurant.latitude, restaurant.longitude, 35.8235, -78.8256);
            const distCisco = this.calculateDistance(restaurant.latitude, restaurant.longitude, 35.8989, -78.9004);
            const distMetlife = this.calculateDistance(restaurant.latitude, restaurant.longitude, 35.8450, -78.8180);
            let coordLandmarkMatches = 0;
            if (distLenovo <= 5)
                coordLandmarkMatches++;
            if (distCisco <= 6)
                coordLandmarkMatches++;
            if (distMetlife <= 5)
                coordLandmarkMatches++;
            virtualLandmarksCount = Math.max(virtualLandmarksCount, coordLandmarkMatches);
        }
        let landmarkScore = Math.min(100, virtualLandmarksCount * 30);
        localIntentAlignmentRaw += landmarkScore * 0.20;
        // office_area_alignment: 15%
        let officeScore = 0;
        const officeKeywords = ['campus', 'office', 'rtp', 'lenovo', 'cisco', 'metlife', 'tech', 'park'];
        let matchesOffice = 0;
        landmarks.forEach(l => {
            if (officeKeywords.some(ok => l.toLowerCase().includes(ok)))
                matchesOffice++;
        });
        if (restaurant.latitude && restaurant.longitude) {
            const distLenovo = this.calculateDistance(restaurant.latitude, restaurant.longitude, 35.8235, -78.8256);
            const distCisco = this.calculateDistance(restaurant.latitude, restaurant.longitude, 35.8989, -78.9004);
            if (distLenovo <= 5)
                matchesOffice++;
            if (distCisco <= 6)
                matchesOffice++;
        }
        officeScore = Math.min(100, matchesOffice * 40);
        localIntentAlignmentRaw += officeScore * 0.15;
        // family_dining_alignment: 20%
        let familyScore = 0;
        if (latestReview) {
            const summary = (latestReview.sentimentSummary || '').toLowerCase();
            if (summary.includes('family') || summary.includes('kids') || summary.includes('weekend'))
                familyScore = 100;
            else
                familyScore = 50;
        }
        localIntentAlignmentRaw += familyScore * 0.20;
        // neighborhood_relevance: 20%
        let neighborhoodScore = 0;
        if (restaurant.city) {
            neighborhoodScore = 100;
        }
        localIntentAlignmentRaw += neighborhoodScore * 0.20;
        const localIntentAlignment = this.applyFriction(localIntentAlignmentRaw);
        // ==========================================
        // 7. RETRIEVAL READINESS (0-100) - Weight: 5%
        // ==========================================
        let retrievalValidationRaw = 0;
        if (restaurant.vectorCaches.length > 0) {
            // query_match_strength: 35%
            let queryMatchStrength = Math.min(100, restaurant.vectorCaches.length * 8 + 30);
            retrievalValidationRaw += queryMatchStrength * 0.35;
            // locality_relevance: 20%
            let locRelevance = landmarks.length > 0 ? 100 : 50;
            retrievalValidationRaw += locRelevance * 0.20;
            // conversational_alignment: 20%
            let convAlign = faqsCount > 0 ? 100 : 40;
            retrievalValidationRaw += convAlign * 0.20;
            // semantic_consistency: 15%
            let semConsistency = latestReview ? 100 : 50;
            retrievalValidationRaw += semConsistency * 0.15;
            // contextual_completeness: 10%
            let contCompleteness = hasSchema ? 100 : 0;
            retrievalValidationRaw += contCompleteness * 0.10;
        }
        const retrievalValidation = this.applyFriction(retrievalValidationRaw);
        // ==========================================
        // 8. COMPETITIVE VISIBILITY (0-100) - Weight: 3% (Tagged: Experimental)
        // ==========================================
        let competitiveVisibilityRaw = 0;
        let baseComp = (dishRecognition + aiDiscoverability + restaurantClarity + localIntentAlignment) / 4;
        // Set to a conservative low-to-medium baseline (Experimental)
        competitiveVisibilityRaw = Math.min(100, Math.round(baseComp * 0.65 + (latestReview ? 5 : 0)));
        const competitiveVisibility = this.applyFriction(competitiveVisibilityRaw);
        // ========================================================
        // HALLUCINATION PREVENTION checks & penalties
        // ========================================================
        let claimsPremium = cuisines.some(c => c.toLowerCase().includes('premium')) || restaurant.name.toLowerCase().includes('premium') || (restaurant.priceRange && restaurant.priceRange.length >= 3);
        let claimsFamily = amenities.some(a => a.toLowerCase().includes('family')) || ambience.some(a => a.toLowerCase().includes('family'));
        let reviewMentionsPremium = 0;
        let reviewMentionsFamily = 0;
        if (latestReview) {
            const summary = (latestReview.sentimentSummary || '').toLowerCase();
            if (summary.includes('premium') || summary.includes('upscale') || summary.includes('fancy'))
                reviewMentionsPremium += 5;
            if (summary.includes('family') || summary.includes('kids') || summary.includes('group'))
                reviewMentionsFamily += 4;
        }
        if (claimsPremium && reviewMentionsPremium < 5) {
            // Deduct penalty on clarity raw before final friction or deduct directly
            restaurantClarityRaw = Math.max(0, restaurantClarityRaw - 15);
        }
        if (claimsFamily && reviewMentionsFamily < 4) {
            localIntentAlignmentRaw = Math.max(0, localIntentAlignmentRaw - 15);
        }
        // ========================================================
        // CONFIDENCE LEVEL ENGINE
        // ========================================================
        let confScore = 0;
        if (latestReview)
            confScore += 35;
        if (itemsCount >= 5)
            confScore += 35;
        else if (itemsCount > 0)
            confScore += 15;
        if (faqsCount >= 3)
            confScore += 20;
        else if (faqsCount > 0)
            confScore += 10;
        if (hasSchema)
            confScore += 10;
        let overallConfidence = 'Low';
        if (confScore >= 80)
            overallConfidence = 'High';
        else if (confScore >= 40)
            overallConfidence = 'Medium';
        // ========================================================
        // FRESHNESS DECAY
        // ========================================================
        let decayFactor = 0;
        const daysSinceUpdate = (Date.now() - new Date(restaurant.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUpdate > 90) {
            decayFactor = 10; // Stale (90+ days)
        }
        else if (daysSinceUpdate > 45) {
            decayFactor = 5; // Aging (46 to 90 days)
        }
        else if (daysSinceUpdate > 14) {
            decayFactor = 2; // Good (15 to 45 days)
        }
        // ========================================================
        // CRITICAL ISSUE #5: SEPARATING COMPLETENESS & CONFIDENCE
        // ========================================================
        // Optimization Completeness (un-decayed completeness index of configuration)
        const optimizationCompleteness = Math.round((dishRecognition * 18 +
            aiDiscoverability * 18 +
            restaurantClarity * 14 +
            aiSearchVisibility * 18 +
            dishUnderstanding * 14 +
            localIntentAlignment * 10 +
            retrievalValidation * 5 +
            competitiveVisibility * 3) / 100);
        // Retrieval Confidence (how certain search discovery is - capped conservatively at 65% in mock environments)
        const maxConfidenceCap = 65;
        const rawConfidenceVal = Math.round((aiSearchVisibility * 40 +
            retrievalValidation * 30 +
            localIntentAlignment * 30) / 100);
        const scaledConfidenceVal = this.applyFriction(rawConfidenceVal);
        const retrievalConfidence = Math.round(scaledConfidenceVal * (maxConfidenceCap / 79));
        // Overall discoverability score is a balanced mix, minus decay
        const baseOverall = Math.round(optimizationCompleteness * 0.7 + retrievalConfidence * 0.3);
        let discoverabilityScore = baseOverall - decayFactor;
        if (discoverabilityScore < 0)
            discoverabilityScore = 0;
        // Save back to database
        const updatedRestaurant = await db_1.default.restaurant.update({
            where: { id: restaurantId },
            data: {
                discoverabilityScore: Math.min(100, Math.round(discoverabilityScore)),
                aiVisibilityScore: Math.min(100, Math.round(aiDiscoverability)),
                localSearchScore: Math.min(100, Math.round(localIntentAlignment)),
                menuDiscoverabilityScore: Math.min(100, Math.round(dishRecognition)),
                conversationalSearchScore: Math.min(100, Math.round(aiSearchVisibility)),
                dishRetrievalScore: Math.min(100, Math.round(dishUnderstanding)),
                restaurantClarityScore: Math.min(100, Math.round(restaurantClarity)),
                retrievalValidationScore: Math.min(100, Math.round(retrievalValidation)),
                competitiveVisibilityScore: Math.min(100, Math.round(competitiveVisibility)),
                optimizationCompleteness: Math.min(100, Math.round(optimizationCompleteness)),
                retrievalConfidence: Math.min(100, Math.round(retrievalConfidence))
            }
        });
        return {
            ...updatedRestaurant,
            overallConfidence,
            freshnessDecayApplied: decayFactor,
            warnings: {
                premiumClaimIssue: claimsPremium && reviewMentionsPremium < 5,
                familyClaimIssue: claimsFamily && reviewMentionsFamily < 4,
                isStale: daysSinceUpdate > 90
            }
        };
    }
}
exports.ScorerService = ScorerService;
exports.scorerService = new ScorerService();
