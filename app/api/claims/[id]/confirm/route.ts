import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { verifyToken } from '@/app/lib/middleware';
import { handleOptions } from '@/lib/cors';

export { handleOptions as OPTIONS };

// PATCH /api/claims/[id]/confirm
// Only the found item owner can confirm. Sets status=confirmed and marks item is_claimed=true.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyToken(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;

    // Fetch claim and its item in one go
    const { data: claim, error: claimError } = await supabaseAdmin
      .from('claims')
      .select('*, items:item_id (id, user_id, is_claimed, is_active)')
      .eq('id', id)
      .single();

    if (claimError || !claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    // Only the item poster (finder/Person B) can confirm
    if (claim.items.user_id !== authResult.userId) {
      return NextResponse.json(
        { error: 'Only the item owner can confirm this claim' },
        { status: 403 }
      );
    }

    if (claim.status !== 'pending') {
      return NextResponse.json(
        { error: `Claim is already ${claim.status}` },
        { status: 409 }
      );
    }

    if (claim.items.is_claimed) {
      return NextResponse.json({ error: 'Item is already claimed' }, { status: 409 });
    }

    // Confirm claim
    const { data: updatedClaim, error: updateError } = await supabaseAdmin
      .from('claims')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Mark item as claimed — removes it from main public feed
    const { error: itemError } = await supabaseAdmin
      .from('items')
      .update({ is_claimed: true, claimed_at: new Date().toISOString() })
      .eq('id', claim.item_id);

    if (itemError) throw itemError;

    // Reject all other pending claims on the same item (only one can be confirmed)
    await supabaseAdmin
      .from('claims')
      .update({
        status: 'rejected',
        rejection_reason: 'Item was claimed by another person',
        rejected_at: new Date().toISOString(),
      })
      .eq('item_id', claim.item_id)
      .eq('status', 'pending')
      .neq('id', id);

    return NextResponse.json({ success: true, claim: updatedClaim });

  } catch (error) {
    console.error('Confirm claim error:', error);
    return NextResponse.json({ error: 'Failed to confirm claim' }, { status: 500 });
  }
}
