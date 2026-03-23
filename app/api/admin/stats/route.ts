import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import jwt from 'jsonwebtoken';
import { handleOptions } from '@/lib/cors';

export { handleOptions as OPTIONS };

export async function GET(request: NextRequest) {
  try {
    // Verify admin token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded: { role?: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as { role: string };
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Run all count queries in parallel for performance
    const [
      { count: total_users },
      { count: total_items },
      { count: lost_items },
      { count: found_items },
      { count: claimed_items },
      { count: total_categories },
    ] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('items').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('items').select('*', { count: 'exact', head: true }).eq('item_type', 'lost').eq('is_active', true).eq('is_claimed', false),
      supabaseAdmin.from('items').select('*', { count: 'exact', head: true }).eq('item_type', 'found').eq('is_active', true).eq('is_claimed', false),
      supabaseAdmin.from('items').select('*', { count: 'exact', head: true }).eq('is_claimed', true),
      supabaseAdmin.from('categories').select('*', { count: 'exact', head: true }).eq('is_active', true),
    ]);

    const stats = {
      total_users: total_users ?? 0,
      total_items: total_items ?? 0,
      lost_items: lost_items ?? 0,
      found_items: found_items ?? 0,
      claimed_items: claimed_items ?? 0,
      total_categories: total_categories ?? 0,
    };

    return NextResponse.json({ success: true, stats });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
