-- ============================================
-- tCredex Test Data Cleanup Script
-- Run this in Supabase SQL Editor to reset test data
-- ============================================

-- Step 1: Show current test users (review before deleting)
SELECT
  u.id,
  u.email,
  u.name,
  u.clerk_id,
  u.role,
  o.name as org_name,
  u.created_at
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
ORDER BY u.created_at DESC;

-- Step 2: Delete test users by email pattern (UNCOMMENT to run)
-- DELETE FROM users WHERE email LIKE '%@your-test-domain.com';

-- Step 3: Delete specific user by email (UNCOMMENT and edit)
-- DELETE FROM users WHERE email = 'your-test-email@example.com';

-- Step 4: Delete orphaned organizations (no users)
-- DELETE FROM organizations
-- WHERE id NOT IN (SELECT DISTINCT organization_id FROM users WHERE organization_id IS NOT NULL);

-- Step 5: Clean up related records for deleted orgs
-- DELETE FROM cdes WHERE organization_id NOT IN (SELECT id FROM organizations);
-- DELETE FROM investors WHERE organization_id NOT IN (SELECT id FROM organizations);
-- DELETE FROM deals WHERE organization_id NOT IN (SELECT id FROM organizations);

-- ============================================
-- FULL RESET (DANGER - deletes ALL user data)
-- Only use for complete test environment reset
-- ============================================

-- TRUNCATE users CASCADE;
-- TRUNCATE organizations CASCADE;
-- TRUNCATE cdes CASCADE;
-- TRUNCATE investors CASCADE;

-- ============================================
-- After cleanup, you can reuse your email in Clerk
-- 1. Delete user in Clerk Dashboard
-- 2. Run cleanup SQL above
-- 3. Sign up fresh with same email
-- ============================================
