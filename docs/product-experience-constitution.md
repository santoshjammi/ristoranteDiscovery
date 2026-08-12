# Product Experience Constitution v1.0
# Restaurant Intelligence Platform — Decision Intelligence Workspace

> The Restaurant Intelligence Platform is not a dashboard. It is a Decision Intelligence Workspace. Every screen must answer one question: *"What should this restaurant owner do next?"*

---

## 1. Design Philosophy

Follow modern product design principles inspired by products featured on 21st.dev.

**Characteristics:**
- Clean, Minimal, Spacious, Fast
- Information Dense without feeling cluttered
- Excellent Typography & White Space
- Progressive Disclosure
- Micro Interactions & Contextual Animations
- Professional & Production Ready

**Never build pages that look like admin dashboards. Build software that restaurant owners enjoy opening every morning.**

---

## 2. Information Hierarchy

Every page should clearly establish:

```
Primary Information
        ↓
Secondary Information
        ↓
Supporting Context
        ↓
Advanced Details
```

Never present everything equally. The user's eye should naturally move through the page.

---

## 3. Show Insights, Not Raw Data

| Avoid | Prefer |
|-------|--------|
| Tables of numbers | Scores |
| Large metric walls | Health Indicators |
| Long reports | Priority Cards |
| Raw data dumps | Recommendations, Evidence, Business Impact, Actions |

---

## 4. Every Score Must Explain Itself

Whenever a score appears, the UI must explain:
- Current Score
- Trend
- Reason
- Confidence
- Impact
- How to Improve
- Estimated Improvement

**No score should ever exist without explanation.**

---

## 5. Restaurant Health Model

Every restaurant should have a visible health profile:

| Dimension | Description |
|-----------|-------------|
| Overall Restaurant Health | Composite score |
| Digital Presence | Website, GBP, Social |
| Reviews | Sentiment, volume, response rate |
| Local SEO | Search ranking, citations |
| Reputation | Rating, review quality |
| Customer Engagement | Response rate, engagement |
| Content Quality | Menu, photos, descriptions |
| Operational Completeness | Hours, services, attributes |
| Trust Signals | Reviews, badges, verifications |
| Performance | Load time, mobile friendliness |

---

## 6. All Insights Require Evidence

Never show "Improve SEO." Instead show:

| Field | Example |
|-------|---------|
| Issue | Missing menu schema markup |
| Evidence | 0 of 12 menu items have schema |
| Why it Matters | AI assistants can't read your menu |
| Business Impact | Lost visibility in AI search results |
| Expected Improvement | +15% AI visibility score |
| Recommended Action | Add MenuItem schema to all dishes |
| Confidence Level | High (92%) |

---

## 7. Prioritization

Every recommendation should have:

- Priority (★★★★★)
- Impact (quantified)
- Difficulty (effort estimate)
- Estimated Time
- Estimated Business Value
- Confidence

Restaurant owners should immediately know where to start.

---

## 8. Visual Language

| Use | Avoid |
|-----|-------|
| Cards | Tables (overuse) |
| Timeline | Dense grids |
| Progress Indicators | Walls of text |
| Score Rings | Raw numbers without context |
| Badges & Status Pills | |
| Expandable Sections | |
| Comparison Views | |
| Evidence Panels | |

**Use tables only when they improve decisions.** Tables should support: sorting, filtering, searching, grouping, bulk actions, saved views, column customization. Otherwise prefer cards and visual summaries.

---

## 9. Color Semantics

| Color | Meaning |
|-------|---------|
| Green | Healthy |
| Yellow | Needs Attention |
| Orange | Important |
| Red | Critical |
| Blue | Information |
| Gray | Inactive |

**Color communicates meaning. Never use color only for decoration.**

---

## 10. Typography & Spacing

- Large numbers only when meaningful
- Readable body text
- Short paragraphs
- Scannable content
- Use generous whitespace
- Never create crowded interfaces
- Related information should feel visually connected

---

## 11. Empty States

Every empty state should educate the user:
- **Why** this section is empty
- **What Happens Next**
- **Primary Action** to take

---

## 12. Loading & Errors

- **Loading:** Prefer skeleton loaders. Never display blank pages.
- **Errors:** Explain what happened, what can be done, and the recovery action. Never expose technical messages.

---

## 13. Mobile

Mobile is not a smaller desktop. Prioritize: Actions, Scores, Recommendations. Collapse secondary information.

---

## 14. Consistency

Every page should feel like it belongs to the same product. Common: spacing, cards, buttons, icons, animations, interactions, terminology.

---

## 15. Quality of Visuals

Every screen should be suitable for:
- Customer Demonstrations
- Investor Presentations
- Conference Talks
- Marketing Screenshots
- Product Hunt
- Landing Pages

**The application itself should become the marketing material.**

---

## 16. Restaurant Intelligence Profile

Every restaurant should have a living profile that updates continuously:

```
Restaurant Intelligence Score          82

Overall Health               82
Visibility                   74
Reputation                   91
Customer Experience          80
Website                      67
Google Business              88
Local Authority              70
Operational Completeness     95
Trust Signals                78

Top Opportunities

★★★★★ Improve Menu Schema
★★★★☆ Respond to Recent Reviews
★★★★☆ Add Missing Business Categories
★★★☆☆ Improve Local Citations

Potential Growth

+12 Visibility
+18 Local Ranking
+9 Customer Trust

Estimated Timeline: 14 Days
```

---

## 17. Final Principle

Do not ask *"What components should this page have?"*

Ask *"What decision is the restaurant owner trying to make?"*

Everything shown on the screen should help answer that question.
