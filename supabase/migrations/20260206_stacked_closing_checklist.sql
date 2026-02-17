-- Stacked NMTC + HTC + State Credits Closing Checklist (Last Hotel example)
-- Adds template entries under program_type = 'NMTC_HTC_STATE'

DO $$ BEGIN
  CREATE TYPE program_combo AS ENUM('NMTC_HTC_STATE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Insert checklist template rows
INSERT INTO closing_checklist_templates (program_type, category, item_name, description, required, sort_order) VALUES
('NMTC_HTC_STATE','Project Overview','Project Overview','Summary of project, address, deal number, closing date', true, 1),

('NMTC_HTC_STATE','Transaction Parties','Investment Fund','Investment fund entity details', true, 10),
('NMTC_HTC_STATE','Transaction Parties','Direct Lender','Direct lender entity details', true, 11),
('NMTC_HTC_STATE','Transaction Parties','Bridge Lender','Bridge lender entity details', true, 12),
('NMTC_HTC_STATE','Transaction Parties','USB Allocatee','Allocatee entity details', true, 13),
('NMTC_HTC_STATE','Transaction Parties','USB Sub-CDE','Sub-CDE entity details', true, 14),
('NMTC_HTC_STATE','Transaction Parties','SLDC Allocatee','Allocatee entity details', true, 15),
('NMTC_HTC_STATE','Transaction Parties','SLDC Sub-CDE','Sub-CDE entity details', true, 16),
('NMTC_HTC_STATE','Transaction Parties','QALICB / Master Landlord','QALICB entity details', true, 17),
('NMTC_HTC_STATE','Transaction Parties','Master Tenant','Master tenant entity details', true, 18),
('NMTC_HTC_STATE','Transaction Parties','Managing Member','Managing member entity details', true, 19),
('NMTC_HTC_STATE','Transaction Parties','Developer','Developer entity details', true, 20),
('NMTC_HTC_STATE','Transaction Parties','Food & Beverage Sublessee','F&B sublessee entity details', true, 21),
('NMTC_HTC_STATE','Transaction Parties','Hotel Manager','Hotel manager entity details', true, 22),

('NMTC_HTC_STATE','Org Docs - Investment Fund','Articles / Certificate of Organization','Fund articles/certificate', true, 30),
('NMTC_HTC_STATE','Org Docs - Investment Fund','Operating Agreement','Fund operating agreement', true, 31),
('NMTC_HTC_STATE','Org Docs - Investment Fund','Certificate of Good Standing','Fund good standing certificate', true, 32),
('NMTC_HTC_STATE','Org Docs - Investment Fund','EIN','Fund EIN confirmation', true, 33),

('NMTC_HTC_STATE','Org Docs - USB Sub-CDE','Managing Member Certificate','Sub-CDE managing member certificate', true, 40),
('NMTC_HTC_STATE','Org Docs - USB Sub-CDE','Articles of Organization','Sub-CDE articles', true, 41),
('NMTC_HTC_STATE','Org Docs - USB Sub-CDE','Operating Agreement (A&R)','Sub-CDE amended & restated OA', true, 42),
('NMTC_HTC_STATE','Org Docs - USB Sub-CDE','Written Member Consents','Sub-CDE member consents', true, 43),
('NMTC_HTC_STATE','Org Docs - USB Sub-CDE','EIN','Sub-CDE EIN confirmation', true, 44),

('NMTC_HTC_STATE','Org Docs - USB Allocatee','Certificate of Formation','Allocatee formation certificate', true, 50),
('NMTC_HTC_STATE','Org Docs - USB Allocatee','Operating Agreement','Allocatee operating agreement', true, 51),
('NMTC_HTC_STATE','Org Docs - USB Allocatee','Member Resolutions','Allocatee member resolutions', true, 52),
('NMTC_HTC_STATE','Org Docs - USB Allocatee','EIN','Allocatee EIN confirmation', true, 53),

('NMTC_HTC_STATE','Org Docs - SLDC Sub-CDE','Articles of Organization','SLDC Sub-CDE articles', true, 60),
('NMTC_HTC_STATE','Org Docs - SLDC Sub-CDE','Operating Agreement (A&R)','SLDC Sub-CDE amended & restated OA', true, 61),
('NMTC_HTC_STATE','Org Docs - SLDC Sub-CDE','Manager Certificate','SLDC Sub-CDE manager certificate', true, 62),
('NMTC_HTC_STATE','Org Docs - SLDC Sub-CDE','EIN','SLDC Sub-CDE EIN confirmation', true, 63),

('NMTC_HTC_STATE','Org Docs - SLDC Allocatee','Articles of Incorporation','SLDC Allocatee articles', true, 70),
('NMTC_HTC_STATE','Org Docs - SLDC Allocatee','Bylaws','SLDC Allocatee bylaws', true, 71),
('NMTC_HTC_STATE','Org Docs - SLDC Allocatee','Board Resolution','SLDC Allocatee board resolution', true, 72),
('NMTC_HTC_STATE','Org Docs - SLDC Allocatee','EIN','SLDC Allocatee EIN confirmation', true, 73),

('NMTC_HTC_STATE','NMTC Due Diligence','NMTC Allocation Agreements','Allocation agreements', true, 80),
('NMTC_HTC_STATE','NMTC Due Diligence','CDE Certifications','CDE certifications', true, 81),
('NMTC_HTC_STATE','NMTC Due Diligence','Allocation Tracking Transfers','Allocation transfer tracking', true, 82),
('NMTC_HTC_STATE','NMTC Due Diligence','Community Benefits Agreement','Community benefits agreement', true, 83),
('NMTC_HTC_STATE','NMTC Due Diligence','Multi-CDE Reporting Agreement','Reporting agreement among CDEs', true, 84),
('NMTC_HTC_STATE','NMTC Due Diligence','CDFI Fee Disclosure','CDFI fee disclosure', true, 85),
('NMTC_HTC_STATE','NMTC Due Diligence','Debarment Certificates','Debarment certificates', true, 86),
('NMTC_HTC_STATE','NMTC Due Diligence','CDFI Geocoder Map','CDFI geocoder tract map', true, 87),

('NMTC_HTC_STATE','HTC Applications','Part 1 (Federal)','Federal HTC Part 1', true, 90),
('NMTC_HTC_STATE','HTC Applications','Part 1A (State)','State HTC Part 1A', true, 91),
('NMTC_HTC_STATE','HTC Applications','Part 2 (Federal)','Federal HTC Part 2', true, 92),
('NMTC_HTC_STATE','HTC Applications','Amendments','HTC application amendments', true, 93),

('NMTC_HTC_STATE','HTC Approvals','National Register Listing','National Register listing evidence', true, 100),
('NMTC_HTC_STATE','HTC Approvals','SHPO Approvals','State Historic Preservation Office approvals', true, 101),
('NMTC_HTC_STATE','HTC Approvals','Contractor Compliance Certificate','Contractor compliance certificate', true, 102),
('NMTC_HTC_STATE','HTC Approvals','Architect Compliance Certificate','Architect compliance certificate', true, 103),
('NMTC_HTC_STATE','HTC Approvals','HTC Consultant Certificate','HTC consultant certificate', true, 104),

('NMTC_HTC_STATE','State HTC','HTC Purchase & Sale Agreement','State HTC purchase & sale agreement', true, 110),

('NMTC_HTC_STATE','Closing Items','Flow of Funds','Flow of funds statement', true, 120),
('NMTC_HTC_STATE','Closing Items','Evidence of Prior Incurred Costs','Evidence of costs incurred to date', true, 121),
('NMTC_HTC_STATE','Closing Items','Title Invoice','Title invoice', true, 122),

('NMTC_HTC_STATE','Post-Closing','Loan Servicing Spreadsheet','Loan servicing spreadsheet', true, 130),
('NMTC_HTC_STATE','Post-Closing','QEI Designation Notices','QEI designation notices', true, 131),
('NMTC_HTC_STATE','Post-Closing','IRS Form 8874-A','IRS Form 8874-A', true, 132),
('NMTC_HTC_STATE','Post-Closing','Recorded Documents','Recorded closing documents', true, 133),
('NMTC_HTC_STATE','Post-Closing','Final Title Policies','Final title policies', true, 134)
ON CONFLICT (program_type, category, item_name) DO NOTHING;
