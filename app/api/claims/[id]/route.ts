import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { verifyToken } from '@/app/lib/middleware';
import { handleOptions } from '@/lib/cors';

export { handleOptions as OPTIONS };

// GET /api/claims/[id] — fetch a single claim (claimant or item owner only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyToken(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;

    const { data: claim, error } = await supabaseAdmin
      .from('claims')
      .select(`
        *,
        items:item_id (
          id, item_name, item_type, location, date_lost_found, images, is_claimed,
          users:user_id (id, first_name, last_name, phone, email),
          categories:category_id (name, icon_name)
        ),
        claimants:claimant_id (
          id, first_name, last_name, phone, email, university_id
        )
      `)
      .eq('id', id)
      .single();

    if (error || !claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    // Only claimant or the item owner can view a specific claim
    const itemOwnerId = (claim.items as any)?.users?.id;
    if (claim.claimant_id !== authResult.userId && itemOwnerId !== authResult.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ success: true, claim });

  } catch (error) {
    console.error('Get claim error:', error);
    return NextResponse.json({ error: 'Failed to fetch claim' }, { status: 500 });
  }
}
