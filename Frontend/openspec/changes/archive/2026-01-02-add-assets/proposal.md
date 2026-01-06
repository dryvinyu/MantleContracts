# Change: Add Asset Creation Capability

## Why
Currently, the system only supports viewing and managing existing assets. Users can view assets in the dashboard and add positions to existing assets, but there is no way to create new assets. The "Add Asset" button in the AssetsTable component currently shows a placeholder toast message. This change enables administrators or authorized users to create new investment assets with all required metadata, making the system fully functional for asset management.

## What Changes
- **API Layer**: Add POST endpoint `/api/assets` to create new assets
- **Frontend UI**: Replace placeholder "Add Asset" button with functional asset creation form/modal
- **Validation**: Implement server-side validation for all asset fields including required fields, data types, and business rules
- **Database**: Use existing Prisma schema to persist new assets with all related metadata (yield breakdowns, confidence factors, real-world info, etc.)

## Impact
- **Affected specs**: `api-layer` (new POST endpoint requirement)
- **Affected code**: 
  - `app/api/assets/route.ts` (add POST handler)
  - `app/dashboard/components/AssetsTable/index.tsx` (replace placeholder with modal)
  - New component: `components/AddAssetModal.tsx` (asset creation form)
- **Breaking changes**: None (additive change only)

