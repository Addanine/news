import { NextResponse } from 'next/server';
import { aggregateArticles, fetchArticleContent } from '~/lib/news-aggregator';
import { generateArticleSummary } from '~/lib/openai-summarizer';

export async function GET() {
  try {
    const articles = await aggregateArticles();
    
    if (articles.length === 0) {
      return NextResponse.json({ error: 'No articles found' }, { status: 404 });
    }

    const top10Articles = articles.slice(0, 10);
    
    const articlesWithSummaries = await Promise.all(
      top10Articles.map(async (article) => {
        const content = await fetchArticleContent(article.url);
        const summary = await generateArticleSummary(content, article.title);
        
        return {
          ...article,
          content,
          summary
        };
      })
    );

    return NextResponse.json({ 
      articles: articlesWithSummaries,
      total: articlesWithSummaries.length 
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch articles' 
    }, { status: 500 });
  }
}