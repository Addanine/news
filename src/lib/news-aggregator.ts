export type Category = 
  | 'science-innovation'
  | 'environment'
  | 'community'
  | 'kindness'
  | 'health-recovery'
  | 'education'
  | 'global-progress'
  | 'technology';

interface Article {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  publishedAt: Date;
  source: string;
  author?: string;
  categories: Category[];
}

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  'science-innovation': ['science', 'research', 'study', 'discovery', 'breakthrough', 'scientists', 'university', 'laboratory'],
  'environment': ['climate', 'environment', 'renewable', 'solar', 'wind', 'sustainable', 'conservation', 'wildlife', 'ocean', 'forest'],
  'community': ['community', 'neighborhood', 'local', 'volunteer', 'initiative', 'together', 'grassroots'],
  'kindness': ['kindness', 'generosity', 'donation', 'charity', 'helped', 'rescued', 'saved', 'compassion'],
  'health-recovery': ['health', 'medical', 'treatment', 'therapy', 'recovery', 'cure', 'patient', 'hospital'],
  'education': ['education', 'school', 'student', 'teacher', 'learning', 'scholarship', 'university', 'literacy'],
  'global-progress': ['global', 'international', 'world', 'nations', 'progress', 'development', 'poverty', 'peace'],
  'technology': ['technology', 'innovation', 'ai', 'artificial intelligence', 'startup', 'app', 'digital', 'software']
};

const TRUSTED_DOMAINS = [
  'bbc.com', 'bbc.co.uk',
  'theguardian.com',
  'nytimes.com',
  'washingtonpost.com',
  'reuters.com',
  'apnews.com',
  'npr.org',
  'pbs.org',
  'theatlantic.com',
  'nature.com',
  'scientificamerican.com',
  'newscientist.com',
  'science.org',
  'nationalgeographic.com',
  'smithsonianmag.com',
  'wired.com',
  'arstechnica.com',
  'techcrunch.com',
  'theverge.com',
  'mit.edu',
  'stanford.edu',
  'harvard.edu',
  'time.com',
  'economist.com',
  'forbes.com',
  'bloomberg.com',
  'axios.com',
  'propublica.org',
  'usatoday.com',
  'csmonitor.com',
  'popsci.com',
  'grist.org',
  'motherjones.com',
  'vox.com',
  'theconversation.com'
];

const POSITIVE_KEYWORDS = [
  'breakthrough', 'innovation', 'discovery', 'achievement', 'recovery',
  'cure', 'solution', 'improvement', 'progress', 'kindness', 'generosity',
  'volunteer', 'help', 'support', 'community', 'together', 'unity',
  'hope', 'inspiring', 'uplifting', 'celebration',
  'overcome', 'resilience', 'donated', 'saved', 'rescued',
  'renewable', 'sustainable', 'conservation', 'restore', 'protect',
  'scholarship', 'education', 'learning', 'research', 'scientific',
  'medical advance', 'treatment', 'therapy', 'healing'
];

const NEGATIVE_KEYWORDS = [
  'death', 'murder', 'war', 'violence', 'crash', 'disaster', 'terrorism',
  'crime', 'scandal', 'controversy', 'conflict', 'shooting', 'attack',
  'fraud', 'corruption', 'lawsuit', 'bankruptcy', 'fired', 'layoffs'
];

const EXCLUDE_SPORTS_KEYWORDS = [
  'game', 'match', 'score', 'playoff', 'championship', 'tournament',
  'league', 'season', 'team wins', 'defeats', 'beat', 'vs', 'versus',
  'quarterback', 'touchdown', 'goal', 'basket', 'home run', 'inning',
  'nfl', 'nba', 'mlb', 'nhl', 'premier league', 'world cup',
  'soccer', 'football', 'basketball', 'baseball', 'hockey'
];

const EXCLUDE_ENTERTAINMENT_KEYWORDS = [
  'movie', 'film', 'actor', 'actress', 'celebrity', 'red carpet',
  'box office', 'premiere', 'trailer', 'netflix', 'streaming',
  'album', 'song', 'concert', 'tour', 'grammy', 'oscar', 'emmy'
];

function calculatePositivityScore(text: string): number {
  const lowerText = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;

  POSITIVE_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) positiveCount++;
  });

  NEGATIVE_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) negativeCount++;
  });

  return positiveCount - negativeCount;
}

function isSportsOrEntertainment(text: string): boolean {
  const lowerText = text.toLowerCase();
  
  const hasSports = EXCLUDE_SPORTS_KEYWORDS.some(keyword => 
    lowerText.includes(keyword)
  );
  
  const hasEntertainment = EXCLUDE_ENTERTAINMENT_KEYWORDS.some(keyword => 
    lowerText.includes(keyword)
  );
  
  return hasSports || hasEntertainment;
}

function isFromTrustedDomain(url: string): boolean {
  try {
    const domain = new URL(url).hostname.toLowerCase();
    return TRUSTED_DOMAINS.some(trusted => 
      domain === trusted || domain.endsWith(`.${trusted}`)
    );
  } catch {
    return false;
  }
}

function detectCategories(article: { title: string; description?: string }): Category[] {
  const text = `${article.title} ${article.description ?? ''}`.toLowerCase();
  const categories: Category[] = [];

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const hasKeyword = keywords.some(keyword => text.includes(keyword));
    if (hasKeyword) {
      categories.push(category as Category);
    }
  }

  return categories.length > 0 ? categories : ['global-progress'];
}

function isQualityArticle(article: { title: string; description?: string; url: string }): boolean {
  if (!isFromTrustedDomain(article.url)) {
    return false;
  }

  const text = `${article.title} ${article.description ?? ''}`;
  
  if (isSportsOrEntertainment(text)) {
    return false;
  }
  
  const positivityScore = calculatePositivityScore(text);
  
  return positivityScore >= 1;
}

export async function fetchFromNewsAPI(): Promise<Article[]> {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) return [];

  try {
    const domains = TRUSTED_DOMAINS.slice(0, 20).join(',');
    const url = `https://newsapi.org/v2/everything?domains=${domains}&language=en&sortBy=publishedAt&pageSize=100&apiKey=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json() as { status: string; articles?: Array<{
      url: string;
      title: string;
      description: string;
      urlToImage?: string;
      publishedAt: string;
      source: { name: string };
      author?: string;
    }> };

    if (data.status !== 'ok' || !data.articles) return [];

    return data.articles
      .filter((article) => isQualityArticle({ 
        title: article.title, 
        description: article.description,
        url: article.url 
      }))
      .map((article) => ({
        id: article.url,
        title: article.title,
        description: article.description ?? '',
        url: article.url,
        imageUrl: article.urlToImage,
        publishedAt: new Date(article.publishedAt),
        source: article.source.name,
        author: article.author,
        categories: detectCategories(article),
      }));
  } catch (error) {
    console.error('NewsAPI error:', error);
    return [];
  }
}

export async function fetchFromGuardian(): Promise<Article[]> {
  const apiKey = process.env.GUARDIAN_API_KEY;
  if (!apiKey) return [];

  try {
    const url = `https://content.guardianapis.com/search?show-fields=thumbnail,trailText&page-size=50&order-by=newest&api-key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json() as { response: { status: string; results?: Array<{
      id: string;
      webTitle: string;
      webUrl: string;
      webPublicationDate: string;
      fields?: {
        trailText?: string;
        thumbnail?: string;
      };
    }> } };

    if (data.response.status !== 'ok' || !data.response.results) return [];

    return data.response.results
      .filter((article) => isQualityArticle({ 
        title: article.webTitle, 
        description: article.fields?.trailText,
        url: article.webUrl
      }))
      .map((article) => ({
        id: article.id,
        title: article.webTitle,
        description: article.fields?.trailText ?? '',
        url: article.webUrl,
        imageUrl: article.fields?.thumbnail,
        publishedAt: new Date(article.webPublicationDate),
        source: 'The Guardian',
        author: undefined,
        categories: detectCategories({ title: article.webTitle, description: article.fields?.trailText }),
      }));
  } catch (error) {
    console.error('Guardian API error:', error);
    return [];
  }
}

export async function fetchFromNYT(): Promise<Article[]> {
  const apiKey = process.env.NYT_API_KEY;
  if (!apiKey) return [];

  try {
    const url = `https://api.nytimes.com/svc/search/v2/articlesearch.json?sort=newest&fq=news_desk:("Science" "Health" "Climate" "Technology")&api-key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json() as { status: string; response?: { docs: Array<{
      _id: string;
      headline: { main: string };
      abstract?: string;
      snippet?: string;
      web_url: string;
      pub_date: string;
      multimedia?: Array<{ url: string }>;
      byline?: { original: string };
    }> } };

    if (data.status !== 'OK' || !data.response) return [];

    return data.response.docs
      .filter((article) => isQualityArticle({ 
        title: article.headline.main, 
        description: article.abstract,
        url: article.web_url
      }))
      .map((article) => ({
        id: article._id,
        title: article.headline.main,
        description: article.abstract ?? article.snippet ?? '',
        url: article.web_url,
        imageUrl: article.multimedia?.[0] 
          ? `https://www.nytimes.com/${article.multimedia[0].url}`
          : undefined,
        publishedAt: new Date(article.pub_date),
        source: 'The New York Times',
        author: article.byline?.original,
        categories: detectCategories({ title: article.headline.main, description: article.abstract }),
      }));
  } catch (error) {
    console.error('NYT API error:', error);
    return [];
  }
}

export async function fetchArticleContent(url: string): Promise<string> {
  try {
    const response = await fetch(`https://r.jina.ai/${url}`);
    const content = await response.text();
    return content;
  } catch (error) {
    console.error('Jina AI Reader error:', error);
    return '';
  }
}

export async function aggregateArticles(): Promise<Article[]> {
  const [newsApiArticles, guardianArticles, nytArticles] = await Promise.all([
    fetchFromNewsAPI(),
    fetchFromGuardian(),
    fetchFromNYT(),
  ]);

  const allArticles = [...newsApiArticles, ...guardianArticles, ...nytArticles];

  const uniqueArticles = Array.from(
    new Map(allArticles.map(article => [article.url, article])).values()
  );

  return uniqueArticles.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

export async function getDailyArticle(): Promise<(Article & { content: string }) | null> {
  const articles = await aggregateArticles();
  
  const bestArticle = articles
    .sort((a, b) => {
      const scoreA = calculatePositivityScore(`${a.title} ${a.description}`);
      const scoreB = calculatePositivityScore(`${b.title} ${b.description}`);
      return scoreB - scoreA;
    })[0];

  if (!bestArticle) return null;

  const content = await fetchArticleContent(bestArticle.url);
  
  return {
    ...bestArticle,
    content
  };
}