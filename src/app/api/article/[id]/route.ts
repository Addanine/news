import { NextResponse } from 'next/server';
import { aggregateArticles, fetchArticleContent } from '~/lib/news-aggregator';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const articleId = decodeURIComponent(id);
    const articles = await aggregateArticles();
    
    const article = articles.find(a => a.id === articleId || a.url === articleId);
    
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    const content = await fetchArticleContent(article.url);
    
    return NextResponse.json({ 
      article: {
        ...article,
        content
      }
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 });
  }
}

export const revalidate = 1800;