# Design: PWA / Mobile App (P3)

## Purpose
Make ristoranteDiscovery installable as a Progressive Web App on mobile devices.

## Files to create/modify
1. `frontend/public/manifest.json` — Web App Manifest
2. `frontend/public/sw.js` — Service Worker for offline caching
3. `frontend/app/layout.tsx` — Add manifest link and meta tags

## Manifest.json
```json
{
  "name": "Ristorante Discovery",
  "short_name": "Ristorante",
  "description": "Restaurant intelligence and visibility platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#1a1a2e",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

## Service Worker
- Cache-first strategy for static assets
- Network-first for API calls
- Offline fallback page
- Register in layout.tsx

## Meta Tags
- `apple-mobile-web-app-capable`
- `viewport` with `minimum-scale=1, maximum-scale=1`
- Theme color meta tag

## Files to create
- `frontend/public/manifest.json`
- `frontend/public/sw.js`
- `frontend/public/icon-192.png` (placeholder)
- `frontend/public/icon-512.png` (placeholder)
- Modify `frontend/app/layout.tsx`
