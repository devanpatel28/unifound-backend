import { NextRequest, NextResponse } from 'next/server';
import { imagekit } from '@/app/lib/imagekit';
import { verifyToken } from '@/app/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyToken(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');

    // Upload to ImageKit
    const result = await imagekit.upload({
      file: base64,
      fileName: file.name,
      folder: '/unifound',
    });

    return NextResponse.json({
      success: true,
      image: {
        file_id: result.fileId,
        url: result.url,
        thumbnail_url: result.thumbnailUrl || result.url,
      },
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
