# NMTC Census Tract Eligibility Data

## Data Source
- **Source**: CDFI Fund 2016-2020 ACS Low-Income Community Data
- **File**: `NMTC_Stackability_by_Tract_and_State_2020_ACS.xlsx`
- **Updated**: December 2024

## Statistics
- **Total US Census Tracts**: 85,395
- **NMTC Eligible Tracts**: 35,167 (41.2%)
- **States/Territories**: 52

## Data File

The `tract_eligible.json` file contains all 35,167 eligible tracts in a compact format:

```json
{
  "17031010100": ["IL", "Cook County", 27.6, 85.4, 5.1, 1, 0, "N"],
  ...
}
```

### Format
Each tract entry is an array: `[stateAbbr, county, poverty, income, unemployment, povertyQ, incomeQ, class]`

| Index | Field | Type | Description |
|-------|-------|------|-------------|
| 0 | stateAbbr | string | 2-letter state abbreviation |
| 1 | county | string | County name |
| 2 | poverty | number | Poverty rate % |
| 3 | income | number | Median income as % of AMI |
| 4 | unemployment | number | Unemployment rate % |
| 5 | povertyQ | 0/1 | Qualifies on poverty (≥20%) |
| 6 | incomeQ | 0/1 | Qualifies on income (≤80% AMI) |
| 7 | class | string | N=Neither, S=Sellable, R=Refundable, B=Both |

## Setup

1. Copy `tract_eligible.json` to `public/data/tract_eligible.json`
2. The API will automatically load it on first request

## API Endpoints

### Single Lookup
```
GET /api/tracts/lookup?geoid=17031010100
```

### Batch Lookup
```
GET /api/tracts/batch?geoids=17031010100,17031010201
POST /api/tracts/batch
Body: { "geoids": ["17031010100", "17031010201"] }
```

### State Data
```
GET /api/tracts?state=IL
```

### Search
```
GET /api/tracts?search=true&minPoverty=30&limit=50
```

### National Summary
```
GET /api/tracts?summary=true
```

## TypeScript Usage

```typescript
import { lookupTract, getTractsByState, searchTracts } from '@/lib/tracts';

// Single lookup
const tract = await lookupTract('17031010100');
if (tract) {
  console.log(`${tract.county}, ${tract.state}: ${tract.poverty}% poverty`);
}

// Get all IL tracts
const ilTracts = await getTractsByState('IL');

// Find severely distressed tracts
const distressed = await searchTracts({
  severelyDistressed: true,
  limit: 100
});
```

## Eligibility Criteria

A census tract qualifies as a Low-Income Community (LIC) if:
- Poverty rate ≥ 20%, OR
- Median family income ≤ 80% of area median

### Severely Distressed
- Poverty rate ≥ 30%, OR
- Both poverty AND income criteria met with unemployment ≥ 10%

## Classification

| Classification | Description |
|----------------|-------------|
| Sellable | State credit can be sold/transferred |
| Refundable | State credit is refundable |
| Both | Both sellable and refundable |
| Neither | No special state credit features |
