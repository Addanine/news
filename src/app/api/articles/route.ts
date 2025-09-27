import { NextResponse } from 'next/server';
import { aggregateArticles } from '~/lib/news-aggregator';

export async function GET() {
  try {
    const articles = await aggregateArticles();
    
    return NextResponse.json({
      articles,
      total: articles.length,
      cached: false,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

export const revalidate = 1800;