import { NextResponse } from 'next/server';
import { fetchArticleContent } from '~/lib/news-aggregator';
import { generateArticleSummary } from '~/lib/openai-summarizer';

export async function POST(request: Request) {
  try {
    const body = await request.json() as { url: string; title: string };
    const { url, title } = body;

    if (!url || !title) {
      return NextResponse.json({ error: 'URL and title required' }, { status: 400 });
    }

    const content = await fetchArticleContent(url);
    const summary = await generateArticleSummary(content, title);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error generating article summary:', error);
    return NextResponse.json({ 
      error: 'Failed to generate summary' 
    }, { status: 500 });
  }
}