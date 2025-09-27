import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { aggregateArticles, fetchArticleContent } from '~/lib/news-aggregator';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const skipParam = searchParams.get('skip');
    const skip = skipParam ? parseInt(skipParam, 10) : 0;

    const articles = await aggregateArticles();
    
    if (articles.length === 0) {
      return NextResponse.json({ error: 'No articles found' }, { status: 404 });
    }

    const article = articles[skip % articles.length];
    
    if (!article) {
      return NextResponse.json({ error: 'No article found' }, { status: 404 });
    }

    const content = await fetchArticleContent(article.url);
    
    return NextResponse.json({ 
      article: {
        ...article,
        content
      },
      totalArticles: articles.length
    });
  } catch (error) {
    console.error('Error fetching daily article:', error);
    return NextResponse.json({ error: 'Failed to fetch daily article' }, { status: 500 });
  }
}

export const revalidate = 1800;