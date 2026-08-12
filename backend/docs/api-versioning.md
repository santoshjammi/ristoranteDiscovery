# API Versioning Strategy

> **Backward compatibility for the RDI platform**

---

## Versioning Scheme

The API uses **URL-based versioning**: `/api/v1/`, `/api/v2/`, etc.

## Current Version

All current routes are mounted at `/api/` (implicit v1). When a breaking change is required:

1. Create new routes at `/api/v2/`
2. Keep old routes at `/api/v1/` for a deprecation period
3. Document the migration path

## Breaking Changes

A change is breaking if it:

- Removes or renames a field in the response
- Changes the type of a field
- Removes an endpoint
- Changes authentication requirements
- Changes error response format

## Non-Breaking Changes

A change is non-breaking if it:

- Adds a new field to the response
- Adds a new endpoint
- Adds a new query parameter
- Changes internal behavior without changing the API contract

## Deprecation Policy

1. Mark the old version as deprecated in the response header: `X-API-Deprecated: true`
2. Include a `Sunset` header with the removal date
3. Keep the old version for at least 90 days after deprecation
4. Document the migration path in release notes

## Version Headers

| Header | Purpose | Example |
|--------|---------|---------|
| `X-API-Version` | Current version | `v1` |
| `X-API-Deprecated` | Deprecation warning | `true` |
| `Sunset` | Removal date | `Sun, 31 Jan 2027 00:00:00 GMT` |
