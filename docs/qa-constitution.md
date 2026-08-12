# QA Constitution v1.0
# Restaurant Intelligence Platform — Comprehensive Test Automation & Quality Engineering

> Quality is a first-class architectural concern. Automation is part of the product.

---

## 1. Quality Principles

1. Every feature is testable.
2. Every page is automatable.
3. Every recommendation is verifiable.
4. Every workflow is reproducible.
5. Every defect should become a permanent automated test.
6. Never rely on manual regression testing.
7. Every release must be deployable with confidence.
8. Automation is written alongside implementation.
9. Every acceptance criterion must have one or more automated tests.
10. A feature is NOT complete until automation passes.

---

## 2. Test Pyramid

```
Level 1: Unit Tests
Level 2: Component Tests
Level 3: Integration Tests
Level 4: API Contract Tests
Level 5: Playwright End-to-End Tests
Level 6: Visual Regression
Level 7: Accessibility
Level 8: Performance Validation
```

---

## 3. Standard Toolchain

| Tool | Purpose |
|------|---------|
| Playwright | End-to-end automation |
| Playwright Headed | Development and debugging |
| Playwright Headless | CI/CD execution |
| Playwright Trace Viewer | Failure investigation |
| Playwright Visual Comparisons | Visual regression testing |
| Axe Accessibility | Accessibility validation |
| Mock Service Worker | API mocking |
| GitHub Actions | CI/CD pipeline |

---

## 4. Every Page Must Produce

| Test Category | Description |
|---------------|-------------|
| Smoke | Page loads without errors |
| Navigation | All links and routes work |
| Functional | Primary actions work correctly |
| CRUD | Create, read, update, delete operations |
| Validation | Form validation, input constraints |
| Search | Search functionality works |
| Filtering | Filters return correct results |
| Sorting | Sort order is correct |
| Pagination | Pagination works across pages |
| Loading | Loading skeleton/spinner renders |
| Empty State | Empty state renders with CTA |
| Error State | Error state renders with retry |
| Permission | Role-based access controls work |
| Accessibility | Keyboard, screen reader, contrast, ARIA |
| Responsive | Desktop, tablet, mobile layouts |
| Visual Regression | Visual snapshots match baselines |
| Analytics Event | All defined events fire correctly |
| Performance | Load time, LCP, CLS within thresholds |

---

## 5. Page Complexity Targets

| Complexity | Test Count | Examples |
|------------|------------|---------|
| Simple | 20-30 | Pricing, Help, About, Success Stories |
| Medium | 40-70 | Settings, Team, Restaurant Profile |
| Complex | 80-150 | Dashboard, Recommendations, Analysis, Decision Center, Visibility |
| Critical Workflow | 150-250 | Restaurant Onboarding, Free Audit, Generate Recommendations, Accept Recommendation, Generate Report, Weekly Review, Upgrade Subscription |

---

## 6. Target Test Inventory

| Category | Target |
|----------|--------|
| Smoke | 60+ |
| Navigation | 120+ |
| Functional | 700+ |
| Validation | 300+ |
| Loading / Empty / Error | 300+ |
| Permissions | 200+ |
| Responsive | 200+ |
| Accessibility | 150+ |
| Visual Regression | 250+ |
| API Contract | 250+ |
| Business Workflow | 120+ |
| Regression | 500+ |
| **Total** | **2,500+** |

---

## 7. Business Journeys

Every critical workflow must have an automated journey:

1. Visitor → Free Audit
2. Signup → Organization
3. Organization → Restaurant
4. Restaurant → Connect Google
5. Run Analysis
6. Generate Recommendations
7. Recommendation Details
8. Accept Recommendation
9. Create Task
10. Complete Task
11. Generate Audit Report
12. Weekly Review
13. Invite Team Member
14. Billing Upgrade
15. Notification Handling
16. Settings Update
17. Logout

Every journey must execute in: **Headed Mode**, **Headless Mode**

---

## 8. Responsive Validation

| Breakpoint | Target |
|------------|--------|
| Desktop (>1024px) | Full layout |
| Laptop (768-1024px) | Collapsed sidebar |
| Tablet (<768px) | Hamburger menu |
| Mobile (<480px) | Single column |
| Landscape | Horizontal orientation |
| Portrait | Vertical orientation |

---

## 9. Accessibility

| Check | Tool/Method |
|-------|-------------|
| Keyboard Navigation | Playwright keyboard tests |
| Screen Reader | Axe + manual review |
| Focus Management | Playwright focus tests |
| ARIA Validation | Axe automated checks |
| Color Contrast | Axe color contrast checks |
| Skip Links | Playwright navigation tests |
| Semantic HTML | Axe landmark checks |

---

## 10. Visual Regression

Capture baseline images for every page in these states:

- Default
- Hover
- Focus
- Loading
- Empty
- Error
- Success
- Dark Mode (if supported)

---

## 11. Performance Thresholds

| Metric | Threshold |
|--------|-----------|
| Initial Load | < 2s |
| Interaction Latency | < 100ms |
| Route Navigation | < 500ms |
| Largest Contentful Paint (LCP) | < 2.5s |
| Cumulative Layout Shift (CLS) | < 0.1 |
| Memory Usage | < 50MB |

---

## 12. Test Data Fixtures

Deterministic, reusable fixtures (no random data):

**Restaurants:**
- Healthy Restaurant (score > 70)
- Poor Visibility (score < 40)
- New Restaurant (no analysis yet)
- Chain Restaurant (multi-location)
- Independent Restaurant

**Reviews:**
- Positive Reviews
- Negative Reviews
- Mixed Reviews
- No Reviews

**Recommendations:**
- High Priority
- Medium Priority
- Low Priority
- Accepted
- Dismissed
- Completed

**Reports:**
- Complete Report
- Partial Report
- Empty Report

---

## 13. CI/CD Gates

Every Pull Request must pass:

```
✓ TypeScript (tsc --noEmit)
✓ Lint (ESLint)
✓ Unit Tests
✓ Integration Tests
✓ API Tests
✓ Playwright Headless
✓ Visual Regression
✓ Accessibility
✓ Production Build
```

Any failure blocks merge.

---

## 14. Definition of Done

A feature is **COMPLETE** only when:

- [ ] Implementation Complete
- [ ] Unit Tests Passing
- [ ] Integration Tests Passing
- [ ] API Tests Passing
- [ ] Playwright Tests Passing
- [ ] Accessibility Tests Passing
- [ ] Responsive Tests Passing
- [ ] Visual Regression Approved
- [ ] Performance Acceptable
- [ ] CI Passing
- [ ] Documentation Updated

---

## 15. Quality Ledger

Every feature implementation must append a record to `docs/quality-ledger.yaml`:

```yaml
feature: <Feature Name>
status: COMPLETE | IN_PROGRESS | NOT_STARTED

implementation:
  pages: <count>
  components: <count>
  apis: <count>

automation:
  unit: <count>
  integration: <count>
  e2e: <count>
  accessibility: <count>
  visual: <count>

coverage:
  statements: <percentage>
  branches: <percentage>
  functions: <percentage>

quality_gate: PASS | FAIL | PENDING
```

---

## 16. Deliverables

1. Quality Engineering Architecture — this document
2. Test Folder Structure — `e2e/`, `__tests__/`, `__mocks__/`
3. Playwright Architecture — page objects, fixtures, helpers
4. Naming Standards — `*.spec.ts`, `*.test.ts`, `*.e2e.ts`
5. Test Data Strategy — deterministic fixtures in `fixtures/`
6. Automation Strategy — test-per-feature, not test-per-file
7. CI/CD Strategy — GitHub Actions workflow
8. Visual Regression Strategy — Playwright `toHaveScreenshot()`
9. Accessibility Strategy — Axe integration in Playwright
10. Performance Strategy — Playwright `page.metrics()`
11. Test Reporting Dashboard — Playwright HTML reporter
12. Coverage Dashboard — Istanbul + Playwright
13. Release Checklist — Definition of Done checklist
14. Maintenance Strategy — Quarterly review of flaky tests
15. Regression Strategy — Full suite on every PR
16. Failure Investigation Guide — Trace Viewer + screenshots

---

## 17. Final Rule

Do NOT treat testing as a task after development.

Every implementation task must include its automation.

No screen. No component. No workflow. No API. No recommendation. No report. No feature shall be considered COMPLETE until all automated quality gates pass.

Quality is a first-class architectural concern.

Automation is part of the product.
