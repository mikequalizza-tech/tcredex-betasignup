#!/usr/bin/env python3
"""
Import LIHTC High Opportunity Areas (HOA) data into Supabase.

Usage:
    python import_hoa_data.py

Requires:
    - SUPABASE_URL environment variable
    - SUPABASE_SERVICE_KEY environment variable
    - pandas, supabase-py packages
"""

import os
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    print("Make sure your .env.local file has these variables set")
    exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Path to HOA data file
HOA_FILE = r"C:\tcredex.com\2025-02-21_A01_HOA_FILE.csv"

def import_hoa_data():
    print(f"Reading HOA data from: {HOA_FILE}")

    # Read CSV
    df = pd.read_csv(HOA_FILE)
    print(f"Loaded {len(df)} rows")

    # Pad FIPS11 to 11 characters
    df['FIPS11'] = df['FIPS11'].astype(str).str.zfill(11)

    # Prepare data for insert
    records = []
    for _, row in df.iterrows():
        records.append({
            "state_fips": str(row['STATE']).zfill(2),
            "county_fips": str(row['COUNTY']).zfill(3),
            "tract_fips": str(row['TRACT']).zfill(6),
            "geoid": row['FIPS11'],
            "msa_code": str(row['MSA23']) if pd.notna(row['MSA23']) else None,
            "high_opp": int(row['HIGH_OPP']),
            "dda_flag": int(row['DDA_FLAG']),
            "qap_flag": int(row['QAP_FLAG']),
            "ct_duplicate": int(row['CT_DUPLICATE'])
        })

    print(f"Prepared {len(records)} records for insert")

    # Clear existing data
    print("Clearing existing HOA staging data...")
    supabase.table("lihtc_hoa_staging").delete().neq("geoid", "").execute()

    # Insert in batches of 1000
    batch_size = 1000
    total_inserted = 0

    for i in range(0, len(records), batch_size):
        batch = records[i:i+batch_size]
        try:
            supabase.table("lihtc_hoa_staging").insert(batch).execute()
            total_inserted += len(batch)
            print(f"Inserted batch {i//batch_size + 1}: {total_inserted}/{len(records)} records")
        except Exception as e:
            print(f"Error inserting batch {i//batch_size + 1}: {e}")
            # Try inserting one by one to find problematic records
            for record in batch:
                try:
                    supabase.table("lihtc_hoa_staging").insert(record).execute()
                    total_inserted += 1
                except Exception as e2:
                    print(f"Failed to insert record {record['geoid']}: {e2}")

    print(f"\nTotal inserted: {total_inserted} records")

    # Update master table
    print("\nUpdating master_tax_credit_sot with HOA data...")
    try:
        supabase.rpc("update_master_with_hoa_data").execute()
        print("Master table updated successfully!")
    except Exception as e:
        print(f"Error updating master table: {e}")
        print("You may need to run: SELECT update_master_with_hoa_data(); manually in Supabase")

    # Print summary stats
    print("\n=== Summary ===")
    result = supabase.table("lihtc_hoa_staging").select("high_opp", count="exact").eq("high_opp", 0).execute()
    print(f"HIGH_OPP = 0 (Not HOA): {result.count}")

    result = supabase.table("lihtc_hoa_staging").select("high_opp", count="exact").eq("high_opp", 1).execute()
    print(f"HIGH_OPP = 1 (HOA+DDA): {result.count}")

    result = supabase.table("lihtc_hoa_staging").select("high_opp", count="exact").eq("high_opp", 2).execute()
    print(f"HIGH_OPP = 2 (HOA only): {result.count}")

    result = supabase.table("lihtc_hoa_staging").select("high_opp", count="exact").eq("high_opp", 3).execute()
    print(f"HIGH_OPP = 3 (HOA+QCT): {result.count}")

    result = supabase.table("lihtc_hoa_staging").select("dda_flag", count="exact").eq("dda_flag", 1).execute()
    print(f"DDA eligible tracts: {result.count}")

if __name__ == "__main__":
    import_hoa_data()
