## ADDED Requirements

### Requirement: Prisma Schema Definition
The system SHALL define a complete Prisma schema that mirrors the existing PostgreSQL database schema in `db.sql`.

#### Scenario: Schema includes all tables and enums
- **WHEN** the Prisma schema is generated
- **THEN** it MUST include all tables: users, assets, portfolios, portfolio_holdings, asset_yield_breakdowns, asset_confidence_factors, asset_real_world_info, asset_real_world_key_facts, asset_real_world_verifications, asset_cash_flow_sources, asset_events, asset_yield_history, asset_nav_history
- **AND** it MUST include all enums: asset_type, asset_status, asset_event_type
- **AND** field types MUST match PostgreSQL types (BigInt for bigserial, Decimal for numeric, DateTime for timestamptz)

#### Scenario: Schema uses camelCase naming with mapping
- **WHEN** Prisma models are defined
- **THEN** model fields MUST use camelCase naming (e.g., `createdAt`, `updatedAt`, `yieldConfidence`)
- **AND** fields MUST use `@map` directive to map to snake_case database columns (e.g., `@map("created_at")`)
- **AND** models MUST use `@@map` directive to map to database table names if different

#### Scenario: Schema omits foreign key constraints
- **WHEN** relationships between models are defined
- **THEN** the schema MUST NOT include `@relation` attributes that create foreign key constraints
- **AND** relationships MAY be documented in comments for reference
- **AND** the schema MUST align with user preference to omit foreign key constraints

### Requirement: Database Client Singleton
The system SHALL provide a singleton PrismaClient instance for database access throughout the application.

#### Scenario: Singleton prevents multiple instances in development
- **WHEN** the database client is imported in development mode
- **THEN** it MUST reuse the same PrismaClient instance across hot reloads
- **AND** it MUST use the global object pattern to store the singleton
- **AND** multiple imports MUST return the same instance

#### Scenario: Production uses fresh client instance
- **WHEN** the application runs in production mode
- **THEN** it MUST create a new PrismaClient instance on startup
- **AND** it MUST NOT pollute the global object
- **AND** connection pooling MUST be handled by Prisma's default configuration

#### Scenario: Database connection uses environment variable
- **WHEN** the PrismaClient is instantiated
- **THEN** it MUST read the database URL from `DATABASE_URL` environment variable
- **AND** the connection string format MUST be `postgresql://postgres:postgres123@localhost:5432/mantle`
- **AND** missing environment variable MUST cause clear error message

### Requirement: Type-Safe Database Queries
The system SHALL provide type-safe database query functions using generated Prisma Client types.

#### Scenario: Query functions return typed results
- **WHEN** a database query is executed
- **THEN** the result MUST be typed based on Prisma schema
- **AND** TypeScript MUST provide autocomplete for query methods and fields
- **AND** invalid queries MUST produce TypeScript compilation errors

#### Scenario: Prisma Client generation
- **WHEN** `npx prisma generate` is executed
- **THEN** it MUST generate TypeScript types in `node_modules/@prisma/client`
- **AND** the generated client MUST export model types matching the schema
- **AND** the client MUST be importable via `@prisma/client` package

