import { NextResponse } from 'next/server';
import { supabase } from '~/lib/supabase';
import { aggregateArticles, fetchArticleContent } from '~/lib/news-aggregator';

function calculatePositivityScore(text: string): number {
  const positiveKeywords = [
    'breakthrough', 'innovation', 'discovery', 'achievement', 'recovery',
    'cure', 'solution', 'improvement', 'progress', 'kindness', 'generosity',
    'volunteer', 'help', 'support', 'community', 'together', 'unity',
    'hope', 'inspiring', 'uplifting'
  ];
  
  const lowerText = text.toLowerCase();
  let score = 0;
  
  positiveKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) score++;
  });
  
  return score;
}

export async function POST() {
  try {
    const articles = await aggregateArticles();
    
    if (articles.length === 0) {
      return NextResponse.json({ error: 'No articles found' }, { status: 404 });
    }

    const top20Articles = articles.slice(0, 20);
    
    const articlesWithContent = await Promise.all(
      top20Articles.map(async (article, index) => {
        const content = await fetchArticleContent(article.url);
        const positivityScore = calculatePositivityScore(
          `${article.title} ${article.description}`
        );
        
        return {
          id: article.id,
          title: article.title,
          description: article.description,
          content,
          url: article.url,
          image_url: article.imageUrl ?? null,
          published_at: article.publishedAt.toISOString(),
          source: article.source,
          author: article.author ?? null,
          categories: article.categories,
          positivity_score: positivityScore,
          display_order: index,
          is_featured: index === 0,
          is_archived: false,
        };
      })
    );

    const { data, error } = await supabase
      .from('articles')
      .upsert(articlesWithContent, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      synced: articlesWithContent.length,
      articles: articlesWithContent.map(a => ({
        id: a.id,
        title: a.title,
        source: a.source
      }))
    });
  } catch (error) {
    console.error('Error syncing articles:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to sync articles' 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data: articles, error } = await supabase
      .from('articles')
      .select('*')
      .eq('is_archived', false)
      .order('display_order', { ascending: true })
      .order('published_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      articles,
      total: articles?.length ?? 0 
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch articles' 
    }, { status: 500 });
  }
}