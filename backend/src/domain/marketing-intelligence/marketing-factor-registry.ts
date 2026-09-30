import { MarketingDomain, MarketingFactorDefinition } from './types';
import { withDeclaredMetadata } from './registry/declarative-metadata';

export const METHODOLOGY_VERSION = 'marketing-model-v1.0';

export const MARKETING_DOMAINS: MarketingDomain[] = [
  { id: 'mkt_d01_market_business_context', name: 'Market & Business Context', description: 'External market dynamics and internal business objectives that shape marketing strategy.' },
  { id: 'mkt_d02_brand_positioning', name: 'Brand Positioning', description: 'How the brand is defined, communicated, and perceived relative to competitors.' },
  { id: 'mkt_d03_audience_demand_intelligence', name: 'Audience & Demand Intelligence', description: 'Understanding who customers are and what they want across geographies and time.' },
  { id: 'mkt_d04_local_discovery', name: 'Local Discovery', description: 'How discoverable a restaurant is on local platforms and in conversational AI.' },
  { id: 'mkt_d05_organic_search_website_discovery', name: 'Organic Search & Website Discovery', description: 'Visibility and relevance in organic search results and the website experience.' },
  { id: 'mkt_d06_reputation_and_trust', name: 'Reputation & Trust', description: 'Star ratings, review volume, freshness, sentiment, and management practices.' },
  { id: 'mkt_d07_content_and_creative', name: 'Content & Creative', description: 'Strategy, production quality, and freshness of restaurant content assets.' },
  { id: 'mkt_d08_social_and_community', name: 'Social & Community', description: 'Brand presence, engagement, and authority across social channels and creator networks.' },
  { id: 'mkt_d09_paid_customer_acquisition', name: 'Paid Customer Acquisition', description: 'Strategy and execution across paid search, social, and geographic targeting.' },
  { id: 'mkt_d10_digital_conversion_experience', name: 'Digital Conversion Experience', description: 'Clarity, friction, trust, and mobile optimization of the conversion path.' },
  { id: 'mkt_d11_ordering_reservations_local_actions', name: 'Ordering, Reservations & Local Actions', description: 'Availability and quality of ordering, reservation, and direct engagement channels.' },
  { id: 'mkt_d12_offers_menu_merchandising', name: 'Offers & Menu Merchandising', description: 'Promotional strategy, offer economics, and menu presentation that drive orders.' },
  { id: 'mkt_d13_first_party_data_crm', name: 'First-Party Data & CRM', description: 'Capture, profile quality, identity resolution, segmentation, and preference data.' },
  { id: 'mkt_d14_lifecycle_marketing', name: 'Lifecycle Marketing', description: 'Email, SMS, and journey-based messaging across the customer lifecycle.' },
  { id: 'mkt_d15_loyalty_retention_advocacy', name: 'Loyalty, Retention & Advocacy', description: 'Program availability, reward quality, repeat visits, personalization, and referrals.' },
  { id: 'mkt_d16_analytics_measurement_attribution', name: 'Analytics, Measurement & Attribution', description: 'Foundation, event taxonomy, data integrity, and attribution model quality.' },
  { id: 'mkt_d17_experimentation_optimization', name: 'Experimentation & Optimization', description: 'Capability to test creatives, audiences, and offers at scale with learning velocity.' },
  { id: 'mkt_d18_competitive_market_intelligence', name: 'Competitive & Market Intelligence', description: 'Visibility into competitor sets, their positioning, offers, and digital experience.' },
  { id: 'mkt_d19_marketing_economics_resource_allocation', name: 'Marketing Economics & Resource Allocation', description: 'Spend visibility, acquisition cost, ROI measurement, and budget allocation quality.' },
  { id: 'mkt_d20_governance_data_quality_execution', name: 'Governance, Data Quality & Marketing Execution', description: 'Data quality, consent governance, channel access, execution discipline, and system resilience.' },
];

const BASE_FACTORS: MarketingFactorDefinition[] = [
  // D01 — Market & Business Context
  {
    factorNumber: 1, domainId: 'mkt_d01_market_business_context', name: 'Business Objective Clarity',
    description: 'Measures how clearly the restaurant defines and communicates its marketing and revenue objectives to stakeholders.',
    funnelStages: ['conversion'], impactLevel: 'high', evidenceClass: 'CONNECTED', controllability: 'partial',
    expectedTimeToImpact: 'long-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Define written quarterly marketing objectives tied to revenue targets.',
      'Share objective summaries with all channel owners and agencies.',
      'Review alignment monthly during marketing ops meetings.',
    ],
  },
  {
    factorNumber: 2, domainId: 'mkt_d01_market_business_context', name: 'Revenue-Channel Priorities',
    description: 'Evaluates whether revenue goals are explicitly mapped to prioritized marketing channels rather than treated equally.',
    funnelStages: ['conversion'], impactLevel: 'high', evidenceClass: 'CONNECTED', controllability: 'partial',
    expectedTimeToImpact: 'long-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Rank channels by projected revenue contribution per dollar spent.',
      'Reallocate budget quarterly based on ranked priorities.',
      'Document channel priority rationale in a shared planning doc.',
    ],
  },
  {
    factorNumber: 3, domainId: 'mkt_d01_market_business_context', name: 'Location Economics Context',
    description: 'Assesses understanding of how foot traffic patterns, rent costs, and nearby competition affect marketing ROI for each location.',
    funnelStages: ['awareness'], impactLevel: 'medium', evidenceClass: 'PUBLIC', controllability: 'partial',
    expectedTimeToImpact: 'medium', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Map foot-traffic heatmaps for each restaurant location.',
      'Catalog competing restaurants within a one-mile radius.',
      'Adjust marketing budgets per location based on economics data.',
    ],
  },
  {
    factorNumber: 4, domainId: 'mkt_d01_market_business_context', name: 'Service/Daypart Strategy',
    description: 'Measures how explicitly the restaurant targets different dayparts (breakfast, lunch, dinner, late night) with dedicated marketing efforts.',
    funnelStages: ['awareness', 'conversion'], impactLevel: 'medium', evidenceClass: 'PUBLIC', controllability: 'partial',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Identify the weakest daypart by revenue and traffic.',
      'Launch a targeted promotion for that daypart over a 90-day test.',
      'Allocate social media posts proportionally to underperforming dayparts.',
    ],
  },
  {
    factorNumber: 5, domainId: 'mkt_d01_market_business_context', name: 'Growth Objective Alignment',
    description: 'Evaluates whether all marketing activities trace back to a unified growth goal such as same-store sales lift or new-customer acquisition.',
    funnelStages: ['conversion'], impactLevel: 'high', evidenceClass: 'CONNECTED', controllability: 'partial',
    expectedTimeToImpact: 'long-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Create a one-page growth strategy shared across all vendors.',
      'Tie every campaign to at least one KPI in the growth strategy.',
      'Quarterly audit of campaigns against stated growth objectives.',
    ],
  },

  // D02 — Brand Positioning
  {
    factorNumber: 6, domainId: 'mkt_d02_brand_positioning', name: 'Brand Positioning Clarity',
    description: 'Measures how distinct and memorable the restaurant\'s positioning is in the minds of target diners relative to nearby alternatives.',
    funnelStages: ['awareness'], impactLevel: 'high', evidenceClass: 'PUBLIC', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Draft a one-paragraph brand positioning statement.',
      'Audit all touchpoints to ensure consistent use of the positioning language.',
      'Run a brand awareness survey among past diners.',
    ],
  },
  {
    factorNumber: 7, domainId: 'mkt_d02_brand_positioning', name: 'Unique Value Proposition',
    description: 'Assesses whether a distinct value proposition for dining with you is clearly stated and differentiated from competitors.',
    funnelStages: ['awareness', 'conversion'], impactLevel: 'high', evidenceClass: 'PUBLIC', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Define a single-sentence value prop for every digital touchpoint.',
      'Place the value prop above the fold on all web pages.',
      'Test alternative value props in paid ad copy to identify winners.',
    ],
  },
  {
    factorNumber: 8, domainId: 'mkt_d02_brand_positioning', name: 'Brand Consistency',
    description: 'Measures visual and verbal consistency of the brand across all owned channels including GBP, social, website, and delivery platforms.',
    funnelStages: ['awareness'], impactLevel: 'medium', evidenceClass: 'PUBLIC', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Create a brand style guide covering colors, fonts, and photo treatment.',
      'Audit every active platform monthly for adherence to the guide.',
      'Assign a single owner to approve brand changes before they go live.',
    ],
  },
  {
    factorNumber: 9, domainId: 'mkt_d02_brand_positioning', name: 'Audience-Brand Fit',
    description: 'Evaluates how well the restaurant\'s actual and communicated audience matches the demographic that currently dines there.',
    funnelStages: ['awareness'], impactLevel: 'medium', evidenceClass: 'PUBLIC', controllability: 'partial',
    expectedTimeToImpact: 'medium', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Analyze past-transaction demographics against brand persona statements.',
      'Adjust audience targeting parameters in paid tools to better match.',
      'Use the CRM data to validate whether current messaging reaches the intended segment.',
    ],
  },
  {
    factorNumber: 10, domainId: 'mkt_d02_brand_positioning', name: 'Occasion Positioning',
    description: 'Measures whether the brand actively claims specific dining occasions such as date night and family celebration as a differentiator.',
    funnelStages: ['awareness', 'conversion'], impactLevel: 'medium', evidenceClass: 'PUBLIC', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Identify the top three occasions diners associate with your brand.',
      'Create targeted offers tied to each occasion on social and email.',
      'Use occasion-based creative in paid search ad groups.',
    ],
  },

  // D03 — Audience & Demand Intelligence
  {
    factorNumber: 11, domainId: 'mkt_d03_audience_demand_intelligence', name: 'Target Customer Definition',
    description: 'Assesses how precisely the restaurant defines and operationalizes its primary customer segments in data and creative.',
    funnelStages: ['conversion'], impactLevel: 'high', evidenceClass: 'CONNECTED', controllability: 'partial',
    expectedTimeToImpact: 'medium', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Write detailed audience profiles for the top two customer segments.',
      'Map each profile to specific keyword lists and ad targeting sets.',
      'Review segmentation annually or after any repositioning.',
    ],
  },
  {
    factorNumber: 12, domainId: 'mkt_d03_audience_demand_intelligence', name: 'Geographic Demand',
    description: 'Measures the ability to identify which postal codes and neighborhoods drive the most traffic and orders to each location.',
    funnelStages: ['awareness'], impactLevel: 'high', evidenceClass: 'CONNECTED', controllability: 'partial',
    expectedTimeToImpact: 'medium', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Map origin ZIP codes from your last 90 days of transactions.',
      'Identify underpenetrated neighborhoods with high search volume.',
      'Test geo-targeted paid ads in those neighborhoods.',
    ],
  },
  {
    factorNumber: 13, domainId: 'mkt_d03_audience_demand_intelligence', name: 'Search Demand',
    description: 'Evaluates whether the restaurant aligns its keyword strategy with real search query volume in relevant cuisine and location segments.',
    funnelStages: ['awareness', 'conversion'], impactLevel: 'high', evidenceClass: 'CONNECTED', controllability: 'partial',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Export Google Search Console queries for the past quarter.',
      'Cross-reference top queries with competitors\' ad copy.',
      'Create dedicated landing pages or GBP posts for under-targeted queries.',
    ],
  },
  {
    factorNumber: 14, domainId: 'mkt_d03_audience_demand_intelligence', name: 'Demand Seasonality',
    description: 'Measures whether the restaurant has mapped and planned marketing around known seasonal demand patterns for its cuisine type.',
    funnelStages: ['awareness'], impactLevel: 'medium', evidenceClass: 'CONNECTED', controllability: 'partial',
    expectedTimeToImpact: 'medium', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Plot weekly order volume by month for the past two years.',
      'Pre-plan seasonal promotions at least one quarter in advance.',
      'Schedule creative refreshes to align with seasonal events.',
    ],
  },
  {
    factorNumber: 15, domainId: 'mkt_d03_audience_demand_intelligence', name: 'Customer Intent Mix',
    description: 'Evaluates the proportion of transactions driven by clear purchase intent (ordering) versus research-only browsing.',
    funnelStages: ['conversion'], impactLevel: 'high', evidenceClass: 'CONNECTED', controllability: 'partial',
    expectedTimeToImpact: 'medium', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Segment web traffic into research vs order intent using on-page behavior.',
      'Add stronger CTAs to high-intent but low-converting paths.',
      'Retarget researchers who viewed menus but did not order.',
    ],
  },

  // D04 — Local Discovery
  {
    factorNumber: 16, domainId: 'mkt_d04_local_discovery', name: 'Google Business Presence',
    description: 'Measures the completeness and optimization of a restaurant\'s Google Business Profile listing across all fields and media.',
    funnelStages: ['awareness', 'conversion'], impactLevel: 'high', evidenceClass: 'PUBLIC', controllability: 'controlled',
    expectedTimeToImpact: 'immediate', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: 'gbp_profile',
    recommendedActions: [
      'Complete all GBP fields including hours, attributes, and service options.',
      'Add high-quality photos of food, decor, and the team at least monthly.',
      'Verify business categories match primary service offering precisely.',
    ],
  },
  {
    factorNumber: 17, domainId: 'mkt_d04_local_discovery', name: 'Local Search Visibility',
    description: 'Assesses how prominently a restaurant appears in the local map pack for relevant cuisine and location-based queries.',
    funnelStages: ['awareness', 'conversion'], impactLevel: 'high', evidenceClass: 'PUBLIC', controllability: 'partial',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: 'local_search',
    recommendedActions: [
      'Audit which queries surface a GBP profile versus competitors.',
      'Optimize GBP business description with targeted location and cuisine keywords.',
      'Increase review velocity to lift map-pack ranking signals.',
    ],
  },
  {
    factorNumber: 18, domainId: 'mkt_d04_local_discovery', name: 'Location/NAP Accuracy',
    description: 'Measures consistency of the restaurant\'s Name, Address, and Phone across all directories, platforms, and citation sources.',
    funnelStages: ['awareness'], impactLevel: 'high', evidenceClass: 'PUBLIC', controllability: 'controlled',
    expectedTimeToImpact: 'immediate', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: 'location_accuracy',
    recommendedActions: [
      'Run a NAP audit across at least 20 major citation sources.',
      'Correct any inconsistent listings immediately via claimed profiles.',
      'Set up Google Business Profile data quality monitoring for future changes.',
    ],
  },
  {
    factorNumber: 19, domainId: 'mkt_d04_local_discovery', name: 'Platform Discovery Coverage',
    description: 'Evaluates whether the restaurant has claimed and optimized profiles on all major food ordering and discovery platforms.',
    funnelStages: ['awareness'], impactLevel: 'medium', evidenceClass: 'PUBLIC', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'List every platform where diners might discover the restaurant.',
      'Claim each profile and verify listing accuracy.',
      'Prioritize missing profiles by estimated customer acquisition potential per platform.',
    ],
  },
  {
    factorNumber: 20, domainId: 'mkt_d04_local_discovery', name: 'AI/Conversational Discovery',
    description: 'Assesses how accurately the restaurant\'s information is surfaced in responses from AI assistants and voice search.',
    funnelStages: ['awareness', 'conversion'], impactLevel: 'high', evidenceClass: 'PUBLIC', controllability: 'partial',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: 'ai_visibility',
    recommendedActions: [
      'Test your restaurant\'s appearance in Google AI Overview and voice search for top queries.',
      'Ensure schema markup on the website matches GBP data exactly.',
      'Monitor third-party review aggregation feeds for correct ingestion.',
    ],
  },

  // D05 — Organic Search & Website Discovery
  {
    factorNumber: 21, domainId: 'mkt_d05_organic_search_website_discovery', name: 'Search Visibility',
    description: 'Measures the restaurant\'s aggregate ranking position across all tracked keywords on organic search results pages.',
    funnelStages: ['awareness'], impactLevel: 'high', evidenceClass: 'CONNECTED', controllability: 'partial',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Set up rank tracking for the top 30 keywords at a monthly cadence.',
      'Identify keywords ranked page-two and prioritize them for on-page optimization.',
      'Publish location- and cuisine-specific blog posts to target low-hanging keywords.',
    ],
  },
  {
    factorNumber: 22, domainId: 'mkt_d05_organic_search_website_discovery', name: 'Technical SEO',
    description: 'Evaluates core website health including page speed, mobile friendliness, indexing status, and structured data accuracy.',
    funnelStages: ['awareness'], impactLevel: 'medium', evidenceClass: 'PUBLIC', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: 'website_health',
    recommendedActions: [
      'Run a technical SEO crawl and fix all Critical Core Web Vitals issues.',
      'Validate structured data on the menu and contact pages with Google\'s testing tool.',
      'Submit an updated XML sitemap if any page structure changes are made.',
    ],
  },
  {
    factorNumber: 23, domainId: 'mkt_d05_organic_search_website_discovery', name: 'Local SEO Relevance',
    description: 'Measures how well the website content and metadata align with local search intent for each restaurant location.',
    funnelStages: ['awareness'], impactLevel: 'medium', evidenceClass: 'PUBLIC', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Ensure each location has a dedicated page with unique local content.',
      'Embed the correct NAP and Google Map on every location page.',
      'Link all location pages from the main navigation and footer.',
    ],
  },
  {
    factorNumber: 24, domainId: 'mkt_d05_organic_search_website_discovery', name: 'Search Content Coverage',
    description: 'Evaluates whether sufficient blog or editorial content exists to capture long-tail search demand within the cuisine category.',
    funnelStages: ['awareness'], impactLevel: 'medium', evidenceClass: 'PUBLIC', controllability: 'partial',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Audit existing content against top-performing competitor blog topics.',
      'Create at least two SEO-optimized articles per month targeting low-competition queries.',
      'Repurpose high-performing social content into blog format for search indexing.',
    ],
  },
  {
    factorNumber: 25, domainId: 'mkt_d05_organic_search_website_discovery', name: 'Search Snippet Effectiveness',
    description: 'Measures how often the restaurant\'s pages earn rich snippet features such as star ratings, FAQs, and featured lists in SERPs.',
    funnelStages: ['awareness', 'conversion'], impactLevel: 'medium', evidenceClass: 'PUBLIC', controllability: 'partial',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Add FAQ schema to the FAQ page targeting top customer questions.',
      'Validate review rating markup so star snippets populate in organic results.',
      'Monitor Google Rich Results report monthly for errors.',
    ],
  },

  // D06 — Reputation & Trust
  {
    factorNumber: 26, domainId: 'mkt_d06_reputation_and_trust', name: 'Rating Strength',
    description: 'Measures the aggregate star rating across major review platforms relative to the local competitive set.',
    funnelStages: ['awareness', 'conversion'], impactLevel: 'high', evidenceClass: 'PUBLIC', controllability: 'controlled',
    expectedTimeToImpact: 'immediate', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: 'avg_rating',
    recommendedActions: [
      'Set a minimum rating floor and investigate any drops below threshold immediately.',
      'Train staff to deliver consistently excellent table-level service.',
      'Highlight high ratings in social posts and GBP updates.',
    ],
  },
  {
    factorNumber: 27, domainId: 'mkt_d06_reputation_and_trust', name: 'Review Volume',
    description: 'Measures the total number of recent reviews acquired per month on all aggregated platforms compared to baseline goals.',
    funnelStages: ['awareness', 'conversion'], impactLevel: 'high', evidenceClass: 'PUBLIC', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: 'review_volume_freshness',
    recommendedActions: [
      'Set a monthly review acquisition goal and track weekly progress.',
      'Add QR table talkers that link directly to the most impactful review platform.',
      'Train servers to verbally invite satisfied guests to leave a review.',
    ],
  },
  {
    factorNumber: 28, domainId: 'mkt_d06_reputation_and_trust', name: 'Review Freshness & Velocity',
    description: 'Measures the rate at which new reviews are arriving so algorithms treat the business as active and growing.',
    funnelStages: ['awareness'], impactLevel: 'medium', evidenceClass: 'PUBLIC', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: 'review_volume_freshness',
    recommendedActions: [
      'Stagger review requests across all weeks instead of batching them at month-end.',
      'Launch a small campaign around new menu items to generate fresh reviews.',
      'Monitor the gap between last-review-date and today weekly.',
    ],
  },
  {
    factorNumber: 29, domainId: 'mkt_d06_reputation_and_trust', name: 'Review Sentiment & Themes',
    description: 'Evaluates the dominant positive and negative themes emerging from review text to identify operational pain points.',
    funnelStages: ['conversion'], impactLevel: 'medium', evidenceClass: 'PUBLIC', controllability: 'partial',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: 'sentiment',
    recommendedActions: [
      'Run sentiment analysis on the last 200 reviews across all platforms.',
      'Share top-negative themes with operations and track improvement over time.',
      'Respond to negative reviews that mention recurring issues with corrective actions.',
    ],
  },
  {
    factorNumber: 30, domainId: 'mkt_d06_reputation_and_trust', name: 'Review Management',
    description: 'Measures responsiveness and professionalism in replying to both positive and negative reviews across all platforms.',
    funnelStages: ['conversion'], impactLevel: 'high', evidenceClass: 'PUBLIC', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: 'review_response',
    recommendedActions: [
      'Respond to all reviews within 48 hours, with a custom message per review.',
      'Create template responses for common themes that staff can personalize.',
      'Escalate any multi-star negative review to the general manager personally.',
    ],
  },

  // D07 — Content & Creative
  {
    factorNumber: 31, domainId: 'mkt_d07_content_and_creative', name: 'Content Strategy',
    description: 'Measures whether the restaurant has a documented content calendar aligned to events, seasons, and operational priorities.',
    funnelStages: ['awareness'], impactLevel: 'medium', evidenceClass: 'PUBLIC', controllability: 'controlled',
    expectedTimeToImpact: 'medium', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Build a quarterly content calendar with at least two themes per month.',
      'Include a mix of menu launches, behind-the-scenes, and community content.',
      'Assign each content pillar to a responsible team member.',
    ],
  },
  {
    factorNumber: 32, domainId: 'mkt_d07_content_and_creative', name: 'Content Freshness',
    description: 'Measures how frequently new photos, posts, and offers are published across all owned channels.',
    funnelStages: ['awareness'], impactLevel: 'low', evidenceClass: 'PUBLIC', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Set a minimum of three new media assets per week across all platforms.',
      'Rotate old menu photos quarterly to signal freshness in algorithms.',
      'Use the GBP Posts feature weekly for time-sensitive updates.',
    ],
  },
  {
    factorNumber: 33, domainId: 'mkt_d07_content_and_creative', name: 'Food Photography',
    description: 'Evaluates the visual quality of food photography used on menus, delivery platforms, social channels, and GBP.',
    funnelStages: ['conversion'], impactLevel: 'medium', evidenceClass: 'PUBLIC', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: 'photos_media',
    recommendedActions: [
      'Hire a professional food photographer for the full menu at least annually.',
      'Shoot overhead, angled, and detail shots for each hero item.',
      'Update dish photography on delivery apps within two weeks of any recipe change.',
    ],
  },
  {
    factorNumber: 34, domainId: 'mkt_d07_content_and_creative', name: 'Video Content',
    description: 'Measures the quantity and production quality of video content used across social stories, reels, and platform feeds.',
    funnelStages: ['awareness', 'conversion'], impactLevel: 'medium', evidenceClass: 'PUBLIC', controllability: 'controlled',
    expectedTimeToImpact: 'medium', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Film at least one short vertical video per week showing kitchen or customer moments.',
      'Prioritize behind-the-scenes and ingredient-sourcing topics that humanize the brand.',
      'Repurpose long-form video into five shorter clips for different platform feeds.',
    ],
  },
  {
    factorNumber: 35, domainId: 'mkt_d07_content_and_creative', name: 'Creative Message Quality',
    description: 'Assesses the clarity, emotional appeal, and persuasive power of copywriting across all marketing assets.',
    funnelStages: ['awareness', 'conversion'], impactLevel: 'medium', evidenceClass: 'PUBLIC', controllability: 'partial',
    expectedTimeToImpact: 'medium', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Review all ad copy and landing page headlines for specificity and benefit-led messaging.',
      'Use competitor creative in A/B tests to gauge relative quality of messaging.',
      'Run customer focus groups or surveys on ad concepts before broad rollout.',
    ],
  },

  // D08 — Social & Community
  {
    factorNumber: 36, domainId: 'mkt_d08_social_and_community', name: 'Social Channel Coverage',
    description: 'Measures whether the restaurant maintains active profiles on all relevant social platforms for its target demographic.',
    funnelStages: ['awareness'], impactLevel: 'medium', evidenceClass: 'PUBLIC', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'List platforms your target audience actually uses and prioritize the top three.',
      'Deactivate or audit dormant profiles older than six months without activity.',
      'Standardize profile images and bios across all active channels.',
    ],
  },
  {
    factorNumber: 37, domainId: 'mkt_d08_social_and_community', name: 'Social Publishing Consistency',
    description: 'Evaluates how regularly and predictably content is published on owned social channels per week and per month.',
    funnelStages: ['awareness'], impactLevel: 'low', evidenceClass: 'PUBLIC', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Define a minimum posting cadence—e.g., three feed posts and seven stories per week.',
      'Use a scheduler tool to batch-create at least one content block per month.',
      'Log any missed weeks in a rolling calendar to track consistency over time.',
    ],
  },
  {
    factorNumber: 38, domainId: 'mkt_d08_social_and_community', name: 'Social Engagement',
    description: 'Measures likes, comments, shares, and saves received relative to follower count against local restaurant benchmarks.',
    funnelStages: ['awareness', 'conversion'], impactLevel: 'medium', evidenceClass: 'PUBLIC', controllability: 'partial',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Respond to every comment within two business hours to boost engagement signals.',
      'Post interactive content such as polls and questions at least twice per week.',
      'Analyze which post formats earn the highest engagement and double down on them.',
    ],
  },
  {
    factorNumber: 39, domainId: 'mkt_d08_social_and_community', name: 'User-Generated Content',
    description: 'Measures how much organic customer-created content features the restaurant and whether it is actively encouraged and repurposed.',
    funnelStages: ['awareness', 'conversion'], impactLevel: 'medium', evidenceClass: 'PUBLIC', controllability: 'partial',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Create an Instagrammable photo moment or signature dish designed for sharing.',
      'Repost customer UGC weekly with proper credit and permission.',
      'Create a branded hashtag and display it on table talkers and receipts.',
    ],
  },
  {
    factorNumber: 40, domainId: 'mkt_d08_social_and_community', name: 'Community/Creator Authority',
    description: 'Evaluates the restaurant\'s credibility and reach through collaborations with local influencers and food creators.',
    funnelStages: ['awareness'], impactLevel: 'medium', evidenceClass: 'PUBLIC', controllability: 'partial',
    expectedTimeToImpact: 'medium', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Build a roster of five to ten local food creators for ongoing partnerships.',
      'Host creator tasting events quarterly and provide unique promo codes for tracking.',
      'Co-create content with complementary local businesses for shared audience reach.',
    ],
  },

  // D09 — Paid Customer Acquisition
  {
    factorNumber: 41, domainId: 'mkt_d09_paid_customer_acquisition', name: 'Paid Search Strategy',
    description: 'Measures whether paid search campaigns target high-intent local queries with tightly themed ad groups and landing pages.',
    funnelStages: ['conversion'], impactLevel: 'high', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Group keywords by cuisine-and-location intent with dedicated ad copy per group.',
      'Ensure every paid search ad links directly to the matched landing page, not home.',
      'Pause underperforming broad-match keywords and reallocate budget to exact match.',
    ],
  },
  {
    factorNumber: 42, domainId: 'mkt_d09_paid_customer_acquisition', name: 'Paid Social Strategy',
    description: 'Evaluates whether paid social campaigns leverage visual assets and audience signals proven to drive foot traffic for restaurants.',
    funnelStages: ['conversion'], impactLevel: 'high', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Define lookalike audiences based on your highest-LTV customer segments.',
      'A/B test static food photos against short-form video for ad creative.',
      'Set geographic radii of two to five miles from each location as targeting bounds.',
    ],
  },
  {
    factorNumber: 43, domainId: 'mkt_d09_paid_customer_acquisition', name: 'Geographic Targeting',
    description: 'Assesses the precision with which paid campaigns are geo-targeted to drive discoverable and orderable traffic around each location.',
    funnelStages: ['conversion'], impactLevel: 'medium', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Use geo-fenced radius targeting instead of broad city-level placement.',
      'Layer demographic and income data filters to eliminate wasteful impressions.',
      'Review heatmaps of past-order origins to refine daily geo-targeting adjustments.',
    ],
  },
  {
    factorNumber: 44, domainId: 'mkt_d09_paid_customer_acquisition', name: 'Paid Creative Quality',
    description: 'Measures the scroll-stopping power and brand alignment of creatives used across all paid ad placements.',
    funnelStages: ['conversion'], impactLevel: 'high', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Run creative rotation tests monthly to identify the top-performing visual style.',
      'Ensure every ad highlights a single offer or menu item rather than listing everything.',
      'Refresh all creatives quarterly before they reach ad fatigue thresholds.',
    ],
  },
  {
    factorNumber: 45, domainId: 'mkt_d09_paid_customer_acquisition', name: 'Paid Audience Strategy',
    description: 'Evaluates whether audience segments in paid campaigns are built on data-backed criteria rather than broad interest targeting.',
    funnelStages: ['conversion'], impactLevel: 'high', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Build first-party lookalike audiences from the CRM database quarterly.',
      'Create retargeting pools for anyone who engaged with the menu but did not order.',
      'Exclude prior customers from prospecting campaigns to reduce wasted spend.',
    ],
  },

  // D10 — Digital Conversion Experience
  {
    factorNumber: 46, domainId: 'mkt_d10_digital_conversion_experience', name: 'Primary CTA Clarity',
    description: 'Measures how unambiguously the primary call to action—order, book, or call—stands out on first glance across all pages.',
    funnelStages: ['conversion'], impactLevel: 'high', evidenceClass: 'PUBLIC', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Place a prominent CTA button above the fold that links directly to ordering.',
      'Reduce the number of competing buttons to exactly one primary and zero secondary on key pages.',
      'Test CTA text variants like Order Now versus Dine Through Our App for conversion lift.',
    ],
  },
  {
    factorNumber: 47, domainId: 'mkt_d10_digital_conversion_experience', name: 'Conversion Path Length',
    description: 'Measures the number of clicks or taps required from landing to completed order or reservation in the digital journey.',
    funnelStages: ['conversion'], impactLevel: 'high', evidenceClass: 'PUBLIC', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Map the current checkout flow and eliminate at least one step from the path per iteration.',
      'Enable one-click reordering for returning customers captured in CRM.',
      'Test accelerated guest checkout with saved payment information.',
    ],
  },
  {
    factorNumber: 48, domainId: 'mkt_d10_digital_conversion_experience', name: 'Mobile Conversion Experience',
    description: 'Evaluates whether the ordering and reservation experience on mobile devices matches or exceeds desktop performance.',
    funnelStages: ['conversion'], impactLevel: 'high', evidenceClass: 'PUBLIC', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Test the full mobile ordering journey weekly across three device sizes.',
      'Optimize tap targets and form fields to prevent mis-taps on small screens.',
      'Validate that delivery radius selection works smoothly in mobile Safari and Chrome.',
    ],
  },
  {
    factorNumber: 49, domainId: 'mkt_d10_digital_conversion_experience', name: 'Conversion Friction',
    description: 'Measures all friction points—such as mandatory sign-ups, hidden fees, or slow load times—that cause abandonments in the funnel.',
    funnelStages: ['conversion'], impactLevel: 'high', evidenceClass: 'PUBLIC', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Install session recordings and analyze drop-off at each step of the conversion funnel.',
      'Remove forced account creation for first-time buyers by offering guest checkout.',
      'Address all Core Web Vitals performance issues above a passing threshold.',
    ],
  },
  {
    factorNumber: 50, domainId: 'mkt_d10_digital_conversion_experience', name: 'Conversion Trust',
    description: 'Evaluates visible trust signals such as secure payment badges, food safety certifications, and social proof during checkout.',
    funnelStages: ['conversion'], impactLevel: 'high', evidenceClass: 'PUBLIC', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Display recognized security badges and accepted payment types near the CTA.',
      'Surface aggregate rating and review count prominently on the checkout page.',
      'Show any food safety awards or health-grade certifications in the sidebar.',
    ],
  },

  // D11 — Ordering, Reservations & Local Actions
  {
    factorNumber: 51, domainId: 'mkt_d11_ordering_reservations_local_actions', name: 'Online Ordering Availability',
    description: 'Measures whether customers can seamlessly order for delivery or pickup through at least one owned and one aggregated channel.',
    funnelStages: ['conversion'], impactLevel: 'high', evidenceClass: 'PUBLIC', controllability: 'controlled',
    expectedTimeToImpact: 'immediate', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: 'online_ordering',
    recommendedActions: [
      'Launch or audit your own ordering channel before relying solely on aggregators.',
      'Verify delivery radius and prep time estimates are current on each platform.',
      'Promote the lowest-cost ordering channel prominently on social media and GBP.',
    ],
  },
  {
    factorNumber: 52, domainId: 'mkt_d11_ordering_reservations_local_actions', name: 'Ordering Conversion Quality',
    description: 'Evaluates the menu-to-order conversion rate for online ordering across all channels relative to platform benchmarks.',
    funnelStages: ['conversion'], impactLevel: 'high', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Track the menu-to-order rate weekly by channel and flag underperforming ones.',
      'A/B test simplified layouts on the ordering interface to reduce cognitive load.',
      'Add popular-add-on prompts at the right step in the ordering flow to increase average order value.',
    ],
  },
  {
    factorNumber: 53, domainId: 'mkt_d11_ordering_reservations_local_actions', name: 'Reservation Availability',
    description: 'Measures whether an easy reservation-booking experience exists on the primary platform diners expect for each cuisine type.',
    funnelStages: ['conversion'], impactLevel: 'high', evidenceClass: 'PUBLIC', controllability: 'controlled',
    expectedTimeToImpact: 'immediate', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: 'reservations',
    recommendedActions: [
      'Connect the restaurant to OpenTable, Resy, or the dominant platform for that market.',
      'Sync real-time table availability daily to prevent overbooking incidents.',
      'Add a reservation button above the fold on the website homepage at all times.',
    ],
  },
  {
    factorNumber: 54, domainId: 'mkt_d11_ordering_reservations_local_actions', name: 'Reservation Conversion Quality',
    description: 'Evaluates how many seated diners result from reservation clicks versus show-up rates and table utilization efficiency.',
    funnelStages: ['conversion'], impactLevel: 'high', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Set confirmation reminders via SMS and email 24 hours before each seated booking.',
      'Track no-show rates by day of week and adjust reservation caps accordingly.',
      'Offer a small perk for confirmed walk-ins on high-no-show days to improve show-up behavior.',
    ],
  },
  {
    factorNumber: 55, domainId: 'mkt_d11_ordering_reservations_local_actions', name: 'Calls/Directions/Visits',
    description: 'Measures the volume and accuracy of local action metrics—clicks for directions, phone taps, and menu views on GBP.',
    funnelStages: ['conversion'], impactLevel: 'high', evidenceClass: 'PUBLIC', controllability: 'partial',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Enable call tracking to attribute phone calls to specific marketing channels.',
      'Review GBP insights weekly for directional clicks and filter by source device.',
      'Ensure the directions link opens directly in native map apps on mobile.',
    ],
  },

  // D12 — Offers & Menu Merchandising
  {
    factorNumber: 56, domainId: 'mkt_d12_offers_menu_merchandising', name: 'Offer Strategy',
    description: 'Measures how intentionally the restaurant designs offers such as combos or LTV-boosting bundles rather than random discounts.',
    funnelStages: ['conversion'], impactLevel: 'medium', evidenceClass: 'PUBLIC', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Design at least one hero combo or bundle that highlights high-margin items.',
      'Cap the number of deep-discount days per month to protect margin.',
      'A/B test bundle pricing against à la carte ordering to validate lift.',
    ],
  },
  {
    factorNumber: 57, domainId: 'mkt_d12_offers_menu_merchandising', name: 'Promotional Economics',
    description: 'Evaluates whether every promotion meets a minimum margin threshold and contributes to customer acquisition or retention goals.',
    funnelStages: ['conversion'], impactLevel: 'high', evidenceClass: 'CONNECTED', controllability: 'partial',
    expectedTimeToImpact: 'medium', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Calculate the break-even increment for every active promotion before launch.',
      'Exclude promotions from items whose COGS would exceed margin floor under discount.',
      'Track incremental revenue per promotion dollar and kill anything below threshold after two weeks.',
    ],
  },
  {
    factorNumber: 58, domainId: 'mkt_d12_offers_menu_merchandising', name: 'Menu Merchandising',
    description: 'Measures how effectively menu layout, item grouping, and descriptions drive customers toward high-margin choices.',
    funnelStages: ['conversion'], impactLevel: 'medium', evidenceClass: 'PUBLIC', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: 'menu_availability_quality',
    recommendedActions: [
      'Place top-margin items in the golden zone—the upper right quadrant of the digital menu.',
      'Use descriptive copy and icons to draw attention to chef-recommended items.',
      'Remove or redesign underperforming dishes that drag down average order value.',
    ],
  },
  {
    factorNumber: 59, domainId: 'mkt_d12_offers_menu_merchandising', name: 'Daypart Promotions',
    description: 'Measures whether specific promotions are offered at different dayparts to shift demand and fill underutilized service windows.',
    funnelStages: ['conversion'], impactLevel: 'medium', evidenceClass: 'PUBLIC', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Launch a morning or lunch deal to fill the lowest-traffic window in each day.',
      'Push daypart-exclusive offers via geo-targeted ads and email to past daytime diners.',
      'Track incremental covers from daypart promos over three-month rolling windows.',
    ],
  },
  {
    factorNumber: 60, domainId: 'mkt_d12_offers_menu_merchandising', name: 'Seasonal/Event Marketing',
    description: 'Measures whether the restaurant proactively launches limited-time offers tied to holidays, sports events, and local happenings.',
    funnelStages: ['conversion'], impactLevel: 'medium', evidenceClass: 'PUBLIC', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Create a seasonal promotion calendar at least six weeks before each event.',
      'Develop LTO menus or bundles that align with the occasion rather than generic discounts.',
      'Activate promotions across email, social, and GBP at least three days prior to the event date.',
    ],
  },

  // D13 — First-Party Data & CRM
  {
    factorNumber: 61, domainId: 'mkt_d13_first_party_data_crm', name: 'Customer Data Capture',
    description: 'Measures how much first-party email, phone, and preference data is captured relative to total transactions.',
    funnelStages: ['conversion'], impactLevel: 'high', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Add a data capture point in every online checkout flow and reservation booking.',
      'Offer a small incentive for customers who voluntarily supply an email or phone number.',
      'Audit the capture rate monthly and target a minimum percentage of transactions captured.',
    ],
  },
  {
    factorNumber: 62, domainId: 'mkt_d13_first_party_data_crm', name: 'Customer Profile Completeness',
    description: 'Measures what percentage of captured profiles include key fields such as first order date, average check, and dietary preferences.',
    funnelStages: ['conversion'], impactLevel: 'medium', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'medium', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Set profile completion as a KPI for the CRM operations team.',
      'Enrich existing profiles periodically with transaction-derived data automatically.',
      'Prompt customers with lightweight preference quizzes to fill demographic gaps.',
    ],
  },
  {
    factorNumber: 63, domainId: 'mkt_d13_first_party_data_crm', name: 'Customer Identity Resolution',
    description: 'Evaluates the accuracy of merging duplicate customer records across ordering platforms, POS, and loyalty accounts.',
    funnelStages: ['conversion'], impactLevel: 'medium', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'medium', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Activate identity-resolution rules in the CRM platform to match email and phone matches.',
      'Run quarterly deduplication audits and review false merge alerts.',
      'Ensure guest profiles created across channels are linked to one master record.',
    ],
  },
  {
    factorNumber: 64, domainId: 'mkt_d13_first_party_data_crm', name: 'Customer Segmentation',
    description: 'Measures whether the restaurant divides its customer base into actionable groups based on behavior rather than static demographics.',
    funnelStages: ['conversion'], impactLevel: 'high', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'medium', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Create at least three dynamic segments: frequent buyers, lapsed high-value, and new customers.',
      'Automate segment assignment based on last-order-date and lifetime value thresholds.',
      'Review segment composition monthly for drift and recalibrate thresholds.',
    ],
  },
  {
    factorNumber: 65, domainId: 'mkt_d13_first_party_data_crm', name: 'Preference Intelligence',
    description: 'Measures whether the CRM collects and applies individual customer preferences—dietary needs, favorites, birthday—to personalization efforts.',
    funnelStages: ['conversion'], impactLevel: 'medium', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'medium', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Add a dietary preference prompt within the ordering flow.',
      'Use saved favorites at checkout to pre-populate or suggest add-ons.',
      'Trigger a personalized offer using birthday data set during registration.',
    ],
  },

  // D14 — Lifecycle Marketing
  {
    factorNumber: 66, domainId: 'mkt_d14_lifecycle_marketing', name: 'Email Marketing Health',
    description: 'Evaluates overall email program performance—open rates, click-through rates, list health, and engagement benchmarks.',
    funnelStages: ['conversion', 'loyalty'], impactLevel: 'high', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Clean the list quarterly by purging any segment below 5 percent engagement.',
      'Maintain an average send cadence of two to four emails per week during active promotion periods.',
      'A/B subject lines monthly to identify tone and length patterns that lift opens.',
    ],
  },
  {
    factorNumber: 67, domainId: 'mkt_d14_lifecycle_marketing', name: 'SMS Marketing Health',
    description: 'Measures the engagement and deliverability of SMS campaigns relative to platform averages for restaurants.',
    funnelStages: ['conversion'], impactLevel: 'medium', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Limit SMS sends to one to two per week to avoid opt-out fatigue.',
      'Always include an opt-out link and honor withdrawal requests immediately.',
      'A/B test urgency-driven copy in time-sensitive promotions for the highest conversion lift.',
    ],
  },
  {
    factorNumber: 68, domainId: 'mkt_d14_lifecycle_marketing', name: 'Welcome Journey',
    description: 'Measures whether every new customer receives a structured sequence of welcome messages that drive a first repeat interaction.',
    funnelStages: ['conversion', 'loyalty'], impactLevel: 'high', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Build a three-email welcome sequence spanning seven days for every new subscriber.',
      'Include a first-repeat incentive in the third email of the sequence.',
      'Track the welcome-sequence to-first-repeat rate as a primary metric.',
    ],
  },
  {
    factorNumber: 69, domainId: 'mkt_d14_lifecycle_marketing', name: 'Post-Visit Journey',
    description: 'Evaluates whether customers receive thoughtful engagement messages after their first visit to encourage repeat behavior.',
    funnelStages: ['loyalty'], impactLevel: 'high', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Send a thank-you email within 24 hours of the first visit with a review link and second-visit offer.',
      'Personalize messages using past order details to make them relevant.',
      'Add a calendar prompt for customers who dined during a special occasion.',
    ],
  },
  {
    factorNumber: 70, domainId: 'mkt_d14_lifecycle_marketing', name: 'Win-Back Journey',
    description: 'Measures how quickly and effectively the restaurant targets lapsed customers with personalized re-engagement efforts.',
    funnelStages: ['loyalty'], impactLevel: 'medium', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'medium', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Flag any customer past 60 days since last order as a win-back candidate.',
      'Send a personalized offer with a time-limited incentive to return within seven days.',
      'If the first win-back fails, schedule a follow-up two weeks later with a progressively stronger incentive.',
    ],
  },

  // D15 — Loyalty, Retention & Advocacy
  {
    factorNumber: 71, domainId: 'mkt_d15_loyalty_retention_advocacy', name: 'Loyalty Program Availability',
    description: 'Measures whether a structured loyalty or rewards program exists and is actively promoted at every customer touchpoint.',
    funnelStages: ['loyalty'], impactLevel: 'medium', evidenceClass: 'PUBLIC', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Launch a simple point-based program where every dollar spent counts toward the next reward.',
      'Promote sign-up at checkout, on receipts, and via table talkers with QR codes.',
      'Ensure the program is accessible through mobile app or text rather than a separate card.',
    ],
  },
  {
    factorNumber: 72, domainId: 'mkt_d15_loyalty_retention_advocacy', name: 'Reward Quality',
    description: 'Evaluates whether the rewards perceived as valuable by customers relative to the cost and effort required to earn them.',
    funnelStages: ['loyalty'], impactLevel: 'medium', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'medium', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Survey members on their top reward preferences before designing the next tier.',
      'Ensure rewards can be claimed within two earning cycles to maintain perceived attainability.',
      'Include non-food rewards like early access or exclusive tastings in high tiers.',
    ],
  },
  {
    factorNumber: 73, domainId: 'mkt_d15_loyalty_retention_advocacy', name: 'Repeat Visit Health',
    description: 'Measures the rate and velocity of repeat visits across the customer base relative to cohort and industry benchmarks.',
    funnelStages: ['loyalty'], impactLevel: 'high', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'medium', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Track repeat-visit rate by 30-day and 90-day cohorts monthly.',
      'Identify the average number of visits before churn and time re-engagement programs accordingly.',
      'Compare repeat rates across segments to find which onboarding produces loyal behavior fastest.',
    ],
  },
  {
    factorNumber: 74, domainId: 'mkt_d15_loyalty_retention_advocacy', name: 'Personalization',
    description: 'Measures how actively individual customer data is used to tailor offers, menu recommendations, and outreach across channels.',
    funnelStages: ['loyalty'], impactLevel: 'medium', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'medium', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Automate menu personalization at the email level based on prior order history.',
      'Tag customers by cuisine preference and send targeted offers aligned to those tags.',
      'Monitor open-rate lift from personalized versus template campaigns as a health signal.',
    ],
  },
  {
    factorNumber: 75, domainId: 'mkt_d15_loyalty_retention_advocacy', name: 'Referral/Advocacy',
    description: 'Measures the volume and effectiveness of customer-driven referrals through formal programs or organic word of mouth.',
    funnelStages: ['loyalty'], impactLevel: 'high', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'medium', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Launch a two-sided referral program offering credit to both referrer and referred friend.',
      'Highlight top reviewers and UGC creators prominently on social for advocacy recognition.',
      'Track referral-attributed revenue per active member monthly as a program health metric.',
    ],
  },

  // D16 — Analytics, Measurement & Attribution
  {
    factorNumber: 76, domainId: 'mkt_d16_analytics_measurement_attribution', name: 'Analytics Foundation',
    description: 'Evaluates whether the restaurant has a functioning analytics stack covering web, app, POS, and platform data sources.',
    funnelStages: ['conversion'], impactLevel: 'high', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Confirm Google Analytics 4 and the POS data pipeline are each capturing events accurately.',
      'Set up a single dashboard that unifies online and offline data for quick access.',
      'Perform quarterly data-quality audits comparing analytics totals to source-system reports.',
    ],
  },
  {
    factorNumber: 77, domainId: 'mkt_d16_analytics_measurement_attribution', name: 'Event Taxonomy',
    description: 'Measures how well custom events in the analytics platform map to the restaurant\'s defined conversion and engagement goals.',
    funnelStages: ['conversion'], impactLevel: 'medium', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Define a documented event taxonomy covering key steps from browse to order.',
      'Validate implementation in Google Tag Manager using preview mode on the live site.',
      'Remove unused or redundant events that clutter reporting dashboards.',
    ],
  },
  {
    factorNumber: 78, domainId: 'mkt_d16_analytics_measurement_attribution', name: 'Key Event Integrity',
    description: 'Measures whether critical conversion events fire correctly and consistently across all pages, devices, and platforms.',
    funnelStages: ['conversion'], impactLevel: 'high', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Set up alerting for any drop in event volume that exceeds a 20 percent deviation from the weekly average.',
      'Test key events manually on mobile and desktop after every site or tag update.',
      'Verify that checkout events fire even under partial network failures to catch silent errors.',
    ],
  },
  {
    factorNumber: 79, domainId: 'mkt_d16_analytics_measurement_attribution', name: 'Attribution Quality',
    description: 'Evaluates whether the chosen attribution model fairly allocates credit across channels for each conversion path.',
    funnelStages: ['conversion', 'loyalty'], impactLevel: 'high', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'medium', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Compare at least two attribution models—data-driven and time decay—to identify channel value shifts.',
      'Use platform-level attribution where first-party data is insufficient for cross-channel visibility.',
      'Review budget allocation quarterly based on the model that best predicts incrementality.',
    ],
  },
  {
    factorNumber: 80, domainId: 'mkt_d16_analytics_measurement_attribution', name: 'Marketing-to-Business Outcome Linkage',
    description: 'Measures whether marketing KPIs are connected back to revenue and profit metrics rather than treated as vanity benchmarks.',
    funnelStages: ['conversion', 'loyalty'], impactLevel: 'high', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'medium', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Build a monthly report that correlates marketing activity to same-store sales per location.',
      'Calculate the revenue-per-marketing-dollar for each active channel quarterly.',
      'Hold the operations team and marketing team accountable to shared revenue dashboards instead of separate KPIs.',
    ],
  },

  // D17 — Experimentation & Optimization
  {
    factorNumber: 81, domainId: 'mkt_d17_experimentation_optimization', name: 'Experimentation Capability',
    description: 'Evaluates whether the restaurant has a structured process for designing, running, and analyzing marketing experiments.',
    funnelStages: ['conversion'], impactLevel: 'medium', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'medium', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Create a test backlog prioritized by expected impact and implementation ease.',
      'Run at least two controlled experiments per month with defined success criteria.',
      'Archive all results in a shared repository so learnings compound across campaigns.',
    ],
  },
  {
    factorNumber: 82, domainId: 'mkt_d17_experimentation_optimization', name: 'Creative Testing',
    description: 'Measures the volume and rigor of controlled tests run on ad and content creative formats to identify winning approaches.',
    funnelStages: ['conversion'], impactLevel: 'medium', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'medium', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Use platform-native multivariate testing to evaluate at least three creative variants per campaign.',
      'Document winning visual styles and hooks in a shared creative playbook.',
      'Test new creatives against control weekly rather than waiting for the annual refresh.',
    ],
  },
  {
    factorNumber: 83, domainId: 'mkt_d17_experimentation_optimization', name: 'Audience Testing',
    description: 'Evaluates the testing of alternate audience segments to identify which groups respond best to existing creative and offers.',
    funnelStages: ['conversion'], impactLevel: 'medium', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'medium', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Run split tests of identical creative across two to three audience segments simultaneously.',
      'Measure which segment delivers the lowest CPA and slowest churn for optimization focus.',
      'Document winner segments quarterly and adjust prospecting audiences accordingly.',
    ],
  },
  {
    factorNumber: 84, domainId: 'mkt_d17_experimentation_optimization', name: 'Offer Testing',
    description: 'Measures whether different promotional offers are systematically A/B tested to maximize ROI before broad rollout.',
    funnelStages: ['conversion'], impactLevel: 'medium', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'medium', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Test percentage-off versus dollar-off offers with matched customer pools.',
      'Measure incremental revenue rather than gross conversion to determine winner.',
      'Rotate winning offers into evergreen promotion with seasonal packaging for sustained lift.',
    ],
  },
  {
    factorNumber: 85, domainId: 'mkt_d17_experimentation_optimization', name: 'Learning Velocity',
    description: 'Measures how quickly and efficiently new insights from tests and experiments are implemented across the marketing program.',
    funnelStages: ['conversion', 'loyalty'], impactLevel: 'medium', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'long-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Set a policy to review and act on experiment results within seven days of conclusion.',
      'Maintain a cross-functional learning team that disseminates findings to all channel owners.',
      'Track the percentage of winning tests implemented within 30 days as a velocity KPI.',
    ],
  },

  // D18 — Competitive & Market Intelligence
  {
    factorNumber: 86, domainId: 'mkt_d18_competitive_market_intelligence', name: 'Competitor Set Accuracy',
    description: 'Measures how accurately the restaurant\'s defined competitive set reflects the actual options diners consider at the moment of search.',
    funnelStages: ['awareness'], impactLevel: 'high', evidenceClass: 'PUBLIC', controllability: 'partial',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Use search analytics to identify which restaurants appear alongside your brand in local pack.',
      'Conduct a mystery-shop of each competitor\'s digital presence on a quarterly basis.',
      'Refresh the competitive set annually or whenever new nearby openings change the landscape.',
    ],
  },
  {
    factorNumber: 87, domainId: 'mkt_d18_competitive_market_intelligence', name: 'Discovery Share vs Competitors',
    description: 'Evaluates your share of online discovery—shares of GBP views, search impressions, and review volume—relative to the competitive set.',
    funnelStages: ['awareness', 'conversion'], impactLevel: 'high', evidenceClass: 'PUBLIC', controllability: 'partial',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Track monthly GBP insights and compare to competitor profiles in the same category.',
      'Identify one metric where you trail competitors by the widest margin and prioritize a catch-up initiative.',
      'Use discovery-share delta data when pitching budget for missing channels.',
    ],
  },
  {
    factorNumber: 88, domainId: 'mkt_d18_competitive_market_intelligence', name: 'Offer/Menu Competitive Position',
    description: 'Measures how your pricing, promotions, and menu breadth compare to the competitive set across key categories.',
    funnelStages: ['conversion'], impactLevel: 'medium', evidenceClass: 'PUBLIC', controllability: 'partial',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Build a competitive menu price index for your top five selling items versus nearby alternatives.',
      'Monitor competitor platforms weekly for new LTO or bundle launches to respond appropriately.',
      'Position your strongest value items at price parity with the lowest-cost competitors.',
    ],
  },
  {
    factorNumber: 89, domainId: 'mkt_d18_competitive_market_intelligence', name: 'Reputation Competitive Position',
    description: 'Measures how your ratings and review profiles compare in aggregate to the competitive set for like-for-like restaurants.',
    funnelStages: ['conversion'], impactLevel: 'medium', evidenceClass: 'PUBLIC', controllability: 'partial',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Compare monthly average ratings and newest-90-day review volume against the top three competitors.',
      'Benchmark sentiment themes from competitor reviews to find unmet diner needs you can address.',
      'Adjust review acquisition pace when falling behind in velocity relative to a key competitor.',
    ],
  },
  {
    factorNumber: 90, domainId: 'mkt_d18_competitive_market_intelligence', name: 'Digital Experience Competitive Position',
    description: 'Evaluates your website and ordering UX relative to local competitors in terms of speed, clarity, and mobile optimization.',
    funnelStages: ['conversion'], impactLevel: 'medium', evidenceClass: 'PUBLIC', controllability: 'partial',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Conduct a blind UX audit comparing your site to the top three competitor sites on mobile.',
      'Measure load-time differences and upgrade hosting or assets if lagging behind benchmarks.',
      'Adopt competitor feature patterns that drive high engagement—such as one-tap reorder—if they align with your brand.',
    ],
  },

  // D19 — Marketing Economics & Resource Allocation
  {
    factorNumber: 91, domainId: 'mkt_d19_marketing_economics_resource_allocation', name: 'Marketing Spend Visibility',
    description: 'Measures whether every dollar of marketing spend is tracked, categorized, and visible in a single dashboard across all channels.',
    funnelStages: ['conversion'], impactLevel: 'high', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Mandate all vendors submit monthly spend reports to a central spreadsheet or BI tool.',
      'Tag every ad account and payment transaction with the correct cost-center code at creation time.',
      'Audit spend visibility quarterly and call out any channel missing from the master view.',
    ],
  },
  {
    factorNumber: 92, domainId: 'mkt_d19_marketing_economics_resource_allocation', name: 'Customer Acquisition Cost',
    description: 'Evaluates whether accurate CAC is calculated per channel and compared against average customer lifetime value.',
    funnelStages: ['conversion'], impactLevel: 'high', evidenceClass: 'CONNECTED', controllability: 'partial',
    expectedTimeToImpact: 'medium', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Calculate blended CAC monthly by dividing total marketing cost by new customers acquired.',
      'Drill down to channel-level CAC quarterly and prune anything exceeding 30 percent of LTV.',
      'Include fully loaded costs such as creative production fees, not just media spend.',
    ],
  },
  {
    factorNumber: 93, domainId: 'mkt_d19_marketing_economics_resource_allocation', name: 'Cost per Marketing Outcome',
    description: 'Measures the cost achieved for each desired marketing outcome such as a completed order, reservation, or opted-in CRM profile.',
    funnelStages: ['conversion'], impactLevel: 'high', evidenceClass: 'CONNECTED', controllability: 'partial',
    expectedTimeToImpact: 'medium', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Define the top three marketing outcomes and set a maximum cost-per-outcome for each.',
      'Calculate real versus budgeted cost per outcome monthly and flag variances above 15 percent.',
      'Reallocate budget from channels consistently breaching their cost targets to higher performers.',
    ],
  },
  {
    factorNumber: 94, domainId: 'mkt_d19_marketing_economics_resource_allocation', name: 'Return on Ad Spend',
    description: 'Measures the revenue return per dollar invested in all paid advertising channels relative to industry benchmarks.',
    funnelStages: ['conversion'], impactLevel: 'high', evidenceClass: 'CONNECTED', controllability: 'partial',
    expectedTimeToImpact: 'medium', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Calculate blended ROAS monthly from aggregated channel data linked to POS revenue attribution.',
      'Set each platform\'s minimum acceptable ROAS and pause anything consistently below that floor.',
      'Test incremental spend on top-ROAS channels before reducing bottom-quartile budget allocations.',
    ],
  },
  {
    factorNumber: 95, domainId: 'mkt_d19_marketing_economics_resource_allocation', name: 'Budget Allocation Quality',
    description: 'Evaluates whether the distribution of marketing budget across channels reflects performance data and strategic priorities rather than inertia.',
    funnelStages: ['conversion'], impactLevel: 'high', evidenceClass: 'CONNECTED', controllability: 'partial',
    expectedTimeToImpact: 'long-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Hold a quarterly budget reallocation review tied to documented ROAS and strategic KPIs.',
      'Apply the zero-based budgeting method at least annually to challenge every line item from scratch.',
      'Publish the resulting allocation plan to all channel owners so expectations are aligned before execution.',
    ],
  },

  // D20 — Governance, Data Quality & Marketing Execution
  {
    factorNumber: 96, domainId: 'mkt_d20_governance_data_quality_execution', name: 'Marketing Data Quality',
    description: 'Measures the accuracy, completeness, and timeliness of data flowing from all marketing platforms into the central reporting layer.',
    funnelStages: ['conversion', 'loyalty'], impactLevel: 'high', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'medium', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Implement a data-quality scorecard covering accuracy, completeness, and latency of each channel\'s feed.',
      'Set up automated alerts for any missing or malformed data feeds exceeding 24 hours of downtime.',
      'Conduct quarterly audits comparing aggregated reported spend against payment-bank records.',
    ],
  },
  {
    factorNumber: 97, domainId: 'mkt_d20_governance_data_quality_execution', name: 'Consent & Communication Governance',
    description: 'Evaluates whether the restaurant\'s SMS and email outreach strictly complies with applicable consent regulations at all times.',
    funnelStages: ['conversion', 'loyalty'], impactLevel: 'high', evidenceClass: 'CONNECTED', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Implement explicit opt-in flows for SMS and email with dated, auditable consent records.',
      'Review opt-out processing logs monthly to guarantee 100 percent honor rate within SLA.',
      'Brief all contractors and agencies handling lists on applicable regulations before any send.',
    ],
  },
  {
    factorNumber: 98, domainId: 'mkt_d20_governance_data_quality_execution', name: 'Channel Ownership & Access',
    description: 'Measures whether every marketing platform account has named owners and appropriate team access rather than shared or forgotten credentials.',
    funnelStages: ['conversion'], impactLevel: 'medium', evidenceClass: 'CONNECTED', controllability: 'partial',
    expectedTimeToImpact: 'medium', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Inventory all marketing platforms and assign an owner and backup for each.',
      'Migrate shared passwords to a centralized vault tool that tracks access history.',
      'Run quarterly access audits and immediately revoke permissions for departed employees or contractors.',
    ],
  },
  {
    factorNumber: 99, domainId: 'mkt_d20_governance_data_quality_execution', name: 'Marketing Execution Discipline',
    description: 'Measures how reliably planned campaigns, content posts, and platform updates go live on time without missing critical deadlines.',
    funnelStages: ['conversion'], impactLevel: 'high', evidenceClass: 'PUBLIC', controllability: 'controlled',
    expectedTimeToImpact: 'near-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: 'opening_hours',
    recommendedActions: [
      'Use a shared editorial calendar visible to all stakeholders for cross-channel coordination.',
      'Set internal deadlines 24 hours before publish dates to allow review and correction time.',
      'Track on-time delivery rate monthly as a primary operations metric for the marketing team.',
    ],
  },
  {
    factorNumber: 100, domainId: 'mkt_d20_governance_data_quality_execution', name: 'Marketing System Resilience',
    description: 'Evaluates whether all critical marketing tools and integrations have fail-safes and contingency plans for service outages.',
    funnelStages: ['conversion', 'loyalty'], impactLevel: 'medium', evidenceClass: 'CONNECTED', controllability: 'partial',
    expectedTimeToImpact: 'long-term', methodologyVersion: 'marketing-model-v1.0', rdiFactorId: null,
    recommendedActions: [
      'Maintain an inventory of all marketing integrations and document manual fallback procedures for each.',
      'Test backup workflows annually to ensure campaign continuity during outages.',
      'Monitor uptime metrics from key vendor APIs and escalate service tickets proactively before they impact campaigns.',
    ],
  },
];

/** Fully-decorated 100 factors (base literals + declared metadata). */
export const MARKETING_FACTORS: MarketingFactorDefinition[] = BASE_FACTORS.map(withDeclaredMetadata);

// Re-export for test consumption.
export { BASE_FACTORS };

/** Keep factorById/factorByNumber/factorsForDomain operating on the decorated array. */

export function factorById(id: string): MarketingFactorDefinition | undefined {
  return MARKETING_FACTORS.find(f => {
    const slug = f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const expectedId = `mf_${String(f.factorNumber).padStart(3, '0')}_${slug}`;
    return expectedId === id;
  });
}

export function domainById(id: string): MarketingDomain | undefined {
  return MARKETING_DOMAINS.find(d => d.id === id);
}

export function factorsForDomain(domainId: string): MarketingFactorDefinition[] {
  return MARKETING_FACTORS.filter(f => f.domainId === domainId);
}

export function factorByNumber(n: number): MarketingFactorDefinition | undefined {
  return MARKETING_FACTORS.find(f => f.factorNumber === n);
}

const VALID_METHODOLOGY_TYPES = new Set([
  'boolean', 'threshold', 'range', 'ratio', 'benchmark',
  'categorical', 'trend', 'composite', 'custom',
] as const);

export function validateMarketingRegistry(): string[] {
  const errors: string[] = [];
  if (MARKETING_DOMAINS.length !== 20) errors.push(`expected 20 domains, got ${MARKETING_DOMAINS.length}`);
  if (MARKETING_FACTORS.length !== 100) errors.push(`expected 100 factors, got ${MARKETING_FACTORS.length}`);
  const domainIds = new Set(MARKETING_DOMAINS.map(d => d.id));
   const seen = new Map<number, number>();
  for (const f of MARKETING_FACTORS) {
    if (!domainIds.has(f.domainId)) errors.push(`factor ${f.factorNumber} references unknown domain ${f.domainId}`);
    const count = seen.get(f.factorNumber) ?? 0;
    seen.set(f.factorNumber, count + 1);
    // Declarative checks: every factor has methodology with valid type
    if (!f.methodology) {
      errors.push(`factor ${f.factorNumber} missing methodology`);
    } else if (!VALID_METHODOLOGY_TYPES.has(f.methodology.type)) {
      errors.push(`factor ${f.factorNumber} has invalid methodology type: ${f.methodology.type}`);
    }
    if (f.methodology && f.requiredSignals) {
      for (const sig of f.requiredSignals) {
        if (!sig || sig.trim().length === 0) {
          errors.push(`factor ${f.factorNumber} has empty requiredSignal`);
        }
      }
    }
    if (!f.methodologyVersion) {
      errors.push(`factor ${f.factorNumber} missing methodologyVersion`);
    }
  }
  for (const [n, c] of seen) if (c !== 1) errors.push(`factorNumber ${n} appears ${c} times (must be unique)`);
  const perDomain = new Map<string, number>();
  for (const f of MARKETING_FACTORS) perDomain.set(f.domainId, (perDomain.get(f.domainId) ?? 0) + 1);
  for (const [d, c] of perDomain) if (c !== 5) errors.push(`domain ${d} has ${c} factors (expected 5)`);
  for (let n = 1; n <= 100; n++) if (!seen.has(n)) errors.push(`missing factorNumber ${n}`);
  return errors;
}
