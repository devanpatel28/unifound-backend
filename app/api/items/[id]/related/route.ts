import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/app/lib/supabase';
import { handleOptions } from '@/lib/cors';

export { handleOptions as OPTIONS };

// GET /api/items/[id]/related
// Returns active unclaimed items in the same category but opposite item_type
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch the source item to get its category and type
    const { data: source, error: srcError } = await supabase
      .from('items')
      .select('category_id, item_type')
      .eq('id', id)
      .single();

    if (srcError || !source) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const oppositeType = source.item_type === 'lost' ? 'found' : 'lost';

    const { data, error } = await supabaseAdmin
      .from('items')
      .select(`
        *,
        users:user_id (first_name, last_name, phone, email),
        categories:category_id (name, icon_name)
      `)
      .eq('category_id', source.category_id)
      .eq('item_type', oppositeType)
      .eq('is_active', true)
      .eq('is_claimed', false)
      .neq('id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return NextResponse.json({ success: true, items: data });

  } catch (error) {
    console.error('Related items error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch related items' },
      { status: 500 }
    );
  }
}
