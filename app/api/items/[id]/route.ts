import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/app/lib/supabase';
import { verifyToken } from '@/app/lib/middleware';

// GET: Fetch single item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('items')
      .select(`
        *,
        users:user_id (first_name, last_name, phone, email),
        categories:category_id (name, icon_name)
      `)
      .eq('id', params.id)
      .eq('is_active', true)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, item: data });

  } catch (error) {
    return NextResponse.json(
      { error: 'Item not found' },
      { status: 404 }
    );
  }
}

// PATCH: Update item (owner only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyToken(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();

    // Verify ownership
    const { data: existingItem } = await supabaseAdmin
      .from('items')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (!existingItem || existingItem.user_id !== authResult.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('items')
      .update(body)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, item: data });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    );
  }
}

// DELETE: Delete item (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyToken(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    // Verify ownership
    const { data: existingItem } = await supabaseAdmin
      .from('items')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (!existingItem || existingItem.user_id !== authResult.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Soft delete
    const { error } = await supabaseAdmin
      .from('items')
      .update({ is_active: false })
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}
