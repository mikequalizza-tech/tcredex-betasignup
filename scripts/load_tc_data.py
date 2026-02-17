#!/usr/bin/env python3
"""
tCredex Data Loader - Populates tax credit eligibility tables
Run this after applying 010_master_tc_schema.sql migration

Usage:
  python load_tc_data.py --connection-string "postgresql://user:pass@host:5432/db"
  
Or with environment variable:
  export DATABASE_URL="postgresql://user:pass@host:5432/db"
  python load_tc_data.py

Requirements:
  pip install pandas openpyxl psycopg2-binary
"""

import os
import sys
import argparse
import pandas as pd
import numpy as np
from pathlib import Path

try:
    import psycopg2
    from psycopg2.extras import execute_values
except ImportError:
    print("Error: psycopg2 not installed. Run: pip install psycopg2-binary")
    sys.exit(1)

# Data file paths (relative to script location)
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR.parent / "data"

DATA_FILES = {
    "nmtc": DATA_DIR / "NMTC_Stackability_by_Tract_and_State_2020_ACS_20251202.xlsx",
    "state_programs": DATA_DIR / "State_Tax_Credit_Programs_Combined_2025_With_Stacking.xlsx",
    "opportunity_zones": DATA_DIR / "Opportunity_Zones_TC_122825.xlsx",
}


def bool_convert(val):
    """Convert various boolean representations to Python bool."""
    if pd.isna(val):
        return False
    val_str = str(val).upper().strip()
    return val_str in ['YES', 'Y', 'TRUE', '1']


def transferable_convert(val):
    """Parse transferable field."""
    if pd.isna(val):
        return False
    val_str = str(val).lower().strip()
    return 'yes' in val_str or 'transfer' in val_str or 'one-time' in val_str


def refundable_convert(val):
    """Parse refundable field."""
    if pd.isna(val):
        return False
    val_str = str(val).lower().strip()
    return 'yes' in val_str or 'refund' in val_str or 'y (' in val_str


def safe_float(val):
    """Convert to float, handling NaN."""
    if pd.isna(val):
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def safe_str(val):
    """Convert to string, handling NaN."""
    if pd.isna(val):
        return None
    return str(val).strip()


def load_federal_tract_eligibility(conn, df):
    """Load federal_tract_eligibility table from NMTC data."""
    print("Loading federal_tract_eligibility...")
    
    # Rename columns for easier access
    df.columns = [
        'geoid', 'state_name', 'county_name', 'is_nmtc_lic', 
        'poverty_rate_pct', 'poverty_qualifies', 'mfi_pct', 'mfi_qualifies',
        'unemployment_rate_pct', 'unemployment_qualifies',
        'state_nmtc', 'nmtc_transferable', 'nmtc_refundable',
        'state_htc', 'htc_transferable', 'htc_refundable',
        'brownfield_credit', 'brownfield_transferable', 'brownfield_refundable',
        'classification'
    ]
    
    # Normalize GEOID to 11 chars
    df['geoid'] = df['geoid'].astype(str).str.zfill(11)
    
    # Prepare data
    records = []
    for _, row in df.iterrows():
        records.append((
            row['geoid'],
            safe_str(row['state_name']),
            safe_str(row['county_name']),
            bool_convert(row['is_nmtc_lic']),
            safe_float(row['poverty_rate_pct']),
            bool_convert(row['poverty_qualifies']),
            safe_float(row['mfi_pct']),
            bool_convert(row['mfi_qualifies']),
            safe_float(row['unemployment_rate_pct']),
            bool_convert(row['unemployment_qualifies']),
        ))
    
    # Truncate and insert
    with conn.cursor() as cur:
        cur.execute("TRUNCATE federal_tract_eligibility CASCADE")
        
        insert_sql = """
            INSERT INTO federal_tract_eligibility (
                geoid, state_name, county_name,
                is_nmtc_lic, poverty_rate_pct, poverty_qualifies, 
                mfi_pct, mfi_qualifies,
                unemployment_rate_pct, unemployment_qualifies
            ) VALUES %s
        """
        
        # Insert in batches
        batch_size = 5000
        for i in range(0, len(records), batch_size):
            batch = records[i:i+batch_size]
            execute_values(cur, insert_sql, batch)
            print(f"  Inserted {min(i+batch_size, len(records))}/{len(records)}")
        
        conn.commit()
    
    print(f"  Done: {len(records)} records")
    return records


def load_state_tract_eligibility(conn, df):
    """Load state_tract_eligibility table from NMTC data."""
    print("Loading state_tract_eligibility...")
    
    # Use same renamed columns as federal
    df.columns = [
        'geoid', 'state_name', 'county_name', 'is_nmtc_lic', 
        'poverty_rate_pct', 'poverty_qualifies', 'mfi_pct', 'mfi_qualifies',
        'unemployment_rate_pct', 'unemployment_qualifies',
        'state_nmtc', 'nmtc_transferable', 'nmtc_refundable',
        'state_htc', 'htc_transferable', 'htc_refundable',
        'brownfield_credit', 'brownfield_transferable', 'brownfield_refundable',
        'classification'
    ]
    
    df['geoid'] = df['geoid'].astype(str).str.zfill(11)
    
    records = []
    for _, row in df.iterrows():
        records.append((
            row['geoid'],
            safe_str(row['state_name']),
            bool_convert(row['state_nmtc']),
            transferable_convert(row['nmtc_transferable']),
            refundable_convert(row['nmtc_refundable']),
            bool_convert(row['state_htc']),
            transferable_convert(row['htc_transferable']),
            refundable_convert(row['htc_refundable']),
            bool_convert(row['brownfield_credit']),
            transferable_convert(row['brownfield_transferable']),
            refundable_convert(row['brownfield_refundable']),
            safe_str(row['classification']),
        ))
    
    with conn.cursor() as cur:
        cur.execute("TRUNCATE state_tract_eligibility CASCADE")
        
        insert_sql = """
            INSERT INTO state_tract_eligibility (
                geoid, state_name,
                is_state_nmtc, state_nmtc_transferable, state_nmtc_refundable,
                is_state_htc, state_htc_transferable, state_htc_refundable,
                is_state_brownfield, state_brownfield_transferable, state_brownfield_refundable,
                credit_classification
            ) VALUES %s
        """
        
        batch_size = 5000
        for i in range(0, len(records), batch_size):
            batch = records[i:i+batch_size]
            execute_values(cur, insert_sql, batch)
            print(f"  Inserted {min(i+batch_size, len(records))}/{len(records)}")
        
        conn.commit()
    
    print(f"  Done: {len(records)} records")


def load_state_tax_credit_programs(conn, df):
    """Load state_tax_credit_programs table."""
    print("Loading state_tax_credit_programs...")
    
    records = []
    for _, row in df.iterrows():
        # Parse LIHTC refundable/transferable from combined field
        lihtc_rt = str(row.get('refundable_transferable_stc', '')).lower()
        lihtc_trans = 'transfer' in lihtc_rt
        lihtc_ref = 'refund' in lihtc_rt
        
        # Parse Brownfield refundable/transferable
        bf_rt = str(row.get('Refundable / Transferable_BROWNFIELD', '')).lower()
        bf_trans = 'transfer' in bf_rt
        bf_ref = 'refund' in bf_rt
        
        records.append((
            safe_str(row['state_name']),
            # State NMTC
            bool_convert(row['state_nmtc']),
            safe_str(row['program_name']),
            safe_str(row['admin_agency']),
            safe_str(row['credit_structure']),
            bool_convert(row['state_nmtc_transferable']),
            safe_str(row['Notes / Statutory Reference']),
            # State LIHTC
            bool_convert(row['state_lihtc']),
            safe_str(row['program_size']),
            safe_str(row['tc_%_years']),
            lihtc_trans,
            lihtc_ref,
            safe_str(row['admin_agent_lihtc']),
            # State HTC
            bool_convert(row['state_htc']),
            safe_str(row['tc%']),
            safe_str(row['annual_or_per_project_cap']),
            bool_convert(row['st_htc_transferable']),
            bool_convert(row['st_htc_refundable']),
            safe_str(row['admin_agent_sthtc']),
            # State OZ
            bool_convert(row['st_oz_tc']),
            bool_convert(row['oz_to_fed']),
            safe_str(row['Program Type']),
            safe_str(row['Administering Agency_OZ']),
            # Brownfield
            bool_convert(row['brownfield_credit']),
            safe_str(row['Credit Type']),
            safe_str(row['Credit % / Amount']),
            bf_trans,
            bf_ref,
            safe_str(row['Administering Agency']),
            safe_str(row['Notes / Statutes']),
            # Stacking
            safe_str(row['Stackable With']),
        ))
    
    with conn.cursor() as cur:
        cur.execute("TRUNCATE state_tax_credit_programs CASCADE")
        
        insert_sql = """
            INSERT INTO state_tax_credit_programs (
                state_name,
                has_state_nmtc, state_nmtc_program_name, state_nmtc_admin_agency,
                state_nmtc_credit_structure, state_nmtc_transferable, state_nmtc_notes,
                has_state_lihtc, state_lihtc_program_size, state_lihtc_credit_pct_years,
                state_lihtc_transferable, state_lihtc_refundable, state_lihtc_admin_agency,
                has_state_htc, state_htc_credit_pct, state_htc_annual_cap,
                state_htc_transferable, state_htc_refundable, state_htc_admin_agency,
                has_state_oz, state_oz_federal_conformity, state_oz_program_type, state_oz_admin_agency,
                has_brownfield_credit, brownfield_credit_type, brownfield_credit_amount,
                brownfield_transferable, brownfield_refundable, brownfield_admin_agency, brownfield_notes,
                stacking_notes
            ) VALUES %s
        """
        
        execute_values(cur, insert_sql, records)
        conn.commit()
    
    print(f"  Done: {len(records)} records")


def load_opportunity_zones(conn, df):
    """Load opportunity_zones table."""
    print("Loading opportunity_zones...")
    
    # Normalize GEOID
    df['geoid'] = df['GEOID10'].astype(str).str.zfill(11)
    
    records = []
    for _, row in df.iterrows():
        geoid = row['geoid']
        records.append((
            geoid,
            geoid[:2],   # state_fips
            geoid[2:5],  # county_fips
            geoid[5:],   # tract_fips
            safe_str(row['STATE_NAME']),
            safe_str(row['STUSAB']),
            2018,  # designation_year
            safe_float(row['Shape__Area']),
            safe_float(row['Shape__Length']),
        ))
    
    with conn.cursor() as cur:
        cur.execute("TRUNCATE opportunity_zones CASCADE")
        
        insert_sql = """
            INSERT INTO opportunity_zones (
                geoid, state_fips, county_fips, tract_fips,
                state_name, state_abbrev, designation_year,
                shape_area, shape_length
            ) VALUES %s
        """
        
        execute_values(cur, insert_sql, records)
        conn.commit()
    
    print(f"  Done: {len(records)} records")
    
    # Update federal_tract_eligibility with OZ flags
    print("Updating OZ flags in federal_tract_eligibility...")
    oz_geoids = tuple(df['geoid'].tolist())
    
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE federal_tract_eligibility
            SET is_oz_designated = TRUE
            WHERE geoid = ANY(%s)
        """, (list(oz_geoids),))
        
        updated = cur.rowcount
        conn.commit()
    
    print(f"  Updated {updated} tracts with OZ designation")


def main():
    parser = argparse.ArgumentParser(description='Load tCredex tax credit data')
    parser.add_argument('--connection-string', '-c', 
                       help='PostgreSQL connection string',
                       default=os.environ.get('DATABASE_URL'))
    parser.add_argument('--data-dir', '-d',
                       help='Directory containing data files',
                       default=str(DATA_DIR))
    args = parser.parse_args()
    
    if not args.connection_string:
        print("Error: No connection string provided.")
        print("Use --connection-string or set DATABASE_URL environment variable.")
        sys.exit(1)
    
    # Check data files exist
    data_dir = Path(args.data_dir)
    for name, path in DATA_FILES.items():
        check_path = data_dir / path.name
        if not check_path.exists():
            print(f"Error: Data file not found: {check_path}")
            print(f"Please place {path.name} in {data_dir}")
            sys.exit(1)
    
    # Connect to database
    print(f"Connecting to database...")
    conn = psycopg2.connect(args.connection_string)
    
    try:
        # Load NMTC data (used for both federal and state tract eligibility)
        nmtc_path = data_dir / DATA_FILES['nmtc'].name
        print(f"Reading {nmtc_path}...")
        nmtc_df = pd.read_excel(nmtc_path)
        
        # Load federal tract eligibility
        load_federal_tract_eligibility(conn, nmtc_df.copy())
        
        # Load state tract eligibility
        load_state_tract_eligibility(conn, nmtc_df.copy())
        
        # Load state programs
        state_path = data_dir / DATA_FILES['state_programs'].name
        print(f"Reading {state_path}...")
        state_df = pd.read_excel(state_path)
        load_state_tax_credit_programs(conn, state_df)
        
        # Load opportunity zones
        oz_path = data_dir / DATA_FILES['opportunity_zones'].name
        print(f"Reading {oz_path}...")
        oz_df = pd.read_excel(oz_path)
        load_opportunity_zones(conn, oz_df)
        
        print("\n=== Data Load Complete ===")
        
        # Verify counts
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM federal_tract_eligibility")
            print(f"federal_tract_eligibility: {cur.fetchone()[0]} rows")
            
            cur.execute("SELECT COUNT(*) FROM state_tract_eligibility")
            print(f"state_tract_eligibility: {cur.fetchone()[0]} rows")
            
            cur.execute("SELECT COUNT(*) FROM state_tax_credit_programs")
            print(f"state_tax_credit_programs: {cur.fetchone()[0]} rows")
            
            cur.execute("SELECT COUNT(*) FROM opportunity_zones")
            print(f"opportunity_zones: {cur.fetchone()[0]} rows")
            
            cur.execute("SELECT COUNT(*) FROM federal_tract_eligibility WHERE is_oz_designated = TRUE")
            print(f"OZ-designated tracts: {cur.fetchone()[0]}")
    
    finally:
        conn.close()


if __name__ == '__main__':
    main()
