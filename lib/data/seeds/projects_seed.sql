-- Demo project seed data for Supabase "projects" table
-- Run this in the Supabase SQL editor or psql against the database.
-- Adjust column names if your schema differs.

INSERT INTO projects (
  deal_id,
  project_name,
  sponsor_name,
  city,
  state,
  credit_type,
  status,
  program_level,
  shovel_ready,
  email,
  total_cost
) VALUES
  ('TC-HFB-001', 'Houston Food Bank Community Hub', 'Houston Food Bank', 'Houston', 'TX', 'NMTC', 'approved', 'federal', true, 'projects@houstonfoodbank.org', 18500000),
  ('TC-CA-HTC-001', 'Redwood Arts Lofts', 'Pacific Renewal Partners', 'Oakland', 'CA', 'HTC', 'submitted', 'state', false, 'info@pacificrenewal.com', 9200000),
  ('TC-NY-LIHTC-001', 'Harlem Affordable Living', 'Uptown Housing Collaborative', 'New York', 'NY', 'LIHTC', 'in_review', 'federal', true, 'pipeline@uhc.org', 26000000),
  ('TC-GA-OZ-001', 'Atlanta Innovation Park', 'Peachtree Ventures', 'Atlanta', 'GA', 'OZ', 'approved', 'federal', false, 'deals@peachtreeventures.com', 34000000),
  ('TC-FL-NMTC-001', 'Tampa Community Health Clinic', 'Sunrise Health', 'Tampa', 'FL', 'NMTC', 'submitted', 'federal', true, 'intake@sunrisehealth.org', 14500000),
  ('TC-TX-HTC-002', 'San Antonio Heritage Theater', 'Mission City Arts', 'San Antonio', 'TX', 'HTC', 'in_review', 'state', false, 'hello@missioncityarts.org', 6800000),
  ('TC-CA-LIHTC-002', 'San Diego Workforce Homes', 'Coastal Housing Trust', 'San Diego', 'CA', 'LIHTC', 'approved', 'federal', true, 'submissions@cht.org', 30500000),
  ('TC-NY-OZ-002', 'Buffalo Waterfront Redevelopment', 'Queen City Development', 'Buffalo', 'NY', 'OZ', 'submitted', 'federal', false, 'projects@qcd.dev', 22000000)
-- ON CONFLICT clause prevents duplicate insertions; existing rows with the same deal_id are left unchanged.
ON CONFLICT (deal_id) DO NOTHING;
