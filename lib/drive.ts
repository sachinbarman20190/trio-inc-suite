// Google Drive v3 Integration Helper
// Dedicates all file storage strictly to the Admin's 5 TB Google Drive quota
import { google } from 'googleapis';
import { Readable } from 'stream';
import crypto from 'crypto';

export interface UploadResult {
  fileId: string;
  name: string;
  mimeType: string;
  size?: string;
  previewUrl: string;
  downloadUrl: string;
  isSimulated?: boolean;
}

export interface ParsedServiceAccount {
  clientEmail: string | null;
  privateKey: string | null;
}

/**
 * Normalizes, extracts, and validates Service Account credentials from environment variables.
 * Handles:
 * - Whole JSON credentials pasted into GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
 * - Base64 encoded private keys
 * - Escaped newlines (\\n, \n, \r\n)
 * - Single/double/escaped quotation wrappers
 * - Malformed PEM line breaks between header/body/footer
 * - Pre-validates with Node crypto.createPrivateKey() to prevent OpenSSL DECODER unsupported crashes.
 */
export function parseServiceAccountCredentials(): ParsedServiceAccount {
  let rawEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() || null;
  let rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.trim() || null;

  if (!rawKey) {
    return { clientEmail: rawEmail, privateKey: null };
  }

  // 1. Check if user pasted the complete Service Account JSON file into GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  if (rawKey.startsWith('{') && rawKey.endsWith('}')) {
    try {
      const parsed = JSON.parse(rawKey);
      if (parsed.private_key) {
        rawKey = parsed.private_key;
      }
      if (!rawEmail && parsed.client_email) {
        rawEmail = parsed.client_email;
      }
    } catch {
      // Continue to other normalization attempts
    }
  }

  // 2. Check if the key was base64 encoded
  if (!rawKey.includes('BEGIN') && rawKey.length > 80) {
    try {
      const decoded = Buffer.from(rawKey, 'base64').toString('utf-8');
      if (decoded.includes('BEGIN') || decoded.startsWith('{')) {
        if (decoded.startsWith('{')) {
          try {
            const parsed = JSON.parse(decoded);
            if (parsed.private_key) rawKey = parsed.private_key;
            if (!rawEmail && parsed.client_email) rawEmail = parsed.client_email;
          } catch {
            rawKey = decoded;
          }
        } else {
          rawKey = decoded;
        }
      }
    } catch {
      // Not base64
    }
  }

  // 3. Strip outer quotation marks if present
  while (
    (rawKey.startsWith('"') && rawKey.endsWith('"')) ||
    (rawKey.startsWith("'") && rawKey.endsWith("'")) ||
    (rawKey.startsWith('\\"') && rawKey.endsWith('\\"'))
  ) {
    if (rawKey.startsWith('\\"')) {
      rawKey = rawKey.slice(2, -2).trim();
    } else {
      rawKey = rawKey.slice(1, -1).trim();
    }
  }

  // 4. Handle escaped newlines and carriage returns
  rawKey = rawKey
    .replace(/\\\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // 5. Standardize PEM header, body lines, and footer boundaries
  const pemMatch = rawKey.match(/(-----BEGIN [A-Z ]+KEY-----)([\s\S]*?)(-----END [A-Z ]+KEY-----)/);
  if (pemMatch) {
    const header = pemMatch[1].trim();
    const rawBody = pemMatch[2];
    const footer = pemMatch[3].trim();

    // Strip any invalid whitespace or corrupted characters from the base64 body
    const cleanBody = rawBody.replace(/[^A-Za-z0-9+/=]/g, '');
    // Wrap into standard 64-character PEM lines
    const formattedBody = cleanBody.match(/.{1,64}/g)?.join('\n') || cleanBody;
    rawKey = `${header}\n${formattedBody}\n${footer}\n`;
  }

  // 6. Test with Node crypto engine to verify OpenSSL compatibility before passing to google-auth-library
  try {
    crypto.createPrivateKey(rawKey);
    return { clientEmail: rawEmail, privateKey: rawKey };
  } catch {
    // If it had PKCS#1 RSA header, try converting to PKCS#8 standard header
    if (rawKey.includes('RSA PRIVATE KEY')) {
      const pkcs8Key = rawKey
        .replace('BEGIN RSA PRIVATE KEY', 'BEGIN PRIVATE KEY')
        .replace('END RSA PRIVATE KEY', 'END PRIVATE KEY');
      try {
        crypto.createPrivateKey(pkcs8Key);
        return { clientEmail: rawEmail, privateKey: pkcs8Key };
      } catch {
        // Continue
      }
    }

    // Try converting PKCS#8 to PKCS#1
    if (rawKey.includes('BEGIN PRIVATE KEY') && !rawKey.includes('RSA PRIVATE KEY')) {
      const pkcs1Key = rawKey
        .replace('BEGIN PRIVATE KEY', 'BEGIN RSA PRIVATE KEY')
        .replace('END PRIVATE KEY', 'END RSA PRIVATE KEY');
      try {
        crypto.createPrivateKey(pkcs1Key);
        return { clientEmail: rawEmail, privateKey: pkcs1Key };
      } catch {
        // Continue
      }
    }

    // Key is either invalid or placeholder. Suppress OpenSSL DECODER crash and return null
    console.warn(
      '[Google Drive Storage] GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is unparseable by OpenSSL. Falling back to in-app media storage.'
    );
    return { clientEmail: rawEmail, privateKey: null };
  }
}

/**
 * Initializes Google Drive v3 Client.
 * Supports:
 * 1. Service Account Credentials via env (GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)
 * 2. Fallback to resilient in-app persistent data URI streaming if credentials are invalid or pending configuration.
 */
export function getDriveClient() {
  const { clientEmail, privateKey } = parseServiceAccountCredentials();

  if (!clientEmail || !privateKey) {
    return null;
  }

  try {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file',
      ],
    });

    return google.drive({ version: 'v3', auth });
  } catch (err) {
    console.warn('[Google Drive Storage] Failed to initialize JWT client:', err);
    return null;
  }
}

/**
 * Upload stream to Google Drive folder directly using streaming without buffering in memory.
 * Accepts either a Readable stream or a stream factory function for safe retries/fallbacks.
 */
export async function uploadStreamToAdminDrive(
  fileStreamOrFactory: Readable | (() => Readable),
  fileName: string,
  mimeType: string,
  fileSize?: number,
  folderCategory: 'voice_notes' | 'doubts_and_updates' | 'ad_creatives' | 'general' = 'general'
): Promise<UploadResult> {
  const drive = getDriveClient();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (drive) {
    try {
      const fileMetadata = {
        name: `[Trio ${folderCategory.toUpperCase()}] ${Date.now()}_${fileName}`,
        parents: folderId ? [folderId] : undefined,
        description: `Uploaded to Trio INC. Hub (${folderCategory}) - Deducted from Admin 5 TB Quota`,
      };

      const streamForDrive = typeof fileStreamOrFactory === 'function' 
        ? fileStreamOrFactory() 
        : fileStreamOrFactory;

      const media = {
        mimeType,
        body: streamForDrive,
      };

      const res = await drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id, name, mimeType, webViewLink, webContentLink, size',
      });

      const fileId = res.data.id || `file_${Date.now()}`;

      // Set public/view permission so team members can play/view/download
      try {
        await drive.permissions.create({
          fileId,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        });
      } catch (e) {
        console.warn('Could not set public permission on drive file:', e);
      }

      const formattedSize = res.data.size
        ? `${(parseInt(res.data.size, 10) / (1024 * 1024)).toFixed(2)} MB`
        : fileSize
        ? `${(fileSize / (1024 * 1024)).toFixed(2)} MB`
        : 'HD Media';

      return {
        fileId,
        name: res.data.name || fileName,
        mimeType: res.data.mimeType || mimeType,
        size: formattedSize,
        previewUrl: res.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
        downloadUrl: res.data.webContentLink || `https://drive.google.com/uc?export=download&id=${fileId}`,
      };
    } catch (err) {
      console.error('Drive API upload failed, using fallback stream buffer:', err);
    }
  }

  // Fallback: If Google Service Account credentials are not yet entered in .env or OpenSSL cannot decode them,
  // stream chunks into playable Data URL.
  const streamForFallback = typeof fileStreamOrFactory === 'function'
    ? fileStreamOrFactory()
    : fileStreamOrFactory;

  const chunks: Buffer[] = [];
  for await (const chunk of streamForFallback) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const buffer = Buffer.concat(chunks);
  const base64Data = buffer.toString('base64');
  const dataUrl = `data:${mimeType};base64,${base64Data}`;
  const generatedId = `admin_drive_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  return {
    fileId: generatedId,
    name: fileName,
    mimeType,
    size: `${(buffer.length / 1024).toFixed(1)} KB`,
    previewUrl: dataUrl,
    downloadUrl: dataUrl,
    isSimulated: true,
  };
}

/**
 * Upload buffer or stream to Google Drive folder
 */
export async function uploadToAdminDrive(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  folderCategory: 'voice_notes' | 'doubts_and_updates' | 'ad_creatives' | 'general' = 'general'
): Promise<UploadResult> {
  return uploadStreamToAdminDrive(
    () => Readable.from(buffer),
    fileName,
    mimeType,
    buffer.length,
    folderCategory
  );
}
