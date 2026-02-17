-- =============================================================================
-- tCredex Seed Data v1.7
-- =============================================================================
-- This creates test data for development and beta testing
-- Run after: 001_complete_schema.sql
-- =============================================================================

-- =============================================================================
-- ORGANIZATIONS
-- =============================================================================

-- Admin Organization
INSERT INTO organizations (id, name, slug, type) VALUES
  ('00000000-0000-0000-0000-000000000001', 'tCredex Admin', 'tcredex-admin', 'admin');

-- CDE Organizations
INSERT INTO organizations (id, name, slug, type, website, city, state) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Urban Development Fund', 'urban-dev-fund', 'cde', 'https://urbandevfund.org', 'Chicago', 'IL'),
  ('10000000-0000-0000-0000-000000000002', 'Capital Impact Partners', 'capital-impact', 'cde', 'https://capitalimpact.org', 'Arlington', 'VA'),
  ('10000000-0000-0000-0000-000000000003', 'National Community Fund', 'national-community', 'cde', 'https://ncfund.org', 'Denver', 'CO'),
  ('10000000-0000-0000-0000-000000000004', 'Rural Opportunities Inc', 'rural-opps', 'cde', 'https://ruralopps.org', 'Kansas City', 'MO'),
  ('10000000-0000-0000-0000-000000000005', 'Coastal Development Corp', 'coastal-dev', 'cde', 'https://coastaldev.org', 'Miami', 'FL');

-- Sponsor Organizations
INSERT INTO organizations (id, name, slug, type, website, city, state) VALUES
  ('20000000-0000-0000-0000-000000000001', 'Midwest Health Partners', 'midwest-health', 'sponsor', 'https://midwesthealth.com', 'Indianapolis', 'IN'),
  ('20000000-0000-0000-0000-000000000002', 'Fresh Food Markets Inc', 'fresh-food', 'sponsor', 'https://freshfoodmarkets.com', 'Detroit', 'MI'),
  ('20000000-0000-0000-0000-000000000003', 'Community First Development', 'community-first', 'sponsor', 'https://communityfirst.org', 'Cleveland', 'OH'),
  ('20000000-0000-0000-0000-000000000004', 'Historic Renewal LLC', 'historic-renewal', 'sponsor', 'https://historicrenewal.com', 'Baltimore', 'MD'),
  ('20000000-0000-0000-0000-000000000005', 'Jobs Now Manufacturing', 'jobs-now', 'sponsor', 'https://jobsnowmfg.com', 'Pittsburgh', 'PA');

-- Investor Organizations
INSERT INTO organizations (id, name, slug, type, website, city, state) VALUES
  ('30000000-0000-0000-0000-000000000001', 'First National Bank', 'first-national', 'investor', 'https://firstnational.com', 'New York', 'NY'),
  ('30000000-0000-0000-0000-000000000002', 'Community Trust Capital', 'community-trust', 'investor', 'https://communitytrust.com', 'Boston', 'MA'),
  ('30000000-0000-0000-0000-000000000003', 'Impact Investment Group', 'impact-invest', 'investor', 'https://impactinvest.com', 'San Francisco', 'CA');


-- =============================================================================
-- USERS
-- =============================================================================

-- Admin Users
INSERT INTO users (id, email, name, role, organization_id) VALUES
  ('00000000-0000-0000-0001-000000000001', 'admin@tcredex.com', 'Mike Admin', 'ORG_ADMIN', '00000000-0000-0000-0000-000000000001');

-- CDE Users
INSERT INTO users (id, email, name, role, organization_id, title) VALUES
  ('10000000-0000-0000-0001-000000000001', 'sarah@urbandevfund.org', 'Sarah Mitchell', 'ORG_ADMIN', '10000000-0000-0000-0000-000000000001', 'Executive Director'),
  ('10000000-0000-0000-0001-000000000002', 'john@capitalimpact.org', 'John Anderson', 'ORG_ADMIN', '10000000-0000-0000-0000-000000000002', 'Managing Director'),
  ('10000000-0000-0000-0001-000000000003', 'maria@ncfund.org', 'Maria Garcia', 'ORG_ADMIN', '10000000-0000-0000-0000-000000000003', 'President'),
  ('10000000-0000-0000-0001-000000000004', 'tom@ruralopps.org', 'Tom Wilson', 'ORG_ADMIN', '10000000-0000-0000-0000-000000000004', 'CEO'),
  ('10000000-0000-0000-0001-000000000005', 'lisa@coastaldev.org', 'Lisa Chen', 'ORG_ADMIN', '10000000-0000-0000-0000-000000000005', 'Director');

-- Sponsor Users
INSERT INTO users (id, email, name, role, organization_id, title) VALUES
  ('20000000-0000-0000-0001-000000000001', 'david@midwesthealth.com', 'David Thompson', 'ORG_ADMIN', '20000000-0000-0000-0000-000000000001', 'CFO'),
  ('20000000-0000-0000-0001-000000000002', 'jennifer@freshfood.com', 'Jennifer Davis', 'ORG_ADMIN', '20000000-0000-0000-0000-000000000002', 'Development Director'),
  ('20000000-0000-0000-0001-000000000003', 'robert@communityfirst.org', 'Robert Brown', 'ORG_ADMIN', '20000000-0000-0000-0000-000000000003', 'Executive Director'),
  ('20000000-0000-0000-0001-000000000004', 'amanda@historicrenewal.com', 'Amanda White', 'ORG_ADMIN', '20000000-0000-0000-0000-000000000004', 'Managing Partner'),
  ('20000000-0000-0000-0001-000000000005', 'michael@jobsnowmfg.com', 'Michael Johnson', 'ORG_ADMIN', '20000000-0000-0000-0000-000000000005', 'CEO');

-- Investor Users
INSERT INTO users (id, email, name, role, organization_id, title) VALUES
  ('30000000-0000-0000-0001-000000000001', 'william@firstnational.com', 'William Harris', 'ORG_ADMIN', '30000000-0000-0000-0000-000000000001', 'VP Community Development'),
  ('30000000-0000-0000-0001-000000000002', 'susan@communitytrust.com', 'Susan Taylor', 'ORG_ADMIN', '30000000-0000-0000-0000-000000000002', 'Managing Director'),
  ('30000000-0000-0000-0001-000000000003', 'james@impactinvest.com', 'James Martinez', 'ORG_ADMIN', '30000000-0000-0000-0000-000000000003', 'Partner');

-- =============================================================================
-- CDEs
-- =============================================================================

INSERT INTO cdes (id, organization_id, certification_number, year_established, total_allocation, remaining_allocation, min_deal_size, max_deal_size, small_deal_fund, service_area_type, primary_states, rural_focus, urban_focus, mission_statement, impact_priorities, target_sectors, nmtc_experience, htc_experience, status, primary_contact_name, primary_contact_email) VALUES
  ('11000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'CDE-2003-0042', 2003, 150000000, 85000000, 2000000, 20000000, true, 'regional', ARRAY['IL', 'IN', 'WI', 'MI', 'OH'], false, true, 'Revitalizing urban communities in the Midwest through strategic NMTC investments in healthcare, education, and essential services.', ARRAY['job-creation', 'healthcare-access', 'community-services'], ARRAY['Healthcare', 'Education', 'Mixed-Use'], true, true, 'active', 'Sarah Mitchell', 'sarah@urbandevfund.org'),
  
  ('11000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'CDE-2001-0015', 2001, 200000000, 120000000, 5000000, 30000000, false, 'national', ARRAY['VA', 'MD', 'DC', 'NC', 'PA', 'NY'], false, true, 'Deploying capital to create economic opportunity in underserved urban communities nationwide.', ARRAY['job-creation', 'affordable-housing', 'small-business-support'], ARRAY['Manufacturing', 'Mixed-Use', 'Community Facility'], true, false, 'active', 'John Anderson', 'john@capitalimpact.org'),
  
  ('11000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'CDE-2005-0078', 2005, 100000000, 45000000, 1000000, 15000000, true, 'regional', ARRAY['CO', 'NM', 'AZ', 'UT', 'WY'], true, true, 'Supporting sustainable development in Rocky Mountain communities through flexible NMTC financing.', ARRAY['food-access', 'healthcare-access', 'rural-development'], ARRAY['Grocery', 'Healthcare', 'Manufacturing'], true, false, 'active', 'Maria Garcia', 'maria@ncfund.org'),
  
  ('11000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'CDE-2008-0112', 2008, 75000000, 60000000, 500000, 10000000, true, 'regional', ARRAY['MO', 'KS', 'NE', 'IA', 'OK'], true, false, 'Dedicated to rural economic development through small-scale NMTC investments in agricultural and manufacturing facilities.', ARRAY['rural-development', 'manufacturing-revival', 'job-creation'], ARRAY['Manufacturing', 'Agriculture', 'Industrial'], true, false, 'active', 'Tom Wilson', 'tom@ruralopps.org'),
  
  ('11000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'CDE-2010-0156', 2010, 125000000, 90000000, 3000000, 25000000, false, 'regional', ARRAY['FL', 'GA', 'AL', 'SC', 'LA'], false, true, 'Catalyzing coastal community development with focus on resilience and economic diversification.', ARRAY['job-creation', 'environmental-sustainability', 'community-services'], ARRAY['Mixed-Use', 'Healthcare', 'Education'], true, true, 'active', 'Lisa Chen', 'lisa@coastaldev.org');


-- =============================================================================
-- CDE ALLOCATIONS
-- =============================================================================

-- Urban Development Fund allocations
INSERT INTO cde_allocations (id, cde_id, type, year, awarded_amount, available_on_platform, deployment_deadline) VALUES
  ('12000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'federal', '2022', 50000000, 25000000, '2027-12-31'),
  ('12000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000001', 'federal', '2023', 55000000, 35000000, '2028-12-31'),
  ('12000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000001', 'state', '2023', 25000000, 15000000, '2028-06-30'),
  ('12000000-0000-0000-0000-000000000004', '11000000-0000-0000-0000-000000000001', 'state', '2024', 20000000, 10000000, '2029-06-30');

-- Capital Impact allocations
INSERT INTO cde_allocations (id, cde_id, type, year, awarded_amount, available_on_platform, deployment_deadline) VALUES
  ('12000000-0000-0000-0000-000000000005', '11000000-0000-0000-0000-000000000002', 'federal', '2021', 75000000, 40000000, '2026-12-31'),
  ('12000000-0000-0000-0000-000000000006', '11000000-0000-0000-0000-000000000002', 'federal', '2023', 80000000, 55000000, '2028-12-31'),
  ('12000000-0000-0000-0000-000000000007', '11000000-0000-0000-0000-000000000002', 'federal', '2024', 45000000, 25000000, '2029-12-31');

-- National Community Fund allocations
INSERT INTO cde_allocations (id, cde_id, type, year, awarded_amount, available_on_platform, deployment_deadline) VALUES
  ('12000000-0000-0000-0000-000000000008', '11000000-0000-0000-0000-000000000003', 'federal', '2022', 40000000, 15000000, '2027-12-31'),
  ('12000000-0000-0000-0000-000000000009', '11000000-0000-0000-0000-000000000003', 'federal', '2024', 60000000, 30000000, '2029-12-31');

-- Rural Opportunities allocations
INSERT INTO cde_allocations (id, cde_id, type, year, awarded_amount, available_on_platform, deployment_deadline) VALUES
  ('12000000-0000-0000-0000-000000000010', '11000000-0000-0000-0000-000000000004', 'federal', '2023', 35000000, 30000000, '2028-12-31'),
  ('12000000-0000-0000-0000-000000000011', '11000000-0000-0000-0000-000000000004', 'federal', '2024', 40000000, 30000000, '2029-12-31');

-- Coastal Development allocations
INSERT INTO cde_allocations (id, cde_id, type, year, awarded_amount, available_on_platform, deployment_deadline) VALUES
  ('12000000-0000-0000-0000-000000000012', '11000000-0000-0000-0000-000000000005', 'federal', '2022', 45000000, 30000000, '2027-12-31'),
  ('12000000-0000-0000-0000-000000000013', '11000000-0000-0000-0000-000000000005', 'federal', '2023', 50000000, 35000000, '2028-12-31'),
  ('12000000-0000-0000-0000-000000000014', '11000000-0000-0000-0000-000000000005', 'state', '2024', 30000000, 25000000, '2029-06-30');

-- =============================================================================
-- SPONSORS
-- =============================================================================

INSERT INTO sponsors (id, organization_id, primary_contact_name, primary_contact_email, organization_type, woman_owned, minority_owned, veteran_owned) VALUES
  ('21000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'David Thompson', 'david@midwesthealth.com', 'Non-profit', false, false, false),
  ('21000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Jennifer Davis', 'jennifer@freshfood.com', 'For-profit', true, true, false),
  ('21000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'Robert Brown', 'robert@communityfirst.org', 'Non-profit', false, false, false),
  ('21000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 'Amanda White', 'amanda@historicrenewal.com', 'For-profit', true, false, false),
  ('21000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000005', 'Michael Johnson', 'michael@jobsnowmfg.com', 'For-profit', false, false, true);

-- =============================================================================
-- INVESTORS
-- =============================================================================

INSERT INTO investors (id, organization_id, primary_contact_name, primary_contact_email, investor_type, cra_motivated, min_investment, max_investment, target_credit_types) VALUES
  ('31000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'William Harris', 'william@firstnational.com', 'Bank', true, 5000000, 50000000, ARRAY['NMTC', 'HTC']::program_type[]),
  ('31000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'Susan Taylor', 'susan@communitytrust.com', 'CDFI', true, 2000000, 25000000, ARRAY['NMTC', 'LIHTC']::program_type[]),
  ('31000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'James Martinez', 'james@impactinvest.com', 'Family Office', false, 1000000, 15000000, ARRAY['NMTC', 'OZ']::program_type[]);


-- =============================================================================
-- DEALS
-- =============================================================================

INSERT INTO deals (id, project_name, sponsor_id, sponsor_name, sponsor_organization_id, programs, city, state, census_tract, total_project_cost, nmtc_financing_requested, financing_gap, jobs_created, jobs_retained, project_type, venture_type, project_description, tract_eligible, tract_severely_distressed, readiness_score, tier, status, visible) VALUES

  -- Deal 1: Healthcare in Indianapolis
  ('40000000-0000-0000-0000-000000000001', 
   'Midwest Community Health Center', 
   '21000000-0000-0000-0000-000000000001', 
   'Midwest Health Partners',
   '20000000-0000-0000-0000-000000000001',
   ARRAY['NMTC']::program_type[], 
   'Indianapolis', 'IN', '18097035200',
   28500000, 12000000, 8500000,
   85, 120,
   'Healthcare', 'Real Estate',
   'New 45,000 SF community health center providing primary care, dental, behavioral health, and pharmacy services to underserved neighborhoods.',
   true, true, 78, 2, 'available', true),

  -- Deal 2: Grocery in Detroit
  ('40000000-0000-0000-0000-000000000002',
   'Fresh Foods Market - Brightmoor',
   '21000000-0000-0000-0000-000000000002',
   'Fresh Food Markets Inc',
   '20000000-0000-0000-0000-000000000002',
   ARRAY['NMTC']::program_type[],
   'Detroit', 'MI', '26163523600',
   15200000, 6000000, 4200000,
   45, 0,
   'Grocery', 'Real Estate',
   'Full-service grocery store bringing fresh food access to a USDA-designated food desert. Includes pharmacy and community meeting space.',
   true, true, 85, 2, 'available', true),

  -- Deal 3: Mixed-Use in Cleveland  
  ('40000000-0000-0000-0000-000000000003',
   'Hough Community Center',
   '21000000-0000-0000-0000-000000000003',
   'Community First Development',
   '20000000-0000-0000-0000-000000000003',
   ARRAY['NMTC']::program_type[],
   'Cleveland', 'OH', '39035108100',
   22000000, 9000000, 6500000,
   65, 25,
   'Mixed-Use', 'Real Estate',
   'Adaptive reuse of historic warehouse into community center with job training facilities, childcare, and small business incubator space.',
   true, true, 72, 2, 'available', true),

  -- Deal 4: Historic Renovation in Baltimore
  ('40000000-0000-0000-0000-000000000004',
   'Penn Station Arts District',
   '21000000-0000-0000-0000-000000000004',
   'Historic Renewal LLC',
   '20000000-0000-0000-0000-000000000004',
   ARRAY['NMTC', 'HTC']::program_type[],
   'Baltimore', 'MD', '24510160100',
   35000000, 15000000, 12000000,
   95, 40,
   'Mixed-Use', 'Real Estate',
   'Rehabilitation of contributing historic building into creative office space and ground-floor retail. Part 1 approval received.',
   true, true, 68, 2, 'seeking_capital', true),

  -- Deal 5: Manufacturing in Pittsburgh
  ('40000000-0000-0000-0000-000000000005',
   'Steel City Manufacturing Hub',
   '21000000-0000-0000-0000-000000000005',
   'Jobs Now Manufacturing',
   '20000000-0000-0000-0000-000000000005',
   ARRAY['NMTC']::program_type[],
   'Pittsburgh', 'PA', '42003050900',
   42000000, 18000000, 14000000,
   180, 75,
   'Manufacturing', 'Real Estate',
   'New advanced manufacturing facility focused on clean energy components. Will employ local workforce with living wage jobs.',
   true, true, 82, 2, 'available', true),

  -- Deal 6: Education in Chicago (smaller deal)
  ('40000000-0000-0000-0000-000000000006',
   'South Side Early Learning Center',
   '21000000-0000-0000-0000-000000000001',
   'Midwest Health Partners',
   '20000000-0000-0000-0000-000000000001',
   ARRAY['NMTC']::program_type[],
   'Chicago', 'IL', '17031842400',
   8500000, 3500000, 2500000,
   35, 0,
   'Education', 'Real Estate',
   'New early childhood education center providing Head Start and childcare services in high-poverty neighborhood.',
   true, true, 65, 2, 'available', true),

  -- Deal 7: Draft deal (not visible)
  ('40000000-0000-0000-0000-000000000007',
   'Community Plaza Development',
   '21000000-0000-0000-0000-000000000003',
   'Community First Development',
   '20000000-0000-0000-0000-000000000003',
   ARRAY['NMTC']::program_type[],
   'Columbus', 'OH', '39049003000',
   18000000, 7500000, 5000000,
   55, 10,
   'Mixed-Use', 'Real Estate',
   'New mixed-use development with retail, office, and community space.',
   true, false, 42, 1, 'draft', false);


-- =============================================================================
-- CDE ALLOCATIONS
-- =============================================================================

INSERT INTO cde_allocations (id, cde_id, type, year, awarded_amount, available_on_platform, deployment_deadline) VALUES
  -- Urban Development Fund - Federal
  ('12000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'federal', '2022', 75000000, 40000000, '2027-12-31'),
  ('12000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000001', 'federal', '2023', 75000000, 45000000, '2028-12-31'),
  -- Capital Impact - Federal
  ('12000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000002', 'federal', '2021', 100000000, 50000000, '2026-12-31'),
  ('12000000-0000-0000-0000-000000000004', '11000000-0000-0000-0000-000000000002', 'federal', '2023', 100000000, 70000000, '2028-12-31'),
  -- National Community Fund - Federal + State
  ('12000000-0000-0000-0000-000000000005', '11000000-0000-0000-0000-000000000003', 'federal', '2022', 50000000, 25000000, '2027-12-31'),
  ('12000000-0000-0000-0000-000000000006', '11000000-0000-0000-0000-000000000003', 'federal', '2024', 50000000, 20000000, '2029-12-31'),
  -- Rural Opportunities - Federal
  ('12000000-0000-0000-0000-000000000007', '11000000-0000-0000-0000-000000000004', 'federal', '2023', 75000000, 60000000, '2028-12-31'),
  -- Coastal Development - Federal
  ('12000000-0000-0000-0000-000000000008', '11000000-0000-0000-0000-000000000005', 'federal', '2022', 65000000, 45000000, '2027-12-31'),
  ('12000000-0000-0000-0000-000000000009', '11000000-0000-0000-0000-000000000005', 'federal', '2024', 60000000, 45000000, '2029-12-31');

-- =============================================================================
-- SPONSORS
-- =============================================================================

INSERT INTO sponsors (id, organization_id, primary_contact_name, primary_contact_email, organization_type, woman_owned, minority_owned, veteran_owned) VALUES
  ('21000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'David Thompson', 'david@midwesthealth.com', 'Non-profit', false, false, false),
  ('21000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Jennifer Davis', 'jennifer@freshfood.com', 'For-profit', true, true, false),
  ('21000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'Robert Brown', 'robert@communityfirst.org', 'Non-profit', false, false, false),
  ('21000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 'Amanda White', 'amanda@historicrenewal.com', 'For-profit', true, false, false),
  ('21000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000005', 'Michael Johnson', 'michael@jobsnowmfg.com', 'For-profit', false, false, true);

-- =============================================================================
-- INVESTORS
-- =============================================================================

INSERT INTO investors (id, organization_id, primary_contact_name, primary_contact_email, investor_type, cra_motivated, min_investment, max_investment, target_credit_types) VALUES
  ('31000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'William Harris', 'william@firstnational.com', 'Bank', true, 5000000, 50000000, ARRAY['NMTC', 'HTC']::program_type[]),
  ('31000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'Susan Taylor', 'susan@communitytrust.com', 'Insurance', true, 10000000, 100000000, ARRAY['NMTC', 'LIHTC']::program_type[]),
  ('31000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'James Martinez', 'james@impactinvest.com', 'Family Office', false, 2000000, 25000000, ARRAY['NMTC', 'HTC', 'OZ']::program_type[]);


-- =============================================================================
-- DEALS
-- =============================================================================

INSERT INTO deals (id, project_name, sponsor_id, sponsor_name, sponsor_organization_id, programs, state, city, census_tract, address, total_project_cost, nmtc_financing_requested, financing_gap, project_type, venture_type, project_description, jobs_created, jobs_retained, tract_eligible, tract_severely_distressed, readiness_score, tier, status, visible) VALUES
  
  ('40000000-0000-0000-0000-000000000001', 
   'Midwest Regional Health Center', 
   '21000000-0000-0000-0000-000000000001', 
   'Midwest Health Partners', 
   '20000000-0000-0000-0000-000000000001',
   ARRAY['NMTC']::program_type[], 
   'IN', 'Indianapolis', '18097352500',
   '1200 Community Health Way',
   45000000, 15000000, 8000000,
   'Healthcare', 'Real Estate',
   'New 85,000 SF community health center providing primary care, dental, behavioral health, and pharmacy services to underserved Indianapolis neighborhoods. Will serve 35,000 patients annually.',
   120, 25, true, true, 75, 2, 'available', true),

  ('40000000-0000-0000-0000-000000000002', 
   'Fresh Market Detroit', 
   '21000000-0000-0000-0000-000000000002', 
   'Fresh Food Markets Inc', 
   '20000000-0000-0000-0000-000000000002',
   ARRAY['NMTC']::program_type[], 
   'MI', 'Detroit', '26163523900',
   '4500 Gratiot Avenue',
   12000000, 6000000, 3500000,
   'Grocery', 'Real Estate',
   'Full-service grocery store in food desert census tract. 35,000 SF with fresh produce, meat, dairy and pharmacy. First grocery in 3-mile radius.',
   85, 0, true, true, 82, 2, 'available', true),

  ('40000000-0000-0000-0000-000000000003', 
   'Cleveland Community Arts Center', 
   '21000000-0000-0000-0000-000000000003', 
   'Community First Development', 
   '20000000-0000-0000-0000-000000000003',
   ARRAY['NMTC', 'HTC']::program_type[], 
   'OH', 'Cleveland', '39035104100',
   '2100 Euclid Avenue',
   28000000, 10000000, 6000000,
   'Community Facility', 'Real Estate',
   'Adaptive reuse of historic 1920s theater into community arts center. 45,000 SF with performance space, classrooms, gallery, and nonprofit office space.',
   45, 15, true, true, 68, 2, 'available', true),

  ('40000000-0000-0000-0000-000000000004', 
   'Baltimore Heritage Hotel', 
   '21000000-0000-0000-0000-000000000004', 
   'Historic Renewal LLC', 
   '20000000-0000-0000-0000-000000000004',
   ARRAY['NMTC', 'HTC']::program_type[], 
   'MD', 'Baltimore', '24510150200',
   '300 North Charles Street',
   52000000, 18000000, 12000000,
   'Mixed-Use', 'Real Estate',
   'Historic rehabilitation of 1912 Beaux-Arts office building into 120-room boutique hotel with ground floor retail. Part of downtown Baltimore revitalization.',
   175, 0, true, false, 55, 1, 'available', true),

  ('40000000-0000-0000-0000-000000000005', 
   'Steel Valley Manufacturing Hub', 
   '21000000-0000-0000-0000-000000000005', 
   'Jobs Now Manufacturing', 
   '20000000-0000-0000-0000-000000000005',
   ARRAY['NMTC']::program_type[], 
   'PA', 'Pittsburgh', '42003563300',
   '1500 Industrial Boulevard',
   35000000, 12000000, 7000000,
   'Manufacturing', 'Real Estate',
   'Renovation of vacant steel mill into modern advanced manufacturing facility. 150,000 SF for precision machining, robotics, and workforce training center.',
   200, 50, true, true, 71, 2, 'seeking_capital', true);


-- =============================================================================
-- CDE ALLOCATIONS
-- =============================================================================

-- Urban Development Fund allocations
INSERT INTO cde_allocations (id, cde_id, type, year, awarded_amount, available_on_platform, deployment_deadline) VALUES
  ('12000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'federal', '2022', 50000000, 35000000, '2029-12-31'),
  ('12000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000001', 'federal', '2023', 55000000, 30000000, '2030-12-31'),
  ('12000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000001', 'state', '2023', 20000000, 20000000, '2028-12-31');

-- Capital Impact allocations
INSERT INTO cde_allocations (id, cde_id, type, year, awarded_amount, available_on_platform, deployment_deadline) VALUES
  ('12000000-0000-0000-0000-000000000004', '11000000-0000-0000-0000-000000000002', 'federal', '2021', 75000000, 45000000, '2028-12-31'),
  ('12000000-0000-0000-0000-000000000005', '11000000-0000-0000-0000-000000000002', 'federal', '2023', 80000000, 75000000, '2030-12-31');

-- National Community Fund allocations
INSERT INTO cde_allocations (id, cde_id, type, year, awarded_amount, available_on_platform, deployment_deadline) VALUES
  ('12000000-0000-0000-0000-000000000006', '11000000-0000-0000-0000-000000000003', 'federal', '2022', 45000000, 25000000, '2029-12-31'),
  ('12000000-0000-0000-0000-000000000007', '11000000-0000-0000-0000-000000000003', 'federal', '2024', 55000000, 20000000, '2031-12-31');

-- Rural Opportunities allocations
INSERT INTO cde_allocations (id, cde_id, type, year, awarded_amount, available_on_platform, deployment_deadline) VALUES
  ('12000000-0000-0000-0000-000000000008', '11000000-0000-0000-0000-000000000004', 'federal', '2023', 40000000, 35000000, '2030-12-31'),
  ('12000000-0000-0000-0000-000000000009', '11000000-0000-0000-0000-000000000004', 'federal', '2024', 35000000, 25000000, '2031-12-31');

-- Coastal Development allocations
INSERT INTO cde_allocations (id, cde_id, type, year, awarded_amount, available_on_platform, deployment_deadline) VALUES
  ('12000000-0000-0000-0000-000000000010', '11000000-0000-0000-0000-000000000005', 'federal', '2022', 60000000, 40000000, '2029-12-31'),
  ('12000000-0000-0000-0000-000000000011', '11000000-0000-0000-0000-000000000005', 'federal', '2023', 65000000, 50000000, '2030-12-31');

-- =============================================================================
-- SPONSORS
-- =============================================================================

INSERT INTO sponsors (id, organization_id, organization_type, primary_contact_name, primary_contact_email, woman_owned, minority_owned) VALUES
  ('21000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Non-profit', 'David Thompson', 'david@midwesthealth.com', false, false),
  ('21000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'For-profit', 'Jennifer Davis', 'jennifer@freshfood.com', true, true),
  ('21000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'Non-profit', 'Robert Brown', 'robert@communityfirst.org', false, false),
  ('21000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 'For-profit', 'Amanda White', 'amanda@historicrenewal.com', true, false),
  ('21000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000005', 'For-profit', 'Michael Johnson', 'michael@jobsnowmfg.com', false, true);

-- =============================================================================
-- INVESTORS
-- =============================================================================

INSERT INTO investors (id, organization_id, investor_type, cra_motivated, min_investment, max_investment, target_credit_types, primary_contact_name, primary_contact_email) VALUES
  ('31000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Bank', true, 5000000, 50000000, ARRAY['NMTC', 'LIHTC']::program_type[], 'William Harris', 'william@firstnational.com'),
  ('31000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'Insurance', false, 10000000, 75000000, ARRAY['NMTC', 'HTC']::program_type[], 'Susan Taylor', 'susan@communitytrust.com'),
  ('31000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'Family Office', false, 2000000, 25000000, ARRAY['NMTC', 'OZ']::program_type[], 'James Martinez', 'james@impactinvest.com');


-- =============================================================================
-- SAMPLE DEALS
-- =============================================================================

INSERT INTO deals (id, project_name, sponsor_id, sponsor_name, sponsor_organization_id, programs, state, city, census_tract, address, total_project_cost, nmtc_financing_requested, financing_gap, jobs_created, jobs_retained, permanent_jobs_fte, construction_jobs_fte, project_type, venture_type, project_description, tract_eligible, tract_severely_distressed, readiness_score, tier, status, visible) VALUES

-- Healthcare Center - Indianapolis
('40000000-0000-0000-0000-000000000001', 
 'Eastside Community Health Center', 
 '21000000-0000-0000-0000-000000000001', 
 'Midwest Health Partners', 
 '20000000-0000-0000-0000-000000000001',
 ARRAY['NMTC']::program_type[], 
 'IN', 'Indianapolis', '18097354200',
 '2400 E 38th Street, Indianapolis, IN 46218',
 18500000, 12000000, 4500000,
 45, 12, 42.5, 85.0,
 'Healthcare', 'Real Estate',
 'New 45,000 SF community health center providing primary care, dental, behavioral health, and pharmacy services to underserved East Indianapolis neighborhoods. Will serve 25,000+ patients annually.',
 true, true, 72, 2, 'available', true),

-- Grocery Store - Detroit
('40000000-0000-0000-0000-000000000002',
 'Fresh Start Market - Brightmoor',
 '21000000-0000-0000-0000-000000000002',
 'Fresh Food Markets Inc',
 '20000000-0000-0000-0000-000000000002',
 ARRAY['NMTC']::program_type[],
 'MI', 'Detroit', '26163532100',
 '19800 Fenkell Ave, Detroit, MI 48223',
 8200000, 5500000, 2200000,
 35, 0, 32.0, 45.0,
 'Grocery', 'Real Estate',
 'Full-service 22,000 SF grocery store in USDA-designated food desert. Will be the only full-service grocery within 3 miles, serving 15,000+ residents.',
 true, true, 65, 2, 'available', true),

-- Community Center - Cleveland
('40000000-0000-0000-0000-000000000003',
 'Hough Neighborhood Community Hub',
 '21000000-0000-0000-0000-000000000003',
 'Community First Development',
 '20000000-0000-0000-0000-000000000003',
 ARRAY['NMTC']::program_type[],
 'OH', 'Cleveland', '39035110100',
 '8501 Hough Ave, Cleveland, OH 44106',
 12000000, 8000000, 3000000,
 28, 5, 25.0, 60.0,
 'Community Facility', 'Real Estate',
 'Multi-purpose community center with workforce training, early childhood education, and health services. Partnership with local hospital and community college.',
 true, true, 58, 2, 'available', true),

-- Historic Renovation - Baltimore
('40000000-0000-0000-0000-000000000004',
 'Station North Arts Center',
 '21000000-0000-0000-0000-000000000004',
 'Historic Renewal LLC',
 '20000000-0000-0000-0000-000000000004',
 ARRAY['NMTC', 'HTC']::program_type[],
 'MD', 'Baltimore', '24510150200',
 '1 W North Ave, Baltimore, MD 21201',
 25000000, 15000000, 6000000,
 55, 0, 50.0, 120.0,
 'Mixed-Use', 'Real Estate',
 'Adaptive reuse of historic 1920s industrial building into 80,000 SF arts and cultural center with maker spaces, galleries, performance venue, and 15 affordable artist studios.',
 true, true, 78, 2, 'seeking_capital', true),

-- Manufacturing - Pittsburgh
('40000000-0000-0000-0000-000000000005',
 'Mon Valley Advanced Manufacturing Center',
 '21000000-0000-0000-0000-000000000005',
 'Jobs Now Manufacturing',
 '20000000-0000-0000-0000-000000000005',
 ARRAY['NMTC']::program_type[],
 'PA', 'Pittsburgh', '42003980300',
 '500 E 8th Ave, Homestead, PA 15120',
 32000000, 20000000, 8000000,
 120, 25, 115.0, 150.0,
 'Manufacturing', 'Real Estate',
 'State-of-the-art 150,000 SF manufacturing facility for precision metal fabrication and advanced composites. Anchor tenant committed for 75% of space with 10-year lease.',
 true, true, 82, 2, 'seeking_capital', true),

-- Rural Healthcare - Kansas
('40000000-0000-0000-0000-000000000006',
 'Prairie Health Clinic',
 '21000000-0000-0000-0000-000000000001',
 'Midwest Health Partners',
 '20000000-0000-0000-0000-000000000001',
 ARRAY['NMTC']::program_type[],
 'KS', 'Dodge City', '20057950100',
 '1201 W Wyatt Earp Blvd, Dodge City, KS 67801',
 6500000, 4000000, 1500000,
 22, 8, 20.0, 35.0,
 'Healthcare', 'Real Estate',
 'Critical access healthcare facility serving 5-county rural area. Will include primary care, urgent care, telehealth hub, and mobile health unit base.',
 true, false, 55, 2, 'available', true),

-- Education - Miami
('40000000-0000-0000-0000-000000000007',
 'Liberty City STEM Academy',
 '21000000-0000-0000-0000-000000000003',
 'Community First Development',
 '20000000-0000-0000-0000-000000000003',
 ARRAY['NMTC']::program_type[],
 'FL', 'Miami', '12086002402',
 '6301 NW 14th Ave, Miami, FL 33147',
 15000000, 10000000, 3500000,
 40, 0, 38.0, 75.0,
 'Education', 'Real Estate',
 'New 35,000 SF STEM-focused charter school serving grades 6-12 in historically underserved Liberty City neighborhood. Capacity for 450 students.',
 true, true, 68, 2, 'available', true),

-- Draft deal - incomplete
('40000000-0000-0000-0000-000000000008',
 'Unnamed Project - Draft',
 '21000000-0000-0000-0000-000000000002',
 'Fresh Food Markets Inc',
 '20000000-0000-0000-0000-000000000002',
 ARRAY['NMTC']::program_type[],
 'MI', 'Flint', NULL,
 NULL,
 NULL, NULL, NULL,
 NULL, NULL, NULL, NULL,
 NULL, 'Real Estate',
 NULL,
 NULL, NULL, 15, 1, 'draft', false);


-- =============================================================================
-- CDE ALLOCATIONS
-- =============================================================================

INSERT INTO cde_allocations (id, cde_id, type, year, awarded_amount, available_on_platform, deployment_deadline) VALUES
  -- Urban Development Fund
  ('12000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'federal', '2022', 50000000, 25000000, '2029-09-30'),
  ('12000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000001', 'federal', '2023', 55000000, 35000000, '2030-09-30'),
  ('12000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000001', 'state', '2023', 25000000, 15000000, '2028-12-31'),
  
  -- Capital Impact Partners
  ('12000000-0000-0000-0000-000000000004', '11000000-0000-0000-0000-000000000002', 'federal', '2021', 65000000, 40000000, '2028-09-30'),
  ('12000000-0000-0000-0000-000000000005', '11000000-0000-0000-0000-000000000002', 'federal', '2023', 70000000, 50000000, '2030-09-30'),
  ('12000000-0000-0000-0000-000000000006', '11000000-0000-0000-0000-000000000002', 'federal', '2024', 65000000, 30000000, '2031-09-30'),
  
  -- National Community Fund
  ('12000000-0000-0000-0000-000000000007', '11000000-0000-0000-0000-000000000003', 'federal', '2022', 45000000, 20000000, '2029-09-30'),
  ('12000000-0000-0000-0000-000000000008', '11000000-0000-0000-0000-000000000003', 'federal', '2024', 55000000, 25000000, '2031-09-30'),
  
  -- Rural Opportunities
  ('12000000-0000-0000-0000-000000000009', '11000000-0000-0000-0000-000000000004', 'federal', '2023', 40000000, 35000000, '2030-09-30'),
  ('12000000-0000-0000-0000-000000000010', '11000000-0000-0000-0000-000000000004', 'federal', '2024', 35000000, 25000000, '2031-09-30'),
  
  -- Coastal Development
  ('12000000-0000-0000-0000-000000000011', '11000000-0000-0000-0000-000000000005', 'federal', '2022', 60000000, 45000000, '2029-09-30'),
  ('12000000-0000-0000-0000-000000000012', '11000000-0000-0000-0000-000000000005', 'federal', '2024', 65000000, 45000000, '2031-09-30');

-- =============================================================================
-- SPONSORS
-- =============================================================================

INSERT INTO sponsors (id, organization_id, organization_type, primary_contact_name, primary_contact_email) VALUES
  ('21000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Non-profit', 'David Thompson', 'david@midwesthealth.com'),
  ('21000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'For-profit', 'Jennifer Davis', 'jennifer@freshfood.com'),
  ('21000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'Non-profit', 'Robert Brown', 'robert@communityfirst.org'),
  ('21000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 'For-profit', 'Amanda White', 'amanda@historicrenewal.com'),
  ('21000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000005', 'For-profit', 'Michael Johnson', 'michael@jobsnowmfg.com');

-- =============================================================================
-- INVESTORS
-- =============================================================================

INSERT INTO investors (id, organization_id, investor_type, cra_motivated, min_investment, max_investment, target_credit_types, primary_contact_name, primary_contact_email) VALUES
  ('31000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Bank', true, 5000000, 50000000, ARRAY['NMTC', 'HTC']::program_type[], 'William Harris', 'william@firstnational.com'),
  ('31000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'CDFI', true, 2000000, 25000000, ARRAY['NMTC', 'LIHTC']::program_type[], 'Susan Taylor', 'susan@communitytrust.com'),
  ('31000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'Family Office', false, 1000000, 15000000, ARRAY['NMTC', 'HTC', 'OZ']::program_type[], 'James Martinez', 'james@impactinvest.com');


-- =============================================================================
-- SAMPLE DEALS
-- =============================================================================

INSERT INTO deals (id, project_name, sponsor_id, sponsor_name, sponsor_organization_id, programs, state, city, census_tract, address, total_project_cost, nmtc_financing_requested, financing_gap, project_type, venture_type, project_description, jobs_created, jobs_retained, tract_eligible, tract_severely_distressed, readiness_score, tier, status, visible) VALUES

  -- Healthcare Facility - Indianapolis
  ('40000000-0000-0000-0000-000000000001', 
   'Eastside Community Health Center', 
   '21000000-0000-0000-0000-000000000001', 
   'Midwest Health Partners',
   '20000000-0000-0000-0000-000000000001',
   ARRAY['NMTC']::program_type[],
   'IN', 'Indianapolis', '18097352700',
   '3200 E Washington St, Indianapolis, IN 46201',
   18500000, 12000000, 4500000,
   'Healthcare', 'Real Estate',
   'New construction of a 35,000 SF community health center providing primary care, dental, behavioral health, and pharmacy services to underserved east side residents.',
   85, 0, true, true, 72, 2, 'available', true),

  -- Grocery Store - Detroit
  ('40000000-0000-0000-0000-000000000002',
   'Fresh Market Detroit',
   '21000000-0000-0000-0000-000000000002',
   'Fresh Food Markets Inc',
   '20000000-0000-0000-0000-000000000002',
   ARRAY['NMTC']::program_type[],
   'MI', 'Detroit', '26163523900',
   '8900 Livernois Ave, Detroit, MI 48204',
   12000000, 8000000, 3000000,
   'Grocery', 'Real Estate',
   'Development of a 25,000 SF full-service grocery store in a USDA food desert, providing fresh produce and healthy food options to 15,000+ residents.',
   65, 0, true, true, 65, 2, 'available', true),

  -- Community Center - Cleveland
  ('40000000-0000-0000-0000-000000000003',
   'Hough Neighborhood Resource Center',
   '21000000-0000-0000-0000-000000000003',
   'Community First Development',
   '20000000-0000-0000-0000-000000000003',
   ARRAY['NMTC']::program_type[],
   'OH', 'Cleveland', '39035108300',
   '7500 Hough Ave, Cleveland, OH 44103',
   9500000, 6500000, 2500000,
   'Community Facility', 'Real Estate',
   'Renovation of historic building into multi-service community center with workforce training, childcare, and social services.',
   40, 15, true, true, 58, 2, 'available', true),

  -- Historic Renovation - Baltimore
  ('40000000-0000-0000-0000-000000000004',
   'Lexington Market Redevelopment',
   '21000000-0000-0000-0000-000000000004',
   'Historic Renewal LLC',
   '20000000-0000-0000-0000-000000000004',
   ARRAY['NMTC', 'HTC']::program_type[],
   'MD', 'Baltimore', '24510170100',
   '400 W Lexington St, Baltimore, MD 21201',
   32000000, 15000000, 8000000,
   'Mixed-Use', 'Real Estate',
   'Historic rehabilitation of 1952 market building into modern mixed-use facility with food hall, retail, and community space.',
   120, 45, true, true, 78, 2, 'seeking_capital', true),

  -- Manufacturing - Pittsburgh
  ('40000000-0000-0000-0000-000000000005',
   'Pittsburgh Precision Manufacturing',
   '21000000-0000-0000-0000-000000000005',
   'Jobs Now Manufacturing',
   '20000000-0000-0000-0000-000000000005',
   ARRAY['NMTC']::program_type[],
   'PA', 'Pittsburgh', '42003020100',
   '2800 Smallman St, Pittsburgh, PA 15222',
   22000000, 14000000, 5500000,
   'Manufacturing', 'Real Estate',
   'Expansion of precision manufacturing facility creating 150+ living-wage jobs in advanced manufacturing sector.',
   155, 85, true, false, 82, 2, 'seeking_capital', true);

-- =============================================================================
-- DEMO CREDENTIALS NOTE
-- =============================================================================
-- For beta testing, use these email/password combinations:
-- CDE: sarah@urbandevfund.org / demo123
-- Sponsor: david@midwesthealth.com / demo123
-- Investor: william@firstnational.com / demo123
-- Admin: admin@tcredex.com / admin123

