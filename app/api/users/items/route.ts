import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { verifyToken } from '@/app/lib/middleware';

// GET: Get all items posted by current user
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyToken(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const item_type = searchParams.get('type'); // 'lost' or 'found'
    const is_claimed = searchParams.get('claimed'); // 'true' or 'false'
    const is_active = searchParams.get('active'); // 'true' or 'false'

    let query = supabaseAdmin
      .from('items')
      .select(`
        *,
        categories:category_id (name, icon_name)
      `)
      .eq('user_id', authResult.userId)
      .order('created_at', { ascending: false });

    if (item_type) {
      query = query.eq('item_type', item_type);
    }

    if (is_claimed !== null) {
      query = query.eq('is_claimed', is_claimed === 'true');
    }

    if (is_active !== null) {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      items: data,
      count: data.length,
    });

  } catch (error) {
    console.error('Fetch user items error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}
