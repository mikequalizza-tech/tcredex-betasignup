-- Fix deal visibility for XS Tennis and other deals
-- This ensures deals show up on the home page and marketplace

-- First, let's see what deals exist and their visibility status
SELECT 
  id,
  project_name,
  sponsor_name,
  programs,
  status,
  visible,
  created_at
FROM deals
ORDER BY created_at DESC;

-- Update XS Tennis deals to be visible and available
UPDATE deals 
SET 
  visible = true,
  status = 'available'
WHERE sponsor_name ILIKE '%XS Tennis%'
  OR project_name ILIKE '%XS Tennis%';

-- Update Community Health Partners deals to be visible and available  
UPDATE deals 
SET 
  visible = true,
  status = 'available'
WHERE sponsor_name ILIKE '%Community Health%'
  OR project_name ILIKE '%Community Health%';

-- Make sure all deals with valid data are visible
UPDATE deals 
SET visible = true
WHERE visible IS NULL 
  OR visible = false
  AND project_name IS NOT NULL 
  AND sponsor_name IS NOT NULL
  AND programs IS NOT NULL
  AND array_length(programs, 1) > 0;

-- Verify the changes
SELECT 
  id,
  project_name,
  sponsor_name,
  programs,
  status,
  visible,
  created_at
FROM deals
WHERE visible = true
ORDER BY created_at DESC;