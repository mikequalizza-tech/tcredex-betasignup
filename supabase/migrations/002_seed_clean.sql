-- =============================================================================
-- tCredex Seed Data v1.7 (Clean Version)
-- =============================================================================
-- Run after: 001_complete_schema.sql
-- =============================================================================

-- ORGANIZATIONS
INSERT INTO organizations (id, name, slug, type, website, city, state) VALUES
  ('00000000-0000-0000-0000-000000000001', 'tCredex Admin', 'tcredex-admin', 'admin', 'https://tcredex.com', 'Austin', 'TX'),
  ('10000000-0000-0000-0000-000000000001', 'Urban Development Fund', 'urban-dev-fund', 'cde', 'https://urbandevfund.org', 'Chicago', 'IL'),
  ('10000000-0000-0000-0000-000000000002', 'Capital Impact Partners', 'capital-impact', 'cde', 'https://capitalimpact.org', 'Arlington', 'VA'),
  ('10000000-0000-0000-0000-000000000003', 'National Community Fund', 'national-community', 'cde', 'https://ncfund.org', 'Denver', 'CO'),
  ('10000000-0000-0000-0000-000000000004', 'Rural Opportunities Inc', 'rural-opps', 'cde', 'https://ruralopps.org', 'Kansas City', 'MO'),
  ('10000000-0000-0000-0000-000000000005', 'Coastal Development Corp', 'coastal-dev', 'cde', 'https://coastaldev.org', 'Miami', 'FL'),
  ('20000000-0000-0000-0000-000000000001', 'Midwest Health Partners', 'midwest-health', 'sponsor', 'https://midwesthealth.com', 'Indianapolis', 'IN'),
  ('20000000-0000-0000-0000-000000000002', 'Fresh Food Markets Inc', 'fresh-food', 'sponsor', 'https://freshfoodmarkets.com', 'Detroit', 'MI'),
  ('20000000-0000-0000-0000-000000000003', 'Community First Development', 'community-first', 'sponsor', 'https://communityfirst.org', 'Cleveland', 'OH'),
  ('20000000-0000-0000-0000-000000000004', 'Historic Renewal LLC', 'historic-renewal', 'sponsor', 'https://historicrenewal.com', 'Baltimore', 'MD'),
  ('20000000-0000-0000-0000-000000000005', 'Jobs Now Manufacturing', 'jobs-now', 'sponsor', 'https://jobsnowmfg.com', 'Pittsburgh', 'PA'),
  ('30000000-0000-0000-0000-000000000001', 'First National Bank', 'first-national', 'investor', 'https://firstnational.com', 'New York', 'NY'),
  ('30000000-0000-0000-0000-000000000002', 'Community Trust Capital', 'community-trust', 'investor', 'https://communitytrust.com', 'Boston', 'MA'),
  ('30000000-0000-0000-0000-000000000003', 'Impact Investment Group', 'impact-invest', 'investor', 'https://impactinvest.com', 'San Francisco', 'CA');


-- USERS
INSERT INTO users (id, email, name, role, organization_id, title) VALUES
  ('00000000-0000-0000-0001-000000000001', 'admin@tcredex.com', 'Mike Admin', 'ORG_ADMIN', '00000000-0000-0000-0000-000000000001', 'Platform Admin'),
  ('10000000-0000-0000-0001-000000000001', 'sarah@urbandevfund.org', 'Sarah Mitchell', 'ORG_ADMIN', '10000000-0000-0000-0000-000000000001', 'Executive Director'),
  ('10000000-0000-0000-0001-000000000002', 'john@capitalimpact.org', 'John Anderson', 'ORG_ADMIN', '10000000-0000-0000-0000-000000000002', 'Managing Director'),
  ('10000000-0000-0000-0001-000000000003', 'maria@ncfund.org', 'Maria Garcia', 'ORG_ADMIN', '10000000-0000-0000-0000-000000000003', 'President'),
  ('10000000-0000-0000-0001-000000000004', 'tom@ruralopps.org', 'Tom Wilson', 'ORG_ADMIN', '10000000-0000-0000-0000-000000000004', 'CEO'),
  ('10000000-0000-0000-0001-000000000005', 'lisa@coastaldev.org', 'Lisa Chen', 'ORG_ADMIN', '10000000-0000-0000-0000-000000000005', 'Director'),
  ('20000000-0000-0000-0001-000000000001', 'david@midwesthealth.com', 'David Thompson', 'ORG_ADMIN', '20000000-0000-0000-0000-000000000001', 'CFO'),
  ('20000000-0000-0000-0001-000000000002', 'jennifer@freshfood.com', 'Jennifer Davis', 'ORG_ADMIN', '20000000-0000-0000-0000-000000000002', 'Development Director'),
  ('20000000-0000-0000-0001-000000000003', 'robert@communityfirst.org', 'Robert Brown', 'ORG_ADMIN', '20000000-0000-0000-0000-000000000003', 'Executive Director'),
  ('20000000-0000-0000-0001-000000000004', 'amanda@historicrenewal.com', 'Amanda White', 'ORG_ADMIN', '20000000-0000-0000-0000-000000000004', 'Managing Partner'),
  ('20000000-0000-0000-0001-000000000005', 'michael@jobsnowmfg.com', 'Michael Johnson', 'ORG_ADMIN', '20000000-0000-0000-0000-000000000005', 'CEO'),
  ('30000000-0000-0000-0001-000000000001', 'william@firstnational.com', 'William Harris', 'ORG_ADMIN', '30000000-0000-0000-0000-000000000001', 'VP Community Development'),
  ('30000000-0000-0000-0001-000000000002', 'susan@communitytrust.com', 'Susan Taylor', 'ORG_ADMIN', '30000000-0000-0000-0000-000000000002', 'Managing Director'),
  ('30000000-0000-0000-0001-000000000003', 'james@impactinvest.com', 'James Martinez', 'ORG_ADMIN', '30000000-0000-0000-0000-000000000003', 'Partner');

-- CDEs
INSERT INTO cdes (id, organization_id, certification_number, year_established, total_allocation, remaining_allocation, min_deal_size, max_deal_size, small_deal_fund, service_area_type, primary_states, rural_focus, urban_focus, mission_statement, impact_priorities, target_sectors, nmtc_experience, htc_experience, status, primary_contact_name, primary_contact_email) VALUES
  ('11000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'CDE-2003-0042', 2003, 150000000, 85000000, 2000000, 20000000, true, 'regional', ARRAY['IL', 'IN', 'WI', 'MI', 'OH'], false, true, 'Revitalizing urban communities in the Midwest through strategic NMTC investments.', ARRAY['job-creation', 'healthcare-access'], ARRAY['Healthcare', 'Education', 'Mixed-Use'], true, true, 'active', 'Sarah Mitchell', 'sarah@urbandevfund.org'),
  ('11000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'CDE-2001-0015', 2001, 200000000, 120000000, 5000000, 30000000, false, 'national', ARRAY['VA', 'MD', 'DC', 'NC', 'PA', 'NY'], false, true, 'Deploying capital to create economic opportunity in underserved communities nationwide.', ARRAY['job-creation', 'affordable-housing'], ARRAY['Manufacturing', 'Mixed-Use', 'Community Facility'], true, false, 'active', 'John Anderson', 'john@capitalimpact.org'),
  ('11000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'CDE-2005-0078', 2005, 100000000, 45000000, 1000000, 15000000, true, 'regional', ARRAY['CO', 'NM', 'AZ', 'UT', 'WY'], true, true, 'Supporting sustainable development in Rocky Mountain communities.', ARRAY['food-access', 'healthcare-access'], ARRAY['Grocery', 'Healthcare', 'Manufacturing'], true, false, 'active', 'Maria Garcia', 'maria@ncfund.org'),
  ('11000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'CDE-2008-0112', 2008, 75000000, 60000000, 500000, 10000000, true, 'regional', ARRAY['MO', 'KS', 'NE', 'IA', 'OK'], true, false, 'Dedicated to rural economic development through small-scale investments.', ARRAY['rural-development', 'manufacturing-revival'], ARRAY['Manufacturing', 'Agriculture', 'Industrial'], true, false, 'active', 'Tom Wilson', 'tom@ruralopps.org'),
  ('11000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'CDE-2010-0156', 2010, 125000000, 90000000, 3000000, 25000000, false, 'regional', ARRAY['FL', 'GA', 'AL', 'SC', 'LA'], false, true, 'Catalyzing coastal community development with focus on resilience.', ARRAY['job-creation', 'environmental-sustainability'], ARRAY['Mixed-Use', 'Healthcare', 'Education'], true, true, 'active', 'Lisa Chen', 'lisa@coastaldev.org');


-- CDE ALLOCATIONS
INSERT INTO cde_allocations (id, cde_id, type, year, awarded_amount, available_on_platform, deployment_deadline) VALUES
  ('12000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'federal', '2022', 50000000, 25000000, '2029-09-30'),
  ('12000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000001', 'federal', '2023', 55000000, 35000000, '2030-09-30'),
  ('12000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000001', 'state', '2023', 25000000, 15000000, '2028-12-31'),
  ('12000000-0000-0000-0000-000000000004', '11000000-0000-0000-0000-000000000002', 'federal', '2021', 65000000, 40000000, '2028-09-30'),
  ('12000000-0000-0000-0000-000000000005', '11000000-0000-0000-0000-000000000002', 'federal', '2023', 70000000, 50000000, '2030-09-30'),
  ('12000000-0000-0000-0000-000000000006', '11000000-0000-0000-0000-000000000002', 'federal', '2024', 65000000, 30000000, '2031-09-30'),
  ('12000000-0000-0000-0000-000000000007', '11000000-0000-0000-0000-000000000003', 'federal', '2022', 45000000, 20000000, '2029-09-30'),
  ('12000000-0000-0000-0000-000000000008', '11000000-0000-0000-0000-000000000003', 'federal', '2024', 55000000, 25000000, '2031-09-30'),
  ('12000000-0000-0000-0000-000000000009', '11000000-0000-0000-0000-000000000004', 'federal', '2023', 40000000, 35000000, '2030-09-30'),
  ('12000000-0000-0000-0000-000000000010', '11000000-0000-0000-0000-000000000004', 'federal', '2024', 35000000, 25000000, '2031-09-30'),
  ('12000000-0000-0000-0000-000000000011', '11000000-0000-0000-0000-000000000005', 'federal', '2022', 60000000, 45000000, '2029-09-30'),
  ('12000000-0000-0000-0000-000000000012', '11000000-0000-0000-0000-000000000005', 'federal', '2024', 65000000, 45000000, '2031-09-30');

-- SPONSORS
INSERT INTO sponsors (id, organization_id, organization_type, primary_contact_name, primary_contact_email, woman_owned, minority_owned, veteran_owned) VALUES
  ('21000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Non-profit', 'David Thompson', 'david@midwesthealth.com', false, false, false),
  ('21000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'For-profit', 'Jennifer Davis', 'jennifer@freshfood.com', true, true, false),
  ('21000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'Non-profit', 'Robert Brown', 'robert@communityfirst.org', false, false, false),
  ('21000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 'For-profit', 'Amanda White', 'amanda@historicrenewal.com', true, false, false),
  ('21000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000005', 'For-profit', 'Michael Johnson', 'michael@jobsnowmfg.com', false, false, true);

-- INVESTORS
INSERT INTO investors (id, organization_id, investor_type, cra_motivated, min_investment, max_investment, target_credit_types, primary_contact_name, primary_contact_email) VALUES
  ('31000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Bank', true, 5000000, 50000000, ARRAY['NMTC', 'HTC']::program_type[], 'William Harris', 'william@firstnational.com'),
  ('31000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'CDFI', true, 2000000, 25000000, ARRAY['NMTC', 'LIHTC']::program_type[], 'Susan Taylor', 'susan@communitytrust.com'),
  ('31000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'Family Office', false, 1000000, 15000000, ARRAY['NMTC', 'HTC', 'OZ']::program_type[], 'James Martinez', 'james@impactinvest.com');


-- DEALS
INSERT INTO deals (id, project_name, sponsor_id, sponsor_name, sponsor_organization_id, programs, state, city, census_tract, address, total_project_cost, nmtc_financing_requested, financing_gap, project_type, venture_type, project_description, jobs_created, jobs_retained, tract_eligible, tract_severely_distressed, readiness_score, tier, status, visible) VALUES
  ('40000000-0000-0000-0000-000000000001', 'Eastside Community Health Center', '21000000-0000-0000-0000-000000000001', 'Midwest Health Partners', '20000000-0000-0000-0000-000000000001', ARRAY['NMTC']::program_type[], 'IN', 'Indianapolis', '18097352700', '3200 E Washington St, Indianapolis, IN 46201', 18500000, 12000000, 4500000, 'Healthcare', 'Real Estate', 'New 35,000 SF community health center providing primary care, dental, behavioral health, and pharmacy services.', 85, 0, true, true, 72, 2, 'available', true),
  ('40000000-0000-0000-0000-000000000002', 'Fresh Market Detroit', '21000000-0000-0000-0000-000000000002', 'Fresh Food Markets Inc', '20000000-0000-0000-0000-000000000002', ARRAY['NMTC']::program_type[], 'MI', 'Detroit', '26163523900', '8900 Livernois Ave, Detroit, MI 48204', 12000000, 8000000, 3000000, 'Grocery', 'Real Estate', 'Development of 25,000 SF grocery store in USDA food desert, serving 15,000+ residents.', 65, 0, true, true, 65, 2, 'available', true),
  ('40000000-0000-0000-0000-000000000003', 'Hough Neighborhood Resource Center', '21000000-0000-0000-0000-000000000003', 'Community First Development', '20000000-0000-0000-0000-000000000003', ARRAY['NMTC']::program_type[], 'OH', 'Cleveland', '39035108300', '7500 Hough Ave, Cleveland, OH 44103', 9500000, 6500000, 2500000, 'Community Facility', 'Real Estate', 'Renovation of historic building into multi-service community center with workforce training and childcare.', 40, 15, true, true, 58, 2, 'available', true),
  ('40000000-0000-0000-0000-000000000004', 'Lexington Market Redevelopment', '21000000-0000-0000-0000-000000000004', 'Historic Renewal LLC', '20000000-0000-0000-0000-000000000004', ARRAY['NMTC', 'HTC']::program_type[], 'MD', 'Baltimore', '24510170100', '400 W Lexington St, Baltimore, MD 21201', 32000000, 15000000, 8000000, 'Mixed-Use', 'Real Estate', 'Historic rehabilitation of 1952 market building into modern mixed-use facility with food hall and retail.', 120, 45, true, true, 78, 2, 'seeking_capital', true),
  ('40000000-0000-0000-0000-000000000005', 'Pittsburgh Precision Manufacturing', '21000000-0000-0000-0000-000000000005', 'Jobs Now Manufacturing', '20000000-0000-0000-0000-000000000005', ARRAY['NMTC']::program_type[], 'PA', 'Pittsburgh', '42003020100', '2800 Smallman St, Pittsburgh, PA 15222', 22000000, 14000000, 5500000, 'Manufacturing', 'Real Estate', 'Expansion of precision manufacturing facility creating 150+ living-wage jobs.', 155, 85, true, false, 82, 2, 'seeking_capital', true);

-- End of seed data
