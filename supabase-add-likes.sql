-- ================================================
-- ADD ARTICLE LIKES FEATURE
-- ================================================
-- Run this migration after the main schema to add likes functionality
-- ================================================

-- Create likes table
CREATE TABLE IF NOT EXISTS article_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  article_id TEXT NOT NULL,
  user_id TEXT,
  session_id TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one like per user/session per article
  CONSTRAINT unique_user_article_like UNIQUE(article_id, user_id),
  CONSTRAINT unique_session_article_like UNIQUE(article_id, session_id),
  CONSTRAINT check_user_or_session CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

-- Add like_count to articles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'articles' AND column_name = 'like_count'
  ) THEN
    ALTER TABLE articles ADD COLUMN like_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_article_likes_article_id ON article_likes(article_id);
CREATE INDEX IF NOT EXISTS idx_article_likes_user_id ON article_likes(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_article_likes_session_id ON article_likes(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_article_likes_created_at ON article_likes(created_at DESC);

-- Function to increment like count
CREATE OR REPLACE FUNCTION increment_article_likes()
RETURNS TRIGGER AS $$
BEGIN
  -- Note: This works with external article IDs (URLs) not stored in articles table yet
  -- When article is stored, this will update the count
  UPDATE articles 
  SET like_count = like_count + 1 
  WHERE url = NEW.article_id OR id::text = NEW.article_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement like count
CREATE OR REPLACE FUNCTION decrement_article_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE articles 
  SET like_count = GREATEST(0, like_count - 1)
  WHERE url = OLD.article_id OR id::text = OLD.article_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Triggers for like count
DROP TRIGGER IF EXISTS increment_likes_trigger ON article_likes;
CREATE TRIGGER increment_likes_trigger
  AFTER INSERT ON article_likes
  FOR EACH ROW
  EXECUTE FUNCTION increment_article_likes();

DROP TRIGGER IF EXISTS decrement_likes_trigger ON article_likes;
CREATE TRIGGER decrement_likes_trigger
  AFTER DELETE ON article_likes
  FOR EACH ROW
  EXECUTE FUNCTION decrement_article_likes();

-- Enable RLS
ALTER TABLE article_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for article_likes
CREATE POLICY "Anyone can view likes"
  ON article_likes FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can insert their own likes"
  ON article_likes FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid()::TEXT = user_id) OR
    (auth.uid() IS NULL AND user_id IS NULL)
  );

CREATE POLICY "Users can delete their own likes"
  ON article_likes FOR DELETE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid()::TEXT = user_id) OR
    (auth.uid() IS NULL AND session_id IS NOT NULL)
  );

-- Create view for article like counts
CREATE OR REPLACE VIEW article_like_stats AS
SELECT
  article_id,
  COUNT(*) as like_count,
  COUNT(DISTINCT user_id) as unique_users,
  MAX(created_at) as last_liked_at
FROM article_likes
GROUP BY article_id;

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

-- Comments
COMMENT ON TABLE article_likes IS 'Stores user likes for articles';
COMMENT ON FUNCTION increment_article_likes() IS 'Automatically increments like count when user likes an article';
COMMENT ON FUNCTION decrement_article_likes() IS 'Automatically decrements like count when user unlikes an article';
COMMENT ON FUNCTION get_user_liked_articles(TEXT, TEXT) IS 'Returns all articles liked by a user or session';
COMMENT ON FUNCTION has_user_liked_article(TEXT, TEXT, TEXT) IS 'Check if a user or session has liked a specific article';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Article likes feature added successfully!';
  RAISE NOTICE 'Users can now like articles and view their liked articles';
  RAISE NOTICE 'Like counts are automatically tracked and updated';
END $$;