-- ================================================
-- POSITIVE NEWS AGGREGATOR - SUPABASE SCHEMA
-- ================================================
-- This schema includes all tables, indexes, RLS policies,
-- and functions needed for the platform
-- ================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

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
  'innovation'
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

-- Articles Table
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Content fields
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  url TEXT NOT NULL UNIQUE,
  image_url TEXT,
  
  -- Metadata
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source article_source NOT NULL,
  source_name TEXT NOT NULL,
  source_domain TEXT NOT NULL,
  author TEXT,
  
  -- Categorization
  categories category_type[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  positivity_score DECIMAL(3, 2) CHECK (positivity_score >= 0 AND positivity_score <= 1),
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  -- Flags
  is_featured BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Preferences Table
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE, -- Can be session ID or auth user ID
  
  -- Category preferences
  selected_categories category_type[] DEFAULT ARRAY['science-innovation', 'environment', 'community', 'kindness', 'health-recovery', 'education', 'global-progress', 'innovation']::category_type[],
  excluded_sources TEXT[] DEFAULT '{}',
  
  -- Display preferences
  articles_per_page INTEGER DEFAULT 20,
  dark_mode BOOLEAN DEFAULT FALSE,
  
  -- Notification settings
  notifications_enabled BOOLEAN DEFAULT FALSE,
  notification_frequency notification_frequency DEFAULT 'never',
  notification_time TIME DEFAULT '09:00:00',
  
  -- Feed settings
  refresh_interval INTEGER DEFAULT 30, -- minutes
  show_images BOOLEAN DEFAULT TRUE,
  show_positivity_score BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Article Interactions Table
CREATE TABLE article_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  user_id TEXT,
  session_id TEXT,
  
  -- Interaction types
  viewed BOOLEAN DEFAULT FALSE,
  clicked BOOLEAN DEFAULT FALSE,
  shared BOOLEAN DEFAULT FALSE,
  bookmarked BOOLEAN DEFAULT FALSE,
  
  -- Feedback
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  
  -- Timestamps
  viewed_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  shared_at TIMESTAMP WITH TIME ZONE,
  bookmarked_at TIMESTAMP WITH TIME ZONE,
  rated_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one interaction record per user per article
  UNIQUE(article_id, user_id)
);

-- Bookmarks Table
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, article_id)
);

-- Search History Table
CREATE TABLE search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  session_id TEXT,
  
  query TEXT NOT NULL,
  results_count INTEGER,
  clicked_result_id UUID REFERENCES articles(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- API Cache Table
CREATE TABLE api_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key TEXT NOT NULL UNIQUE,
  
  data JSONB NOT NULL,
  source article_source NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Analytics Events Table
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  event_type TEXT NOT NULL, -- 'page_view', 'article_click', 'search', 'filter', etc.
  event_data JSONB,
  
  user_id TEXT,
  session_id TEXT,
  
  -- Request metadata
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Keyword Filters Table
CREATE TABLE keyword_filters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  keyword TEXT NOT NULL UNIQUE,
  type TEXT CHECK (type IN ('positive', 'negative')),
  weight INTEGER DEFAULT 1,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- INDEXES
-- ================================================

-- Articles indexes
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_articles_source ON articles(source);
CREATE INDEX idx_articles_categories ON articles USING GIN(categories);
CREATE INDEX idx_articles_tags ON articles USING GIN(tags);
CREATE INDEX idx_articles_positivity_score ON articles(positivity_score DESC);
CREATE INDEX idx_articles_is_featured ON articles(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_articles_url_hash ON articles(url);
CREATE INDEX idx_articles_source_domain ON articles(source_domain);

-- Full-text search indexes
CREATE INDEX idx_articles_title_search ON articles USING GIN(to_tsvector('english', title));
CREATE INDEX idx_articles_description_search ON articles USING GIN(to_tsvector('english', description));
CREATE INDEX idx_articles_content_search ON articles USING GIN(to_tsvector('english', COALESCE(content, '')));

-- Trigram indexes for fuzzy search
CREATE INDEX idx_articles_title_trgm ON articles USING GIN(title gin_trgm_ops);

-- User preferences indexes
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Article interactions indexes
CREATE INDEX idx_interactions_article_id ON article_interactions(article_id);
CREATE INDEX idx_interactions_user_id ON article_interactions(user_id);
CREATE INDEX idx_interactions_viewed_at ON article_interactions(viewed_at DESC);

-- Bookmarks indexes
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_article_id ON bookmarks(article_id);
CREATE INDEX idx_bookmarks_created_at ON bookmarks(created_at DESC);

-- Search history indexes
CREATE INDEX idx_search_history_user_id ON search_history(user_id);
CREATE INDEX idx_search_history_created_at ON search_history(created_at DESC);

-- API cache indexes
CREATE INDEX idx_api_cache_key ON api_cache(cache_key);
CREATE INDEX idx_api_cache_expires_at ON api_cache(expires_at);

-- Analytics indexes
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_user_id ON analytics_events(user_id);

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

-- Function to increment article view count
CREATE OR REPLACE FUNCTION increment_article_view_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.viewed = TRUE AND (OLD.viewed IS NULL OR OLD.viewed = FALSE) THEN
    UPDATE articles SET view_count = view_count + 1 WHERE id = NEW.article_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to increment article click count
CREATE OR REPLACE FUNCTION increment_article_click_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.clicked = TRUE AND (OLD.clicked IS NULL OR OLD.clicked = FALSE) THEN
    UPDATE articles SET click_count = click_count + 1 WHERE id = NEW.article_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to increment article share count
CREATE OR REPLACE FUNCTION increment_article_share_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.shared = TRUE AND (OLD.shared IS NULL OR OLD.shared = FALSE) THEN
    UPDATE articles SET share_count = share_count + 1 WHERE id = NEW.article_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired cache
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM api_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to search articles with full-text search
CREATE OR REPLACE FUNCTION search_articles(
  search_query TEXT,
  category_filter category_type[] DEFAULT NULL,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  url TEXT,
  image_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  source_name TEXT,
  categories category_type[],
  positivity_score DECIMAL,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.description,
    a.url,
    a.image_url,
    a.published_at,
    a.source_name,
    a.categories,
    a.positivity_score,
    ts_rank(
      to_tsvector('english', a.title || ' ' || COALESCE(a.description, '')),
      plainto_tsquery('english', search_query)
    ) as rank
  FROM articles a
  WHERE 
    to_tsvector('english', a.title || ' ' || COALESCE(a.description, '')) @@ plainto_tsquery('english', search_query)
    AND (category_filter IS NULL OR a.categories && category_filter)
    AND a.is_archived = FALSE
  ORDER BY rank DESC, a.published_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get trending articles
CREATE OR REPLACE FUNCTION get_trending_articles(
  hours_ago INTEGER DEFAULT 24,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  url TEXT,
  engagement_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.url,
    (a.view_count * 1.0 + a.click_count * 2.0 + a.share_count * 3.0) as engagement_score
  FROM articles a
  WHERE 
    a.published_at > NOW() - (hours_ago || ' hours')::INTERVAL
    AND a.is_archived = FALSE
  ORDER BY engagement_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- TRIGGERS
-- ================================================

-- Update updated_at triggers
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_config_updated_at
  BEFORE UPDATE ON categories_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Article interaction triggers
CREATE TRIGGER increment_view_count_trigger
  AFTER INSERT OR UPDATE ON article_interactions
  FOR EACH ROW
  EXECUTE FUNCTION increment_article_view_count();

CREATE TRIGGER increment_click_count_trigger
  AFTER INSERT OR UPDATE ON article_interactions
  FOR EACH ROW
  EXECUTE FUNCTION increment_article_click_count();

CREATE TRIGGER increment_share_count_trigger
  AFTER INSERT OR UPDATE ON article_interactions
  FOR EACH ROW
  EXECUTE FUNCTION increment_article_share_count();

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

-- Enable RLS on all tables
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_filters ENABLE ROW LEVEL SECURITY;

-- Articles: Public read, authenticated write
CREATE POLICY "Articles are viewable by everyone"
  ON articles FOR SELECT
  USING (TRUE);

CREATE POLICY "Authenticated users can insert articles"
  ON articles FOR INSERT
  WITH CHECK (TRUE);

-- User preferences: Users can only access their own preferences
CREATE POLICY "Users can view their own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid()::TEXT = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid()::TEXT = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid()::TEXT = user_id OR user_id IS NULL);

-- Article interactions: Users can manage their own interactions
CREATE POLICY "Users can view their own interactions"
  ON article_interactions FOR SELECT
  USING (auth.uid()::TEXT = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own interactions"
  ON article_interactions FOR INSERT
  WITH CHECK (auth.uid()::TEXT = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own interactions"
  ON article_interactions FOR UPDATE
  USING (auth.uid()::TEXT = user_id OR user_id IS NULL);

-- Bookmarks: Users can only access their own bookmarks
CREATE POLICY "Users can view their own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can insert their own bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid()::TEXT = user_id);

-- Search history: Users can view their own history
CREATE POLICY "Users can view their own search history"
  ON search_history FOR SELECT
  USING (auth.uid()::TEXT = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert search history"
  ON search_history FOR INSERT
  WITH CHECK (TRUE);

-- Categories config: Public read
CREATE POLICY "Categories are viewable by everyone"
  ON categories_config FOR SELECT
  USING (TRUE);

-- API cache: Public read
CREATE POLICY "Cache is viewable by everyone"
  ON api_cache FOR SELECT
  USING (TRUE);

CREATE POLICY "Cache can be inserted"
  ON api_cache FOR INSERT
  WITH CHECK (TRUE);

-- Analytics: Write-only for users
CREATE POLICY "Anyone can insert analytics events"
  ON analytics_events FOR INSERT
  WITH CHECK (TRUE);

-- Keyword filters: Public read
CREATE POLICY "Keyword filters are viewable by everyone"
  ON keyword_filters FOR SELECT
  USING (TRUE);

-- ================================================
-- SEED DATA
-- ================================================

-- Insert default categories
INSERT INTO categories_config (id, label, icon, color, keywords, description, display_order) VALUES
  ('science-innovation', 'Science & Innovation', '🔬', '#3B82F6', ARRAY['breakthrough', 'discovery', 'research', 'innovation', 'technology', 'invention'], 'Scientific breakthroughs and technological innovations', 1),
  ('environment', 'Environment', '🌱', '#10B981', ARRAY['climate', 'renewable', 'conservation', 'sustainability', 'wildlife', 'clean energy'], 'Environmental progress and conservation efforts', 2),
  ('community', 'Community', '🤝', '#8B5CF6', ARRAY['community', 'volunteer', 'local', 'neighborhood', 'together', 'initiative'], 'Community initiatives and local impact', 3),
  ('kindness', 'Acts of Kindness', '💝', '#EC4899', ARRAY['kindness', 'generosity', 'donation', 'helped', 'rescued', 'saved'], 'Heartwarming acts of kindness and generosity', 4),
  ('health-recovery', 'Health & Recovery', '⚕️', '#EF4444', ARRAY['recovery', 'cure', 'medical', 'health', 'treatment', 'breakthrough'], 'Medical advances and recovery stories', 5),
  ('education', 'Education', '📚', '#F59E0B', ARRAY['education', 'learning', 'school', 'scholarship', 'students', 'teachers'], 'Educational achievements and opportunities', 6),
  ('global-progress', 'Global Progress', '🌍', '#06B6D4', ARRAY['progress', 'improvement', 'development', 'global', 'international', 'peace'], 'Global development and international cooperation', 7),
  ('innovation', 'Innovation', '💡', '#A855F7', ARRAY['innovation', 'startup', 'solution', 'creative', 'entrepreneur', 'idea'], 'Innovative solutions and entrepreneurship', 8)
ON CONFLICT (id) DO NOTHING;

-- Insert default positive keywords
INSERT INTO keyword_filters (keyword, type, weight) VALUES
  ('breakthrough', 'positive', 3),
  ('innovation', 'positive', 2),
  ('success', 'positive', 2),
  ('achievement', 'positive', 2),
  ('recovery', 'positive', 3),
  ('cure', 'positive', 3),
  ('solution', 'positive', 2),
  ('improvement', 'positive', 2),
  ('progress', 'positive', 2),
  ('kindness', 'positive', 3),
  ('generosity', 'positive', 3),
  ('volunteer', 'positive', 2),
  ('help', 'positive', 1),
  ('support', 'positive', 1),
  ('community', 'positive', 2),
  ('together', 'positive', 1),
  ('unity', 'positive', 2),
  ('hope', 'positive', 2),
  ('inspiring', 'positive', 2),
  ('uplifting', 'positive', 3),
  ('positive', 'positive', 1),
  ('celebration', 'positive', 2),
  ('victory', 'positive', 2),
  ('triumph', 'positive', 2),
  ('overcome', 'positive', 2),
  ('resilience', 'positive', 2),
  ('donated', 'positive', 2),
  ('saved', 'positive', 3),
  ('rescued', 'positive', 3)
ON CONFLICT (keyword) DO NOTHING;

-- Insert default negative keywords
INSERT INTO keyword_filters (keyword, type, weight) VALUES
  ('death', 'negative', 3),
  ('murder', 'negative', 3),
  ('war', 'negative', 2),
  ('violence', 'negative', 2),
  ('crash', 'negative', 2),
  ('disaster', 'negative', 2),
  ('terrorism', 'negative', 3),
  ('crime', 'negative', 2),
  ('scandal', 'negative', 2),
  ('controversy', 'negative', 1),
  ('conflict', 'negative', 2),
  ('shooting', 'negative', 3),
  ('attack', 'negative', 2),
  ('fraud', 'negative', 2),
  ('corruption', 'negative', 2),
  ('lawsuit', 'negative', 1),
  ('bankruptcy', 'negative', 2),
  ('fired', 'negative', 1),
  ('layoffs', 'negative', 2)
ON CONFLICT (keyword) DO NOTHING;

-- ================================================
-- VIEWS
-- ================================================

-- View for article statistics
CREATE OR REPLACE VIEW article_stats AS
SELECT
  DATE_TRUNC('day', published_at) as date,
  source,
  COUNT(*) as article_count,
  AVG(positivity_score) as avg_positivity_score,
  SUM(view_count) as total_views,
  SUM(click_count) as total_clicks,
  SUM(share_count) as total_shares
FROM articles
WHERE is_archived = FALSE
GROUP BY DATE_TRUNC('day', published_at), source
ORDER BY date DESC;

-- View for popular categories
CREATE OR REPLACE VIEW popular_categories AS
SELECT
  UNNEST(categories) as category,
  COUNT(*) as article_count,
  AVG(positivity_score) as avg_positivity_score,
  SUM(view_count) as total_views
FROM articles
WHERE 
  published_at > NOW() - INTERVAL '30 days'
  AND is_archived = FALSE
GROUP BY category
ORDER BY article_count DESC;

-- ================================================
-- SCHEDULED JOBS (using pg_cron if available)
-- ================================================

-- Note: These require pg_cron extension
-- If you have pg_cron enabled, uncomment these:

-- Clean expired cache daily
-- SELECT cron.schedule('clean-expired-cache', '0 2 * * *', 'SELECT clean_expired_cache()');

-- Archive old articles (older than 90 days)
-- SELECT cron.schedule('archive-old-articles', '0 3 * * *', 
--   'UPDATE articles SET is_archived = TRUE WHERE published_at < NOW() - INTERVAL ''90 days'' AND is_archived = FALSE'
-- );

-- ================================================
-- COMMENTS
-- ================================================

COMMENT ON TABLE articles IS 'Stores all aggregated news articles from various sources';
COMMENT ON TABLE user_preferences IS 'Stores user preferences for personalized news feeds';
COMMENT ON TABLE article_interactions IS 'Tracks user interactions with articles for analytics';
COMMENT ON TABLE bookmarks IS 'User-saved articles for later reading';
COMMENT ON TABLE search_history IS 'Search query history for improving search functionality';
COMMENT ON TABLE categories_config IS 'Configuration for article categories';
COMMENT ON TABLE api_cache IS 'Caches API responses to reduce external API calls';
COMMENT ON TABLE analytics_events IS 'General analytics events tracking';
COMMENT ON TABLE keyword_filters IS 'Keywords for filtering positive/negative content';

-- ================================================
-- COMPLETION
-- ================================================

-- Grant necessary permissions
-- Note: Adjust these based on your Supabase setup
-- These grants are typically handled automatically by Supabase

DO $$
BEGIN
  -- Create app-specific roles if needed
  -- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
  -- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
  -- GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
  
  RAISE NOTICE 'Schema creation completed successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Review RLS policies and adjust as needed';
  RAISE NOTICE '2. Set up authentication in Supabase dashboard';
  RAISE NOTICE '3. Add API keys to .env file';
  RAISE NOTICE '4. Test the schema by running the application';
END $$;