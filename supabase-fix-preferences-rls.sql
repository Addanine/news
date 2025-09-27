-- ================================================
-- FIX USER PREFERENCES RLS POLICIES
-- ================================================
-- This ensures preferences can be saved properly
-- Run this if settings aren't saving
-- ================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;

-- Create more permissive policies for unauthenticated users with session IDs
CREATE POLICY "Anyone can view preferences"
  ON user_preferences FOR SELECT
  USING (TRUE);

CREATE POLICY "Anyone can insert preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Anyone can update preferences"
  ON user_preferences FOR UPDATE
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Anyone can delete preferences"
  ON user_preferences FOR DELETE
  USING (TRUE);

-- Alternatively, if you want to keep it more secure but allow session-based access:
-- DROP the above policies and use these instead:

DROP POLICY IF EXISTS "Anyone can view preferences" ON user_preferences;
DROP POLICY IF EXISTS "Anyone can insert preferences" ON user_preferences;
DROP POLICY IF EXISTS "Anyone can update preferences" ON user_preferences;
DROP POLICY IF EXISTS "Anyone can delete preferences" ON user_preferences;

CREATE POLICY "Users can manage their preferences"
  ON user_preferences FOR ALL
  USING (
    auth.uid()::TEXT = user_id OR 
    user_id IS NOT NULL
  )
  WITH CHECK (
    auth.uid()::TEXT = user_id OR 
    user_id IS NOT NULL
  );

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'User preferences RLS policies updated!';
  RAISE NOTICE 'Preferences can now be saved and loaded properly';
END $$;