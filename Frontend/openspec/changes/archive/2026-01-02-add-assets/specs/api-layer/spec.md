## ADDED Requirements

### Requirement: Asset Creation API
The system SHALL provide an API endpoint to create new investment assets in the database.

#### Scenario: Create asset with valid data
- **WHEN** POST request is made to `/api/assets` with valid asset data in request body
- **THEN** it MUST validate all required fields are present
- **AND** it MUST validate all field values meet database constraints
- **AND** it MUST check that asset ID does not already exist
- **AND** it MUST create the asset record in the database
- **AND** it MUST return 201 status code
- **AND** response MUST include the created asset object matching GET response format

#### Scenario: Missing required fields
- **WHEN** POST request is made with missing required fields
- **THEN** it MUST return 400 status code
- **AND** response MUST include error message listing missing fields
- **AND** no asset MUST be created in the database

#### Scenario: Invalid field values
- **WHEN** POST request contains invalid field values (e.g., negative APY, risk score > 100)
- **THEN** it MUST return 400 status code
- **AND** response MUST include error message describing validation failures
- **AND** no asset MUST be created in the database

#### Scenario: Duplicate asset ID
- **WHEN** POST request contains an asset ID that already exists
- **THEN** it MUST return 409 status code
- **AND** response MUST include error message indicating duplicate ID
- **AND** no asset MUST be created in the database

#### Scenario: Invalid enum values
- **WHEN** POST request contains invalid enum values for type or status
- **THEN** it MUST return 400 status code
- **AND** response MUST include error message listing valid enum values
- **AND** no asset MUST be created in the database

#### Scenario: Required fields validation
- **WHEN** POST request is validated
- **THEN** required fields MUST include: id, name, type, apy, durationDays, riskScore, yieldConfidence, aumUsd, price, status, nextPayoutDate
- **AND** optional fields MAY include: description, tokenAddress, distributorAddress
- **AND** all required fields MUST be non-empty (where applicable)

#### Scenario: Numeric range validation
- **WHEN** POST request contains numeric fields
- **THEN** apy MUST be >= 0
- **AND** durationDays MUST be > 0
- **AND** riskScore MUST be between 0 and 100 (inclusive)
- **AND** yieldConfidence MUST be between 0 and 100 (inclusive)
- **AND** aumUsd MUST be >= 0
- **AND** price MUST be >= 0
- **AND** invalid values MUST result in 400 error response

#### Scenario: Date format validation
- **WHEN** POST request contains nextPayoutDate field
- **THEN** it MUST be a valid date string (ISO 8601 format or YYYY-MM-DD)
- **AND** invalid date format MUST result in 400 error response

