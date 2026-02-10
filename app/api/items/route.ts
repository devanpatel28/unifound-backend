import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/app/lib/supabase';
import { verifyToken } from '@/app/lib/middleware';

// GET: Fetch all items (public)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const item_type = searchParams.get('type'); // 'lost' or 'found'
    const category_id = searchParams.get('category');
    const is_claimed = searchParams.get('claimed');

    let query = supabase
      .from('items')
      .select(`
        *,
        users:user_id (first_name, last_name, phone, email),
        categories:category_id (name, icon_name)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (item_type) {
      query = query.eq('item_type', item_type);
    }

    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    if (is_claimed !== null) {
      query = query.eq('is_claimed', is_claimed === 'true');
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, items: data });

  } catch (error) {
    console.error('Fetch items error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}

// POST: Create new item (authenticated)
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyToken(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const {
      category_id,
      item_type,
      item_name,
      description,
      location,
      date_lost_found,
      images,
    } = body;

    // Validate required fields
    if (!category_id || !item_type || !item_name || !location || !date_lost_found) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: item, error } = await supabaseAdmin
      .from('items')
      .insert([{
        user_id: authResult.userId,
        category_id,
        item_type,
        item_name,
        description,
        location,
        date_lost_found,
        images: images || [],
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { success: true, item },
      { status: 201 }
    );

  } catch (error) {
    console.error('Create item error:', error);
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    );
  }
}
