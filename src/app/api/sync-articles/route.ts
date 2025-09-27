import { NextResponse } from 'next/server';
import { aggregateArticles } from '~/lib/news-aggregator';

export async function GET() {
  try {
    const articles = await aggregateArticles();
    
    if (articles.length === 0) {
      return NextResponse.json({ error: 'No articles found' }, { status: 404 });
    }

    const top10Articles = articles.slice(0, 10);

    return NextResponse.json({ 
      articles: top10Articles,
      total: top10Articles.length 
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch articles' 
    }, { status: 500 });
  }
}