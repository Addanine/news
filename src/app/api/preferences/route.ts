import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { supabase } from '~/lib/supabase';
import type { Category } from '~/lib/news-aggregator';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? sessionId;

    if (!userId) {
      return NextResponse.json({
        selectedCategories: ['science-innovation', 'environment', 'community', 'kindness', 'health-recovery', 'education', 'global-progress', 'technology'],
        showImages: true,
      });
    }

    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('selected_categories, show_images')
      .eq('user_id', userId)
      .single();

    if (prefs) {
      const prefsData = prefs as { selected_categories: Category[]; show_images: boolean };
      return NextResponse.json({
        selectedCategories: prefsData.selected_categories,
        showImages: prefsData.show_images,
      });
    }

    return NextResponse.json({
      selectedCategories: ['science-innovation', 'environment', 'community', 'kindness', 'health-recovery', 'education', 'global-progress', 'technology'],
      showImages: true,
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json({
      selectedCategories: ['science-innovation', 'environment', 'community', 'kindness', 'health-recovery', 'education', 'global-progress', 'technology'],
      showImages: true,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { 
      sessionId?: string;
      selectedCategories: Category[];
      showImages: boolean;
    };
    const { sessionId, selectedCategories, showImages } = body;

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? sessionId;

    if (!userId) {
      return NextResponse.json({ error: 'User or session required' }, { status: 401 });
    }

    const { data: existing } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('user_preferences')
        .update({
          selected_categories: selectedCategories,
          show_images: showImages,
        })
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          selected_categories: selectedCategories,
          show_images: showImages,
        });

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    );
  }
}