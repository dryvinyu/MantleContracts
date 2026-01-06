# Design: Add Asset Creation Capability

## Context
The application currently supports viewing and filtering assets, but lacks the ability to create new assets. The database schema already supports asset creation through Prisma, and the UI has a placeholder button that needs to be made functional.

## Goals / Non-Goals

### Goals
- Enable creation of new assets through a POST API endpoint
- Provide a user-friendly form UI for asset creation
- Validate all asset fields according to database constraints
- Maintain consistency with existing API response formats
- Support all asset types: treasury, real-estate, credit, cash

### Non-Goals
- Bulk asset import (single asset creation only)
- Asset editing/updating (out of scope for this change)
- Asset deletion (out of scope for this change)
- Related metadata creation (yield breakdowns, confidence factors, etc.) - can be added in future iterations
- Authentication/authorization (assumes authorized user for now)

## Decisions

### Decision: API Endpoint Design
- **What**: Use POST `/api/assets` endpoint
- **Why**: Follows RESTful conventions, matches existing GET endpoint pattern
- **Alternatives considered**: 
  - PUT `/api/assets/[id]` - Not appropriate for creation
  - POST `/api/assets/create` - Redundant path segment

### Decision: Form Field Scope
- **What**: Include all required database fields in the form
- **Why**: Ensures complete asset creation without follow-up edits
- **Alternatives considered**:
  - Minimal form with only essential fields - Rejected: Would require multiple steps or edits
  - Include optional related metadata - Deferred: Can be added later

### Decision: Validation Strategy
- **What**: Server-side validation with client-side hints
- **Why**: Security and data integrity require server validation; client-side improves UX
- **Alternatives considered**:
  - Client-side only - Rejected: Security risk
  - Server-side only - Rejected: Poor user experience

### Decision: Asset ID Generation
- **What**: Require user-provided asset ID
- **Why**: Allows for meaningful IDs (e.g., "us-treasury-2y-2024")
- **Alternatives considered**:
  - Auto-generate UUID - Rejected: Less meaningful, harder to reference
  - Auto-generate sequential ID - Rejected: Not suitable for financial assets

## Risks / Trade-offs

### Risk: Duplicate Asset IDs
- **Mitigation**: Validate uniqueness in API before creation, return clear error message

### Risk: Complex Form UX
- **Mitigation**: Group related fields logically, provide clear labels and validation messages

### Risk: Missing Optional Metadata
- **Mitigation**: Document that optional fields (yield breakdowns, etc.) can be added later

## Migration Plan
- No migration needed - this is a new feature
- Existing assets remain unchanged
- New assets created through this feature will be immediately available in listings

## Open Questions
- Should asset creation require authentication/authorization? (Deferred - assume authorized for now)
- Should we support creating related metadata (yield breakdowns, confidence factors) in the same request? (Deferred - can be separate feature)

