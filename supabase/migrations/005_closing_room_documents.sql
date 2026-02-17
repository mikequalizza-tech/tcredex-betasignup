-- =============================================================================
-- CLOSING ROOM CHECKLIST & DOCUMENT SYSTEM
-- tCredex v1.7 - Revenue Engine
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. CHECKLIST TEMPLATES BY PROGRAM
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS closing_checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_type VARCHAR(20) NOT NULL, -- 'NMTC', 'HTC', 'LIHTC', 'OZ', 'BROWNFIELD'
  category VARCHAR(100) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  description TEXT,
  required BOOLEAN DEFAULT true,
  conditional_on JSONB, -- e.g., {"field": "has_leverage_loan", "value": true}
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(program_type, category, item_name)
);

-- Index for fast lookups
CREATE INDEX idx_checklist_templates_program ON closing_checklist_templates(program_type);

-- -----------------------------------------------------------------------------
-- 2. DEAL-SPECIFIC CHECKLIST TRACKING
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deal_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES closing_checklist_templates(id),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'uploaded', 'approved', 'waived'
  document_id UUID REFERENCES documents(id),
  notes TEXT,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(deal_id, template_id)
);

-- Indexes
CREATE INDEX idx_deal_checklists_deal ON deal_checklists(deal_id);
CREATE INDEX idx_deal_checklists_status ON deal_checklists(status);

-- -----------------------------------------------------------------------------
-- 3. DOCUMENT TEMPLATES (REVENUE CENTER)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_type VARCHAR(20) NOT NULL,
  template_name VARCHAR(255) NOT NULL,
  template_code VARCHAR(50) NOT NULL UNIQUE, -- 'NMTC_CDE_LOI', 'HTC_INVESTOR_COMMIT', etc.
  description TEXT,
  category VARCHAR(100), -- 'LOI', 'Commitment', 'Agreement', 'Certificate'
  file_path VARCHAR(500), -- path to template file
  file_type VARCHAR(10) DEFAULT 'docx', -- 'docx', 'pdf'
  field_mappings JSONB, -- maps intake fields to template placeholders
  preview_available BOOLEAN DEFAULT false,
  price_cents INTEGER DEFAULT 0, -- 0 = free, else paid
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_doc_templates_program ON document_templates(program_type);
CREATE INDEX idx_doc_templates_category ON document_templates(category);

-- -----------------------------------------------------------------------------
-- 4. DOCUMENT PACKS (BUNDLES FOR PURCHASE)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_name VARCHAR(255) NOT NULL,
  pack_code VARCHAR(50) NOT NULL UNIQUE, -- 'NMTC_FULL', 'HTC_STARTER', etc.
  description TEXT,
  program_types VARCHAR(20)[], -- which programs this covers
  included_templates UUID[], -- references document_templates
  price_cents INTEGER NOT NULL,
  stripe_price_id VARCHAR(100), -- Stripe price ID for checkout
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 5. PURCHASES & TRANSACTIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  deal_id UUID REFERENCES deals(id),
  pack_id UUID REFERENCES document_packs(id),
  template_id UUID REFERENCES document_templates(id), -- if single template purchase
  stripe_payment_intent_id VARCHAR(100),
  stripe_checkout_session_id VARCHAR(100),
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  purchased_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- optional: time-limited access
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchases_user ON document_purchases(user_id);
CREATE INDEX idx_purchases_deal ON document_purchases(deal_id);
CREATE INDEX idx_purchases_status ON document_purchases(status);

-- -----------------------------------------------------------------------------
-- 6. GENERATED DOCUMENTS (OUTPUT)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id),
  template_id UUID NOT NULL REFERENCES document_templates(id),
  purchase_id UUID REFERENCES document_purchases(id),
  generated_by UUID REFERENCES users(id),
  file_path VARCHAR(500),
  file_name VARCHAR(255),
  field_values JSONB, -- snapshot of values used
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'final', 'signed'
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  signed_at TIMESTAMPTZ,
  
  UNIQUE(deal_id, template_id, generated_at)
);

CREATE INDEX idx_generated_docs_deal ON generated_documents(deal_id);

-- -----------------------------------------------------------------------------
-- 7. SUBSCRIPTION PLANS (LAW FIRMS)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  plan_type VARCHAR(50) NOT NULL, -- 'basic', 'professional', 'enterprise'
  stripe_subscription_id VARCHAR(100),
  stripe_customer_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'past_due', 'canceled', 'trialing'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- =============================================================================
-- SEED DATA: CHECKLIST ITEMS BY PROGRAM
-- =============================================================================

-- -----------------------------------------------------------------------------
-- NMTC CHECKLIST
-- -----------------------------------------------------------------------------
INSERT INTO closing_checklist_templates (program_type, category, item_name, description, required, sort_order) VALUES
-- Application & Entity
('NMTC', 'Entity & Borrower', 'Borrower Background', 'Organizational history and principals', true, 1),
('NMTC', 'Entity & Borrower', 'Organizational Documents', 'Articles, bylaws, operating agreements', true, 2),
('NMTC', 'Entity & Borrower', 'Good Standing Certificates', 'State certifications of good standing', true, 3),
('NMTC', 'Entity & Borrower', 'Borrower Financial Statements', '3 years audited financials', true, 4),
('NMTC', 'Entity & Borrower', 'Tax Returns (3 years)', 'Federal and state tax returns', true, 5),

-- Project Information
('NMTC', 'Project Information', 'Project Summary', 'Executive summary of project scope', true, 10),
('NMTC', 'Project Information', 'Market Study', 'Market analysis and demand study', true, 11),
('NMTC', 'Project Information', 'Appraisal', 'Independent property appraisal', true, 12),
('NMTC', 'Project Information', 'Site Plan', 'Detailed site layout', true, 13),
('NMTC', 'Project Information', 'Survey', 'ALTA/NSPS land survey', true, 14),
('NMTC', 'Project Information', 'Title Commitment', 'Title insurance commitment', true, 15),
('NMTC', 'Project Information', 'Zoning Approval', 'Zoning compliance or variance', true, 16),

-- Environmental
('NMTC', 'Environmental', 'Phase I ESA', 'Phase I Environmental Site Assessment', true, 20),
('NMTC', 'Environmental', 'Phase II ESA', 'Phase II if Phase I recommends', false, 21),
('NMTC', 'Environmental', 'NEPA Review', 'National Environmental Policy Act compliance', true, 22),
('NMTC', 'Environmental', 'Hazardous Materials Assessment', 'Asbestos, lead paint, etc.', true, 23),

-- Construction
('NMTC', 'Construction', 'Project Budget', 'Detailed sources and uses', true, 30),
('NMTC', 'Construction', 'Construction Schedule', 'Timeline and milestones', true, 31),
('NMTC', 'Construction', 'Plans and Specifications', 'Architectural drawings', true, 32),
('NMTC', 'Construction', 'Construction Contract', 'GC contract', true, 33),
('NMTC', 'Construction', 'Architect Agreement', 'Design services contract', true, 34),
('NMTC', 'Construction', 'Contractor Qualifications', 'GC experience and references', true, 35),
('NMTC', 'Construction', 'Building Permits', 'All required permits', true, 36),
('NMTC', 'Construction', 'Performance Bond', 'Construction bond if required', false, 37),

-- Insurance
('NMTC', 'Insurance', 'General Liability Insurance', 'GL policy', true, 40),
('NMTC', 'Insurance', 'Property Insurance', 'Property coverage', true, 41),
('NMTC', 'Insurance', 'Builders Risk Insurance', 'During construction', true, 42),
('NMTC', 'Insurance', 'Workers Compensation', 'WC policy', true, 43),
('NMTC', 'Insurance', 'Flood Insurance', 'If in flood zone', false, 44),

-- Finance
('NMTC', 'Finance', 'CDE Letter of Intent', 'LOI from Community Development Entity', true, 50),
('NMTC', 'Finance', 'CDE Commitment Letter', 'Final commitment from CDE', true, 51),
('NMTC', 'Finance', 'Investor Term Sheet', 'NMTC investor terms', true, 52),
('NMTC', 'Finance', 'Investor Commitment Letter', 'Final investor commitment', true, 53),
('NMTC', 'Finance', 'Leverage Loan Term Sheet', 'Senior debt terms', true, 54),
('NMTC', 'Finance', 'Leverage Loan Commitment', 'Bank commitment letter', true, 55),
('NMTC', 'Finance', 'Project Projections', '7-year NMTC projections', true, 56),

-- Legal / Closing
('NMTC', 'Legal & Closing', 'QLICI Loan Documents', 'Qualified Low-Income Community Investment docs', true, 60),
('NMTC', 'Legal & Closing', 'Allocation Agreement', 'CDE allocation agreement', true, 61),
('NMTC', 'Legal & Closing', 'Sub-CDE Operating Agreement', 'Investment fund OpCo agreement', true, 62),
('NMTC', 'Legal & Closing', 'Leverage Loan Documents', 'Senior loan docs', true, 63),
('NMTC', 'Legal & Closing', 'Legal Opinion - Tax', 'Tax counsel opinion', true, 64),
('NMTC', 'Legal & Closing', 'Legal Opinion - Corporate', 'Corporate counsel opinion', true, 65),
('NMTC', 'Legal & Closing', 'Closing Checklist Sign-off', 'All parties sign-off', true, 66),

-- -----------------------------------------------------------------------------
-- HTC CHECKLIST
-- -----------------------------------------------------------------------------
('HTC', 'Entity & Borrower', 'Borrower Background', 'Organizational history and principals', true, 1),
('HTC', 'Entity & Borrower', 'Organizational Documents', 'Articles, bylaws, operating agreements', true, 2),
('HTC', 'Entity & Borrower', 'Good Standing Certificates', 'State certifications', true, 3),
('HTC', 'Entity & Borrower', 'Financial Statements (3 years)', 'Audited financials', true, 4),
('HTC', 'Entity & Borrower', 'Tax Returns (3 years)', 'Federal and state', true, 5),

-- NPS Approvals
('HTC', 'NPS Approvals', 'NPS Part 1 - Evaluation of Significance', 'Historic significance determination', true, 10),
('HTC', 'NPS Approvals', 'NPS Part 1 - Approval Letter', 'NPS approval of Part 1', true, 11),
('HTC', 'NPS Approvals', 'NPS Part 2 - Description of Rehabilitation', 'Detailed rehab scope', true, 12),
('HTC', 'NPS Approvals', 'NPS Part 2 - Approval Letter', 'NPS approval of Part 2', true, 13),
('HTC', 'NPS Approvals', 'NPS Part 3 - Certification of Completed Work', 'Final certification application', true, 14),
('HTC', 'NPS Approvals', 'NPS Part 3 - Approval Letter', 'Final NPS certification', true, 15),
('HTC', 'NPS Approvals', 'State Historic Preservation Office (SHPO) Letters', 'SHPO correspondence', true, 16),

-- Project Information
('HTC', 'Project Information', 'Historic Structure Report', 'Building history and condition', true, 20),
('HTC', 'Project Information', 'Market Study', 'Market analysis', true, 21),
('HTC', 'Project Information', 'Appraisal', 'As-is and as-completed values', true, 22),
('HTC', 'Project Information', 'Qualified Rehabilitation Expenditure Analysis', 'QRE breakdown', true, 23),

-- Construction
('HTC', 'Construction', 'Project Budget', 'Sources and uses with QRE detail', true, 30),
('HTC', 'Construction', 'Construction Schedule', 'Timeline', true, 31),
('HTC', 'Construction', 'Plans and Specifications', 'Architectural drawings', true, 32),
('HTC', 'Construction', 'Secretary of Interior Standards Compliance', 'Standards checklist', true, 33),
('HTC', 'Construction', 'Construction Contract', 'GC contract', true, 34),
('HTC', 'Construction', 'Historic Preservation Easement', 'If applicable', false, 35),

-- Finance
('HTC', 'Finance', 'HTC Investor Term Sheet', 'Tax credit investor terms', true, 40),
('HTC', 'Finance', 'HTC Investor Commitment Letter', 'Final commitment', true, 41),
('HTC', 'Finance', 'Bridge Loan Term Sheet', 'Bridge financing terms', false, 42),
('HTC', 'Finance', 'Permanent Loan Commitment', 'Take-out financing', true, 43),
('HTC', 'Finance', 'Project Projections', 'Financial projections', true, 44),

-- Legal & Closing
('HTC', 'Legal & Closing', 'Operating Agreement', 'Partnership/LLC agreement', true, 50),
('HTC', 'Legal & Closing', 'Development Agreement', 'Developer services agreement', true, 51),
('HTC', 'Legal & Closing', 'Tax Opinion', 'Tax counsel opinion on credits', true, 52),
('HTC', 'Legal & Closing', 'Cost Certification', 'CPA certification of costs', true, 53),

-- -----------------------------------------------------------------------------
-- LIHTC CHECKLIST
-- -----------------------------------------------------------------------------
('LIHTC', 'Entity & Borrower', 'Developer Qualifications', 'Experience and track record', true, 1),
('LIHTC', 'Entity & Borrower', 'Organizational Documents', 'Partnership/LLC docs', true, 2),
('LIHTC', 'Entity & Borrower', 'Financial Statements', 'Developer financials', true, 3),
('LIHTC', 'Entity & Borrower', 'Guarantor Financials', 'Guarantor PFS and tax returns', true, 4),

-- Allocation
('LIHTC', 'Tax Credit Allocation', 'Tax Credit Application', 'HFA application', true, 10),
('LIHTC', 'Tax Credit Allocation', 'Reservation Letter', 'Credit reservation', true, 11),
('LIHTC', 'Tax Credit Allocation', 'Carryover Allocation', 'If applicable', false, 12),
('LIHTC', 'Tax Credit Allocation', 'Final Allocation (8609)', 'IRS Form 8609', true, 13),

-- Project Information  
('LIHTC', 'Project Information', 'Market Study', 'Housing market analysis', true, 20),
('LIHTC', 'Project Information', 'Appraisal', 'As-restricted value', true, 21),
('LIHTC', 'Project Information', 'Capital Needs Assessment', 'For acquisition/rehab', false, 22),
('LIHTC', 'Project Information', 'Rent Roll', 'Current occupancy if existing', false, 23),

-- Construction
('LIHTC', 'Construction', 'Project Budget', 'Detailed development budget', true, 30),
('LIHTC', 'Construction', 'Plans and Specifications', 'Construction drawings', true, 31),
('LIHTC', 'Construction', 'Construction Contract', 'GC agreement', true, 32),
('LIHTC', 'Construction', 'Davis-Bacon Compliance', 'If federal funds involved', false, 33),

-- Finance
('LIHTC', 'Finance', 'Syndicator/Investor LOI', 'Tax credit investor letter of intent', true, 40),
('LIHTC', 'Finance', 'Syndicator/Investor Commitment', 'Final equity commitment', true, 41),
('LIHTC', 'Finance', 'Construction Loan Commitment', 'Construction lender', true, 42),
('LIHTC', 'Finance', 'Permanent Loan Commitment', 'Permanent lender', true, 43),
('LIHTC', 'Finance', 'Gap/Soft Financing Commitments', 'HOME, CDBG, other', false, 44),
('LIHTC', 'Finance', 'Project Projections', '15-year projections', true, 45),

-- Regulatory
('LIHTC', 'Regulatory', 'Land Use Restriction Agreement (LURA)', 'Recorded LURA', true, 50),
('LIHTC', 'Regulatory', 'Extended Use Agreement', 'Extended affordability period', true, 51),
('LIHTC', 'Regulatory', 'Regulatory Agreement', 'HFA regulatory agreement', true, 52),
('LIHTC', 'Regulatory', 'Fair Housing Certification', 'Accessibility compliance', true, 53),

-- Legal & Closing
('LIHTC', 'Legal & Closing', 'Partnership Agreement', 'LP or LLC operating agreement', true, 60),
('LIHTC', 'Legal & Closing', 'Development Agreement', 'Developer fee agreement', true, 61),
('LIHTC', 'Legal & Closing', 'Management Agreement', 'Property management contract', true, 62),
('LIHTC', 'Legal & Closing', 'Tax Opinion', 'Tax counsel opinion', true, 63),
('LIHTC', 'Legal & Closing', 'Cost Certification', 'CPA cost cert', true, 64),

-- -----------------------------------------------------------------------------
-- BROWNFIELD CHECKLIST
-- -----------------------------------------------------------------------------
('BROWNFIELD', 'Environmental', 'Phase I ESA', 'Environmental site assessment', true, 1),
('BROWNFIELD', 'Environmental', 'Phase II ESA', 'Sampling and analysis', true, 2),
('BROWNFIELD', 'Environmental', 'Remedial Investigation', 'Full site investigation', true, 3),
('BROWNFIELD', 'Environmental', 'Remedial Action Plan (RAP)', 'Cleanup plan', true, 4),
('BROWNFIELD', 'Environmental', 'State Approval of RAP', 'State environmental agency approval', true, 5),
('BROWNFIELD', 'Environmental', 'No Further Action Letter', 'Site closure letter', true, 6),
('BROWNFIELD', 'Environmental', 'Engineering Controls', 'Caps, barriers, vapor mitigation', false, 7),
('BROWNFIELD', 'Environmental', 'Institutional Controls', 'Deed restrictions', false, 8),

('BROWNFIELD', 'Finance', 'Brownfield Tax Credit Application', 'State credit application', true, 10),
('BROWNFIELD', 'Finance', 'Cost Estimate for Remediation', 'Qualified cleanup costs', true, 11),
('BROWNFIELD', 'Finance', 'Credit Reservation/Award', 'State award letter', true, 12),

-- -----------------------------------------------------------------------------
-- OZ CHECKLIST  
-- -----------------------------------------------------------------------------
('OZ', 'Entity & Structure', 'Qualified Opportunity Fund (QOF) Formation', 'Fund entity docs', true, 1),
('OZ', 'Entity & Structure', 'QOF Self-Certification (Form 8996)', 'IRS self-certification', true, 2),
('OZ', 'Entity & Structure', 'Operating Agreement', 'QOF operating agreement', true, 3),
('OZ', 'Entity & Structure', 'PPM (Private Placement Memorandum)', 'Investor disclosure', true, 4),
('OZ', 'Entity & Structure', 'Subscription Agreement', 'Investor subscription docs', true, 5),

('OZ', 'Qualification', 'Census Tract Eligibility Verification', 'OZ tract confirmation', true, 10),
('OZ', 'Qualification', 'Qualified Opportunity Zone Business Property', 'QOZBP analysis', true, 11),
('OZ', 'Qualification', 'Substantial Improvement Test', '30-month timeline tracking', true, 12),
('OZ', 'Qualification', '90% Asset Test Compliance', 'Quarterly testing documentation', true, 13),
('OZ', 'Qualification', '50% Gross Income Test', 'For operating businesses', false, 14),

('OZ', 'Finance', 'Investor Commitment Letters', 'Capital gain investor commitments', true, 20),
('OZ', 'Finance', 'Capital Call Schedule', 'Deployment timeline', true, 21),
('OZ', 'Finance', 'Project Projections', 'QOF and QOZB projections', true, 22),

('OZ', 'Legal & Compliance', 'Tax Opinion', 'OZ qualification opinion', true, 30),
('OZ', 'Legal & Compliance', 'Annual Certification (Form 8996)', 'Yearly IRS filing', true, 31),
('OZ', 'Legal & Compliance', 'Investor K-1s with OZ Reporting', 'Schedule K-1 with OZ data', true, 32)

ON CONFLICT (program_type, category, item_name) DO NOTHING;

-- =============================================================================
-- SEED DATA: DOCUMENT TEMPLATES
-- =============================================================================

INSERT INTO document_templates (program_type, template_code, template_name, category, description, price_cents) VALUES
-- NMTC Templates
('NMTC', 'NMTC_CDE_LOI', 'CDE Letter of Intent', 'LOI', 'Standard CDE LOI template', 0),
('NMTC', 'NMTC_CDE_COMMIT', 'CDE Commitment Letter', 'Commitment', 'CDE commitment letter template', 9900),
('NMTC', 'NMTC_INV_TERMSHEET', 'Investor Term Sheet', 'Term Sheet', 'NMTC investor term sheet', 9900),
('NMTC', 'NMTC_INV_COMMIT', 'Investor Commitment Letter', 'Commitment', 'NMTC investor commitment', 14900),
('NMTC', 'NMTC_QLICI_NOTE', 'QLICI Loan Note', 'Loan Document', 'Qualified low-income community investment note', 24900),
('NMTC', 'NMTC_QLICI_AGREEMENT', 'QLICI Loan Agreement', 'Loan Document', 'QLICI loan agreement', 24900),
('NMTC', 'NMTC_ALLOCATION_AGMT', 'Allocation Agreement', 'Agreement', 'CDE allocation agreement', 34900),
('NMTC', 'NMTC_SUBCDE_OPAGMT', 'Sub-CDE Operating Agreement', 'Agreement', 'Investment fund operating agreement', 49900),
('NMTC', 'NMTC_LEVERAGE_NOTE', 'Leverage Loan Note', 'Loan Document', 'Senior leverage loan promissory note', 19900),
('NMTC', 'NMTC_PROJECTIONS', 'NMTC 7-Year Projections Model', 'Financial', 'Excel projections template', 14900),

-- HTC Templates
('HTC', 'HTC_INV_LOI', 'HTC Investor LOI', 'LOI', 'Historic tax credit investor letter of intent', 0),
('HTC', 'HTC_INV_TERMSHEET', 'HTC Investor Term Sheet', 'Term Sheet', 'HTC investor term sheet', 9900),
('HTC', 'HTC_INV_COMMIT', 'HTC Investor Commitment Letter', 'Commitment', 'HTC investor commitment', 14900),
('HTC', 'HTC_PARTNERSHIP_AGMT', 'HTC Partnership Agreement', 'Agreement', 'Master tenant/partnership agreement', 39900),
('HTC', 'HTC_DEV_AGMT', 'Development Agreement', 'Agreement', 'Developer services agreement', 19900),
('HTC', 'HTC_BRIDGE_TERMSHEET', 'Bridge Loan Term Sheet', 'Term Sheet', 'HTC bridge financing terms', 9900),
('HTC', 'HTC_QRE_ANALYSIS', 'QRE Analysis Worksheet', 'Financial', 'Qualified rehabilitation expenditure breakdown', 9900),

-- LIHTC Templates
('LIHTC', 'LIHTC_SYND_LOI', 'Syndicator LOI', 'LOI', 'Tax credit syndicator letter of intent', 0),
('LIHTC', 'LIHTC_SYND_COMMIT', 'Syndicator Commitment', 'Commitment', 'Syndicator commitment letter', 14900),
('LIHTC', 'LIHTC_LP_AGMT', 'Limited Partnership Agreement', 'Agreement', 'LIHTC LP agreement', 49900),
('LIHTC', 'LIHTC_DEV_AGMT', 'Development Agreement', 'Agreement', 'Developer agreement', 19900),
('LIHTC', 'LIHTC_MGMT_AGMT', 'Management Agreement', 'Agreement', 'Property management agreement', 14900),
('LIHTC', 'LIHTC_PROJECTIONS', 'LIHTC 15-Year Projections', 'Financial', 'Excel projections template', 14900),

-- OZ Templates  
('OZ', 'OZ_QOF_OPAGMT', 'QOF Operating Agreement', 'Agreement', 'Qualified opportunity fund operating agreement', 39900),
('OZ', 'OZ_PPM', 'Private Placement Memorandum', 'Disclosure', 'QOF investor PPM template', 99900),
('OZ', 'OZ_SUBSCRIPTION', 'Subscription Agreement', 'Agreement', 'Investor subscription documents', 24900),
('OZ', 'OZ_PROJECTIONS', 'OZ Investment Projections', 'Financial', 'QOF projections template', 14900),

-- Brownfield Templates
('BROWNFIELD', 'BF_RAP_TEMPLATE', 'Remedial Action Plan Template', 'Environmental', 'RAP outline and template', 19900),
('BROWNFIELD', 'BF_CREDIT_APP', 'Brownfield Credit Application', 'Application', 'State credit application template', 9900)

ON CONFLICT (template_code) DO NOTHING;

-- =============================================================================
-- SEED DATA: DOCUMENT PACKS (BUNDLES)
-- =============================================================================

INSERT INTO document_packs (pack_code, pack_name, description, program_types, price_cents) VALUES
('NMTC_STARTER', 'NMTC Starter Pack', 'LOIs and term sheets to get your deal moving', ARRAY['NMTC'], 19900),
('NMTC_FULL', 'NMTC Complete Closing Pack', 'All documents needed to close an NMTC transaction', ARRAY['NMTC'], 149900),
('HTC_STARTER', 'HTC Starter Pack', 'LOIs and term sheets for historic tax credit deals', ARRAY['HTC'], 19900),
('HTC_FULL', 'HTC Complete Closing Pack', 'Full HTC document set', ARRAY['HTC'], 99900),
('LIHTC_STARTER', 'LIHTC Starter Pack', 'Syndicator LOI and basic documents', ARRAY['LIHTC'], 19900),
('LIHTC_FULL', 'LIHTC Complete Closing Pack', 'Full LIHTC document set', ARRAY['LIHTC'], 129900),
('COMBO_NMTC_HTC', 'NMTC + HTC Combo Pack', 'Complete docs for stacked NMTC/HTC deals', ARRAY['NMTC', 'HTC'], 199900),
('ENTERPRISE', 'Enterprise All-Access', 'All templates, all programs, 1 year access', ARRAY['NMTC', 'HTC', 'LIHTC', 'OZ', 'BROWNFIELD'], 499900)

ON CONFLICT (pack_code) DO NOTHING;

-- =============================================================================
-- VIEWS FOR EASY ACCESS
-- =============================================================================

-- Deal checklist progress view
CREATE OR REPLACE VIEW deal_checklist_progress AS
SELECT 
  d.id as deal_id,
  d.project_name,
  d.program_type,
  COUNT(dc.id) as total_items,
  COUNT(CASE WHEN dc.status IN ('uploaded', 'approved') THEN 1 END) as completed_items,
  COUNT(CASE WHEN dc.status = 'pending' THEN 1 END) as pending_items,
  ROUND(
    100.0 * COUNT(CASE WHEN dc.status IN ('uploaded', 'approved') THEN 1 END) / 
    NULLIF(COUNT(dc.id), 0), 
    1
  ) as completion_percentage
FROM deals d
LEFT JOIN deal_checklists dc ON d.id = dc.deal_id
GROUP BY d.id, d.project_name, d.program_type;

-- Revenue dashboard view
CREATE OR REPLACE VIEW document_revenue AS
SELECT 
  DATE_TRUNC('month', purchased_at) as month,
  COUNT(*) as transactions,
  SUM(amount_cents) / 100.0 as revenue_dollars,
  COUNT(DISTINCT user_id) as unique_buyers
FROM document_purchases
WHERE status = 'completed'
GROUP BY DATE_TRUNC('month', purchased_at)
ORDER BY month DESC;
