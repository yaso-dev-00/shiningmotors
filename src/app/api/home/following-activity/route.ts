import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const authHeader = req.headers.get('authorization');
    const userId = authHeader?.replace('Bearer ', '') || null;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        data: [],
      }, { status: 401 });
    }

    // Get followed user IDs
    const { data: follows, error: followsError } = await supabase
      // @ts-ignore - follows table not in types
      .from('follows')
      .select('following_id')
      .eq('user_id', userId);

    if (followsError || !follows || follows.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const followedIds = follows.map((f: any) => f.following_id);

    // Get recent posts from followed users
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*, profile:user_id(id, username, full_name, avatar_url)')
      .in('user_id', followedIds)
      .order('created_at', { ascending: false })
      .limit(6);

    if (postsError) {
      console.error('Error fetching following posts:', postsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch following posts',
        data: [],
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: posts || [],
    });
  } catch (error: any) {
    console.error('Error fetching following activity:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to fetch following activity',
        data: [],
      },
      { status: 500 }
    );
  }
}

