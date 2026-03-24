import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { verifyToken } from '@/app/lib/middleware';
import { handleOptions } from '@/lib/cors';

export { handleOptions as OPTIONS };

// GET /api/claims/my — all claims I have raised (as claimant)
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyToken(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // optional filter: pending | confirmed | rejected

    let query = supabaseAdmin
      .from('claims')
      .select(`
        *,
        items:item_id (
          id, item_name, item_type, location, date_lost_found,
          images, is_claimed, is_active,
          users:user_id (first_name, last_name, phone, email),
          categories:category_id (name, icon_name)
        )
      `)
      .eq('claimant_id', authResult.userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, claims: data });

  } catch (error) {
    console.error('Get my claims error:', error);
    return NextResponse.json({ error: 'Failed to fetch claims' }, { status: 500 });
  }
}
