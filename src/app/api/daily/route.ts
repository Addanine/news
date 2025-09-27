import { NextResponse } from 'next/server';
import { getDailyArticle } from '~/lib/news-aggregator';

export async function GET() {
  try {
    const article = await getDailyArticle();
    
    if (!article) {
      return NextResponse.json({ error: 'No article found' }, { status: 404 });
    }

    return NextResponse.json({ article });
  } catch (error) {
    console.error('Error fetching daily article:', error);
    return NextResponse.json({ error: 'Failed to fetch daily article' }, { status: 500 });
  }
}

export const revalidate = 86400;