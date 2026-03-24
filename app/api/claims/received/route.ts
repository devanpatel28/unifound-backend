import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { verifyToken } from '@/app/lib/middleware';
import { handleOptions } from '@/lib/cors';

export { handleOptions as OPTIONS };

// GET /api/claims/received — all claims on items I posted (as item owner/finder)
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyToken(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // optional: pending | confirmed | rejected

    // First get all found item IDs that belong to this user
    const { data: myItems, error: itemsError } = await supabaseAdmin
      .from('items')
      .select('id')
      .eq('user_id', authResult.userId)
      .eq('item_type', 'found');

    if (itemsError) throw itemsError;

    if (!myItems || myItems.length === 0) {
      return NextResponse.json({ success: true, claims: [] });
    }

    const myItemIds = myItems.map((i) => i.id);

    let query = supabaseAdmin
      .from('claims')
      .select(`
        *,
        items:item_id (
          id, item_name, item_type, location, date_lost_found, images, is_claimed
        ),
        claimants:claimant_id (
          id, first_name, last_name, phone, email, university_id
        )
      `)
      .in('item_id', myItemIds)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, claims: data });

  } catch (error) {
    console.error('Get received claims error:', error);
    return NextResponse.json({ error: 'Failed to fetch received claims' }, { status: 500 });
  }
}
