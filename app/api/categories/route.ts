import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { handleOptions } from '@/lib/cors';

export { handleOptions as OPTIONS };

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    return NextResponse.json({ success: true, categories: data });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
