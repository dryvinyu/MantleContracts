## 1. API Implementation
- [x] 1.1 Add POST handler to `/app/api/assets/route.ts`
- [x] 1.2 Implement request body validation (required fields, types, ranges)
- [x] 1.3 Validate asset ID uniqueness
- [x] 1.4 Create asset record in database using Prisma
- [x] 1.5 Handle validation errors with appropriate HTTP status codes
- [x] 1.6 Return created asset in response matching GET format

## 2. Frontend UI
- [x] 2.1 Create `components/AddAssetModal.tsx` component
- [x] 2.2 Implement form fields for all required asset properties
- [x] 2.3 Add form validation (client-side)
- [x] 2.4 Integrate modal with AssetsTable "Add Asset" button
- [x] 2.5 Handle API errors and display user-friendly messages
- [x] 2.6 Refresh assets list after successful creation

## 3. Validation & Business Rules
- [x] 3.1 Validate required fields: id, name, type, apy, durationDays, riskScore, yieldConfidence, aumUsd, price, status, nextPayoutDate
- [x] 3.2 Validate numeric ranges: apy >= 0, durationDays > 0, riskScore 0-100, yieldConfidence 0-100, aumUsd >= 0, price >= 0
- [x] 3.3 Validate enum values: type (treasury|real-estate|credit|cash), status (Active|Maturing|Paused)
- [x] 3.4 Validate date format for nextPayoutDate
- [x] 3.5 Validate asset ID format (non-empty string)

## 4. Testing & Validation
- [x] 4.1 Test API endpoint with valid asset data
- [x] 4.2 Test API endpoint with missing required fields
- [x] 4.3 Test API endpoint with invalid field values
- [x] 4.4 Test API endpoint with duplicate asset ID
- [x] 4.5 Test UI form submission and error handling
- [x] 4.6 Verify created asset appears in assets list
- [x] 4.7 Run `openspec validate add-assets --strict` and resolve issues

