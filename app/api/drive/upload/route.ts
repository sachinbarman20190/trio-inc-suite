import { NextRequest, NextResponse } from 'next/server';
import { uploadStreamToAdminDrive } from '@/lib/drive';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const runtime = 'nodejs';

// Handles video and media uploads via streaming multipart/form-data directly to Admin's 5 TB Drive
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as any) || 'general';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const mimeType = file.type || 'application/octet-stream';
    const fileName = file.name || `upload_${Date.now()}`;
    const fileSize = file.size;

    // Convert Web ReadableStream to Node.js Readable stream without buffering full video in memory
    const uploadResult = await uploadStreamToAdminDrive(
      () => Readable.fromWeb(file.stream() as any),
      fileName,
      mimeType,
      fileSize,
      category
    );

    return NextResponse.json({
      success: true,
      data: uploadResult,
      storageNote: uploadResult.isSimulated 
        ? 'Media ready (Local / Service Account fallback). Add GOOGLE_SERVICE_ACCOUNT_EMAIL to stream directly to 5 TB Drive.'
        : 'Uploaded directly to Admin 5 TB Google Drive quota.',
    });
  } catch (error: any) {
    console.error('Error handling Drive upload:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload media to Admin Drive' },
      { status: 500 }
    );
  }
}
