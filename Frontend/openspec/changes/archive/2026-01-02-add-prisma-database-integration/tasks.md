## 1. Setup Prisma Infrastructure
- [x] 1.1 Create `prisma/schema.prisma` with complete data model from `db.sql`
- [x] 1.2 Configure PostgreSQL connection string in `.env` file
- [x] 1.3 Generate Prisma Client with `npx prisma generate`
- [x] 1.4 Create `lib/db.ts` singleton for database client
- [x] 1.5 Verify database connection and schema alignment

## 2. Migrate Assets API
- [x] 2.1 Update `app/api/assets/route.ts` to query from database with filters
- [x] 2.2 Update `app/api/assets/[id]/route.ts` to fetch asset with related data
- [x] 2.3 Update `lib/api.ts` `fetchAssets` function to use Prisma
- [x] 2.4 Update `lib/api.ts` `fetchAssetById` function to use Prisma

## 3. Migrate Portfolio API
- [x] 3.1 Update `app/api/portfolio/route.ts` to query user portfolio from database
- [x] 3.2 Update `lib/api.ts` `fetchPortfolio` function to use Prisma
- [x] 3.3 Implement portfolio calculation logic (weighted APY, risk score, allocation)
- [x] 3.4 Handle user authentication (hardcode demo user for now)

## 4. Migrate Transactions API
- [x] 4.1 Update `app/api/transactions/route.ts` to create transaction records
- [x] 4.2 Update `lib/api.ts` `postTransaction` function to use Prisma
- [x] 4.3 Implement transaction creation with proper data validation

## 5. Testing and Validation
- [ ] 5.1 Test assets listing with query parameters (type, minAPY, maxRisk)
- [ ] 5.2 Test asset detail retrieval with user position calculation
- [ ] 5.3 Test portfolio summary with holdings and allocations
- [ ] 5.4 Test transaction creation and database persistence
- [ ] 5.5 Verify all API responses match existing mock API format

