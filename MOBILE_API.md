# Mobile App API Documentation

This document describes the API endpoints and database structure for the mobile app.

## Database Setup

1. Run the `supabase-articles-table.sql` file in your Supabase SQL editor
2. This creates:
   - `articles` table with all article data
   - Indexes for performance
   - RLS policies for security
   - Helper functions for mobile API
   - Optimized view for mobile consumption

## Syncing Articles

### Sync Articles from News Sources
Fetches latest articles and saves them to Supabase.

**Endpoint**: `POST /api/sync-articles`

**Response**:
```json
{
  "success": true,
  "synced": 20,
  "articles": [
    {
      "id": "article-url",
      "title": "Article Title",
      "source": "The Guardian"
    }
  ]
}
```

**Usage**: Call this endpoint daily via cron job or manually to update articles.

## Mobile App Endpoints

### 1. Get All Articles
Fetches articles from Supabase (already synced).

**Endpoint**: `GET /api/sync-articles`

**Response**:
```json
{
  "articles": [
    {
      "id": "unique-article-id",
      "title": "Article Title",
      "description": "Article description",
      "content": "Full article content in markdown",
      "url": "https://original-url.com",
      "image_url": "https://image-url.com/image.jpg",
      "published_at": "2025-09-27T12:00:00Z",
      "source": "The Guardian",
      "author": "Author Name",
      "categories": ["science-innovation", "environment"],
      "positivity_score": 5,
      "display_order": 0,
      "is_featured": true,
      "created_at": "2025-09-27T12:00:00Z"
    }
  ],
  "total": 20
}
```

### 2. Direct Supabase Query (Recommended for Mobile)
Use Supabase client directly in your mobile app.

**JavaScript/TypeScript Example**:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
)

// Get all articles
const { data: articles, error } = await supabase
  .from('articles')
  .select('*')
  .eq('is_archived', false)
  .order('display_order', { ascending: true })
  .order('published_at', { ascending: false })
  .limit(50)

// Get articles by category
const { data: scienceArticles, error } = await supabase
  .from('articles')
  .select('*')
  .contains('categories', ['science-innovation'])
  .eq('is_archived', false)
  .limit(20)

// Get featured article (top article)
const { data: featured, error } = await supabase
  .from('articles')
  .select('*')
  .eq('is_featured', true)
  .eq('is_archived', false)
  .single()

// Get paginated articles
const { data: articles, error } = await supabase
  .from('articles')
  .select('*')
  .eq('is_archived', false)
  .order('display_order', { ascending: true })
  .range(0, 9) // First 10 articles

// Like an article
const { data, error } = await supabase
  .from('article_likes')
  .insert({
    article_id: 'article-url',
    session_id: 'user-session-id'
  })

// Unlike an article
const { data, error } = await supabase
  .from('article_likes')
  .delete()
  .match({ 
    article_id: 'article-url',
    session_id: 'user-session-id'
  })

// Get user's liked articles
const { data: likes, error } = await supabase
  .from('article_likes')
  .select('article_id')
  .eq('session_id', 'user-session-id')
```

**Swift Example** (iOS):
```swift
import Supabase

let client = SupabaseClient(
  supabaseURL: URL(string: "YOUR_SUPABASE_URL")!,
  supabaseKey: "YOUR_SUPABASE_ANON_KEY"
)

// Get all articles
let articles: [Article] = try await client
  .from("articles")
  .select()
  .eq("is_archived", value: false)
  .order("display_order", ascending: true)
  .order("published_at", ascending: false)
  .limit(50)
  .execute()
  .value
```

**Kotlin Example** (Android):
```kotlin
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.from

val client = createSupabaseClient(
    supabaseUrl = "YOUR_SUPABASE_URL",
    supabaseKey = "YOUR_SUPABASE_ANON_KEY"
)

// Get all articles
val articles = client.from("articles")
    .select()
    .eq("is_archived", false)
    .order("display_order", ascending = true)
    .order("published_at", ascending = false)
    .limit(50)
    .decodeList<Article>()
```

## Database Schema

### Articles Table
```sql
articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,                    -- Full article in markdown
  url TEXT NOT NULL,
  image_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  source TEXT,
  author TEXT,
  categories category_type[],      -- Array of categories
  positivity_score INTEGER,
  display_order INTEGER,           -- Lower = shown first
  is_featured BOOLEAN,             -- True for daily featured article
  is_archived BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
```

### Categories
Available categories:
- `science-innovation`
- `environment`
- `community`
- `kindness`
- `health-recovery`
- `education`
- `global-progress`
- `technology`

## Automated Syncing

### Option 1: Vercel Cron Job
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/sync-articles",
    "schedule": "0 6 * * *"
  }]
}
```

### Option 2: GitHub Actions
Create `.github/workflows/sync-articles.yml`:
```yaml
name: Sync Articles Daily

on:
  schedule:
    - cron: '0 6 * * *'  # 6 AM UTC daily
  workflow_dispatch:      # Allow manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Sync Articles
        run: |
          curl -X POST https://your-domain.com/api/sync-articles
```

### Option 3: Supabase Edge Function (Recommended)
Create a Supabase Edge Function that runs on a schedule to call your sync endpoint.

## Rate Limiting & Caching

- Articles are synced once daily
- Mobile apps should cache articles locally
- Use `updated_at` field to check for updates
- Implement pagination for better performance

## Error Handling

All endpoints return standard error format:
```json
{
  "error": "Error message description"
}
```

Status codes:
- `200`: Success
- `404`: No articles found
- `500`: Server error

## Best Practices for Mobile Apps

1. **Cache articles locally** using SQLite or similar
2. **Sync periodically** (e.g., on app launch if 1+ hours since last sync)
3. **Show cached data first**, then update in background
4. **Use pagination** for large lists
5. **Handle offline mode** gracefully
6. **Implement pull-to-refresh** for manual syncing
7. **Store user's session_id** for likes/preferences

## Security

- Articles table is public read-only via RLS
- Only service role can write to articles table
- Use environment variables for API keys
- Never expose service role key in mobile apps