# Triangle Indian Restaurant Discoverability Engine (TIRDE) v4.0

TIRDE v4.0 is a specialized platform designed to supercharge the discoverability of Indian restaurants in the North Carolina Research Triangle (Raleigh, Cary, Morrisville, RTP Corridor). It utilizes AI and coordinate-based proximity math to parse menus, analyze sentiments, map local search intents, and optimize voice/search presence.

## 🌟 Core Services & Features

The platform operates through a suite of specialized AI backend services and interactive frontend interfaces:

1. **Parser Service (`parser.service.ts`)**
   - Ingests raw text and PDF menus.
   - Uses AI to extract structured items, pricing, ingredients, and auto-tags dietary types (e.g., Vegan, Halal) and allergens.
2. **Review Intelligence Service (`review.service.ts`)**
   - Analyzes customer review sentiments.
   - Extracts popular dish mentions, ambience tags, topic clusters, and audience profiles.
3. **Conversational FAQ Service (`faq.service.ts`)**
   - Auto-generates conversational and voice-search-optimized FAQs based on restaurant metadata, menus, and review sentiments.
4. **SEO Optimizer Service (`seo-optimizer.service.ts`)**
   - Audits Google Business Profile (GBP) health.
   - Maps proximity to key NC Triangle landmarks (e.g., Lenovo Cary Campus, Cisco RTP) and suggests actionable local SEO strategies.
5. **Schema Generator Service (`schema.service.ts`)**
   - Generates Google-compliant structured JSON-LD schemas (Combined, Restaurant, Menu, FAQ) for injection into websites to boost semantic web presence.
6. **Discoverability Scorer Service (`scorer.service.ts`)**
   - Automatically computes an overall discoverability index alongside granular scores (AI Visibility, Local Search, Menu Discoverability, Conversational Search, and Dish Retrieval).
   - Incorporates **Progressive Friction scaling** and **Ontology Ambiguity audits** for honest scoring calibration.
7. **Coordinate-based Geo-Intent Proximity Engine (`query-simulator.service.ts`)**
   - Uses the **Haversine formula** to calculate physical distance (in miles) to business parks (Lenovo, Cisco, MetLife) to ground local search rankings in true coordinates.
8. **Vector Storage & RAG Search Service**
   - Embeds restaurant data into a local vector database for semantic chat searches and conversational recommendations.

### 🚀 Advanced Features (v4.0)
* **One-Click Smart Optimizations**: Auto-fix ambiguous dish names and map corporate landmarks from the frontend Score Evidence Panel.
* **Google AI Overview (AIO) Simulator**: Real-time simulation of Google Search AIO answers with citation cards for menu dishes.
* **Discoverability Proximity Heatmap**: Dynamic SVG vector grid overlaying local office coordinates and representing discoverability search range.
* **Dish Discovery Index**: Granular rankings table grouping dishes by details coverage, popularity, and discoverability status.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- SQLite (pre-configured via Prisma)
- API Keys: To use live AI generation, configure `GEMINI_API_KEY` or `OPENAI_API_KEY` in the backend `.env`. If none are provided, the platform gracefully falls back to a **TIRDE Mock Engine** with pre-seeded Cary/Morrisville demo data.

### 1. Start the Backend API
The backend runs on port `5001`.
```bash
cd backend
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

### 2. Start the Frontend Dashboard
The frontend runs on port `3000`. Open a new terminal tab:
```bash
cd frontend
npm install
npm run dev
```

### 3. Usage
- Navigate to [http://localhost:3000](http://localhost:3000) in your browser.
- Use the **Onboarding Wizard** tab to register a new restaurant (or use the pre-seeded *Biryani Maxx* in Demo Mode).
- Watch the **Discoverability Scores** dynamically update as you feed it menu text, reviews, and generate FAQs.
- Navigate to the **GBP Maps Optimizer** to audit landmark visibility.
- Test natural language searches in the **TIRDE Search Portal**.

## 🧪 Running Validation Tests

To verify that the AI modules and scoring logic work correctly end-to-end:
```bash
cd backend
npx ts-node src/tirde-test.ts
```
This script runs a complete simulated onboarding of a Morrisville Indian restaurant, tracking the discoverability score progressing from 0% to ~90%.

## 🐳 VPS Docker Deployment (Recommended for Multi-App VPS)

TIRDE v4.0 is fully containerized and can run alongside other applications on your VPS. SQLite database writes are automatically persisted to a named Docker volume (`tirde-data`).

### 1. Configure Ports & Keys
Rename `.env.example` in the root folder to `.env` and update configurations:
```bash
cp .env.example .env
```
Ensure `PORT_FRONTEND` and `PORT_BACKEND` are set to unused ports on your VPS (defaults: `3040` and `5040`).

### 2. Start Containers
Run the Docker Compose build and start commands:
```bash
docker compose up -d --build
```
This builds both multi-stage containers and starts the services in the background. Database tables are initialized automatically on startup.

### 3. Nginx Reverse Proxy Setup (Example)
To route subdomains and expose the app securely on ports `80`/`443`, append a server block in your Nginx configuration (e.g. `/etc/nginx/sites-available/tirde`):

```nginx
server {
    listen 80;
    server_name tirde.yourdomain.com;

    # Frontend Routing
    location / {
        proxy_pass http://127.0.0.1:3040;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API Routing (avoids CORS issues)
    location /api {
        proxy_pass http://127.0.0.1:5040/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
If using this Nginx proxy, update your `.env` to use the proxy path directly:
```env
NEXT_PUBLIC_API_URL=https://tirde.yourdomain.com/api
```
And rebuild the containers:
```bash
docker compose up -d --build
```

