import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { verifyToken } from '@/app/lib/middleware';
import { handleOptions } from '@/lib/cors';

export { handleOptions as OPTIONS };

// PATCH /api/claims/[id]/reject
// Only the found item owner can reject. rejection_reason is mandatory.
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
    const { rejection_reason } = await request.json();

    if (!rejection_reason || !rejection_reason.trim()) {
      return NextResponse.json(
        { error: 'rejection_reason is required' },
        { status: 400 }
      );
    }

    // Fetch claim with its item
    const { data: claim, error: claimError } = await supabaseAdmin
      .from('claims')
      .select('*, items:item_id (user_id)')
      .eq('id', id)
      .single();

    if (claimError || !claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    // Only the item poster (finder/Person B) can reject
    if (claim.items.user_id !== authResult.userId) {
      return NextResponse.json(
        { error: 'Only the item owner can reject this claim' },
        { status: 403 }
      );
    }

    if (claim.status !== 'pending') {
      return NextResponse.json(
        { error: `Claim is already ${claim.status}` },
        { status: 409 }
      );
    }

    const { data: updatedClaim, error: updateError } = await supabaseAdmin
      .from('claims')
      .update({
        status: 'rejected',
        rejection_reason: rejection_reason.trim(),
        rejected_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, claim: updatedClaim });

  } catch (error) {
    console.error('Reject claim error:', error);
    return NextResponse.json({ error: 'Failed to reject claim' }, { status: 500 });
  }
}
