-- =============================================================================
-- tCredex LOI & Commitment System
-- Migration: 007_loi_commitment_flow.sql
-- 
-- Transaction Flow:
-- 1. CDE issues LOI → Sponsor accepts → Deal status: "Seeking Capital"
-- 2. Investor issues Commitment → All parties accept → Closing Room opens
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. LOI STATUS ENUM
-- -----------------------------------------------------------------------------
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loi_status') THEN
    CREATE TYPE loi_status AS ENUM (
      'draft',
      'issued',
      'pending_sponsor',
      'sponsor_accepted',
      'sponsor_rejected',
      'sponsor_countered',
      'expired',
      'withdrawn',
      'superseded'
    );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. COMMITMENT STATUS ENUM
-- -----------------------------------------------------------------------------
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'commitment_status') THEN
    CREATE TYPE commitment_status AS ENUM (
      'draft',
      'issued',
      'pending_sponsor',
      'pending_cde',
      'sponsor_accepted',
      'cde_accepted',
      'all_accepted',
      'rejected',
      'expired',
      'withdrawn',
      'superseded'
    );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3. LETTERS OF INTENT TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS letters_of_intent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  cde_id UUID NOT NULL REFERENCES cdes(id),
  sponsor_id UUID NOT NULL REFERENCES users(id),
  
  -- LOI Details
  loi_number VARCHAR(50) UNIQUE, -- e.g., "LOI-2025-001234"
  status loi_status NOT NULL DEFAULT 'draft',
  
  -- Financial Terms
  allocation_amount DECIMAL(15,2) NOT NULL,
  qlici_rate DECIMAL(5,4), -- e.g., 0.0200 for 2%
  leverage_structure VARCHAR(50), -- 'standard', 'self-leverage', 'hybrid'
  term_years INTEGER DEFAULT 7,
  
  -- Key Dates
  issued_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  sponsor_response_deadline TIMESTAMPTZ,
  expected_closing_date DATE,
  
  -- Conditions
  conditions JSONB DEFAULT '[]',
  -- Expected structure: [{"description": "Phase I ESA complete", "status": "pending"}]
  
  -- Special Terms
  special_terms TEXT,
  cde_requirements JSONB DEFAULT '{}',
  
  -- Document Reference
  document_id UUID REFERENCES documents(id),
  document_url TEXT,
  
  -- Response Tracking
  sponsor_response_at TIMESTAMPTZ,
  sponsor_response_notes TEXT,
  counter_terms JSONB, -- If sponsor countered
  
  -- Workflow
  issued_by UUID REFERENCES users(id),
  withdrawn_by UUID REFERENCES users(id),
  withdrawn_at TIMESTAMPTZ,
  withdrawn_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_allocation CHECK (allocation_amount > 0),
  CONSTRAINT valid_term CHECK (term_years > 0 AND term_years <= 10)
);

-- -----------------------------------------------------------------------------
-- 4. LOI HISTORY TABLE (state transitions)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS loi_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loi_id UUID NOT NULL REFERENCES letters_of_intent(id) ON DELETE CASCADE,
  from_status loi_status,
  to_status loi_status NOT NULL,
  changed_by UUID REFERENCES users(id),
  change_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 5. COMMITMENTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  loi_id UUID REFERENCES letters_of_intent(id), -- Links to accepted LOI
  investor_id UUID NOT NULL REFERENCES investors(id),
  cde_id UUID REFERENCES cdes(id), -- For NMTC, the CDE involved
  sponsor_id UUID NOT NULL REFERENCES users(id),
  
  -- Commitment Details
  commitment_number VARCHAR(50) UNIQUE, -- e.g., "CMT-2025-001234"
  status commitment_status NOT NULL DEFAULT 'draft',
  
  -- Financial Terms
  investment_amount DECIMAL(15,2) NOT NULL,
  credit_type VARCHAR(20) NOT NULL, -- 'NMTC', 'HTC', 'LIHTC', 'OZ'
  credit_rate DECIMAL(5,4), -- e.g., 0.3900 for 39%
  expected_credits DECIMAL(15,2),
  
  -- Pricing
  pricing_cents_per_credit DECIMAL(8,4), -- e.g., 0.75 for 75 cents
  net_benefit_to_project DECIMAL(15,2),
  
  -- Key Dates
  issued_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  response_deadline TIMESTAMPTZ,
  target_closing_date DATE,
  
  -- Acceptance Tracking
  sponsor_accepted_at TIMESTAMPTZ,
  sponsor_accepted_by UUID REFERENCES users(id),
  cde_accepted_at TIMESTAMPTZ,
  cde_accepted_by UUID REFERENCES users(id),
  all_accepted_at TIMESTAMPTZ,
  
  -- Conditions
  conditions JSONB DEFAULT '[]',
  investor_requirements JSONB DEFAULT '{}',
  
  -- Special Terms
  special_terms TEXT,
  cra_eligible BOOLEAN DEFAULT false,
  
  -- Document Reference
  document_id UUID REFERENCES documents(id),
  document_url TEXT,
  
  -- Workflow
  issued_by UUID REFERENCES users(id),
  withdrawn_by UUID REFERENCES users(id),
  withdrawn_at TIMESTAMPTZ,
  withdrawn_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_investment CHECK (investment_amount > 0)
);

-- -----------------------------------------------------------------------------
-- 6. COMMITMENT HISTORY TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS commitment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id UUID NOT NULL REFERENCES commitments(id) ON DELETE CASCADE,
  from_status commitment_status,
  to_status commitment_status NOT NULL,
  changed_by UUID REFERENCES users(id),
  change_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 7. DEAL STATUS EXTENSION (add new statuses)
-- -----------------------------------------------------------------------------
-- Note: This assumes deals table has a status column
-- We're adding support for these statuses in application logic:
-- 'seeking_allocation' -> LOI flow
-- 'seeking_capital' -> After LOI accepted, before commitment
-- 'committed' -> After commitment accepted
-- 'closing' -> In closing room

-- -----------------------------------------------------------------------------
-- 8. INDEXES
-- -----------------------------------------------------------------------------

-- LOI indexes
CREATE INDEX IF NOT EXISTS idx_loi_deal ON letters_of_intent(deal_id);
CREATE INDEX IF NOT EXISTS idx_loi_cde ON letters_of_intent(cde_id);
CREATE INDEX IF NOT EXISTS idx_loi_sponsor ON letters_of_intent(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_loi_status ON letters_of_intent(status);
CREATE INDEX IF NOT EXISTS idx_loi_expires ON letters_of_intent(expires_at) WHERE status IN ('issued', 'pending_sponsor');
CREATE INDEX IF NOT EXISTS idx_loi_number ON letters_of_intent(loi_number);

-- LOI history indexes
CREATE INDEX IF NOT EXISTS idx_loi_history_loi ON loi_history(loi_id);
CREATE INDEX IF NOT EXISTS idx_loi_history_created ON loi_history(created_at);

-- Commitment indexes
CREATE INDEX IF NOT EXISTS idx_commitment_deal ON commitments(deal_id);
CREATE INDEX IF NOT EXISTS idx_commitment_loi ON commitments(loi_id);
CREATE INDEX IF NOT EXISTS idx_commitment_investor ON commitments(investor_id);
CREATE INDEX IF NOT EXISTS idx_commitment_cde ON commitments(cde_id);
CREATE INDEX IF NOT EXISTS idx_commitment_status ON commitments(status);
CREATE INDEX IF NOT EXISTS idx_commitment_expires ON commitments(expires_at) WHERE status IN ('issued', 'pending_sponsor', 'pending_cde');
CREATE INDEX IF NOT EXISTS idx_commitment_number ON commitments(commitment_number);

-- Commitment history indexes
CREATE INDEX IF NOT EXISTS idx_commitment_history_commitment ON commitment_history(commitment_id);
CREATE INDEX IF NOT EXISTS idx_commitment_history_created ON commitment_history(created_at);

-- -----------------------------------------------------------------------------
-- 9. TRIGGERS
-- -----------------------------------------------------------------------------

-- Auto-update updated_at for LOI
CREATE OR REPLACE FUNCTION update_loi_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_loi_updated_at
  BEFORE UPDATE ON letters_of_intent
  FOR EACH ROW
  EXECUTE FUNCTION update_loi_updated_at();

-- Auto-update updated_at for Commitment
CREATE OR REPLACE FUNCTION update_commitment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_commitment_updated_at
  BEFORE UPDATE ON commitments
  FOR EACH ROW
  EXECUTE FUNCTION update_commitment_updated_at();

-- Track LOI status changes
CREATE OR REPLACE FUNCTION track_loi_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO loi_history (loi_id, from_status, to_status, metadata)
    VALUES (NEW.id, OLD.status, NEW.status, jsonb_build_object(
      'allocation_amount', NEW.allocation_amount,
      'expires_at', NEW.expires_at
    ));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_loi_status_history
  AFTER UPDATE ON letters_of_intent
  FOR EACH ROW
  EXECUTE FUNCTION track_loi_status_change();

-- Track Commitment status changes
CREATE OR REPLACE FUNCTION track_commitment_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO commitment_history (commitment_id, from_status, to_status, metadata)
    VALUES (NEW.id, OLD.status, NEW.status, jsonb_build_object(
      'investment_amount', NEW.investment_amount,
      'expires_at', NEW.expires_at
    ));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_commitment_status_history
  AFTER UPDATE ON commitments
  FOR EACH ROW
  EXECUTE FUNCTION track_commitment_status_change();

-- Generate LOI number on insert
CREATE OR REPLACE FUNCTION generate_loi_number()
RETURNS TRIGGER AS $$
DECLARE
  seq_num INTEGER;
BEGIN
  IF NEW.loi_number IS NULL THEN
    SELECT COALESCE(MAX(CAST(SUBSTRING(loi_number FROM 10) AS INTEGER)), 0) + 1
    INTO seq_num
    FROM letters_of_intent
    WHERE loi_number LIKE 'LOI-' || TO_CHAR(NOW(), 'YYYY') || '-%';
    
    NEW.loi_number := 'LOI-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(seq_num::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_loi_number
  BEFORE INSERT ON letters_of_intent
  FOR EACH ROW
  EXECUTE FUNCTION generate_loi_number();

-- Generate Commitment number on insert
CREATE OR REPLACE FUNCTION generate_commitment_number()
RETURNS TRIGGER AS $$
DECLARE
  seq_num INTEGER;
BEGIN
  IF NEW.commitment_number IS NULL THEN
    SELECT COALESCE(MAX(CAST(SUBSTRING(commitment_number FROM 10) AS INTEGER)), 0) + 1
    INTO seq_num
    FROM commitments
    WHERE commitment_number LIKE 'CMT-' || TO_CHAR(NOW(), 'YYYY') || '-%';
    
    NEW.commitment_number := 'CMT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(seq_num::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_commitment_number
  BEFORE INSERT ON commitments
  FOR EACH ROW
  EXECUTE FUNCTION generate_commitment_number();

-- -----------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
ALTER TABLE letters_of_intent ENABLE ROW LEVEL SECURITY;
ALTER TABLE loi_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitment_history ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service full access on loi"
  ON letters_of_intent FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service full access on loi_history"
  ON loi_history FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service full access on commitments"
  ON commitments FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service full access on commitment_history"
  ON commitment_history FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Authenticated read access (filtered by role in application)
CREATE POLICY "Authenticated can read loi"
  ON letters_of_intent FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can read loi_history"
  ON loi_history FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can read commitments"
  ON commitments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can read commitment_history"
  ON commitment_history FOR SELECT TO authenticated
  USING (true);

-- -----------------------------------------------------------------------------
-- 11. VIEWS
-- -----------------------------------------------------------------------------

-- Active LOIs view
CREATE OR REPLACE VIEW active_lois AS
SELECT 
  l.id,
  l.loi_number,
  l.deal_id,
  d.project_name,
  l.cde_id,
  c.name as cde_name,
  l.sponsor_id,
  l.status,
  l.allocation_amount,
  l.issued_at,
  l.expires_at,
  l.sponsor_response_deadline,
  CASE 
    WHEN l.expires_at < NOW() AND l.status IN ('issued', 'pending_sponsor') THEN true
    ELSE false
  END as is_expired,
  EXTRACT(DAY FROM l.expires_at - NOW()) as days_until_expiry
FROM letters_of_intent l
JOIN deals d ON l.deal_id = d.id
JOIN cdes c ON l.cde_id = c.id
WHERE l.status NOT IN ('withdrawn', 'superseded')
ORDER BY l.created_at DESC;

-- Active Commitments view
CREATE OR REPLACE VIEW active_commitments AS
SELECT 
  c.id,
  c.commitment_number,
  c.deal_id,
  d.project_name,
  c.investor_id,
  i.name as investor_name,
  c.cde_id,
  cde.name as cde_name,
  c.status,
  c.investment_amount,
  c.credit_type,
  c.issued_at,
  c.expires_at,
  c.sponsor_accepted_at,
  c.cde_accepted_at,
  c.all_accepted_at,
  CASE 
    WHEN c.expires_at < NOW() AND c.status IN ('issued', 'pending_sponsor', 'pending_cde') THEN true
    ELSE false
  END as is_expired
FROM commitments c
JOIN deals d ON c.deal_id = d.id
JOIN investors i ON c.investor_id = i.id
LEFT JOIN cdes cde ON c.cde_id = cde.id
WHERE c.status NOT IN ('withdrawn', 'superseded')
ORDER BY c.created_at DESC;

-- Deal pipeline status view
CREATE OR REPLACE VIEW deal_transaction_status AS
SELECT 
  d.id as deal_id,
  d.project_name,
  d.deal_status,
  -- LOI Status
  (SELECT COUNT(*) FROM letters_of_intent WHERE deal_id = d.id AND status = 'sponsor_accepted') as accepted_lois,
  (SELECT COUNT(*) FROM letters_of_intent WHERE deal_id = d.id AND status IN ('issued', 'pending_sponsor')) as pending_lois,
  -- Commitment Status
  (SELECT COUNT(*) FROM commitments WHERE deal_id = d.id AND status = 'all_accepted') as accepted_commitments,
  (SELECT COUNT(*) FROM commitments WHERE deal_id = d.id AND status IN ('issued', 'pending_sponsor', 'pending_cde')) as pending_commitments,
  -- Latest LOI
  (SELECT loi_number FROM letters_of_intent WHERE deal_id = d.id ORDER BY created_at DESC LIMIT 1) as latest_loi,
  -- Latest Commitment
  (SELECT commitment_number FROM commitments WHERE deal_id = d.id ORDER BY created_at DESC LIMIT 1) as latest_commitment
FROM deals d;

-- -----------------------------------------------------------------------------
-- 12. FUNCTIONS
-- -----------------------------------------------------------------------------

-- Check if deal can receive LOI
CREATE OR REPLACE FUNCTION can_issue_loi(p_deal_id UUID, p_cde_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  existing_active_loi INTEGER;
BEGIN
  -- Check for existing active LOI from same CDE
  SELECT COUNT(*) INTO existing_active_loi
  FROM letters_of_intent
  WHERE deal_id = p_deal_id 
    AND cde_id = p_cde_id
    AND status IN ('issued', 'pending_sponsor', 'sponsor_accepted');
  
  RETURN existing_active_loi = 0;
END;
$$ LANGUAGE plpgsql;

-- Check if deal can receive commitment
CREATE OR REPLACE FUNCTION can_issue_commitment(p_deal_id UUID, p_investor_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_accepted_loi BOOLEAN;
  existing_active_commitment INTEGER;
BEGIN
  -- For NMTC, need accepted LOI first
  -- For HTC/LIHTC/OZ, can go direct
  -- (Simplified: just check no duplicate active commitment)
  
  SELECT COUNT(*) INTO existing_active_commitment
  FROM commitments
  WHERE deal_id = p_deal_id 
    AND investor_id = p_investor_id
    AND status IN ('issued', 'pending_sponsor', 'pending_cde', 'all_accepted');
  
  RETURN existing_active_commitment = 0;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 13. COMMENTS
-- -----------------------------------------------------------------------------
COMMENT ON TABLE letters_of_intent IS 'CDE Letters of Intent for NMTC allocation';
COMMENT ON TABLE commitments IS 'Investor commitments for tax credit investment';
COMMENT ON COLUMN letters_of_intent.qlici_rate IS 'Qualified Low-Income Community Investment interest rate';
COMMENT ON COLUMN commitments.pricing_cents_per_credit IS 'Price per dollar of tax credit (e.g., 0.75 = 75 cents)';
COMMENT ON COLUMN commitments.cra_eligible IS 'Whether investment qualifies for CRA credit';
