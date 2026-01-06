# Project Context

## Purpose
Mantle RealFi Console App is a portfolio management dashboard for Real-World Assets (RWA). Users can view, analyze, and manage their tokenized asset portfolios including treasury bonds, real estate, credit instruments, and cash flow assets. The application provides portfolio analytics, risk assessment, AI-powered copilot assistance, and transaction capabilities.

## Tech Stack
- **Frontend Framework**: Next.js 16.1.1 (App Router)
- **UI Library**: React 19.2.3
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 with custom theme
- **UI Components**: Radix UI primitives (@radix-ui/react-*)
- **Database**: PostgreSQL (via Prisma ORM)
- **State Management**: React Context API with custom providers
- **Notifications**: Sonner (toast notifications)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Linting/Formatting**: Biome
- **Package Manager**: pnpm

## Project Conventions

### Code Style
- **Formatter**: Biome with 2-space indentation, 80 character line width
- **Quotes**: Single quotes for JavaScript/TypeScript, double quotes for JSX attributes
- **Semicolons**: As needed (not required)
- **Trailing Commas**: Always
- **Arrow Functions**: Always use parentheses for parameters
- **File Naming**: kebab-case for files, PascalCase for React components
- **Path Aliases**: Use `@/` prefix for imports from project root
- **TypeScript**: Strict mode enabled, prefer explicit types

### Architecture Patterns
- **App Router**: Next.js App Router with Server and Client Components
- **Component Organization**: 
  - Business components in `components/business/`
  - Reusable UI components in `components/ui/`
  - Page-specific components in `app/[route]/components/`
- **API Routes**: Next.js API routes in `app/api/`
- **Data Fetching**: 
  - Server-side: Direct database queries in API routes
  - Client-side: Custom hooks (`usePortfolio`, `useCopilot`, `useWallet`)
- **State Management**: Context providers for global state (PortfolioProvider, CopilotProvider, WalletProvider)
- **Service Layer**: API functions in `lib/api.ts`, actions in `lib/actions.ts`
- **Mock Data**: Currently using mock data in `lib/mockData.ts` (transitioning to real database)

### Testing Strategy
- Testing setup not yet configured
- Prefer unit tests for utility functions
- Integration tests for API routes
- Component tests for complex UI interactions

### Git Workflow
- **Commit Linting**: Commitlint with conventional commits (via Husky)
- **Pre-commit**: Biome formatting and linting via lint-staged
- **Branch Strategy**: Not yet defined (likely feature branches with main/master)
- **Commit Format**: Conventional commits (feat:, fix:, refactor:, etc.)

## Domain Context

### Asset Types
- **Treasury**: Government and investment-grade corporate bonds (low risk, 4-6% APY)
- **Real Estate**: Tokenized commercial/residential properties (medium risk, 8-10% APY)
- **Credit**: Invoice factoring, trade finance (medium-high risk, 10-12% APY)
- **Cash**: Revenue-backed assets like SaaS MRR, royalties (variable risk, 7-13% APY)

### Key Concepts
- **APY**: Annual Percentage Yield
- **AUM**: Assets Under Management
- **NAV**: Net Asset Value (daily tracking)
- **Risk Score**: 0-100 scale (lower is safer)
- **Yield Confidence**: 0-100 scale (higher is more predictable)
- **Holdings**: User's positions in assets (shares × price = value)
- **Portfolio**: User's total holdings across all assets plus cash
- **Weighted APY**: Portfolio-level APY weighted by position values
- **Allocation**: Distribution of portfolio value across asset types

### Database Schema
- **users**: User accounts (UUID primary key)
- **assets**: Available investment assets with metadata
- **portfolios**: User portfolio summary (1:1 with users)
- **portfolio_holdings**: User positions in assets (many-to-many)
- **asset_yield_history**: Daily yield tracking (30-day window)
- **asset_nav_history**: Daily NAV tracking (30-day window)
- **asset_events**: Transaction history (Deposit, Withdraw, Payout)
- **asset_yield_breakdowns**: Yield component analysis
- **asset_confidence_factors**: Risk assessment factors
- **asset_real_world_info**: Real-world asset details and verification

### User Flows
1. **Dashboard View**: View portfolio summary, asset table, quick actions
2. **Asset Detail**: View individual asset details (yield, risk, real-world info)
3. **Portfolio Management**: Add positions, redeem shares, view allocation
4. **AI Copilot**: Ask questions about portfolio risk, get rebalancing advice
5. **Transactions**: Execute deposits, withdrawals, and view transaction history

## Important Constraints
- **No Foreign Key Constraints**: Per user preference, omit foreign key constraints in SQL schemas
- **Demo Environment**: Currently using mock data; transitioning to real database
- **Financial Data**: All yields, prices, and recommendations are simulated (not financial advice)
- **Dark Mode**: Application defaults to dark theme
- **Responsive Design**: Mobile-first approach with breakpoints for desktop

## External Dependencies
- **PostgreSQL**: Primary database (via Prisma)
- **Mantle Network**: Blockchain network for tokenized assets (token addresses, distributor addresses)
- **AI Copilot**: Currently mock responses; will integrate with real AI service
- **Wallet Integration**: WalletProvider suggests future wallet connectivity (not yet implemented)
