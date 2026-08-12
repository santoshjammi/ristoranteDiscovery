# Platform Design Checklist v1.0

> Before merging any UI change, verify every item below.

## Design System
- [ ] Uses design tokens (`@/lib/design-tokens`)
- [ ] Uses shared components (`components/shared/`)
- [ ] Color communicates meaning (not decorative)
- [ ] Typography hierarchy clear (h1, h3, body, small, caption, label)

## States
- [ ] Loading state (skeleton loader)
- [ ] Empty state (educates user + primary action)
- [ ] Error state (explains + recovery action)
- [ ] Success state (confirmation)

## Platform Capabilities (where applicable)
- [ ] Search (`SearchBar` + `useList`)
- [ ] Sort (`SortButton` + `useList`)
- [ ] Filter (`FilterDropdown` + `useList`)
- [ ] Pagination (`Pagination` + `useList`)
- [ ] CRUD (create, read, update, delete)
- [ ] Back navigation

## Decision Intelligence
- [ ] Score has explanation (value, trend, confidence, evidence)
- [ ] Recommendation has evidence, impact, action
- [ ] Priority is visible
- [ ] Confidence is visible

## Responsive
- [ ] Desktop (1200px+)
- [ ] Laptop (1024px)
- [ ] Tablet (768px)
- [ ] Mobile (375px)

## Accessibility
- [ ] Keyboard navigation
- [ ] Focus management
- [ ] ARIA labels where needed
- [ ] Color contrast sufficient
- [ ] Semantic HTML

## Visual Polish
- [ ] Spacing consistent
- [ ] Alignment correct
- [ ] Hover states
- [ ] Focus states
- [ ] No visual clutter
- [ ] Cards use consistent elevation

## Cross-page Navigation
- [ ] "Where am I?" — clear page title
- [ ] "What can I do here?" — primary action visible
- [ ] "What's next?" — next steps clear
- [ ] "How do I go back?" — back navigation present

## Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] Playwright E2E tests
- [ ] Accessibility checks
- [ ] Visual regression baselines

## CI/CD Gates
- [ ] TypeScript (`tsc --noEmit`)
- [ ] Production build (`next build`)
- [ ] Playwright headless
- [ ] All tests pass
