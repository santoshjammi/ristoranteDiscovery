"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.querySimulatorService = exports.QuerySimulatorService = void 0;
class QuerySimulatorService {
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
     * Evaluates the discoverability probability of a restaurant for a set of high-value NC Triangle local searches.
     * Grounded in actual database fields: menu items, reviews sentiment, landmarks, timings, and FAQs.
     */
    simulateQueries(restaurant) {
        const queries = [];
        const items = restaurant.menuItems || [];
        const faqs = restaurant.faqs || [];
        const city = (restaurant.city || '').toLowerCase();
        const cuisines = this.parseList(restaurant.cuisineTypes).map(c => c.toLowerCase());
        const amenities = this.parseList(restaurant.amenities).map(a => a.toLowerCase());
        const dietary = this.parseList(restaurant.dietarySupport).map(d => d.toLowerCase());
        const landmarks = this.parseList(restaurant.nearbyLandmarks).map(l => l.toLowerCase());
        const regional = (restaurant.regionalCuisine || '').toLowerCase();
        const reviews = restaurant.reviewAnalyses || [];
        // Helper: Find matching review dishes
        let popularDishesList = [];
        if (reviews.length > 0) {
            try {
                popularDishesList = typeof reviews[0].popularDishes === 'string'
                    ? JSON.parse(reviews[0].popularDishes)
                    : (Array.isArray(reviews[0].popularDishes) ? reviews[0].popularDishes : []);
            }
            catch { }
        }
        // QUERY 1: "best biryani in Morrisville"
        {
            const query = "best biryani in Morrisville";
            let prob = 10; // Baseline
            const evidence = [];
            const missing = [];
            // 1. Menu items check
            const hasBiryaniItem = items.some((i) => i.name.toLowerCase().includes('biryani'));
            if (hasBiryaniItem) {
                prob += 35;
                evidence.push("Menu has explicit Biryani items");
            }
            else {
                missing.push("No Biryani dishes found in the menu");
            }
            // 2. City match
            if (city === 'morrisville') {
                prob += 20;
                evidence.push("Business location is Morrisville");
            }
            else {
                missing.push(`Located in ${restaurant.city || 'other area'} (Morrisville search mismatch)`);
            }
            // 3. Review mentions (Sentiment verify)
            const reviewMentions = popularDishesList.find((d) => d.dishName.toLowerCase().includes('biryani'));
            if (reviewMentions && reviewMentions.mentions >= 3) {
                prob += 20;
                evidence.push(`Reviews have strong mentions of Biryani (${reviewMentions.mentions} customer references)`);
            }
            else {
                missing.push("Lack of customer review mentions for Biryani (needs at least 3)");
            }
            // 4. Schema markup
            const hasCombinedSchema = restaurant.schemas && restaurant.schemas.some((s) => s.type === 'Combined');
            if (hasCombinedSchema) {
                prob += 15;
                evidence.push("Structured Google Rich Snippet schema is active");
            }
            else {
                missing.push("Google Rich Snippet schema combined graph is missing");
            }
            // Naming ambiguity penalty
            const hasAmbiguousName = items.some((i) => i.name.toLowerCase() === 'biryani');
            if (hasAmbiguousName) {
                prob -= 10;
                missing.push("Ambiguous name 'Biryani' detected. Change to specific name (e.g. Hyderabadi Chicken Biryani)");
            }
            const finalProb = Math.min(100, Math.max(0, prob));
            queries.push({
                query,
                probability: finalProb,
                tier: 1,
                evidence,
                missing,
                status: this.getStatus(finalProb)
            });
        }
        // QUERY 2: "dosa near RTP"
        {
            const query = "dosa near RTP";
            let prob = 10;
            const evidence = [];
            const missing = [];
            const hasDosa = items.some((i) => i.name.toLowerCase().includes('dosa'));
            if (hasDosa) {
                prob += 40;
                evidence.push("Menu contains specialized Dosa selection");
            }
            else {
                missing.push("No Dosa listings on the menu");
            }
            let closeToRTP = landmarks.some((l) => l.includes('rtp') || l.includes('lenovo') || l.includes('cisco') || l.includes('morrisville') || l.includes('cary'));
            if (restaurant.latitude && restaurant.longitude) {
                const distLenovo = this.calculateDistance(restaurant.latitude, restaurant.longitude, 35.8235, -78.8256);
                const distCisco = this.calculateDistance(restaurant.latitude, restaurant.longitude, 35.8989, -78.9004);
                if (distLenovo <= 5 || distCisco <= 6) {
                    closeToRTP = true;
                    evidence.push(`Coordinate alignment confirms RTP corridor proximity (Lenovo: ${distLenovo.toFixed(1)}mi, Cisco: ${distCisco.toFixed(1)}mi)`);
                }
            }
            if (closeToRTP) {
                prob += 30;
                if (!evidence.some(e => e.includes("Coordinate alignment"))) {
                    evidence.push("Proximity landmarks align with RTP business corridor");
                }
            }
            else {
                missing.push("No proximity landmark references close to RTP office campus");
            }
            if (cuisines.includes('south indian') || regional.includes('south indian') || regional.includes('andhra')) {
                prob += 20;
                evidence.push("South Indian / Andhra cuisine classification confirmed");
            }
            else {
                missing.push("Missing regional South Indian tags");
            }
            const finalProb = Math.min(100, Math.max(0, prob));
            queries.push({
                query,
                probability: finalProb,
                tier: 1,
                evidence,
                missing,
                status: this.getStatus(finalProb)
            });
        }
        // QUERY 3: "vegetarian buffet Morrisville"
        {
            const query = "vegetarian buffet Morrisville";
            let prob = 10;
            const evidence = [];
            const missing = [];
            const hasBuffet = amenities.some((a) => a.includes('buffet') || a.includes('lunch buffet'));
            if (hasBuffet) {
                prob += 30;
                evidence.push("Dining amenities list 'Lunch Buffet'");
            }
            else {
                missing.push("Lunch buffet is not listed in business amenities");
            }
            const hasVegOption = dietary.some((d) => d.includes('vegetarian') || d.includes('vegan')) || items.some((i) => {
                try {
                    const dt = JSON.parse(i.dietaryType || '[]');
                    return dt.some((d) => d.toLowerCase().includes('veg'));
                }
                catch {
                    return false;
                }
            });
            if (hasVegOption) {
                prob += 30;
                evidence.push("Vegetarian-friendly dining options verified on profile");
            }
            else {
                missing.push("No vegetarian dietary certifications or menu tags configured");
            }
            if (city === 'morrisville') {
                prob += 30;
                evidence.push("Restaurant is located in Morrisville");
            }
            else {
                missing.push("Business location is not Morrisville");
            }
            const finalProb = Math.min(100, Math.max(0, prob));
            queries.push({
                query,
                probability: finalProb,
                tier: 1,
                evidence,
                missing,
                status: this.getStatus(finalProb)
            });
        }
        // QUERY 4: "authentic Andhra food Cary"
        {
            const query = "authentic Andhra food Cary";
            let prob = 10;
            const evidence = [];
            const missing = [];
            const isAndhra = regional.includes('andhra') || cuisines.includes('andhra');
            if (isAndhra) {
                prob += 40;
                evidence.push("Andhra regional cuisine classification active");
            }
            else {
                missing.push("Missing regional 'Andhra' categorization");
            }
            if (city === 'cary') {
                prob += 30;
                evidence.push("Business location is Cary");
            }
            else {
                missing.push("Located outside of Cary boundary");
            }
            let reviewsVerify = false;
            if (reviews.length > 0) {
                const summary = (reviews[0].sentimentSummary || '').toLowerCase();
                if (summary.includes('andhra') || summary.includes('authentic') || summary.includes('spices')) {
                    reviewsVerify = true;
                    prob += 20;
                    evidence.push("Customer review sentiment confirms spice authenticity and regional flavor consistency");
                }
            }
            if (!reviewsVerify) {
                missing.push("No customer reviews validating regional 'Andhra' authenticity keywords");
            }
            const finalProb = Math.min(100, Math.max(0, prob));
            queries.push({
                query,
                probability: finalProb,
                tier: 2,
                evidence,
                missing,
                status: this.getStatus(finalProb)
            });
        }
        // QUERY 5: "Indian lunch near RTP offices"
        {
            const query = "Indian lunch near RTP offices";
            let prob = 10;
            const evidence = [];
            const missing = [];
            const officeLandmarks = landmarks.filter(l => l.includes('lenovo') || l.includes('cisco') || l.includes('campus') || l.includes('rtp') || l.includes('metlife'));
            if (restaurant.latitude && restaurant.longitude) {
                const distLenovo = this.calculateDistance(restaurant.latitude, restaurant.longitude, 35.8235, -78.8256);
                if (distLenovo <= 5 && !officeLandmarks.includes("lenovo campus (coordinates)")) {
                    officeLandmarks.push(`Lenovo Campus (${distLenovo.toFixed(1)}mi)`);
                }
                const distCisco = this.calculateDistance(restaurant.latitude, restaurant.longitude, 35.8989, -78.9004);
                if (distCisco <= 6 && !officeLandmarks.includes("cisco rtp (coordinates)")) {
                    officeLandmarks.push(`Cisco RTP (${distCisco.toFixed(1)}mi)`);
                }
            }
            if (officeLandmarks.length > 0) {
                prob += 40;
                evidence.push(`Proximity mappings reference local office complexes (${officeLandmarks.join(', ')})`);
            }
            else {
                missing.push("No proximity landmark references mapping to business offices");
            }
            const hasLunch = amenities.some(a => a.includes('lunch') || a.includes('buffet')) || items.some((i) => {
                try {
                    const mt = JSON.parse(i.mealType || '[]');
                    return mt.some((m) => m.toLowerCase().includes('lunch'));
                }
                catch {
                    return false;
                }
            });
            if (hasLunch) {
                prob += 30;
                evidence.push("Lunch hours / meal tags are configured on menu items");
            }
            else {
                missing.push("Menu items lack lunch tag mapping details");
            }
            if (cuisines.includes('indian')) {
                prob += 20;
                evidence.push("Indian restaurant category active");
            }
            else {
                missing.push("Missing core 'Indian' cuisine tag");
            }
            const finalProb = Math.min(100, Math.max(0, prob));
            queries.push({
                query,
                probability: finalProb,
                tier: 2,
                evidence,
                missing,
                status: this.getStatus(finalProb)
            });
        }
        return queries;
    }
    getStatus(prob) {
        if (prob >= 75)
            return 'High';
        if (prob >= 45)
            return 'Medium';
        return 'Low';
    }
    parseList(str) {
        if (!str)
            return [];
        try {
            const parsed = JSON.parse(str);
            return Array.isArray(parsed) ? parsed : [];
        }
        catch {
            return str.split(',').map(s => s.trim()).filter(Boolean);
        }
    }
}
exports.QuerySimulatorService = QuerySimulatorService;
exports.querySimulatorService = new QuerySimulatorService();
