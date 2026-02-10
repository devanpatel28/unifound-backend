import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { verifyToken } from '@/app/lib/middleware';
import { updateData } from '@/types';

// GET: Get user by ID (public - limited info)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name, profile_image_url, created_at')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PATCH: Update user (self only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyToken(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { id } = await params;

    // Check if user is updating their own profile
    if (authResult.userId !== id) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only update your own profile' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { first_name, last_name, phone, profile_image_url } = body;

    const updateData: updateData = {};
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (phone) updateData.phone = phone;
    if (profile_image_url !== undefined) updateData.profile_image_url = profile_image_url;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, university_id, email, first_name, last_name, phone, profile_image_url')
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user,
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE: Delete user account (self only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyToken(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { id } = await params;

    // Check if user is deleting their own account
    if (authResult.userId !== id) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only delete your own account' },
        { status: 403 }
      );
    }

    // Delete user (CASCADE will delete all their items)
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
