-- ============================================================================
-- tCredex v1.7 Seed Data
-- Test data for development and beta testing
-- ============================================================================

-- ============================================================================
-- ORGANIZATIONS
-- ============================================================================

-- Sponsors
INSERT INTO organizations (id, name, type, city, state, is_verified, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Midwest Community Development Corp', 'sponsor', 'Chicago', 'IL', true, true),
  ('11111111-1111-1111-1111-111111111112', 'Southern Growth Partners', 'sponsor', 'Atlanta', 'GA', true, true),
  ('11111111-1111-1111-1111-111111111113', 'Pacific Development Group', 'sponsor', 'Los Angeles', 'CA', true, true),
  ('11111111-1111-1111-1111-111111111114', 'Northeast Urban Renewal LLC', 'sponsor', 'Philadelphia', 'PA', true, true),
  ('11111111-1111-1111-1111-111111111115', 'Rural Opportunity Fund', 'sponsor', 'Des Moines', 'IA', true, true);

-- CDEs
INSERT INTO organizations (id, name, type, city, state, website, is_verified, is_active) VALUES
  ('22222222-2222-2222-2222-222222222221', 'National Community Investment Fund', 'cde', 'Chicago', 'IL', 'https://ncif.org', true, true),
  ('22222222-2222-2222-2222-222222222222', 'Enterprise Community Loan Fund', 'cde', 'Columbia', 'MD', 'https://enterprisecommunity.org', true, true),
  ('22222222-2222-2222-2222-222222222223', 'Capital Impact Partners', 'cde', 'Arlington', 'VA', 'https://capitalimpact.org', true, true),
  ('22222222-2222-2222-2222-222222222224', 'Reinvestment Fund', 'cde', 'Philadelphia', 'PA', 'https://reinvestment.com', true, true),
  ('22222222-2222-2222-2222-222222222225', 'Low Income Investment Fund', 'cde', 'San Francisco', 'CA', 'https://liif.org', true, true),
  ('22222222-2222-2222-2222-222222222226', 'Midwest CDE Alliance', 'cde', 'St. Louis', 'MO', 'https://midwestcde.org', true, true);

-- Investors
INSERT INTO organizations (id, name, type, city, state, is_verified, is_active) VALUES
  ('33333333-3333-3333-3333-333333333331', 'First National Bank', 'investor', 'New York', 'NY', true, true),
  ('33333333-3333-3333-3333-333333333332', 'Community Trust Bank', 'investor', 'Charlotte', 'NC', true, true),
  ('33333333-3333-3333-3333-333333333333', 'Pacific Mutual Insurance', 'investor', 'San Francisco', 'CA', true, true),
  ('33333333-3333-3333-3333-333333333334', 'Heartland Credit Union', 'investor', 'Minneapolis', 'MN', true, true);

-- Admin
INSERT INTO organizations (id, name, type, city, state, is_verified, is_active) VALUES
  ('00000000-0000-0000-0000-000000000001', 'tCredex Platform', 'admin', 'Austin', 'TX', true, true);


-- ============================================================================
-- USERS
-- ============================================================================

-- Sponsor Users
INSERT INTO users (id, organization_id, email, first_name, last_name, title, role, is_primary_contact) VALUES
  ('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'john.smith@midwestcdc.org', 'John', 'Smith', 'Executive Director', 'admin', true),
  ('aaaa1111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111112', 'maria.gonzalez@southerngrowth.com', 'Maria', 'Gonzalez', 'President', 'admin', true),
  ('aaaa1111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111113', 'david.chen@pacificdev.com', 'David', 'Chen', 'Managing Partner', 'admin', true),
  ('aaaa1111-1111-1111-1111-111111111114', '11111111-1111-1111-1111-111111111114', 'sarah.williams@neurban.org', 'Sarah', 'Williams', 'Director of Development', 'admin', true),
  ('aaaa1111-1111-1111-1111-111111111115', '11111111-1111-1111-1111-111111111115', 'mike.johnson@ruralfund.org', 'Mike', 'Johnson', 'CEO', 'admin', true);

-- CDE Users
INSERT INTO users (id, organization_id, email, first_name, last_name, title, role, is_primary_contact) VALUES
  ('bbbb2222-2222-2222-2222-222222222221', '22222222-2222-2222-2222-222222222221', 'lisa.anderson@ncif.org', 'Lisa', 'Anderson', 'VP of Lending', 'admin', true),
  ('bbbb2222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'robert.taylor@enterprisecommunity.org', 'Robert', 'Taylor', 'Senior Director', 'admin', true),
  ('bbbb2222-2222-2222-2222-222222222223', '22222222-2222-2222-2222-222222222223', 'jennifer.brown@capitalimpact.org', 'Jennifer', 'Brown', 'Chief Investment Officer', 'admin', true),
  ('bbbb2222-2222-2222-2222-222222222224', '22222222-2222-2222-2222-222222222224', 'michael.davis@reinvestment.com', 'Michael', 'Davis', 'Portfolio Manager', 'admin', true),
  ('bbbb2222-2222-2222-2222-222222222225', '22222222-2222-2222-2222-222222222225', 'emily.wilson@liif.org', 'Emily', 'Wilson', 'Director of NMTC', 'admin', true),
  ('bbbb2222-2222-2222-2222-222222222226', '22222222-2222-2222-2222-222222222226', 'james.miller@midwestcde.org', 'James', 'Miller', 'Executive Director', 'admin', true);

-- Investor Users
INSERT INTO users (id, organization_id, email, first_name, last_name, title, role, is_primary_contact) VALUES
  ('cccc3333-3333-3333-3333-333333333331', '33333333-3333-3333-3333-333333333331', 'patricia.moore@firstnational.com', 'Patricia', 'Moore', 'CRA Officer', 'admin', true),
  ('cccc3333-3333-3333-3333-333333333332', '33333333-3333-3333-3333-333333333332', 'richard.jackson@communitytrust.com', 'Richard', 'Jackson', 'VP Community Development', 'admin', true),
  ('cccc3333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'susan.white@pacificmutual.com', 'Susan', 'White', 'Investment Director', 'admin', true),
  ('cccc3333-3333-3333-3333-333333333334', '33333333-3333-3333-3333-333333333334', 'thomas.harris@heartlandcu.com', 'Thomas', 'Harris', 'CFO', 'admin', true);

-- Admin User
INSERT INTO users (id, organization_id, email, first_name, last_name, title, role, is_primary_contact) VALUES
  ('dddd0000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'admin@tcredex.com', 'Platform', 'Admin', 'System Administrator', 'admin', true);


-- ============================================================================
-- CDE PROFILES
-- ============================================================================

INSERT INTO cde_profiles (id, organization_id, certification_number, mission_statement, impact_priorities, target_sectors, service_area_type, primary_states, rural_focus, urban_focus, min_project_cost, max_project_cost, nmtc_experience, htc_experience, status) VALUES
  ('cde-prof-2222-2222-222222222221', '22222222-2222-2222-2222-222222222221', 'CDE-2001-001', 'Investing in community development financial institutions and minority depository institutions to create jobs and stimulate economic growth in underserved communities.', ARRAY['job-creation', 'small-business-support', 'minority-owned-business'], ARRAY['community_facility', 'manufacturing', 'healthcare'], 'national', ARRAY['IL', 'IN', 'OH', 'MI', 'WI'], false, true, 2000000, 25000000, true, false, 'active'),
  ('cde-prof-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'CDE-2003-045', 'Creating opportunity for low- and moderate-income communities through capital solutions for affordable housing and community facilities.', ARRAY['affordable-housing', 'healthcare-access', 'education-childcare'], ARRAY['housing', 'healthcare', 'education'], 'national', ARRAY['MD', 'VA', 'DC', 'PA', 'NY'], false, true, 5000000, 50000000, true, true, 'active'),
  ('cde-prof-2222-2222-222222222223', '22222222-2222-2222-2222-222222222223', 'CDE-2005-089', 'Delivering mission-driven capital to create opportunity in underserved communities through healthcare, education, and healthy food access.', ARRAY['healthcare-access', 'food-access', 'education-childcare'], ARRAY['healthcare', 'food_access', 'childcare'], 'national', ARRAY['CA', 'TX', 'AZ', 'NV', 'CO'], true, true, 3000000, 35000000, true, false, 'active'),
  ('cde-prof-2222-2222-222222222224', '22222222-2222-2222-2222-222222222224', 'CDE-2002-023', 'Building strong, resilient communities through strategic investment in housing, economic opportunity, and essential services.', ARRAY['job-creation', 'community-services', 'environmental-sustainability'], ARRAY['mixed_use', 'community_facility', 'manufacturing'], 'regional', ARRAY['PA', 'NJ', 'DE', 'MD'], false, true, 2500000, 30000000, true, true, 'active'),
  ('cde-prof-2222-2222-222222222225', '22222222-2222-2222-2222-222222222225', 'CDE-2000-012', 'Investing capital and expertise in underserved communities to support childcare, education, healthcare, and housing.', ARRAY['education-childcare', 'affordable-housing', 'healthcare-access'], ARRAY['childcare', 'education', 'housing'], 'national', ARRAY['CA', 'WA', 'OR', 'AZ'], false, true, 1000000, 20000000, true, false, 'active'),
  ('cde-prof-2222-2222-222222222226', '22222222-2222-2222-2222-222222222226', 'CDE-2010-156', 'Driving economic development in the heartland through strategic investments in manufacturing, healthcare, and community facilities.', ARRAY['manufacturing-revival', 'rural-development', 'healthcare-access'], ARRAY['manufacturing', 'healthcare', 'community_facility'], 'regional', ARRAY['MO', 'KS', 'IA', 'NE', 'IL'], true, false, 1500000, 15000000, true, false, 'active');

-- ============================================================================
-- CDE ALLOCATIONS
-- ============================================================================

INSERT INTO cde_allocations (id, cde_profile_id, allocation_type, year, awarded_amount, available_on_platform, percentage_won, deployment_deadline) VALUES
  -- NCIF
  ('alloc-1111-1111-1111-111111111111', 'cde-prof-2222-2222-222222222221', 'federal', '2023', 55000000, 35000000, 100, '2030-12-31'),
  ('alloc-1111-1111-1111-111111111112', 'cde-prof-2222-2222-222222222221', 'federal', '2024', 50000000, 50000000, 50, '2031-12-31'),
  -- Enterprise
  ('alloc-2222-2222-2222-222222222221', 'cde-prof-2222-2222-222222222222', 'federal', '2022', 75000000, 20000000, 100, '2029-12-31'),
  ('alloc-2222-2222-2222-222222222222', 'cde-prof-2222-2222-222222222222', 'federal', '2024', 80000000, 80000000, 100, '2031-12-31'),
  -- Capital Impact
  ('alloc-3333-3333-3333-333333333331', 'cde-prof-2222-2222-222222222223', 'federal', '2023', 60000000, 40000000, 100, '2030-12-31'),
  -- Reinvestment Fund
  ('alloc-4444-4444-4444-444444444441', 'cde-prof-2222-2222-222222222224', 'federal', '2024', 45000000, 45000000, 75, '2031-12-31'),
  ('alloc-4444-4444-4444-444444444442', 'cde-prof-2222-2222-222222222224', 'state', '2023', 10000000, 8000000, NULL, '2030-06-30'),
  -- LIIF
  ('alloc-5555-5555-5555-555555555551', 'cde-prof-2222-2222-222222222225', 'federal', '2023', 40000000, 25000000, 100, '2030-12-31'),
  -- Midwest CDE
  ('alloc-6666-6666-6666-666666666661', 'cde-prof-2222-2222-222222222226', 'federal', '2024', 30000000, 30000000, 100, '2031-12-31'),
  ('alloc-6666-6666-6666-666666666662', 'cde-prof-2222-2222-222222222226', 'state', '2024', 5000000, 5000000, NULL, '2031-06-30');


-- ============================================================================
-- INVESTOR PROFILES
-- ============================================================================

INSERT INTO investor_profiles (id, organization_id, investor_type, assessment_areas, cra_pressure, yield_target, min_investment, max_investment, programs) VALUES
  ('inv-prof-3333-3333-333333333331', '33333333-3333-3333-3333-333333333331', 'bank', ARRAY['NY', 'NJ', 'CT', 'PA'], 0.8, 0.045, 5000000, 50000000, ARRAY['NMTC', 'LIHTC']::program_type[]),
  ('inv-prof-3333-3333-333333333332', '33333333-3333-3333-3333-333333333332', 'bank', ARRAY['NC', 'SC', 'VA', 'GA'], 0.7, 0.050, 2000000, 25000000, ARRAY['NMTC', 'HTC']::program_type[]),
  ('inv-prof-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'insurance', ARRAY['CA', 'WA', 'OR', 'AZ'], 0.3, 0.055, 10000000, 100000000, ARRAY['NMTC', 'LIHTC', 'OZ']::program_type[]),
  ('inv-prof-3333-3333-333333333334', '33333333-3333-3333-3333-333333333334', 'bank', ARRAY['MN', 'WI', 'IA', 'ND', 'SD'], 0.9, 0.040, 1000000, 15000000, ARRAY['NMTC']::program_type[]);

-- ============================================================================
-- SAMPLE DEALS
-- ============================================================================

INSERT INTO deals (id, sponsor_id, project_name, project_description, project_type, status, tier, programs, address, city, state, zip_code, census_tract, tract_poverty_rate, tract_eligible, tract_severely_distressed, total_project_cost, nmtc_financing_requested, financing_gap, permanent_jobs_fte, construction_jobs_fte, site_control, exclusivity_agreed) VALUES
  -- Chicago Healthcare Facility
  ('deal-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Westside Community Health Center', 'New 45,000 SF federally qualified health center serving 25,000 patients annually in underserved West Chicago neighborhood. Will provide primary care, dental, behavioral health, and pharmacy services.', 'Healthcare', 'intake', 2, ARRAY['NMTC']::program_type[], '4521 W Madison St', 'Chicago', 'IL', '60624', '17031281800', 42.5, true, true, 28500000, 12000000, 8500000, 85, 120, 'Under Contract', true),
  
  -- Atlanta Grocery Store
  ('deal-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111112', 'Southside Fresh Market', 'Full-service grocery store in USDA-designated food desert. 35,000 SF store with pharmacy, community meeting space, and job training center.', 'Retail', 'matched', 2, ARRAY['NMTC']::program_type[], '2100 Jonesboro Rd SE', 'Atlanta', 'GA', '30315', '13121011200', 38.2, true, true, 18500000, 8000000, 5500000, 65, 80, 'Owned', true),
  
  -- LA Manufacturing
  ('deal-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111113', 'Vernon Manufacturing Hub', 'Rehabilitation of 120,000 SF former industrial building into modern manufacturing incubator with shared equipment and training facilities.', 'Manufacturing', 'intake', 1, ARRAY['NMTC', 'HTC']::program_type[], '5800 S Alameda St', 'Vernon', 'CA', '90058', '06037540100', 35.8, true, true, 42000000, 18000000, 14000000, 150, 200, 'Under Contract', true),
  
  -- Philadelphia Mixed-Use
  ('deal-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111114', 'North Broad Revitalization', 'Historic renovation of 80,000 SF building into mixed-use development with 40 affordable housing units, ground floor retail, and community space.', 'Mixed Use', 'term_sheet', 3, ARRAY['NMTC', 'HTC', 'LIHTC']::program_type[], '1500 N Broad St', 'Philadelphia', 'PA', '19121', '42101017800', 45.3, true, true, 52000000, 20000000, 18000000, 45, 180, 'Owned', true),
  
  -- Rural Iowa Childcare
  ('deal-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111115', 'Heartland Early Learning Center', 'New 15,000 SF childcare facility serving rural communities with capacity for 200 children. Includes infant care, preschool, and after-school programs.', 'Childcare', 'intake', 1, ARRAY['NMTC']::program_type[], '450 Main St', 'Marshalltown', 'IA', '50158', '19127000300', 28.5, true, false, 8500000, 4000000, 2500000, 35, 45, 'LOI', false),
  
  -- More deals to show variety
  ('deal-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'Englewood Workforce Center', 'Job training and workforce development facility in South Chicago, including classrooms, computer labs, and mock interview spaces.', 'Education', 'intake', 2, ARRAY['NMTC']::program_type[], '6320 S Halsted St', 'Chicago', 'IL', '60621', '17031681700', 48.2, true, true, 15000000, 7000000, 4500000, 25, 60, 'Under Contract', true),
  
  ('deal-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111112', 'Savannah Historic Hotel', 'Adaptive reuse of 1920s historic building into 85-room boutique hotel with restaurant and event space in downtown Savannah.', 'Hospitality', 'matched', 2, ARRAY['HTC', 'NMTC']::program_type[], '123 E Bay St', 'Savannah', 'GA', '31401', '13051000102', 31.5, true, true, 35000000, 12000000, 10000000, 95, 140, 'Owned', true);


-- ============================================================================
-- CDE MATCHES
-- ============================================================================

INSERT INTO cde_matches (id, deal_id, cde_id, match_score, match_reasons, status) VALUES
  ('match-1111-1111-1111-111111111111', 'deal-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 92, ARRAY['Healthcare sector match', 'Illinois focus state', 'Severely distressed tract', 'Deal size within range'], 'pending'),
  ('match-1111-1111-1111-111111111112', 'deal-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222223', 85, ARRAY['Healthcare sector match', 'Strong community impact', 'Severely distressed tract'], 'pending'),
  ('match-2222-2222-2222-222222222221', 'deal-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 88, ARRAY['Food access priority', 'Georgia in service area', 'Severely distressed tract'], 'accepted'),
  ('match-3333-3333-3333-333333333331', 'deal-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222225', 78, ARRAY['California focus', 'Manufacturing revival', 'HTC experience'], 'pending'),
  ('match-4444-4444-4444-444444444441', 'deal-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222224', 95, ARRAY['Philadelphia home market', 'HTC experience', 'Mixed-use preferred', 'Severely distressed'], 'accepted'),
  ('match-7777-7777-7777-777777777771', 'deal-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222', 82, ARRAY['Georgia in service area', 'HTC experience', 'Hospitality acceptable'], 'accepted');

-- ============================================================================
-- SAMPLE LOI
-- ============================================================================

INSERT INTO lois (id, deal_id, cde_id, sponsor_id, loi_number, status, allocation_amount, qlici_rate, leverage_structure, term_years, issued_at, expires_at, expected_closing_date, special_terms) VALUES
  ('loi-1111-1111-1111-111111111111', 'deal-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222224', '11111111-1111-1111-1111-111111111114', 'LOI-20241215-0001', 'sponsor_accepted', 20000000, 0.0175, 'standard', 7, '2024-12-15', '2025-01-15', '2025-06-30', 'Subject to completion of Part 2 HTC approval and LIHTC allocation confirmation.');

-- ============================================================================
-- LOI CONDITIONS
-- ============================================================================

INSERT INTO loi_conditions (id, loi_id, description, status, due_date) VALUES
  ('cond-1111-1111-1111-111111111111', 'loi-1111-1111-1111-111111111111', 'NPS Part 2 Approval', 'pending', '2025-03-01'),
  ('cond-1111-1111-1111-111111111112', 'loi-1111-1111-1111-111111111111', 'LIHTC Allocation Letter', 'pending', '2025-02-15'),
  ('cond-1111-1111-1111-111111111113', 'loi-1111-1111-1111-111111111111', 'Phase I Environmental - No RECs', 'satisfied', '2024-12-20'),
  ('cond-1111-1111-1111-111111111114', 'loi-1111-1111-1111-111111111111', 'Appraisal confirming value', 'pending', '2025-02-01');

-- ============================================================================
-- SAMPLE COMMITMENT
-- ============================================================================

INSERT INTO commitments (id, deal_id, loi_id, investor_id, cde_id, sponsor_id, commitment_number, status, investment_amount, credit_type, credit_rate, pricing_cents_per_credit, cra_eligible, issued_at, target_closing_date) VALUES
  ('commit-1111-1111-1111-111111111111', 'deal-4444-4444-4444-444444444444', 'loi-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222224', '11111111-1111-1111-1111-111111111114', 'CMT-20241220-0001', 'pending_sponsor', 15000000, 'NMTC', 0.39, 0.75, true, '2024-12-20', '2025-06-30');

-- ============================================================================
-- DEAL SCORES
-- ============================================================================

INSERT INTO deal_scores (id, deal_id, distress_score, distress_breakdown, impact_score, impact_breakdown, readiness_score, readiness_breakdown, mission_fit_score, total_score, tier, nmtc_eligible, severely_distressed, model_version) VALUES
  ('score-1111-1111-1111-111111111111', 'deal-1111-1111-1111-111111111111', 36, '{"poverty_rate": 9, "mfi": 8, "unemployment": 8, "ppc_flag": 3, "non_metro_flag": 0, "capital_desert": 4}'::jsonb, 30, '{"job_creation": 7, "essential_services": 8, "lmi_benefit": 6, "catalytic_effect": 5, "community_readiness": 2, "leverage": 2}'::jsonb, 11, '{"site_control": 3, "pro_forma": 3, "third_party_reports": 2, "committed_sources": 2, "timeline": 1}'::jsonb, 7, 84, 'TIER_1_GREENLIGHT', true, true, '1.7.0'),
  ('score-2222-2222-2222-222222222222', 'deal-2222-2222-2222-222222222222', 34, '{"poverty_rate": 8, "mfi": 8, "unemployment": 7, "ppc_flag": 3, "non_metro_flag": 0, "capital_desert": 4}'::jsonb, 28, '{"job_creation": 6, "essential_services": 6, "lmi_benefit": 7, "catalytic_effect": 5, "community_readiness": 2, "leverage": 2}'::jsonb, 12, '{"site_control": 4, "pro_forma": 3, "third_party_reports": 2, "committed_sources": 2, "timeline": 1}'::jsonb, 6, 80, 'TIER_1_GREENLIGHT', true, true, '1.7.0'),
  ('score-4444-4444-4444-444444444444', 'deal-4444-4444-4444-444444444444', 38, '{"poverty_rate": 10, "mfi": 9, "unemployment": 8, "ppc_flag": 3, "non_metro_flag": 0, "capital_desert": 4}'::jsonb, 32, '{"job_creation": 6, "essential_services": 5, "lmi_benefit": 7, "catalytic_effect": 6, "community_readiness": 3, "leverage": 3}'::jsonb, 14, '{"site_control": 4, "pro_forma": 3, "third_party_reports": 3, "committed_sources": 3, "timeline": 1}'::jsonb, 9, 93, 'TIER_1_GREENLIGHT', true, true, '1.7.0');

