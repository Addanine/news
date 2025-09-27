import { NextResponse } from 'next/server';
import { streamArticleSummary } from '~/lib/openai-summarizer';

export async function POST(request: Request) {
  try {
    const body = await request.json() as { content: string; title: string };
    const { content, title } = body;

    if (!content || !title) {
      return NextResponse.json({ error: 'Content and title required' }, { status: 400 });
    }

    const stream = await streamArticleSummary(content, title);
    
    if (!stream) {
      return NextResponse.json({ error: 'Summary generation not available' }, { status: 503 });
    }

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in summarize endpoint:', error);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}