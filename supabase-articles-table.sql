-- ================================================
-- ARTICLES TABLE FOR MOBILE APP
-- ================================================
-- Add this to your existing Supabase database
-- Stores cached articles for mobile app consumption
-- ================================================

-- Articles Table
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  
  -- Content fields
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  url TEXT NOT NULL,
  image_url TEXT,
  
  -- Metadata
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source TEXT NOT NULL,
  author TEXT,
  
  -- Categorization
  categories category_type[] DEFAULT '{}',
  positivity_score INTEGER DEFAULT 0,
  
  -- Display order (lower = higher priority)
  display_order INTEGER DEFAULT 0,
  
  -- Flags
  is_featured BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_display_order ON articles(display_order ASC, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_categories ON articles USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_articles_is_featured ON articles(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_articles_fetched_at ON articles(fetched_at DESC);

-- RLS Policies
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Anyone can read articles
CREATE POLICY IF NOT EXISTS "Articles are viewable by everyone"
  ON articles FOR SELECT
  USING (is_archived = FALSE);

-- Only authenticated users can insert/update (for admin/cron jobs)
CREATE POLICY IF NOT EXISTS "Service role can manage articles"
  ON articles FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_articles_updated_at_trigger ON articles;
CREATE TRIGGER update_articles_updated_at_trigger
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_articles_updated_at();

-- View for mobile API - returns articles in optimal format
CREATE OR REPLACE VIEW articles_mobile_view AS
SELECT
  id,
  title,
  description,
  content,
  url,
  image_url,
  published_at,
  source,
  author,
  categories,
  positivity_score,
  display_order,
  is_featured,
  COALESCE(
    (SELECT COUNT(*) FROM article_likes WHERE article_id = articles.id),
    0
  ) as like_count,
  created_at
FROM articles
WHERE is_archived = FALSE
ORDER BY display_order ASC, published_at DESC;

-- Function to get articles for mobile app
CREATE OR REPLACE FUNCTION get_articles_mobile(
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0,
  category_filter category_type[] DEFAULT NULL
)
RETURNS TABLE(
  id TEXT,
  title TEXT,
  description TEXT,
  content TEXT,
  url TEXT,
  image_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  source TEXT,
  author TEXT,
  categories category_type[],
  positivity_score INTEGER,
  display_order INTEGER,
  is_featured BOOLEAN,
  like_count BIGINT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.title,
    a.description,
    a.content,
    a.url,
    a.image_url,
    a.published_at,
    a.source,
    a.author,
    a.categories,
    a.positivity_score,
    a.display_order,
    a.is_featured,
    COALESCE(
      (SELECT COUNT(*) FROM article_likes WHERE article_id = a.id),
      0
    )::BIGINT as like_count,
    a.created_at
  FROM articles a
  WHERE 
    a.is_archived = FALSE
    AND (category_filter IS NULL OR a.categories && category_filter)
  ORDER BY a.display_order ASC, a.published_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE articles IS 'Cached articles for mobile app consumption';
COMMENT ON FUNCTION get_articles_mobile(INTEGER, INTEGER, category_type[]) IS 'Get paginated articles with filters for mobile app';
COMMENT ON VIEW articles_mobile_view IS 'Optimized view of articles for mobile API endpoints';