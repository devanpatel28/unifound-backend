import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { verifyToken } from '@/app/lib/middleware';
import { updateData } from '@/types';

// GET: Get current logged-in user's profile
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyToken(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, university_id, email, first_name, last_name, phone, profile_image_url, is_verified, created_at')
      .eq('id', authResult.userId)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      user,
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PATCH: Update current user's profile
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await verifyToken(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const { first_name, last_name, phone, profile_image_url } = body;

    // Only allow updating specific fields
    const updateData:updateData = {};
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (phone) updateData.phone = phone;
    if (profile_image_url !== undefined) updateData.profile_image_url = profile_image_url;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', authResult.userId)
      .select('id, university_id, email, first_name, last_name, phone, profile_image_url, is_verified')
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
