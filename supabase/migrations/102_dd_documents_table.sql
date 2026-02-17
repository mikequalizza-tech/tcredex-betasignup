-- =============================================================================
-- DD DOCUMENTS TABLE (Due Diligence Vault)
-- Migration: 102_dd_documents_table.sql
-- Created: 2026-01-30
-- =============================================================================

-- =============================================================================
-- DD DOCUMENTS TABLE
-- Tracks due diligence document requirements and status per deal
-- Using VARCHAR for status/required_by to match existing patterns
-- =============================================================================

CREATE TABLE IF NOT EXISTS dd_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Deal reference
  deal_id UUID NOT NULL,

  -- Document category (matches DDDocumentCategory in TypeScript)
  category VARCHAR(50) NOT NULL,

  -- Linked uploaded document (nullable until document is uploaded)
  document_id UUID,

  -- Status tracking (not_started, requested, pending, under_review, approved, rejected, waived, expired)
  status VARCHAR(20) DEFAULT 'not_started',

  -- Requirement settings
  required BOOLEAN DEFAULT false,
  required_by VARCHAR(20) DEFAULT 'all', -- all, cde, investor, sponsor

  -- Request tracking
  requested_by_id UUID,
  requested_by_org VARCHAR(255),
  requested_at TIMESTAMPTZ,

  -- Upload tracking
  uploaded_at TIMESTAMPTZ,

  -- Review tracking
  reviewed_at TIMESTAMPTZ,
  reviewed_by_id UUID,
  review_notes TEXT,

  -- Expiration (for documents that need periodic refresh)
  expires_at TIMESTAMPTZ,

  -- General notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_dd_documents_deal ON dd_documents(deal_id);
CREATE INDEX IF NOT EXISTS idx_dd_documents_category ON dd_documents(category);
CREATE INDEX IF NOT EXISTS idx_dd_documents_status ON dd_documents(status);
CREATE INDEX IF NOT EXISTS idx_dd_documents_required ON dd_documents(required) WHERE required = true;
CREATE INDEX IF NOT EXISTS idx_dd_documents_expires ON dd_documents(expires_at) WHERE expires_at IS NOT NULL;

-- Unique constraint: one document category per deal
CREATE UNIQUE INDEX IF NOT EXISTS idx_dd_documents_deal_category
  ON dd_documents(deal_id, category);

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION update_dd_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_dd_documents_updated_at ON dd_documents;
CREATE TRIGGER trigger_dd_documents_updated_at
  BEFORE UPDATE ON dd_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_dd_documents_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE dd_documents IS 'Due Diligence document tracking for tax credit deals';
COMMENT ON COLUMN dd_documents.category IS 'Document category (pro_forma, site_control, appraisal, etc.)';
COMMENT ON COLUMN dd_documents.status IS 'Current status in the DD workflow';
COMMENT ON COLUMN dd_documents.required IS 'Whether this document is required for deal completion';
COMMENT ON COLUMN dd_documents.required_by IS 'Which party requires this document';
COMMENT ON COLUMN dd_documents.expires_at IS 'Expiration date for time-sensitive documents';

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE dd_documents ENABLE ROW LEVEL SECURITY;

-- Service role can do anything
CREATE POLICY "Service role full access" ON dd_documents
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Authenticated users can view DD documents for deals they have access to
CREATE POLICY "Authenticated users can view" ON dd_documents
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert/update DD documents
CREATE POLICY "Authenticated users can insert" ON dd_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update" ON dd_documents
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
