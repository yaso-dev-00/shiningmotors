import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedServerClient } from '@/lib/supabase-server';
import type { Database } from '@/integrations/supabase/types';
import { revalidateTag, revalidatePath } from 'next/cache';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type SavedPostInsert = Database['public']['Tables']['saved_post']['Insert'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const userId = searchParams.get('userId');

    if (!postId || !userId) {
      return NextResponse.json(
        { error: 'postId and userId are required' },
        { status: 400 }
      );
    }

    // Get access token from Authorization header or request body
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '') || undefined;
    
    const supabase = await createAuthenticatedServerClient(accessToken);

    // Use select() instead of maybeSingle() to handle potential duplicates
    const { data, error } = await supabase
      .from('saved_post')
      .select()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error checking saved post:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Return true if any record exists (handle duplicates by checking array length)
    const isSaved = data && data.length > 0;

    return NextResponse.json(
      { isSaved },
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
    console.error('Error in GET /api/saved-posts:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to check saved post' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { post_id, user_id } = body as SavedPostInsert;

    if (!post_id || !user_id) {
      return NextResponse.json(
        { error: 'post_id and user_id are required' },
        { status: 400 }
      );
    }

    // Get access token from Authorization header or request body
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '') || undefined;
    
    const supabase = await createAuthenticatedServerClient(accessToken);

    // First check if post is already saved (handles race conditions and duplicates)
    const { data: existingRecords, error: checkError } = await supabase
      .from('saved_post')
      .select()
      .eq('post_id', post_id)
      .eq('user_id', user_id);

    if (checkError) {
      console.error('Error checking existing saved post:', checkError);
      // Continue with insert attempt
    } else if (existingRecords && existingRecords.length > 0) {
      // Post is already saved, return first existing record (handle duplicates)
      return NextResponse.json(
        { data: existingRecords[0], isAlreadySaved: true },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        }
      );
    }

    // Insert new saved post
    const { data, error } = await supabase
      .from('saved_post')
      .insert({ post_id, user_id })
      .select()
      .single();

    if (error) {
      // Check if it's a unique constraint violation (race condition - another request inserted it)
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique') || error.message?.includes('multiple')) {
        // Post was just saved by another request, fetch the existing record(s)
        const { data: existingRecords, error: fetchError } = await supabase
          .from('saved_post')
          .select()
          .eq('post_id', post_id)
          .eq('user_id', user_id);

        // If we have records, return the first one (or handle duplicates)
        if (existingRecords && existingRecords.length > 0) {
          // If there are duplicates, we'll return the first one
          // In a production system, you might want to clean up duplicates
          return NextResponse.json(
            { data: existingRecords[0], isAlreadySaved: true },
            {
              headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
              },
            }
          );
        }
      }

      console.error('Error saving post:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Revalidate saved posts cache for this user and post
    try {
      revalidateTag(`saved-posts-${user_id}`, 'max');
      revalidateTag(`saved-posts-${post_id}`, 'max');
      revalidateTag('saved-posts', 'max');
      // Revalidate any pages that might display saved posts
      revalidatePath('/profile', 'layout');
    } catch (revalidateError) {
      // Revalidation errors shouldn't fail the request
      console.warn('Revalidation warning:', revalidateError);
    }

    return NextResponse.json(
      { data },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error: any) {
    console.error('Error in POST /api/saved-posts:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save post' },
      { status: 500 }
    );
  }
}

