# Change: Add Prisma Database Integration

## Why
The application currently uses mock data from `lib/mockData.ts` for all asset, portfolio, and transaction operations. To support real production data, user authentication, and persistent storage, we need to replace the mock APIs with actual PostgreSQL database queries using Prisma ORM.

## What Changes
- Create Prisma schema file based on existing `db.sql` PostgreSQL schema
- Generate Prisma Client and configure database connection
- Create database client singleton for Next.js edge runtime
- Replace mock data API calls with real database queries in all API routes:
  - `app/api/assets/route.ts` - List and filter assets
  - `app/api/assets/[id]/route.ts` - Get asset details with user position
  - `app/api/portfolio/route.ts` - Get user portfolio with holdings
  - `app/api/transactions/route.ts` - Create transaction records
  - `app/api/ai/copilot/route.ts` - Keep as mock (AI integration is separate concern)
- Update `lib/api.ts` utility functions to use database instead of mock data
- Maintain existing API contracts and response shapes for backward compatibility

## Impact
- **Affected specs**: `data-access`, `api-layer`
- **Affected code**: 
  - New: `prisma/schema.prisma`, `lib/db.ts`
  - Modified: `app/api/assets/route.ts`, `app/api/assets/[id]/route.ts`, `app/api/portfolio/route.ts`, `app/api/transactions/route.ts`, `lib/api.ts`
  - Environment: Requires `DATABASE_URL` environment variable
- **Database**: PostgreSQL connection at `postgresql://postgres:postgres123@localhost:5432/mantle`
- **Breaking changes**: None - API contracts remain the same, only backend implementation changes

