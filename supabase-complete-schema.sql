-- ================================================
-- LIFT - COMPLETE DATABASE SCHEMA
-- ================================================
-- Run this on a fresh Supabase database
-- This creates everything needed for the app
-- ================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ================================================
-- ENUMS
-- ================================================

CREATE TYPE category_type AS ENUM (
  'science-innovation',
  'environment',
  'community',
  'kindness',
  'health-recovery',
  'education',
  'global-progress',
  'technology'
);

CREATE TYPE article_source AS ENUM (
  'newsapi',
  'guardian',
  'nyt',
  'jina',
  'web'
);

CREATE TYPE notification_frequency AS ENUM (
  'daily',
  'weekly',
  'never'
);

-- ================================================
-- TABLES
-- ================================================

-- User Preferences Table
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL,
  
  -- Category preferences
  selected_categories category_type[] DEFAULT ARRAY[
    'science-innovation', 
    'environment', 
    'community', 
    'kindness', 
    'health-recovery', 
    'education', 
    'global-progress', 
    'technology'
  ]::category_type[],
  excluded_sources TEXT[] DEFAULT '{}',
  
  -- Display preferences
  articles_per_page INTEGER DEFAULT 20,
  dark_mode BOOLEAN DEFAULT FALSE,
  
  -- Notification settings
  notifications_enabled BOOLEAN DEFAULT FALSE,
  notification_frequency notification_frequency DEFAULT 'never',
  notification_time TIME DEFAULT '09:00:00',
  
  -- Feed settings
  refresh_interval INTEGER DEFAULT 30,
  show_images BOOLEAN DEFAULT TRUE,
  show_positivity_score BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Article Likes Table
CREATE TABLE article_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  article_id TEXT NOT NULL,
  user_id TEXT,
  session_id TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_article_like UNIQUE(article_id, user_id),
  CONSTRAINT unique_session_article_like UNIQUE(article_id, session_id),
  CONSTRAINT check_user_or_session CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

-- Categories Configuration Table
CREATE TABLE categories_config (
  id category_type PRIMARY KEY,
  label TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  keywords TEXT[] DEFAULT '{}',
  description TEXT,
  
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- INDEXES
-- ================================================

-- User preferences indexes
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Article likes indexes
CREATE INDEX idx_article_likes_article_id ON article_likes(article_id);
CREATE INDEX idx_article_likes_user_id ON article_likes(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_article_likes_session_id ON article_likes(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_article_likes_created_at ON article_likes(created_at DESC);

-- ================================================
-- FUNCTIONS
-- ================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's liked articles
CREATE OR REPLACE FUNCTION get_user_liked_articles(
  p_user_id TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
)
RETURNS TABLE(article_id TEXT, created_at TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.article_id,
    al.created_at
  FROM article_likes al
  WHERE 
    (p_user_id IS NOT NULL AND al.user_id = p_user_id) OR
    (p_session_id IS NOT NULL AND al.session_id = p_session_id)
  ORDER BY al.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user liked an article
CREATE OR REPLACE FUNCTION has_user_liked_article(
  p_article_id TEXT,
  p_user_id TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  liked BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM article_likes
    WHERE article_id = p_article_id
    AND (
      (p_user_id IS NOT NULL AND user_id = p_user_id) OR
      (p_session_id IS NOT NULL AND session_id = p_session_id)
    )
  ) INTO liked;
  
  RETURN liked;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- TRIGGERS
-- ================================================

-- Update updated_at triggers
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_config_updated_at
  BEFORE UPDATE ON categories_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

-- Enable RLS on all tables
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories_config ENABLE ROW LEVEL SECURITY;

-- User preferences: Allow all operations for simplicity with session IDs
CREATE POLICY "Anyone can manage preferences"
  ON user_preferences FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- Article likes: Anyone can manage
CREATE POLICY "Anyone can view likes"
  ON article_likes FOR SELECT
  USING (TRUE);

CREATE POLICY "Anyone can insert likes"
  ON article_likes FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Anyone can delete likes"
  ON article_likes FOR DELETE
  USING (TRUE);

-- Categories config: Public read
CREATE POLICY "Categories are viewable by everyone"
  ON categories_config FOR SELECT
  USING (TRUE);

-- ================================================
-- SEED DATA
-- ================================================

-- Insert default categories
INSERT INTO categories_config (id, label, icon, color, keywords, description, display_order) VALUES
  ('science-innovation', 'science & innovation', '🔬', '#3B82F6', 
    ARRAY['science', 'research', 'study', 'discovery', 'breakthrough', 'scientists', 'university', 'laboratory'], 
    'scientific breakthroughs and research', 1),
  ('environment', 'environment', '🌱', '#10B981', 
    ARRAY['climate', 'environment', 'renewable', 'solar', 'wind', 'sustainable', 'conservation', 'wildlife', 'ocean', 'forest'], 
    'environmental progress and conservation', 2),
  ('community', 'community', '🤝', '#8B5CF6', 
    ARRAY['community', 'neighborhood', 'local', 'volunteer', 'initiative', 'together', 'grassroots'], 
    'community initiatives and local impact', 3),
  ('kindness', 'kindness', '💝', '#EC4899', 
    ARRAY['kindness', 'generosity', 'donation', 'charity', 'helped', 'rescued', 'saved', 'compassion'], 
    'acts of kindness and generosity', 4),
  ('health-recovery', 'health & recovery', '⚕️', '#EF4444', 
    ARRAY['health', 'medical', 'treatment', 'therapy', 'recovery', 'cure', 'patient', 'hospital'], 
    'medical advances and recovery stories', 5),
  ('education', 'education', '📚', '#F59E0B', 
    ARRAY['education', 'school', 'student', 'teacher', 'learning', 'scholarship', 'university', 'literacy'], 
    'educational achievements', 6),
  ('global-progress', 'global progress', '🌍', '#06B6D4', 
    ARRAY['global', 'international', 'world', 'nations', 'progress', 'development', 'poverty', 'peace'], 
    'global development and cooperation', 7),
  ('technology', 'technology', '💻', '#A855F7', 
    ARRAY['technology', 'innovation', 'ai', 'artificial intelligence', 'startup', 'app', 'digital', 'software'], 
    'innovative technology and digital solutions', 8)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- VIEWS
-- ================================================

-- View for article like stats
CREATE OR REPLACE VIEW article_like_stats AS
SELECT
  article_id,
  COUNT(*) as like_count,
  COUNT(DISTINCT user_id) as unique_users,
  MAX(created_at) as last_liked_at
FROM article_likes
GROUP BY article_id;

-- ================================================
-- COMMENTS
-- ================================================

COMMENT ON TABLE user_preferences IS 'User preferences for personalized news feeds';
COMMENT ON TABLE article_likes IS 'User likes for articles';
COMMENT ON TABLE categories_config IS 'Configuration for article categories';
COMMENT ON FUNCTION get_user_liked_articles(TEXT, TEXT) IS 'Returns all articles liked by a user or session';
COMMENT ON FUNCTION has_user_liked_article(TEXT, TEXT, TEXT) IS 'Check if a user or session has liked a specific article';

-- ================================================
-- COMPLETION
-- ================================================

DO $$
BEGIN
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'LIFT DATABASE SCHEMA CREATED SUCCESSFULLY!';
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'Created:';
  RAISE NOTICE '  - 3 tables (user_preferences, article_likes, categories_config)';
  RAISE NOTICE '  - 3 enums (category_type, article_source, notification_frequency)';
  RAISE NOTICE '  - 8 categories seeded';
  RAISE NOTICE '  - RLS policies enabled';
  RAISE NOTICE '  - Helper functions created';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Verify tables exist in Supabase dashboard';
  RAISE NOTICE '  2. Test the app - settings should now save properly';
  RAISE NOTICE '  3. Check that categories filter works';
  RAISE NOTICE '==================================================';
END $$;