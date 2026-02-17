-- Check recent deals added in last 24 hours and their coordinates
SELECT 
  id,
  project_name,
  sponsor_name,
  programs,
  status,
  visible,
  latitude,
  longitude,
  created_at
FROM deals
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- If you want to hide these deals from the map temporarily:
-- UPDATE deals 
-- SET visible = false 
-- WHERE created_at >= NOW() - INTERVAL '24 hours';

-- Or if you want to remove their coordinates so they don't show as pins:
-- UPDATE deals 
-- SET latitude = NULL, longitude = NULL 
-- WHERE created_at >= NOW() - INTERVAL '24 hours';

-- Or if you want to change their status so they don't appear in marketplace:
-- UPDATE deals 
-- SET status = 'draft'
-- WHERE created_at >= NOW() - INTERVAL '24 hours';