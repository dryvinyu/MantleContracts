## Context
The application has a complete PostgreSQL schema in `db.sql` but currently relies on mock data. Prisma ORM is already installed as a dependency. We need to bridge the gap between the existing schema and the application layer while maintaining API backward compatibility.

**Constraints:**
- Database URL: `postgresql://postgres:postgres123@localhost:5432/mantle`
- No foreign key constraints (per user preference memory)
- Next.js App Router with Server Components and API routes
- Existing mock API contracts must remain unchanged for frontend compatibility

**Stakeholders:**
- Frontend components consuming API routes
- Database schema already deployed in PostgreSQL
- Future user authentication system (currently hardcoded demo user)

## Goals / Non-Goals
**Goals:**
- Replace all mock data with real database queries
- Generate type-safe Prisma schema matching existing PostgreSQL schema
- Maintain exact API response shapes for backward compatibility
- Create reusable database client singleton
- Support query filtering (asset type, APY, risk score)
- Calculate derived portfolio metrics (weighted APY, allocation, risk)

**Non-Goals:**
- User authentication (use hardcoded demo user ID for now)
- AI copilot integration (keep as mock, separate concern)
- Database migration tooling (schema already exists in PostgreSQL)
- Frontend component changes (APIs remain compatible)
- Performance optimization (focus on correctness first)

## Decisions

### Decision 1: Prisma Schema Structure
**What:** Create `prisma/schema.prisma` that mirrors `db.sql` structure using Prisma's declarative syntax.

**Why:** 
- Provides type-safe database client with TypeScript types
- Enables IDE autocomplete for queries
- Centralizes schema documentation
- No foreign key constraints as specified in user preference

**Alternatives considered:**
- Raw SQL queries: Rejected due to lack of type safety and more boilerplate
- Prisma with introspection: Rejected because we need explicit control over schema

**Implementation:**
- Map PostgreSQL enums to Prisma enums
- Use `@map` for camelCase to snake_case field mapping
- Mark foreign keys without `@relation` constraints (per user preference)
- Use `BigInt` for `bigserial`, `Decimal` for `numeric`, `DateTime` for `timestamptz`

### Decision 2: Database Client Singleton
**What:** Create `lib/db.ts` with a singleton PrismaClient instance using the global pattern for Next.js.

**Why:**
- Next.js hot reload creates multiple PrismaClient instances without singleton
- Prevents database connection pool exhaustion in development
- Follows Prisma's Next.js best practices

**Pattern:**
```typescript
const globalForPrisma = globalThis as { prisma?: PrismaClient }
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Decision 3: API Layer Strategy
**What:** Keep API routes as thin wrappers, move business logic to `lib/api.ts` functions.

**Why:**
- Maintains separation of concerns
- Easier to test business logic separately
- Consistent with existing architecture pattern
- Reusable functions across API routes and Server Components

**Approach:**
- API routes handle HTTP concerns (request/response, status codes)
- `lib/api.ts` functions handle database queries and business logic
- Maintain exact response shapes from mock implementation

### Decision 4: User Context Handling
**What:** Hardcode demo user ID (`demo-user` UUID) for now, accept `userId` from request body/headers in future.

**Why:**
- Authentication system not yet implemented
- Unblocks database integration work
- Easy to replace with real auth later

**Migration path:**
- Create demo user in database with known UUID
- Phase 2: Accept `userId` from authenticated session
- Phase 3: Integrate with wallet-based authentication

### Decision 5: Portfolio Calculation Logic
**What:** Calculate weighted APY, risk score, and allocation in application code using Prisma queries.

**Why:**
- Flexibility to adjust calculation logic without database migrations
- Easier to test and debug in TypeScript
- Database views/functions add complexity for simple aggregations

**Approach:**
```typescript
// Fetch holdings with asset details
const holdings = await prisma.portfolioHolding.findMany({
  where: { userId },
  include: { asset: true }
})
// Calculate weighted APY in JS
const weightedAPY = holdings.reduce((sum, h) => 
  sum + (h.shares * h.asset.price * h.asset.apy) / totalValue, 0)
```

## Risks / Trade-offs

### Risk: Schema Drift
**Risk:** Prisma schema diverges from actual PostgreSQL schema over time.

**Mitigation:**
- Document that `db.sql` is source of truth
- Run `prisma db pull` to detect drift before changes
- Include schema validation in CI/CD (future)

### Risk: Missing Seed Data
**Risk:** Empty database breaks frontend that expects mock data structure.

**Mitigation:**
- Create seed script to populate development data
- Document seed data requirements in README
- Phase 1: Manual data insertion acceptable

### Risk: N+1 Query Performance
**Risk:** Naive Prisma queries may cause performance issues with related data.

**Mitigation:**
- Use `include` and `select` strategically in queries
- Monitor query patterns in development
- Optimize in separate performance proposal if needed
- Current mock data is small, performance not critical yet

### Risk: Breaking API Contracts
**Risk:** Database queries return different shapes than mock data.

**Mitigation:**
- Carefully map database results to existing mock response shapes
- Test each endpoint manually before marking complete
- Use TypeScript types from mock data as target interface

## Migration Plan

### Phase 1: Infrastructure (Tasks 1.x)
1. Create Prisma schema file
2. Configure environment variables
3. Generate Prisma Client
4. Test database connection

**Validation:** Can query database successfully with Prisma Client

### Phase 2: Assets API (Tasks 2.x)
1. Migrate assets listing endpoint
2. Migrate asset detail endpoint
3. Test filtering and response shapes

**Validation:** Assets table in UI loads real data

### Phase 3: Portfolio API (Tasks 3.x)
1. Migrate portfolio endpoint
2. Implement aggregation logic
3. Test calculations match mock expectations

**Validation:** Portfolio summary displays real holdings

### Phase 4: Transactions API (Tasks 4.x)
1. Migrate transaction creation
2. Test persistence and retrieval

**Validation:** Can create transactions via UI modals

### Rollback Strategy
- Keep `lib/mockData.ts` intact during migration
- Use feature flag environment variable to toggle between mock/real data
- Fallback to mock APIs if database connection fails

## Open Questions
- [ ] Should we seed the database with demo data from `mockData.ts`?
- [ ] Do we need database migrations, or is schema already deployed?
- [ ] Should we add database connection retry logic?
- [ ] What error handling strategy for database failures?

