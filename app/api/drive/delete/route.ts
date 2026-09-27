import { NextRequest, NextResponse } from 'next/server';
import { deleteFromAdminDrive } from '@/lib/drive';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Extracts a clean Google Drive fileId from a URL or raw ID string.
 */
function extractDriveFileId(rawIdOrUrl?: string | null): string | null {
  if (!rawIdOrUrl) return null;
  const str = rawIdOrUrl.trim();

  // Pattern: id=([a-zA-Z0-9_-]+)
  const idParamMatch = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) return idParamMatch[1];

  // Pattern: /file/d/([a-zA-Z0-9_-]+)
  const fileDMatch = str.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) return fileDMatch[1];

  // Pattern: /folders/([a-zA-Z0-9_-]+)
  const folderMatch = str.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) return folderMatch[1];

  // Raw alphanumeric ID without slashes
  if (!str.includes('/') && !str.includes('?') && str.length > 5) {
    return str;
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileId, docId } = body;

    if (!docId && !fileId) {
      return NextResponse.json(
        { error: 'Either docId or fileId is required for deletion' },
        { status: 400 }
      );
    }

    // 1. Permanently delete from Google Drive if fileId is present
    let driveDeleteSuccess = true;
    const cleanFileId = extractDriveFileId(fileId);
    if (cleanFileId) {
      try {
        driveDeleteSuccess = await deleteFromAdminDrive(cleanFileId);
      } catch (driveErr) {
        console.warn('Drive deletion error (continuing with database cleanup):', driveErr);
      }
    }

    // 2. Permanently delete Firestore document from media_assets
    if (docId) {
      try {
        const assetRef = doc(db, 'media_assets', docId);
        await deleteDoc(assetRef);
      } catch (firestoreErr: any) {
        console.error('Firestore delete error in API route:', firestoreErr);
        return NextResponse.json(
          { 
            error: firestoreErr?.message || 'Failed to delete asset from Firestore',
            driveDeleted: driveDeleteSuccess
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Design asset permanently deleted from Trio INC. and Google Drive',
      fileId: cleanFileId,
      docId,
    });
  } catch (error: any) {
    console.error('Error handling Drive delete request:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error deleting asset' },
      { status: 500 }
    );
  }
}
