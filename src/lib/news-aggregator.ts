interface Article {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  publishedAt: Date;
  source: string;
  author?: string;
}

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

function isPositive(article: { title: string; description?: string }): boolean {
  const text = `${article.title} ${article.description ?? ''}`;
  return calculatePositivityScore(text) > 0;
}

export async function fetchFromNewsAPI(): Promise<Article[]> {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) return [];

  try {
    const keywords = POSITIVE_KEYWORDS.slice(0, 10).join(' OR ');
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(keywords)}&language=en&sortBy=publishedAt&pageSize=50&apiKey=${apiKey}`;
    
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
      .filter((article) => isPositive(article))
      .map((article) => ({
        id: article.url,
        title: article.title,
        description: article.description ?? '',
        url: article.url,
        imageUrl: article.urlToImage,
        publishedAt: new Date(article.publishedAt),
        source: article.source.name,
        author: article.author,
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
    const keywords = POSITIVE_KEYWORDS.slice(0, 5).join(',');
    const url = `https://content.guardianapis.com/search?q=${encodeURIComponent(keywords)}&show-fields=thumbnail,trailText&page-size=50&api-key=${apiKey}`;
    
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
      .filter((article) => isPositive({ 
        title: article.webTitle, 
        description: article.fields?.trailText 
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
    const keywords = POSITIVE_KEYWORDS.slice(0, 5).join(' ');
    const url = `https://api.nytimes.com/svc/search/v2/articlesearch.json?q=${encodeURIComponent(keywords)}&sort=newest&api-key=${apiKey}`;
    
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
      .filter((article) => isPositive({ 
        title: article.headline.main, 
        description: article.abstract 
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
      }));
  } catch (error) {
    console.error('NYT API error:', error);
    return [];
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