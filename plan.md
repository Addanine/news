# AI Development Specification: Positive News Aggregation Platform

## Project Brief
Build a web-based positive news aggregation platform that filters and categorizes uplifting news content from multiple sources. The application should provide personalized feeds based on user-selected categories and tags, with a mobile-responsive design optimized for engagement and positivity.

## Technical Requirements

### Core Stack
- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: Start with localStorage, migrate to Supabase for production
- **Deployment**: Vercel
- **Mobile**: Progressive Web App (PWA) approach

### API Integration Requirements

#### Primary News Sources
1. **NewsAPI** (https://newsapi.org/v2/)
   - Endpoint: `/everything`
   - Required parameters: `q`, `language=en`, `sortBy=publishedAt`, `pageSize=50`
   - Positive keyword filtering required
   - Rate limit: 1000 requests/day (free tier)

2. **Guardian API** (https://content.guardianapis.com/)
   - Endpoint: `/search`
   - Required fields: `thumbnail`, `trailText`
   - Filter by positive content categories
   - Rate limit: 5000 requests/day (free tier)

3. **Reddit API** (Public endpoints, no auth required)
   - Sources: `/r/UpliftingNews/`, `/r/MadeMeSmile/`, `/r/HumansBeingBros/`
   - Format: `.json` endpoints
   - No rate limiting for public data

#### Content Filtering Logic
Implement keyword-based filtering:
```typescript
const POSITIVE_KEYWORDS = [
  'breakthrough', 'innovation', 'success', 'achievement', 'recovery',
  'cure', 'solution', 'improvement', 'progress', 'kindness', 'generosity',
  'volunteer', 'help', 'support', 'community', 'together', 'unity',
  'hope', 'inspiring', 'uplifting', 'positive', 'celebration', 'victory',
  'triumph', 'overcome', 'resilience', 'donated', 'saved', 'rescued'
];

const NEGATIVE_KEYWORDS = [
  'death', 'murder', 'war', 'violence', 'crash', 'disaster', 'terrorism',
  'crime', 'scandal', 'controversy', 'conflict', 'shooting', 'attack',
  'fraud', 'corruption', 'lawsuit', 'bankruptcy', 'fired', 'layoffs'
];
```

## Data Models

### Article Interface
```typescript
interface Article {
  id: string;
  title: string;
  description: string;
  content?: string;
  url: string;
  imageUrl?: string;
  publishedAt: Date;
  source: {
    name: string;
    domain: string;
  };
  author?: string;
  categories: Category[];
  tags: string[];
  positivityScore: number; // 0-1 scale
}
```

### Category System
```typescript
enum Category {
  SCIENCE_INNOVATION = 'science-innovation',
  ENVIRONMENT = 'environment',
  COMMUNITY = 'community',
  KINDNESS = 'kindness',
  HEALTH_RECOVERY = 'health-recovery',
  EDUCATION = 'education',
  GLOBAL_PROGRESS = 'global-progress',
  INNOVATION = 'innovation'
}

interface CategoryConfig {
  id: Category;
  label: string;
  icon: string;
  keywords: string[];
  color: string;
}
```

### User Preferences
```typescript
interface UserPreferences {
  selectedCategories: Category[];
  excludedSources: string[];
  refreshInterval: number; // minutes
  articlesPerPage: number;
  darkMode: boolean;
  notifications: {
    enabled: boolean;
    frequency: 'daily' | 'weekly';
    time: string; // HH:MM format
  };
}
```

## Required Components

### 1. ArticleCard Component
**Props**: `article: Article`, `onRead: (id: string) => void`
**Features**:
- Responsive image with fallback
- Truncated title (2 lines max)
- Description preview (3 lines max)
- Source attribution with favicon
- Publish date (relative format)
- Category badges
- Positivity score indicator (optional)
- Smooth hover animations
- Click tracking

### 2. CategoryFilter Component
**Props**: `categories: CategoryConfig[]`, `selected: Category[]`, `onChange: (categories: Category[]) => void`
**Features**:
- Horizontal scrollable layout
- Active/inactive visual states
- Category icons and labels
- "Select All" / "Clear All" functionality
- Smooth transitions

### 3. NewsGrid Component
**Props**: `articles: Article[]`, `loading: boolean`, `onLoadMore: () => void`
**Features**:
- Masonry or grid layout
- Infinite scroll implementation
- Loading skeleton states
- Empty state handling
- Pull-to-refresh (mobile)

### 4. SearchBar Component
**Props**: `onSearch: (query: string) => void`, `placeholder?: string`
**Features**:
- Debounced search input
- Search suggestions
- Clear functionality
- Mobile-optimized keyboard

### 5. SettingsPanel Component
**Props**: `preferences: UserPreferences`, `onUpdate: (prefs: UserPreferences) => void`
**Features**:
- Category selection
- Source management
- Notification settings
- Theme toggle
- Data export/import

## Core Services

### 1. NewsAggregationService
```typescript
class NewsAggregationService {
  async fetchArticles(
    categories: Category[],
    limit: number = 50,
    offset: number = 0
  ): Promise<Article[]>;
  
  async searchArticles(
    query: string,
    categories?: Category[]
  ): Promise<Article[]>;
  
  private async fetchFromNewsAPI(params: SearchParams): Promise<Article[]>;
  private async fetchFromGuardian(params: SearchParams): Promise<Article[]>;
  private async fetchFromReddit(subreddits: string[]): Promise<Article[]>;
  
  private normalizeArticle(rawArticle: any, source: string): Article;
  private calculatePositivityScore(article: Article): number;
  private categorizeArticle(article: Article): Category[];
  private filterByKeywords(articles: Article[]): Article[];
}
```

### 2. CacheService
```typescript
class CacheService {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }>;
  
  set<T>(key: string, data: T, ttlMinutes: number = 30): void;
  get<T>(key: string): T | null;
  clear(pattern?: string): void;
  isExpired(key: string): boolean;
}
```

### 3. PreferencesService
```typescript
class PreferencesService {
  save(preferences: UserPreferences): Promise<void>;
  load(): Promise<UserPreferences>;
  reset(): Promise<void>;
  subscribe(callback: (prefs: UserPreferences) => void): () => void;
}
```

## API Route Specifications

### GET /api/articles
**Query Parameters**:
- `categories`: string[] (optional)
- `limit`: number (default: 20)
- `offset`: number (default: 0)
- `search`: string (optional)
- `fresh`: boolean (optional, bypass cache)

**Response**:
```typescript
{
  articles: Article[];
  total: number;
  hasMore: boolean;
  cached: boolean;
  lastUpdated: string;
}
```

### GET /api/categories
**Response**:
```typescript
{
  categories: CategoryConfig[];
}
```

### POST /api/feedback
**Body**:
```typescript
{
  articleId: string;
  rating: number; // 1-5
  feedback?: string;
}
```

## UI/UX Specifications

### Design System
- **Color Palette**: 
  - Primary: Warm blue (#3B82F6)
  - Secondary: Soft green (#10B981)
  - Accent: Sunny yellow (#F59E0B)
  - Background: Light gray (#F9FAFB)
  - Text: Dark gray (#1F2937)
- **Typography**: Inter font family
- **Border Radius**: 8px for cards, 4px for buttons
- **Shadows**: Subtle drop shadows for depth
- **Animations**: 200ms ease-in-out transitions

### Layout Requirements
- **Header**: Fixed header with logo, search, and settings
- **Sidebar**: Collapsible category filter (desktop)
- **Main**: Article grid with infinite scroll
- **Mobile**: Bottom navigation, swipeable categories

### Responsive Breakpoints
- Mobile: 0-768px
- Tablet: 768-1024px
- Desktop: 1024px+

### Performance Requirements
- **First Contentful Paint**: < 2 seconds
- **Largest Contentful Paint**: < 3 seconds
- **Time to Interactive**: < 4 seconds
- **Cumulative Layout Shift**: < 0.1

## Content Processing Pipeline

### 1. Article Ingestion
1. Fetch from multiple APIs simultaneously
2. Normalize data structure
3. Apply keyword filtering
4. Calculate positivity scores
5. Categorize content
6. Deduplicate articles
7. Cache results

### 2. Positivity Scoring Algorithm
```typescript
function calculatePositivityScore(article: Article): number {
  const text = `${article.title} ${article.description}`.toLowerCase();
  
  let positiveMatches = 0;
  let negativeMatches = 0;
  
  POSITIVE_KEYWORDS.forEach(keyword => {
    if (text.includes(keyword)) positiveMatches++;
  });
  
  NEGATIVE_KEYWORDS.forEach(keyword => {
    if (text.includes(keyword)) negativeMatches -= 2; // Weight negative more heavily
  });
  
  const score = Math.max(0, Math.min(1, (positiveMatches + negativeMatches + 1) / 10));
  return score;
}
```

### 3. Content Deduplication
- Compare titles using Levenshtein distance
- Check URL domains for cross-posting
- Merge similar articles from different sources

## Error Handling Requirements

### API Error Handling
```typescript
interface ApiError {
  code: string;
  message: string;
  source?: string;
  retryAfter?: number;
}

// Handle rate limiting
// Implement exponential backoff
// Graceful degradation when sources fail
// User-friendly error messages
```

### Offline Support
- Cache articles for offline reading
- Show cached content when network unavailable
- Queue actions for when connectivity returns
- Offline indicator in UI

## Testing Requirements

### Unit Tests (Jest + React Testing Library)
- Component rendering and interactions
- Service functions and data processing
- Utility functions (scoring, categorization)
- Mock API responses

### Integration Tests
- API route functionality
- Database operations
- Cache behavior
- Error scenarios

### E2E Tests (Playwright)
- User workflow: browse → filter → read
- Mobile responsiveness
- Performance benchmarks
- Cross-browser compatibility

## Security Considerations

### API Security
- Store API keys in environment variables
- Implement request rate limiting
- Validate and sanitize all inputs
- Use HTTPS for all requests

### Content Security
- Sanitize article content (XSS prevention)
- Validate image URLs
- Implement Content Security Policy headers
- Block potentially malicious domains

## Deployment Configuration

### Environment Variables
```env
# Required
NEWSAPI_KEY=your_newsapi_key
GUARDIAN_API_KEY=your_guardian_key

# Optional
OPENAI_API_KEY=your_openai_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Vercel Configuration
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci",
  "functions": {
    "app/api/articles/route.js": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=1800, stale-while-revalidate"
        }
      ]
    }
  ]
}
```

## Success Criteria

### Functional Requirements
✅ Successfully aggregate articles from 3+ sources
✅ Filter content by 8 predefined categories
✅ Responsive design works on mobile and desktop
✅ Local storage persists user preferences
✅ Articles load within 3 seconds
✅ Infinite scroll implementation
✅ Search functionality
✅ PWA features (offline support, installable)

### Performance Metrics
- Lighthouse score > 90
- Bundle size < 500KB
- API response time < 2 seconds
- 99% uptime
- Error rate < 1%

### User Experience Goals
- Intuitive navigation
- Visually appealing, optimistic design
- Fast, responsive interactions
- Accessible (WCAG 2.1 AA compliance)
- Cross-browser compatibility

This specification provides complete technical requirements for building a robust, scalable positive news aggregation platform optimized for user engagement and technical excellence.
