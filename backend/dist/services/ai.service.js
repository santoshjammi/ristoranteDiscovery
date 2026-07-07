"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = exports.AIService = void 0;
const genai_1 = require("@google/genai");
const openai_1 = __importDefault(require("openai"));
class AIService {
    geminiClient = null;
    openaiClient = null;
    constructor() {
        const geminiKey = process.env.GEMINI_API_KEY;
        const openaiKey = process.env.OPENAI_API_KEY;
        if (geminiKey) {
            console.log('🤖 AI Service: Initialized with Google Gemini.');
            this.geminiClient = new genai_1.GoogleGenAI({ apiKey: geminiKey });
        }
        else if (openaiKey) {
            console.log('🤖 AI Service: Initialized with OpenAI.');
            this.openaiClient = new openai_1.default({ apiKey: openaiKey });
        }
        else {
            console.warn('⚠️ AI Service: No API keys configured. Running in mock mode.');
        }
    }
    /**
     * General-purpose structured JSON completion.
     */
    async generateJSON(prompt, systemInstruction) {
        const instructionPrompt = systemInstruction
            ? `${systemInstruction}\n\nUser request:\n${prompt}`
            : prompt;
        // 1. Google Gemini SDK Integration
        if (this.geminiClient) {
            try {
                const response = await this.geminiClient.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: instructionPrompt,
                    config: {
                        responseMimeType: 'application/json',
                    }
                });
                const text = response.text;
                if (!text) {
                    throw new Error('Empty response from Gemini');
                }
                return JSON.parse(text);
            }
            catch (error) {
                console.error('Gemini execution error, trying fallback parser:', error);
                throw error;
            }
        }
        // 2. OpenAI SDK Integration
        if (this.openaiClient) {
            try {
                const response = await this.openaiClient.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: 'You are an advanced AI assistant. Return your response strictly as valid, parsable JSON.' },
                        { role: 'user', content: instructionPrompt }
                    ],
                    response_format: { type: 'json_object' }
                });
                const text = response.choices[0].message.content;
                if (!text) {
                    throw new Error('Empty response from OpenAI');
                }
                return JSON.parse(text);
            }
            catch (error) {
                console.error('OpenAI execution error:', error);
                throw error;
            }
        }
        // 3. Fallback Mock Service (TIRDE Specialized Mock Engine)
        console.warn('🚨 AI Service running in TIRDE MOCK mode. Returning simulated responses.');
        return this.getMockResponse(prompt);
    }
    getMockResponse(prompt) {
        const lower = prompt.toLowerCase();
        // 1. Check for SEO Audits (TIRDE NC Triangle specific landmarks)
        if (lower.includes('seo audit') || lower.includes('gbp') || lower.includes('audit')) {
            return {
                scorecard: {
                    photoCompleteness: 90,
                    descriptionCompleteness: 75,
                    hoursCompleteness: 95,
                    overallScore: 86
                },
                neighborhoods: ["West Cary", "Morrisville Town Center", "RTP Corridor", "Brier Creek"],
                landmarks: ["Lenovo Cary Campus", "Cisco Systems RTP", "Lake Crabtree County Park", "MetLife Cary Offices"],
                keywordOpportunities: [
                    "best chicken biryani morrisville nc",
                    "indian lunch buffet rtp",
                    "authentic south indian food cary"
                ],
                actionItems: [
                    {
                        task: "Update Google description to reference close proximity to Lenovo Cary Campus and Cisco RTP.",
                        priority: "High",
                        impact: "Improves ranking for high-volume office worker lunch queries."
                    },
                    {
                        task: "Add 10 high-resolution photos highlighting vegetarian options and buffet setup.",
                        priority: "High",
                        impact: "Boosts conversion rates for weekend family dining searches."
                    },
                    {
                        task: "Publish weekly GBP updates targeting keyword 'authentic south indian cary'.",
                        priority: "Medium",
                        impact: "Increases authority score in local map listings."
                    }
                ]
            };
        }
        // 2. Check for RAG Search / Chat matching (TIRDE Indian cuisine specific answers)
        if (lower.includes('retrieved context') || lower.includes('concierge') || lower.includes('search query')) {
            return {
                answer: "I highly recommend **Biryani Maxx** located in Morrisville near the Lenovo Campus. They serve a legendary **Hyderabadi Chicken Biryani ($16.50)** which features slow-cooked basmati rice and marinated chicken, highly praised by customers in 18 positive mentions. For South Indian specialties, check out **Dharani Cary** which serves a crispy, golden **Masala Dosa ($11.00)**.",
                citations: [
                    {
                        restaurantId: "demo-biryani-maxx",
                        restaurantName: "Biryani Maxx",
                        entityType: "menuItem",
                        entityName: "Hyderabadi Chicken Biryani",
                        details: "$16.50"
                    },
                    {
                        restaurantId: "demo-dharani-cary",
                        restaurantName: "Dharani Cary",
                        entityType: "menuItem",
                        entityName: "Masala Dosa",
                        details: "$11.00"
                    }
                ]
            };
        }
        // 3. Check for FAQ (TIRDE Indian specifics)
        if (lower.includes('faq') || lower.includes('question')) {
            return {
                faqs: [
                    {
                        question: "Are your menu items suitable for vegetarian and vegan diets?",
                        answer: "Yes! Over 60% of our menu is vegetarian, including our Paneer Tikka Masala and Dal Makhani. We offer multiple vegan options and can prepare dishes without ghee upon request.",
                        category: "dietary",
                        voiceSnippet: "Yes, over sixty percent of our menu is vegetarian, with vegan options available."
                    },
                    {
                        question: "Do you offer a daily lunch buffet?",
                        answer: "We serve our grand Grand Indian Lunch Buffet daily from 11:30 AM to 2:30 PM. It features a rotating menu of regional tandoori, curries, and sweets.",
                        category: "hours",
                        voiceSnippet: "Our Grand Indian Lunch Buffet is served daily from eleven thirty AM to two thirty PM."
                    },
                    {
                        question: "What is your default spice level scaling?",
                        answer: "Our dishes are prepared according to four spice levels: Mild, Medium, Hot, and Indian Hot. Please specify your preference when ordering.",
                        category: "general",
                        voiceSnippet: "We offer four spice levels: Mild, Medium, Hot, and Indian Hot."
                    }
                ]
            };
        }
        // 4. Check for Reviews (TIRDE Indian specific sentiment summaries)
        if (lower.includes('review') || lower.includes('sentiment') || lower.includes('overall')) {
            return {
                overallSentiment: 0.88,
                sentimentSummary: "Customers highly praise the authenticity of the Hyderabadi Biryani and the wide variety in the lunch buffet. A few reviews mention long queues during Sunday lunch rushes, but note the service is friendly.",
                popularDishes: [
                    { dishName: "Hyderabadi Chicken Biryani", sentiment: "Positive", mentions: 22 },
                    { dishName: "Masala Dosa", sentiment: "Positive", mentions: 14 },
                    { dishName: "Paneer Butter Masala", sentiment: "Positive", mentions: 8 }
                ],
                ambienceTags: ["family-friendly", "lively", "aromatic"],
                serviceInsights: "Service is prompt during the week, but wait times increase by 15 minutes during the Sunday buffet rush.",
                topicClusters: [
                    { topic: "Authenticity", summary: "Strong praise for regional spices and traditional preparation." },
                    { topic: "Buffet Value", summary: "Excellent pricing for over 25 varieties of dishes." },
                    { topic: "Wait Times", summary: "Crowded on weekends. Early arrival recommended." }
                ],
                complaints: [
                    "Long wait times during the Sunday lunch buffet.",
                    "Parking lot gets full during weekday lunch hours."
                ],
                audienceProfile: {
                    families: "45%",
                    couples: "25%",
                    business: "20%",
                    solo: "10%"
                }
            };
        }
        // 5. Fall back to Menu parsing (TIRDE Indian dishes)
        if (lower.includes('menu') || lower.includes('dish') || lower.includes('price')) {
            return {
                sections: [
                    {
                        name: "Biryani & Rice",
                        description: "Aromatic slow-cooked basmati rice specials",
                        items: [
                            {
                                name: "Hyderabadi Chicken Biryani",
                                description: "Aromatic basmati rice cooked with marinated chicken, saffron, mint, and regional spices, served with raita.",
                                price: 16.50,
                                ingredients: ["Basmati Rice", "Chicken", "Yogurt", "Saffron", "Mint", "Spices"],
                                dietaryType: ["Halal"],
                                spiceLevel: "Hot",
                                allergens: ["Dairy"],
                                mealType: ["Lunch", "Dinner"],
                                popularityScore: 4.9
                            }
                        ]
                    },
                    {
                        name: "Vegetarian Specialties",
                        description: "Rich and creamy vegetarian delights",
                        items: [
                            {
                                name: "Paneer Butter Masala",
                                description: "Cubes of cottage cheese cooked in a rich, creamy tomato and cashew-nut gravy.",
                                price: 15.00,
                                ingredients: ["Paneer", "Tomato", "Cashew Nuts", "Butter", "Cream", "Spices"],
                                dietaryType: ["Vegetarian", "Gluten-Free"],
                                spiceLevel: "Medium",
                                allergens: ["Dairy", "Nuts"],
                                mealType: ["Lunch", "Dinner"],
                                popularityScore: 4.7
                            }
                        ]
                    }
                ]
            };
        }
        // Default catch-all
        return {
            message: "Mock response generated",
            originalPrompt: prompt
        };
    }
}
exports.AIService = AIService;
exports.aiService = new AIService();
