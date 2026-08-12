# Review Intelligence — Regression Fixtures

> **Canonical test cases for deterministic review analysis**

---

## Fixture 1: Conflicting Signals

High average rating but repeated negative theme mentions. The engine must surface both without suppressing the negative signal.

### Input

```json
{
  "restaurantId": "fixture-conflict-001",
  "reviews": [
    {"id": "r1", "rating": 5, "text": "Amazing food! The biryani was incredible and the service was great.", "date": "2026-06-01", "source": "google", "responseText": null, "responseDate": null},
    {"id": "r2", "rating": 4, "text": "Very tasty food but the wait was way too long. Almost 45 minutes.", "date": "2026-06-15", "source": "google", "responseText": null, "responseDate": null},
    {"id": "r3", "rating": 5, "text": "Best biryani in town! Highly recommend.", "date": "2026-07-01", "source": "yelp", "responseText": null, "responseDate": null},
    {"id": "r4", "rating": 2, "text": "Food was good but the wait time is ridiculous. 1 hour for food.", "date": "2026-07-10", "source": "google", "responseText": null, "responseDate": null},
    {"id": "r5", "rating": 4, "text": "Delicious food but slow service. Need more staff.", "date": "2026-07-20", "source": "yelp", "responseText": null, "responseDate": null}
  ]
}
```

### Expected Output

| Property | Expected | Rationale |
|----------|----------|-----------|
| `averageRating` | 4.0 | (5+4+5+2+4)/5 = 4.0 |
| `positivePercentage` | 60% | 3 of 5 reviews are positive (rating ≥ 4) |
| `negativePercentage` | 20% | 1 of 5 reviews is negative (rating ≤ 2) |
| `responseRate` | 0% | No responses |
| `ratingTrend` | `stable` | Only 2 months of data |
| `themes` includes `food_quality` | ✅ | 5 mentions (r1, r2, r3, r4, r5) |
| `themes` includes `wait_time` | ✅ | 3 mentions (r2, r4, r5) |
| `themes` includes `service` | ✅ | 2 mentions (r1, r5) |
| `insights` includes "Praised: Food Quality" | ✅ | Positive theme with 5 mentions |
| `insights` includes "Criticized: Wait Times" | ✅ | Negative theme with 3 mentions |
| `insights` includes "Unresponded critical reviews" | ✅ | 1 critical review (r4) unresponded |

### Validation

```typescript
// Run with: npx tsx src/validation/review-intelligence-v1.0/fixture-conflict-signals.ts
import { ReviewIntelligenceEngine } from '../../src/application/reviews/ReviewIntelligenceEngine';

const engine = new ReviewIntelligenceEngine();
const result = engine.analyze({
  restaurantId: 'fixture-conflict-001',
  reviews: [
    {id:'r1',rating:5,text:'Amazing food! The biryani was incredible and the service was great.',date:new Date('2026-06-01'),source:'google',responseText:null,responseDate:null},
    {id:'r2',rating:4,text:'Very tasty food but the wait was way too long. Almost 45 minutes.',date:new Date('2026-06-15'),source:'google',responseText:null,responseDate:null},
    {id:'r3',rating:5,text:'Best biryani in town! Highly recommend.',date:new Date('2026-07-01'),source:'yelp',responseText:null,responseDate:null},
    {id:'r4',rating:2,text:'Food was good but the wait time is ridiculous. 1 hour for food.',date:new Date('2026-07-10'),source:'google',responseText:null,responseDate:null},
    {id:'r5',rating:4,text:'Delicious food but slow service. Need more staff.',date:new Date('2026-07-20'),source:'yelp',responseText:null,responseDate:null},
  ],
});

const checks = {
  avgRating: result.aggregate.averageRating === 4.0,
  positivePct: result.aggregate.positivePercentage === 60,
  negativePct: result.aggregate.negativePercentage === 20,
  hasFoodTheme: result.themes.some(t => t.name === 'food_quality'),
  hasWaitTheme: result.themes.some(t => t.name === 'wait_time'),
  hasServiceTheme: result.themes.some(t => t.name === 'service'),
  hasPraisedFood: result.insights.some(i => i.title.includes('Praised') && i.title.includes('Food Quality')),
  hasCriticizedWait: result.insights.some(i => i.title.includes('Criticized') && i.title.includes('Wait Times')),
  hasCriticalUnresponded: result.insights.some(i => i.type === 'critical'),
};

const allPass = Object.values(checks).every(Boolean);
console.log('Fixture: Conflicting Signals');
Object.entries(checks).forEach(([k, v]) => console.log(`  ${k}: ${v ? 'PASS' : 'FAIL'}`));
console.log(`All: ${allPass ? 'PASS' : 'FAIL'}`);
process.exit(allPass ? 0 : 1);
```

---

## Fixture 2: All Positive

### Input

5 reviews, all 5-star, all praising food and service.

### Expected

- `averageRating`: 5.0
- `positivePercentage`: 100%
- `negativePercentage`: 0%
- `themes`: food_quality (5), service (5)
- `insights`: No critical warnings, no negative themes

---

## Fixture 3: All Negative

### Input

5 reviews, all 1-2 star, all criticizing service and wait times.

### Expected

- `averageRating`: 1.4
- `positivePercentage`: 0%
- `negativePercentage`: 100%
- `themes`: service (5), wait_time (5)
- `insights`: Critical warnings present, no positive themes

---

## Fixture 4: Empty / No Reviews

### Input

Empty reviews array.

### Expected

- `totalReviews`: 0
- `averageRating`: 0
- `themes`: empty
- `insights`: empty (no volume, no rating, no response insights)

---

## Fixture 5: Single Review

### Input

1 review, 3-star, neutral tone.

### Expected

- `totalReviews`: 1
- `averageRating`: 3.0
- `ratingTrend`: `stable` (insufficient data)
- `themes`: empty (all themes filtered — need ≥2 mentions)
- `insights`: volume (1), rating (3.0), response (0%)
