import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabase } from '~/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { articleId: string; sessionId?: string };
    const { articleId, sessionId } = body;

    if (!articleId) {
      return NextResponse.json({ error: 'Article ID required' }, { status: 400 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId && !sessionId) {
      return NextResponse.json({ error: 'User or session required' }, { status: 401 });
    }

    const { data: existingLike } = await supabase
      .from('article_likes')
      .select('id')
      .eq('article_id', articleId)
      .eq(userId ? 'user_id' : 'session_id', userId ?? sessionId)
      .single();

    if (existingLike) {
      const { error } = await supabase
        .from('article_likes')
        .delete()
        .eq('article_id', articleId)
        .eq(userId ? 'user_id' : 'session_id', userId ?? sessionId);

      if (error) throw error;

      return NextResponse.json({ liked: false });
    }

    const { error } = await supabase
      .from('article_likes')
      .insert({
        article_id: articleId,
        user_id: userId ?? null,
        session_id: sessionId ?? null,
      });

    if (error) throw error;

    return NextResponse.json({ liked: true });
  } catch (error) {
    console.error('Like error:', error);
    return NextResponse.json(
      { error: 'Failed to process like' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId && !sessionId) {
      return NextResponse.json({ likes: [] });
    }

    const { data: likes, error } = await supabase
      .from('article_likes')
      .select('article_id')
      .eq(userId ? 'user_id' : 'session_id', userId ?? sessionId);

    if (error) throw error;

    const likesList = (likes as Array<{ article_id: string }> | null)?.map(l => l.article_id) ?? [];

    return NextResponse.json({ 
      likes: likesList
    });
  } catch (error) {
    console.error('Get likes error:', error);
    return NextResponse.json({ likes: [] });
  }
}