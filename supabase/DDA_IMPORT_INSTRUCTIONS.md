# DDA Import Instructions

## Overview
Import HUD Difficult Development Area (DDA) data into Supabase.

**DDA is NOT a standalone qualifier** - it provides a 30% basis boost for LIHTC QCT projects.

## Files Location
`C:\tcredex.com\tracts\In Supabase CSV\`

Cleaned files (ready for import):
- `dda_metro_2025_clean.csv` (~22,192 rows)
- `dda_metro_2026_clean.csv` (~22,137 rows)
- `dda_nonmetro_2025_clean.csv` (~1,962 rows)
- `dda_nonmetro_2026_clean.csv` (~1,963 rows)

---

## Step 1: Run Migration 031 (Create Tables)

In Supabase SQL Editor, run the contents of:
`supabase/migrations/031_dda_tables_and_import.sql`

This creates 4 tables:
- `dda_metro_2025`
- `dda_metro_2026`
- `dda_nonmetro_2025`
- `dda_nonmetro_2026`

And adds DDA columns to `master_tax_credit_sot`.

---

## Step 2: Import CSV Data

Go to Supabase Table Editor for each table and import:

### dda_metro_2025
1. Select table `dda_metro_2025`
2. Click "Insert" → "Import data from CSV"
3. Upload `dda_metro_2025_clean.csv`
4. Verify columns match, then import

### dda_metro_2026
Same process with `dda_metro_2026_clean.csv`

### dda_nonmetro_2025
Same process with `dda_nonmetro_2025_clean.csv`

### dda_nonmetro_2026
Same process with `dda_nonmetro_2026_clean.csv`

---

## Step 3: Run Migration 032 (Populate DDA Flags)

In Supabase SQL Editor, run the contents of:
`supabase/migrations/032_update_dda_flags.sql`

This updates `master_tax_credit_sot` with:
- `is_dda_2025` = TRUE for matching tracts
- `is_dda_2026` = TRUE for matching tracts

**Logic:**
- Non-Metro: Match County FIPS (first 5 digits of GEOID)
- Metro: Match ZIP via `zip_tract_crosswalk` table

---

## Step 4: Verify

Run this query to verify counts:

```sql
SELECT
    COUNT(*) FILTER (WHERE is_dda_2025) as dda_2025_tracts,
    COUNT(*) FILTER (WHERE is_dda_2026) as dda_2026_tracts,
    COUNT(*) FILTER (WHERE is_dda_2025 AND is_lihtc_qct_2025) as qct_plus_dda_2025,
    COUNT(*) FILTER (WHERE is_dda_2026 AND is_lihtc_qct_2026) as qct_plus_dda_2026
FROM master_tax_credit_sot;
```

Expected: Thousands of DDA tracts, with a subset that are also QCT (these get the 30% boost).

---

## UI Display Logic

In the frontend:
```typescript
if (tract.is_lihtc_qct_2025 && tract.is_dda_2025) {
  show "LIHTC QCT + DDA (30% Boost)"
}
```

DDA alone does NOT display anything - it only matters when combined with QCT.
