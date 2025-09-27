import { NextResponse } from 'next/server';
import { aggregateArticles } from '~/lib/news-aggregator';
import { generateRecommendations, type ArticleForRecommendation } from '~/lib/recommendation-engine';

export async function GET() {
  try {
    const articles = await aggregateArticles();
    
    if (articles.length === 0) {
      return NextResponse.json({ error: 'No articles found' }, { status: 404 });
    }

    const articlesForRec: ArticleForRecommendation[] = articles.map(article => ({
      ...article,
      publishedAt: article.publishedAt.toISOString()
    }));

    const recommendations = generateRecommendations(articlesForRec, 15);

    return NextResponse.json({ 
      recommendations,
      total: recommendations.length 
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json({ 
      error: 'Failed to generate recommendations' 
    }, { status: 500 });
  }
}