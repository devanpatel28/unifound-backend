import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { verifyToken } from '@/app/lib/middleware';
import { handleOptions } from '@/lib/cors';

export { handleOptions as OPTIONS };

// POST /api/claims — raise a claim on a found item
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyToken(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { item_id, message } = await request.json();

    if (!item_id) {
      return NextResponse.json({ error: 'item_id is required' }, { status: 400 });
    }

    // Validate the item exists, is found type, active, and not already claimed
    const { data: item, error: itemError } = await supabaseAdmin
      .from('items')
      .select('id, item_type, is_active, is_claimed, user_id')
      .eq('id', item_id)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (item.item_type !== 'found') {
      return NextResponse.json(
        { error: 'You can only claim a found item' },
        { status: 400 }
      );
    }

    if (!item.is_active) {
      return NextResponse.json({ error: 'Item is no longer active' }, { status: 400 });
    }

    if (item.is_claimed) {
      return NextResponse.json({ error: 'Item is already claimed' }, { status: 409 });
    }

    if (item.user_id === authResult.userId) {
      return NextResponse.json(
        { error: 'You cannot claim your own item' },
        { status: 400 }
      );
    }

    // Insert claim (UNIQUE constraint handles duplicate claims gracefully)
    const { data: claim, error: claimError } = await supabaseAdmin
      .from('claims')
      .insert([{
        item_id,
        claimant_id: authResult.userId,
        message: message ?? null,
        status: 'pending',
      }])
      .select()
      .single();

    if (claimError) {
      if (claimError.code === '23505') {
        return NextResponse.json(
          { error: 'You have already raised a claim on this item' },
          { status: 409 }
        );
      }
      throw claimError;
    }

    return NextResponse.json({ success: true, claim }, { status: 201 });

  } catch (error) {
    console.error('Create claim error:', error);
    return NextResponse.json({ error: 'Failed to create claim' }, { status: 500 });
  }
}
