import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedServerClient } from '@/lib/supabase-server';
import type { Database } from '@/integrations/supabase/types';
import { revalidateTag, revalidatePath } from 'next/cache';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type CommentInsert = Database['public']['Tables']['comments']['Insert'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const limit = searchParams.get('limit');
    const orderBy = searchParams.get('orderBy') || 'desc'; // 'asc' or 'desc'

    if (!postId) {
      return NextResponse.json(
        { error: 'postId is required' },
        { status: 400 }
      );
    }

    // Get access token from Authorization header
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '') || undefined;
    
    const supabase = await createAuthenticatedServerClient(accessToken);

    let query = supabase
      .from('comments')
      .select(
        `
        *,
        profile:user_id (
          id,
          username,
          avatar_url,
          full_name
        )
      `,
        { count: 'exact' }
      )
      .eq('post_id', postId)
      .order('created_at', { ascending: orderBy === 'asc' });

    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        query = query.limit(limitNum);
      }
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: data || [], count: count || 0 },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    );
  } catch (error: any) {
    console.error('Error in GET /api/comments:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { post_id, user_id, content, parent_id } = body as CommentInsert & {
      parent_id?: string | null;
    };

    if (!post_id || !user_id || !content) {
      return NextResponse.json(
        { error: 'post_id, user_id, and content are required' },
        { status: 400 }
      );
    }

    // Get access token from Authorization header
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '') || undefined;
    
    const supabase = await createAuthenticatedServerClient(accessToken);

    // Insert new comment
    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id,
        user_id,
        content,
        parent_id: parent_id || null,
      })
      .select(
        `
        *,
        profile:user_id (
          id,
          username,
          avatar_url,
          full_name
        )
      `
      )
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Revalidate comments cache for this post
    try {
      revalidateTag(`comments-${post_id}`, 'max');
      revalidateTag('comments', 'max');
      // Revalidate post detail pages that display comments
      revalidatePath(`/social/post/${post_id}`, 'page');
      revalidatePath('/social', 'layout');
    } catch (revalidateError) {
      // Revalidation errors shouldn't fail the request
      console.warn('Revalidation warning:', revalidateError);
    }

    return NextResponse.json(
      { data },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    );
  } catch (error: any) {
    console.error('Error in POST /api/comments:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create comment' },
      { status: 500 }
    );
  }
}

