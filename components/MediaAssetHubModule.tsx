'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Search, 
  Download, 
  Maximize2, 
  Share2, 
  UploadCloud, 
  FolderGit2, 
  CheckCircle2, 
  Layers, 
  FileText, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Heart, 
  Check, 
  SlidersHorizontal,
  HardDrive,
  Info,
  Tag,
  ExternalLink,
  Printer,
  Star,
  FileCheck,
  AlertCircle,
  Loader2,
  Trash2
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  increment 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { useNotification } from '@/lib/notification-context';
import { MediaAssetItem, MediaAssetCategory } from '@/lib/types';

const CATEGORIES: MediaAssetCategory[] = [
  'All Assets',
  'T-Shirt Prints',
  'Hoodies & Winter',
  'Mockup Renders',
  'Social Media / Posters',
  'DTF Vectors',
];

type SortOption = 'newest' | 'file-size' | 'popular' | 'title';

interface UploadQueueItem {
  id: string;
  name: string;
  size: string;
  progress: number;
  statusText?: string;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

function formatFileSize(bytes: number): string {
  if (!bytes || isNaN(bytes)) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function determineCategory(fileName: string, mimeType: string): MediaAssetItem['category'] {
  const name = fileName.toLowerCase();
  if (name.includes('hoodie') || name.includes('winter') || name.includes('fleece') || name.includes('jacket') || name.includes('sweatshirt')) {
    return 'Hoodies & Winter';
  }
  if (name.includes('mockup') || name.includes('render') || name.includes('model') || name.includes('mannequin') || name.includes('simulation')) {
    return 'Mockup Renders';
  }
  if (name.includes('poster') || name.includes('reel') || name.includes('story') || name.includes('ad') || name.includes('social') || name.includes('feed')) {
    return 'Social Media / Posters';
  }
  if (name.includes('vector') || name.includes('dtf') || name.includes('film') || name.endsWith('.ai') || name.endsWith('.svg')) {
    return 'DTF Vectors';
  }
  return 'T-Shirt Prints';
}

function determineFormat(fileName: string, mimeType: string): MediaAssetItem['format'] {
  const ext = fileName.split('.').pop()?.toUpperCase() || '';
  if (['PNG', 'PSD', 'AI', 'SVG', 'TIFF', 'PDF', 'JPG'].includes(ext)) {
    return ext as any;
  }
  if (mimeType.includes('png')) return 'PNG';
  if (mimeType.includes('svg')) return 'SVG';
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'JPG';
  if (mimeType.includes('tiff')) return 'TIFF';
  return 'PNG';
}

/**
 * High-speed XHR uploader with accurate byte tracking:
 * - 0% - 90%: Real network upload from device to server
 * - 90% - 99%: "Syncing to 5 TB Drive..." while backend finishes Drive API streaming & Firestore commit
 * - 100%: "Done! 🎉" on response
 */
function uploadFileWithXHR(
  file: File,
  category: string,
  onProgress: (percent: number, statusText: string) => void,
  uploaderEmail?: string,
  uploaderName?: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (uploaderEmail) formData.append('uploadedBy', uploaderEmail);
    if (uploaderName) formData.append('uploadedByName', uploaderName);

    // Initial state
    onProgress(5, 'Preparing file...');

    let syncInterval: ReturnType<typeof setInterval> | null = null;

    // 0% - 90%: Real network upload from device to server
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) {
        const ratio = e.loaded / e.total;
        const mappedPercent = Math.min(90, Math.max(5, Math.round(ratio * 85 + 5)));
        const mbLoaded = (e.loaded / (1024 * 1024)).toFixed(1);
        const mbTotal = (e.total / (1024 * 1024)).toFixed(1);
        onProgress(mappedPercent, `Uploading (${mbLoaded}/${mbTotal} MB)...`);
      }
    };

    // When network upload finishes, server is streaming buffer to Google Drive & committing to Firestore
    xhr.upload.onload = () => {
      onProgress(92, 'Syncing to 5 TB Drive...');
      let current = 92;
      syncInterval = setInterval(() => {
        if (current < 99) {
          current += 1;
          onProgress(current, 'Syncing to 5 TB Drive...');
        }
      }, 350);
    };

    xhr.onload = () => {
      if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.success) {
            onProgress(100, 'Done! 🎉');
            resolve(res);
          } else {
            reject(new Error(res.error || 'Server reported failure'));
          }
        } catch {
          reject(new Error('Invalid response from server'));
        }
      } else {
        try {
          const errRes = JSON.parse(xhr.responseText);
          reject(new Error(errRes.error || `Upload failed with HTTP ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with HTTP ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      if (syncInterval) clearInterval(syncInterval);
      reject(new Error('Network error during upload'));
    };

    xhr.ontimeout = () => {
      if (syncInterval) clearInterval(syncInterval);
      reject(new Error('Upload timed out'));
    };

    // 45s client timeout
    xhr.timeout = 45000;
    xhr.open('POST', '/api/drive/upload', true);
    xhr.send(formData);
  });
}

export function MediaAssetHubModule() {
  const { user, currentUser, teamMember, isAdmin } = useAuth();
  const { triggerToast } = useNotification();

  // Current authenticated user's email
  const userEmail = (currentUser?.email || user?.email || teamMember?.email || '').trim().toLowerCase();

  // Firestore live assets state
  const [assets, setAssets] = useState<MediaAssetItem[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState<boolean>(true);
  const [pinnedSpotlightId, setPinnedSpotlightId] = useState<string | null>(null);

  // Filters & sorting
  const [selectedCategory, setSelectedCategory] = useState<MediaAssetCategory>('All Assets');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Drag & drop & file upload state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isUploadingBatch, setIsUploadingBatch] = useState(false);
  const [showQueueDrawer, setShowQueueDrawer] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Lightbox Modal state
  const [lightboxAsset, setLightboxAsset] = useState<MediaAssetItem | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Deletion Confirmation Dialog state
  const [assetToDelete, setAssetToDelete] = useState<MediaAssetItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Detailed Upload Modal state (for setting custom specs)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<MediaAssetItem['category']>('T-Shirt Prints');
  const [uploadFormat, setUploadFormat] = useState<MediaAssetItem['format']>('PNG');
  const [uploadResolution, setUploadResolution] = useState('300 DPI CMYK');
  const [uploadDimensions, setUploadDimensions] = useState('4500 x 5400 px');
  const [uploadTags, setUploadTags] = useState('Oversized Tee, DTF, Print Ready');
  const [isCustomUploading, setIsCustomUploading] = useState(false);
  const [customProgress, setCustomProgress] = useState(0);

  // Check if current user is Admin (sachinbarman20190@gmail.com) OR the original uploader
  const canDeleteAsset = (asset?: MediaAssetItem | null): boolean => {
    if (!asset) return false;
    const currentEmail = (userEmail || teamMember?.email || '').trim().toLowerCase();
    // Admin (Sachin) can delete any asset
    if (currentEmail === 'sachinbarman20190@gmail.com' || isAdmin) return true;
    
    // Any member who uploaded the asset can delete their own asset
    const uploaderEmail = (asset.uploaderEmail || '').trim().toLowerCase();
    const uploadedBy = (asset.uploadedBy || '').trim().toLowerCase();
    if (uploaderEmail && uploaderEmail === currentEmail) return true;
    if (uploadedBy && uploadedBy === currentEmail) return true;
    return false;
  };

  // 1. LISTEN TO FIRESTORE: Live Real-Time sync with collection `media_assets`
  // Avoids brittle multi-field compound indexes that freeze onSnapshot
  useEffect(() => {
    setIsLoadingAssets(true);
    const q = collection(db, 'media_assets');

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          const fileId = d.fileId || '';
          const directLink = fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : '';
          const driveLink = d.driveViewLink || d.driveLink || d.driveUrl || (fileId ? `https://drive.google.com/file/d/${fileId}/view` : '');
          const downloadLink = d.driveDownloadLink || d.downloadUrl || d.webContentLink || directLink || d.previewUrl || '';
          const previewLink = d.driveDownloadLink || d.previewUrl || directLink || d.downloadUrl || '';

          // Determine numeric timestamp for ultra-reliable sorting without index crashes
          let createdAtMs = typeof d.createdAtMs === 'number' ? d.createdAtMs : undefined;
          if (!createdAtMs) {
            if (d.uploadedAt?.toMillis) {
              createdAtMs = d.uploadedAt.toMillis();
            } else if (d.createdAt) {
              const parsed = new Date(d.createdAt).getTime();
              createdAtMs = isNaN(parsed) ? 0 : parsed;
            } else {
              createdAtMs = 0;
            }
          }

          return {
            id: docSnap.id,
            title: d.title || d.name || 'UNTITLED ASSET',
            name: d.name || d.title || 'UNTITLED ASSET',
            category: d.category || 'T-Shirt Prints',
            format: d.format || 'PNG',
            resolution: d.resolution || '300 DPI CMYK',
            dimensions: d.dimensions || 'High-Res Master',
            fileSize: d.fileSize || (d.size ? formatFileSize(d.size) : 'Unknown Size'),
            fileSizeBytes: d.fileSizeBytes || d.size || 0,
            downloadsCount: d.downloadsCount || 0,
            likesCount: d.likesCount || 0,
            uploadedBy: d.uploadedByName || d.uploadedBy || 'Trio Member',
            uploadedByName: d.uploadedByName || d.uploadedBy || 'Trio Member',
            uploaderEmail: d.uploaderEmail || d.uploadedBy || '',
            uploaderAvatar: d.uploaderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
            createdAt: d.createdAt || (createdAtMs ? new Date(createdAtMs).toISOString() : new Date().toISOString()),
            createdAtMs,
            uploadedAt: d.uploadedAt?.toDate ? d.uploadedAt.toDate().toISOString() : (d.uploadedAt || d.createdAt || new Date().toISOString()),
            driveFolder: d.driveFolder || 'Trio-INC-Drive / 02_PrintReady_Assets',
            driveLink,
            driveViewLink: driveLink,
            driveUrl: driveLink,
            fileId,
            previewUrl: previewLink,
            downloadUrl: downloadLink,
            driveDownloadLink: downloadLink,
            masterDownloadUrl: d.masterDownloadUrl || d.webContentLink || downloadLink,
            webContentLink: d.webContentLink || downloadLink,
            tags: Array.isArray(d.tags) ? d.tags : ['PrintReady'],
            isSpotlight: Boolean(d.isSpotlight),
            isFeatured: Boolean(d.isFeatured),
            mimeType: d.mimeType || '',
            colorway: d.colorway || 'Standard Print Ready',
            mockupGarment: d.mockupGarment || 'Premium Print Garment',
          } as MediaAssetItem;
        });

        // Sort in memory by timestamp to avoid missing index errors
        docs.sort((a: any, b: any) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
        setAssets(docs);
        setIsLoadingAssets(false);
      },
      (error) => {
        console.error('Firestore media assets listener error:', error);
        setIsLoadingAssets(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. LISTEN TO SYSTEM SETTINGS FOR PINNED SPOTLIGHT HERO
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system', 'media_settings'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data?.spotlightAssetId) {
          setPinnedSpotlightId(data.spotlightAssetId);
        } else {
          setPinnedSpotlightId(null);
        }
      }
    }, (err) => {
      console.warn('System media_settings info:', err);
    });
    return () => unsub();
  }, []);

  // 3. DYNAMIC HERO SPOTLIGHT DETERMINATION:
  // Whichever asset is pinned (or has isSpotlight / isFeatured), otherwise defaults to the newest uploaded design
  const spotlightAsset = useMemo(() => {
    if (assets.length === 0) return null;
    if (pinnedSpotlightId) {
      const found = assets.find((a) => a.id === pinnedSpotlightId);
      if (found) return found;
    }
    return assets.find((a) => a.isFeatured || a.isSpotlight) || assets[0] || null;
  }, [assets, pinnedSpotlightId]);

  // Set as Hero Spotlight Handler
  const handleSetHeroSpotlight = async (asset: MediaAssetItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setPinnedSpotlightId(asset.id);
      
      // Update system settings document in Firestore
      await setDoc(doc(db, 'system', 'media_settings'), {
        spotlightAssetId: asset.id,
        updatedAt: new Date().toISOString(),
        updatedBy: teamMember?.displayName || 'Trio Member'
      }, { merge: true });

      // Also update asset record
      await updateDoc(doc(db, 'media_assets', asset.id), {
        isFeatured: true,
        isSpotlight: true
      });

      triggerToast({
        type: 'system',
        title: '⭐ Hero Spotlight Updated',
        snippet: `"${asset.title}" is now pinned to the top Hero Banner.`,
        targetTab: 'media-hub'
      });
    } catch (err) {
      console.error('Failed to set hero spotlight:', err);
    }
  };

  // 4. SAFE DESIGN DELETION (HERO FALLBACK + GOOGLE DRIVE + FIRESTORE CLEANUP)
  const handleConfirmDelete = async () => {
    if (!assetToDelete) return;
    setIsDeleting(true);

    const targetId = assetToDelete.id;
    const targetFileId = assetToDelete.fileId || assetToDelete.driveUrl || assetToDelete.driveLink || assetToDelete.previewUrl;
    const wasHeroSpotlight = (spotlightAsset?.id === targetId) || (pinnedSpotlightId === targetId);

    try {
      // 1. Hero Spotlight Fallback Handling
      if (wasHeroSpotlight) {
        const remaining = assets.filter((a) => a.id !== targetId);
        const nextHero = remaining[0] || null;

        if (nextHero) {
          await setDoc(doc(db, 'system', 'media_settings'), {
            spotlightAssetId: nextHero.id,
            updatedAt: new Date().toISOString(),
            updatedBy: teamMember?.displayName || 'Trio Member'
          }, { merge: true });
          setPinnedSpotlightId(nextHero.id);
        } else {
          await setDoc(doc(db, 'system', 'media_settings'), {
            spotlightAssetId: null,
            updatedAt: new Date().toISOString(),
            updatedBy: teamMember?.displayName || 'Trio Member'
          }, { merge: true });
          setPinnedSpotlightId(null);
        }
      }

      // 2. Call backend Google Drive deletion endpoint
      const deleteResponse = await fetch('/api/drive/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: targetFileId,
          docId: targetId
        })
      });

      if (!deleteResponse.ok) {
        const errPayload = await deleteResponse.json().catch(() => ({}));
        console.warn('Backend delete response info:', errPayload);
      }

      // 3. Client-side Firestore delete safeguard & optimistic state removal
      try {
        await deleteDoc(doc(db, 'media_assets', targetId));
      } catch (err) {
        console.warn('Client deleteDoc note:', err);
      }
      setAssets((prev) => prev.filter((a) => a.id !== targetId));

      // 4. Close Lightbox Modal if the currently opened asset was deleted
      if (lightboxAsset?.id === targetId) {
        setLightboxAsset(null);
      }

      // 5. Real-time feedback toast
      triggerToast({
        type: 'system',
        title: 'Design Removed',
        snippet: '🗑️ Asset permanently removed from Workspace & Drive',
        targetTab: 'media-hub'
      });
    } catch (err: any) {
      console.error('Error during deletion:', err);
      triggerToast({
        type: 'system',
        title: 'Delete Warning',
        snippet: err?.message || 'Could not completely remove asset',
        targetTab: 'media-hub'
      });
    } finally {
      setIsDeleting(false);
      setAssetToDelete(null);
    }
  };

  // 5. BATCH MULTI-FILE UPLOAD LOGIC WITH CONCURRENCY CONTROL (UP TO 3 CONCURRENT FILES)
  const handleUploadFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;
    setIsUploadingBatch(true);
    setShowQueueDrawer(true);

    const initialQueue: UploadQueueItem[] = files.map((f, i) => ({
      id: `up-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
      name: f.name,
      size: formatFileSize(f.size),
      progress: 5,
      statusText: 'Waiting in queue...',
      status: 'uploading' as const,
    }));

    setUploadQueue((prev) => [...initialQueue, ...prev]);

    // Worker function for an individual file upload
    const uploadSingleBatchFile = async (file: File, qId: string) => {
      try {
        const response = await uploadFileWithXHR(
          file,
          'media_assets',
          (percent, statusText) => {
            setUploadQueue((prev) =>
              prev.map((item) =>
                item.id === qId ? { ...item, progress: percent, statusText } : item
              )
            );
          },
          userEmail || teamMember?.email || 'sachinbarman20190@gmail.com',
          teamMember?.displayName || 'Trio Member'
        );

        const driveData = response.data || response;
        const serverDocId = response.docId || driveData.docId || driveData.id;

        const titleClean = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').toUpperCase();
        const category = determineCategory(file.name, file.type);
        const format = determineFormat(file.name, file.type);
        const directLink = driveData.fileId ? `https://lh3.googleusercontent.com/d/${driveData.fileId}` : '';
        const downloadUrl = driveData.driveDownloadLink || directLink || driveData.downloadUrl;
        const driveLink = driveData.driveViewLink || driveData.previewUrl || driveData.downloadUrl;

        // If for any rare reason server failed to write docId, write client-side
        let finalDocId = serverDocId;
        if (!finalDocId || finalDocId.startsWith('asset_')) {
          const assetDocClient = {
            name: file.name,
            title: titleClean,
            fileId: driveData.fileId || '',
            driveViewLink: driveLink,
            driveDownloadLink: downloadUrl,
            webContentLink: driveData.webContentLink || downloadUrl,
            size: file.size,
            mimeType: file.type || 'application/octet-stream',
            category,
            uploadedBy: userEmail || teamMember?.email || 'sachinbarman20190@gmail.com',
            uploadedByName: teamMember?.displayName || 'Trio Member',
            createdAtMs: Date.now(),
            isFeatured: false,
            format,
            resolution: format === 'SVG' || format === 'AI' ? 'Vector Scalable' : '300 DPI CMYK',
            dimensions: 'Print-Ready Master',
            fileSize: formatFileSize(file.size),
            fileSizeBytes: file.size,
            downloadsCount: 0,
            likesCount: 0,
            uploaderEmail: userEmail || teamMember?.email || '',
            uploaderAvatar: teamMember?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
            createdAt: new Date().toISOString(),
            uploadedAt: new Date().toISOString(),
            driveFolder: 'Trio-INC-Drive / 02_PrintReady_Assets',
            driveLink,
            driveUrl: driveLink,
            downloadUrl,
            masterDownloadUrl: driveData.webContentLink || downloadUrl,
            previewUrl: downloadUrl,
            tags: ['PrintReady', category, format],
            isSpotlight: false,
            colorway: 'Standard Print Ready',
            mockupGarment: category === 'Hoodies & Winter' ? '400 GSM Fleece Hoodie' : 'Heavyweight 240 GSM Tee',
          };
          const addedDocRef = await addDoc(collection(db, 'media_assets'), assetDocClient);
          finalDocId = addedDocRef.id;
        }

        const newAssetItem: MediaAssetItem = {
          id: finalDocId,
          title: response.title || titleClean,
          name: response.name || file.name,
          category: response.category || category,
          format: response.format || format,
          resolution: response.resolution || (format === 'SVG' || format === 'AI' ? 'Vector Scalable' : '300 DPI CMYK'),
          dimensions: response.dimensions || 'Print-Ready Master',
          fileSize: formatFileSize(file.size),
          fileSizeBytes: file.size,
          size: file.size,
          downloadsCount: 0,
          likesCount: 0,
          uploadedBy: teamMember?.displayName || 'Trio Member',
          uploadedByName: teamMember?.displayName || 'Trio Member',
          uploaderEmail: userEmail || teamMember?.email || '',
          uploaderAvatar: teamMember?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
          createdAt: new Date().toISOString(),
          createdAtMs: response.createdAtMs || Date.now(),
          uploadedAt: new Date().toISOString(),
          driveFolder: 'Trio-INC-Drive / 02_PrintReady_Assets',
          driveLink,
          driveViewLink: driveLink,
          driveUrl: driveLink,
          fileId: driveData.fileId || '',
          downloadUrl,
          driveDownloadLink: downloadUrl,
          masterDownloadUrl: driveData.webContentLink || downloadUrl,
          webContentLink: driveData.webContentLink || downloadUrl,
          previewUrl: downloadUrl,
          tags: ['PrintReady', category, format],
          isSpotlight: false,
          isFeatured: false,
          mimeType: file.type || 'application/octet-stream',
          colorway: 'Standard Print Ready',
          mockupGarment: category === 'Hoodies & Winter' ? '400 GSM Fleece Hoodie' : 'Heavyweight 240 GSM Tee',
        };

        // Optimistically append to local UI immediately so card appears with zero delay
        setAssets((prev) => [newAssetItem, ...prev.filter((a) => a.id !== newAssetItem.id)]);

        // Auto-set as Hero Spotlight if first asset in library
        if (assets.length === 0) {
          await setDoc(doc(db, 'system', 'media_settings'), {
            spotlightAssetId: finalDocId,
            updatedAt: new Date().toISOString(),
            updatedBy: teamMember?.displayName || 'Trio Member'
          }, { merge: true });
        }

        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === qId
              ? { ...item, progress: 100, status: 'completed', statusText: 'Done! 🎉' }
              : item
          )
        );

        triggerToast({
          type: 'system',
          title: 'Asset Uploaded to 5 TB Drive',
          snippet: `"${file.name}" saved to Google Drive and synced to team vault.`,
          targetTab: 'media-hub'
        });
      } catch (err: any) {
        console.error('File upload error:', err);
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === qId
              ? { ...item, status: 'error', error: err?.message || 'Upload failed', statusText: 'Error' }
              : item
          )
        );
        triggerToast({
          type: 'system',
          title: 'Upload Failed',
          snippet: `Could not upload "${file.name}": ${err?.message || 'Network error'}`,
          targetTab: 'media-hub'
        });
      }
    };

    // CONCURRENCY CONTROL: Process up to 3 files concurrently using Promise.allSettled
    const CONCURRENCY_LIMIT = 3;
    for (let i = 0; i < files.length; i += CONCURRENCY_LIMIT) {
      const fileBatch = files.slice(i, i + CONCURRENCY_LIMIT);
      await Promise.allSettled(
        fileBatch.map((file, batchIdx) =>
          uploadSingleBatchFile(file, initialQueue[i + batchIdx].id)
        )
      );
    }

    setIsUploadingBatch(false);
  };

  // 6. CUSTOM SPEC MODAL UPLOAD
  const handleCustomUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFile) {
      triggerToast({
        type: 'system',
        title: 'File Required',
        snippet: 'Please select a file to upload.',
        targetTab: 'media-hub'
      });
      return;
    }

    setIsCustomUploading(true);
    setCustomProgress(5);

    try {
      const response = await uploadFileWithXHR(
        customFile,
        uploadCategory,
        (percent) => {
          setCustomProgress(percent);
        },
        userEmail || teamMember?.email || 'sachinbarman20190@gmail.com',
        teamMember?.displayName || 'Trio Member'
      );

      const driveData = response.data || response;
      const serverDocId = response.docId || driveData.docId || driveData.id;
      const directLink = driveData.fileId ? `https://lh3.googleusercontent.com/d/${driveData.fileId}` : '';
      const downloadUrl = driveData.driveDownloadLink || directLink || driveData.downloadUrl;
      const driveLink = driveData.driveViewLink || driveData.previewUrl || driveData.downloadUrl;

      const customTitle = uploadTitle.trim().toUpperCase() || customFile.name.replace(/\.[^/.]+$/, '').toUpperCase();
      const customTags = uploadTags.split(',').map((t) => t.trim()).filter(Boolean);

      const customSpecDoc = {
        title: customTitle,
        category: uploadCategory,
        format: uploadFormat,
        resolution: uploadResolution,
        dimensions: uploadDimensions,
        tags: customTags,
        colorway: 'Custom Print Ready',
        mockupGarment: uploadCategory === 'Hoodies & Winter' ? '400 GSM Fleece Hoodie' : 'Heavyweight Box-Fit 260 GSM Tee'
      };

      let finalDocId = serverDocId;
      if (finalDocId && !finalDocId.startsWith('asset_')) {
        try {
          await updateDoc(doc(db, 'media_assets', finalDocId), customSpecDoc);
        } catch (e) {
          console.warn('Update custom spec notice:', e);
        }
      } else {
        const fullDoc = {
          name: customFile.name,
          title: customTitle,
          fileId: driveData.fileId || '',
          driveViewLink: driveLink,
          driveDownloadLink: downloadUrl,
          webContentLink: driveData.webContentLink || downloadUrl,
          size: customFile.size,
          mimeType: customFile.type || 'application/octet-stream',
          uploadedBy: userEmail || teamMember?.email || 'sachinbarman20190@gmail.com',
          uploadedByName: teamMember?.displayName || 'Trio Member',
          createdAtMs: Date.now(),
          isFeatured: false,
          fileSize: formatFileSize(customFile.size),
          fileSizeBytes: customFile.size,
          downloadsCount: 0,
          likesCount: 0,
          uploaderEmail: userEmail || teamMember?.email || '',
          uploaderAvatar: teamMember?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
          createdAt: new Date().toISOString(),
          uploadedAt: new Date().toISOString(),
          driveFolder: 'Trio-INC-Drive / 02_PrintReady_Assets',
          driveLink,
          driveUrl: driveLink,
          downloadUrl,
          masterDownloadUrl: driveData.webContentLink || downloadUrl,
          previewUrl: downloadUrl,
          isSpotlight: false,
          ...customSpecDoc,
        };
        const added = await addDoc(collection(db, 'media_assets'), fullDoc);
        finalDocId = added.id;
      }

      // Optimistically append to local UI immediately
      const localItem: MediaAssetItem = {
        id: finalDocId,
        title: customTitle,
        name: customFile.name,
        category: uploadCategory,
        format: uploadFormat,
        resolution: uploadResolution,
        dimensions: uploadDimensions,
        fileSize: formatFileSize(customFile.size),
        fileSizeBytes: customFile.size,
        size: customFile.size,
        downloadsCount: 0,
        likesCount: 0,
        uploadedBy: teamMember?.displayName || 'Trio Member',
        uploadedByName: teamMember?.displayName || 'Trio Member',
        uploaderEmail: userEmail || teamMember?.email || '',
        uploaderAvatar: teamMember?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
        createdAt: new Date().toISOString(),
        createdAtMs: Date.now(),
        uploadedAt: new Date().toISOString(),
        driveFolder: 'Trio-INC-Drive / 02_PrintReady_Assets',
        driveLink,
        driveViewLink: driveLink,
        driveUrl: driveLink,
        fileId: driveData.fileId || '',
        downloadUrl,
        driveDownloadLink: downloadUrl,
        masterDownloadUrl: driveData.webContentLink || downloadUrl,
        webContentLink: driveData.webContentLink || downloadUrl,
        previewUrl: downloadUrl,
        tags: customTags,
        isSpotlight: false,
        isFeatured: false,
        mimeType: customFile.type || 'application/octet-stream',
        colorway: 'Custom Print Ready',
        mockupGarment: uploadCategory === 'Hoodies & Winter' ? '400 GSM Fleece Hoodie' : 'Heavyweight Box-Fit 260 GSM Tee'
      };
      setAssets((prev) => [localItem, ...prev.filter((a) => a.id !== localItem.id)]);

      if (assets.length === 0) {
        await setDoc(doc(db, 'system', 'media_settings'), {
          spotlightAssetId: finalDocId,
          updatedAt: new Date().toISOString(),
          updatedBy: teamMember?.displayName || 'Trio Member'
        }, { merge: true });
      }

      setCustomProgress(100);
      triggerToast({
        type: 'system',
        title: 'Asset Uploaded to 5 TB Drive',
        snippet: `"${customTitle}" published with custom specs.`,
        targetTab: 'media-hub'
      });

      // Dismiss the upload popup after 1.5 seconds
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setCustomFile(null);
        setUploadTitle('');
        setIsCustomUploading(false);
        setCustomProgress(0);
      }, 1500);
    } catch (err: any) {
      console.error('Custom upload error:', err);
      triggerToast({
        type: 'system',
        title: 'Upload Failed',
        snippet: err?.message || 'Failed to upload asset',
        targetTab: 'media-hub'
      });
      setIsCustomUploading(false);
      setCustomProgress(0);
    }
  };

  // 7. INSTANT DIRECT DOWNLOAD HANDLER
  const handleDownload = async (item: MediaAssetItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsDownloading(true);

    try {
      const targetUrl = item.downloadUrl || item.masterDownloadUrl || item.previewUrl;
      const cleanFileName = item.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
      const ext = (item.format || 'png').toLowerCase();

      if (targetUrl.startsWith('data:') || targetUrl.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = targetUrl;
        link.download = `TrioINC_${cleanFileName}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        try {
          const response = await fetch(targetUrl);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `TrioINC_${cleanFileName}.${ext}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch {
          const link = document.createElement('a');
          link.href = targetUrl;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.download = `TrioINC_${cleanFileName}.${ext}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }

      // Increment download counter in Firestore
      try {
        await updateDoc(doc(db, 'media_assets', item.id), {
          downloadsCount: increment(1)
        });
      } catch (err) {
        console.warn('Download counter notice:', err);
      }

      triggerToast({
        type: 'system',
        title: 'Master Print File Downloaded',
        snippet: `${item.title} (${item.fileSize}) download initiated.`,
        targetTab: 'media-hub'
      });
    } catch (err) {
      console.error('Download error:', err);
      window.open(item.downloadUrl || item.previewUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  // Like Toggle
  const handleLike = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await updateDoc(doc(db, 'media_assets', id), {
        likesCount: increment(1)
      });
    } catch (err) {
      console.warn('Like count notice:', err);
    }
  };

  // Copy Link Handler
  const handleCopyLink = async (item: MediaAssetItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const link = item.driveUrl || item.driveLink || item.previewUrl;
      await navigator.clipboard.writeText(link);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      triggerToast({
        type: 'system',
        title: 'Drive Link Copied',
        snippet: `Direct link for "${item.title}" copied to clipboard.`,
        targetTab: 'media-hub'
      });
    } catch {
      triggerToast({
        type: 'system',
        title: 'Drive Link Ready',
        snippet: item.driveLink || item.previewUrl,
        targetTab: 'media-hub'
      });
    }
  };

  // Lightbox Navigation
  const handleNextLightbox = () => {
    if (!lightboxAsset || filteredAssets.length === 0) return;
    const currentIndex = filteredAssets.findIndex((a) => a.id === lightboxAsset.id);
    const nextIndex = (currentIndex + 1) % filteredAssets.length;
    setLightboxAsset(filteredAssets[nextIndex]);
    setZoomLevel(1);
  };

  const handlePrevLightbox = () => {
    if (!lightboxAsset || filteredAssets.length === 0) return;
    const currentIndex = filteredAssets.findIndex((a) => a.id === lightboxAsset.id);
    const prevIndex = (currentIndex - 1 + filteredAssets.length) % filteredAssets.length;
    setLightboxAsset(filteredAssets[prevIndex]);
    setZoomLevel(1);
  };

  // Filtering & Sorting
  const filteredAssets = useMemo(() => {
    return assets.filter((item) => {
      if (selectedCategory !== 'All Assets' && item.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesCategory = item.category.toLowerCase().includes(query);
        const matchesFormat = item.format.toLowerCase().includes(query);
        const matchesTags = item.tags.some((t) => t.toLowerCase().includes(query));
        const matchesUploader = item.uploadedBy.toLowerCase().includes(query);
        return matchesTitle || matchesCategory || matchesFormat || matchesTags || matchesUploader;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'file-size') {
        return b.fileSizeBytes - a.fileSizeBytes;
      }
      if (sortBy === 'popular') {
        return b.downloadsCount - a.downloadsCount;
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [assets, selectedCategory, searchQuery, sortBy]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'All Assets': assets.length
    };
    CATEGORIES.forEach((cat) => {
      if (cat !== 'All Assets') {
        counts[cat] = assets.filter((a) => a.category === cat).length;
      }
    });
    return counts;
  }, [assets]);

  // Format badge helper
  const getFormatBadge = (format: string) => {
    switch (format.toUpperCase()) {
      case 'PNG':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      case 'PSD':
        return 'bg-blue-600/25 text-blue-300 border-blue-500/40';
      case 'AI':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'SVG':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'TIFF':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'PDF':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div 
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDragging(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleUploadFiles(Array.from(e.dataTransfer.files));
        }
      }}
      className="space-y-8 pb-16 relative"
    >
      {/* Hidden Mobile & Desktop Native File Picker */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.psd,.pdf,.svg,.ai,.tiff"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleUploadFiles(Array.from(e.target.files));
            e.target.value = '';
          }
        }}
        className="hidden"
      />

      {/* Desktop Drag & Drop Visual Hover Feedback Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-sky-950/85 backdrop-blur-md border-4 border-dashed border-sky-400 flex flex-col items-center justify-center p-6 text-center pointer-events-none animate-in fade-in duration-150">
          <div className="p-5 rounded-3xl bg-sky-500/20 text-sky-400 mb-4 animate-bounce border border-sky-400/30 shadow-2xl">
            <UploadCloud className="w-16 h-16" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Drop Design Assets to Upload
          </h3>
          <p className="text-sm text-sky-200 mt-2 max-w-md">
            Direct streaming to Sachin&apos;s 5 TB root Google Drive. Batch upload PNG, PSD, AI, SVG, or TIFF.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-mono bg-sky-900/70 px-4 py-2 rounded-xl text-sky-300 border border-sky-500/40">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Multiple files will be batched concurrently</span>
          </div>
        </div>
      )}

      {/* TOP HEADER CONTROLS & BATCH UPLOAD TRIGGER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-6 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span className="p-2 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/25">
                <FolderGit2 className="w-5 h-5" />
              </span>
              Media Asset Hub
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
              LIVE FIRESTORE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pinterest-style POD design library &bull; Synced with Sachin&apos;s 5 TB Drive Quota
          </p>
        </div>

        {/* Action Buttons: Native Multi-File Picker & Custom Spec Modal */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingBatch}
            className="flex-1 sm:flex-initial cursor-pointer min-h-[44px] px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold rounded-2xl transition-all shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            title="Open native file picker for multiple files (Phone & Desktop)"
          >
            {isUploadingBatch ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>+ Upload Assets to Drive</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="cursor-pointer min-h-[44px] px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-2xl border border-white/10 transition-colors flex items-center justify-center gap-1.5"
            title="Upload with custom DPI, dimensions, tags"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">Custom Form</span>
          </button>
        </div>
      </div>

      {/* 1. DYNAMIC TOP HERO SPOTLIGHT BANNER */}
      {spotlightAsset ? (
        <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-slate-900/90 via-[#0d1322]/90 to-slate-950/90 shadow-2xl backdrop-blur-2xl p-6 sm:p-8 lg:p-10">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-bl from-sky-500/20 via-indigo-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Visual Preview Box */}
            <div className="lg:col-span-5">
              <div 
                onClick={() => {
                  setLightboxAsset(spotlightAsset);
                  setZoomLevel(1);
                }}
                className="cursor-pointer group/spotlight relative rounded-3xl overflow-hidden border border-white/20 bg-slate-950 shadow-2xl aspect-[4/5] sm:aspect-square flex items-center justify-center"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={spotlightAsset.previewUrl} 
                  alt={spotlightAsset.title}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (spotlightAsset.fileId && !target.src.includes('uc?export=view')) {
                      target.src = `https://drive.google.com/uc?export=view&id=${spotlightAsset.fileId}`;
                    } else if (spotlightAsset.downloadUrl && target.src !== spotlightAsset.downloadUrl) {
                      target.src = spotlightAsset.downloadUrl;
                    }
                  }}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/spotlight:scale-105"
                />

                {/* Spotlight Status Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-amber-500/30 text-xs font-bold text-amber-300 shadow-xl">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-pulse" />
                  <span className="tracking-wide text-[11px] font-black uppercase">HERO SPOTLIGHT DESIGN</span>
                </div>

                {/* File Specs Ribbon Bottom */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent p-4 flex items-center justify-between text-xs text-slate-300">
                  <span className="font-mono text-sky-300 font-semibold">{spotlightAsset.dimensions}</span>
                  <span className="px-2 py-0.5 rounded-md bg-white/10 text-white font-mono text-[11px] font-bold">
                    {spotlightAsset.resolution}
                  </span>
                </div>
              </div>
            </div>

            {/* Spotlight Information & Action Controls */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    Pinned Hero Design
                  </span>
                  <span className="text-xs text-slate-400 hidden sm:inline">&bull; Direct 5 TB Google Drive v3</span>
                </div>

                <div className="text-[11px] text-slate-400 font-mono">
                  Uploaded: {new Date(spotlightAsset.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              {/* Design Title */}
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                  {spotlightAsset.title}
                </h2>
                <p className="text-sm text-slate-300 mt-1.5 flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="font-mono text-xs text-slate-400 truncate">{spotlightAsset.driveFolder}</span>
                </p>
              </div>

              {/* Tag Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {spotlightAsset.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
                <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${getFormatBadge(spotlightAsset.format)}`}>
                  {spotlightAsset.format}
                </span>
                <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {spotlightAsset.fileSize}
                </span>
              </div>

              {/* Uploader Avatar Chip & Print Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/60 border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={spotlightAsset.uploaderAvatar} 
                    alt={spotlightAsset.uploadedBy}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-xl object-cover border border-sky-400/40 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{spotlightAsset.uploadedBy}</div>
                    <div className="text-[11px] text-slate-400 truncate">{spotlightAsset.uploaderEmail}</div>
                    <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      Team Member
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10 flex flex-col justify-center text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Garment Preset:</span>
                    <span className="text-white font-medium truncate max-w-[140px]">{spotlightAsset.mockupGarment}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Colorway:</span>
                    <span className="text-sky-300 font-medium truncate max-w-[140px]">{spotlightAsset.colorway}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Production Status:</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Ready
                    </span>
                  </div>
                </div>
              </div>

              {/* Primary Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                <button
                  onClick={(e) => handleDownload(spotlightAsset, e)}
                  disabled={isDownloading}
                  className="cursor-pointer min-h-[46px] px-6 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm transition-all shadow-xl hover:shadow-2xl flex items-center gap-2.5 active:scale-95 disabled:opacity-75"
                >
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>⚡ Quick HD Download ({spotlightAsset.fileSize})</span>
                </button>

                <button
                  onClick={() => {
                    setLightboxAsset(spotlightAsset);
                    setZoomLevel(1);
                  }}
                  className="cursor-pointer min-h-[46px] px-5 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-white font-semibold text-sm transition-all border border-white/10 flex items-center gap-2 active:scale-95"
                >
                  <Maximize2 className="w-4 h-4 text-sky-400" />
                  <span>🔍 Inspect Details</span>
                </button>

                <button
                  onClick={(e) => handleCopyLink(spotlightAsset, e)}
                  className="cursor-pointer min-h-[46px] px-4 py-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-all border border-white/10 flex items-center gap-2 text-xs"
                  title="Copy Google Drive Direct Link"
                >
                  <Share2 className="w-4 h-4 text-slate-400" />
                  <span className="hidden sm:inline">Drive Share</span>
                </button>

                {/* Safe Delete Hero Button for Admin or Original Uploader */}
                {canDeleteAsset(spotlightAsset) && (
                  <button
                    onClick={() => setAssetToDelete(spotlightAsset)}
                    className="cursor-pointer min-h-[46px] px-3.5 py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/25 text-xs font-bold transition-all flex items-center gap-2"
                    title="Permanently remove design from Drive and Hub"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Delete File</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : isLoadingAssets ? (
        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-8 sm:p-12 text-center backdrop-blur-xl">
          <div className="flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
            <p className="text-sm text-slate-300 font-medium">
              Loading real-time assets from Firestore...
            </p>
          </div>
        </section>
      ) : (
        /* Empty State Hero Banner when no assets exist yet */
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-indigo-950/20 to-slate-900/90 p-8 sm:p-12 text-center relative overflow-hidden backdrop-blur-xl">
          <div className="max-w-xl mx-auto space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-sky-500/25 animate-pulse">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                POD Media Asset Vault // 5 TB Drive
              </h2>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                No design assets uploaded yet. Start uploading your master prints, oversized t-shirt mockups, vector artwork, or ad reels to sync across all 3 members.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer min-h-[46px] px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-sky-500/25 flex items-center gap-2 active:scale-95 transition-all"
              >
                <UploadCloud className="w-4 h-4" />
                <span>+ Upload Your First Design</span>
              </button>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="cursor-pointer min-h-[46px] px-5 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-white/10 flex items-center gap-2 transition-all"
              >
                <FileText className="w-4 h-4 text-sky-400" />
                <span>Custom Spec Form</span>
              </button>
            </div>
          </div>
        </section>
      ) : (
        /* Loading skeleton */
        <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-12 text-center flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Loading real-time assets from Firestore...</p>
        </div>
      )}

      {/* 2. CATEGORY FILTER PILL BAR & SEARCH CONTROLS */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Horizontal Scrolling Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pt-1 -mx-2 px-2 touch-pan-x">
            {CATEGORIES.map((cat) => {
              const count = categoryCounts[cat] || 0;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`cursor-pointer min-h-[42px] px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
                    isSelected
                      ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20 scale-[1.02]'
                      : 'bg-slate-900/70 hover:bg-slate-800/80 text-slate-300 border border-white/10 hover:text-white'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box & Sort Options */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search designs, tags, formats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-h-[42px] pl-10 pr-8 py-2 rounded-2xl bg-slate-900/70 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 backdrop-blur-xl transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="relative shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-900/70 border border-white/10 text-xs text-slate-300 min-h-[42px]">
                <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer pr-2"
                >
                  <option value="newest" className="bg-slate-900 text-white">Newest First</option>
                  <option value="file-size" className="bg-slate-900 text-white">File Size (Max)</option>
                  <option value="popular" className="bg-slate-900 text-white">Most Popular</option>
                  <option value="title" className="bg-slate-900 text-white">Title (A-Z)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Search Results Summary */}
        {(searchQuery || selectedCategory !== 'All Assets') && (
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <div>
              Showing <strong className="text-white">{filteredAssets.length}</strong> design assets
              {selectedCategory !== 'All Assets' && <span> in <span className="text-sky-400">{selectedCategory}</span></span>}
              {searchQuery && <span> matching &ldquo;<span className="text-white">{searchQuery}</span>&rdquo;</span>}
            </div>
            <button
              onClick={() => {
                setSelectedCategory('All Assets');
                setSearchQuery('');
              }}
              className="text-sky-400 hover:text-sky-300 text-xs font-medium cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        )}
      </section>

      {/* 3. PINTEREST-STYLE DYNAMIC MASONRY / RESPONSIVE GRID */}
      {isLoadingAssets ? (
        <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-12 text-center flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
          <p className="text-sm text-slate-300 font-medium">Syncing media assets from Firestore...</p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/15 bg-slate-900/40 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-8 h-8 text-sky-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {assets.length === 0 ? 'No assets uploaded yet. Upload your first design!' : 'No Design Assets Found'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              {assets.length === 0
                ? 'Drop your artwork anywhere on screen or tap the button below to upload directly to 5 TB Drive.'
                : 'We couldn’t find any assets matching your search query or category filter.'}
            </p>
          </div>
          <button
            onClick={() => {
              if (assets.length === 0) {
                fileInputRef.current?.click();
              } else {
                setSelectedCategory('All Assets');
                setSearchQuery('');
              }
            }}
            className="cursor-pointer px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
          >
            {assets.length === 0 ? '+ Upload First Design' : 'Clear All Filters'}
          </button>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-5 space-y-5">
          {filteredAssets.map((asset) => {
            const isHeroPinned = spotlightAsset?.id === asset.id;
            const userCanDelete = canDeleteAsset(asset);

            return (
              <motion.article
                key={asset.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                onClick={() => {
                  setLightboxAsset(asset);
                  setZoomLevel(1);
                }}
                className={`break-inside-avoid rounded-3xl overflow-hidden border bg-slate-900/60 hover:bg-slate-800/80 transition-all duration-300 group shadow-lg hover:shadow-indigo-500/15 cursor-pointer relative ${
                  isHeroPinned ? 'border-amber-500/50 ring-2 ring-amber-500/20' : 'border-white/10'
                }`}
              >
                {/* Image Container with subtle zoom on hover */}
                <div className="relative overflow-hidden bg-slate-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.previewUrl}
                    alt={asset.title}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (asset.fileId && !target.src.includes('uc?export=view')) {
                        target.src = `https://drive.google.com/uc?export=view&id=${asset.fileId}`;
                      } else if (asset.downloadUrl && target.src !== asset.downloadUrl) {
                        target.src = asset.downloadUrl;
                      }
                    }}
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />

                  {/* Gradient shadow overlay for badge readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-black/40 pointer-events-none opacity-60 group-hover:opacity-85 transition-opacity" />

                  {/* Top Badge Overlays */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-1 pointer-events-none">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border backdrop-blur-md shadow-md ${getFormatBadge(asset.format)}`}>
                      {asset.format}
                    </span>

                    {isHeroPinned ? (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-amber-500 text-slate-950 shadow-lg flex items-center gap-1">
                        <Star className="w-3 h-3 fill-slate-950" />
                        SPOTLIGHT
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold bg-slate-950/80 backdrop-blur-md text-slate-200 border border-white/15 shadow-md">
                        {asset.resolution.split(' ')[0]} DPI
                      </span>
                    )}
                  </div>

                  {/* Top Right Action Overlay: Pin to Hero & Safe Trash/Delete Button */}
                  <div className="absolute top-12 right-3 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleSetHeroSpotlight(asset, e)}
                      className="cursor-pointer p-2 rounded-xl bg-slate-950/90 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-white/20 transition-all shadow-xl active:scale-90"
                      title="⭐ Set as Hero Spotlight"
                    >
                      <Star className={`w-3.5 h-3.5 ${isHeroPinned ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>

                    {userCanDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAssetToDelete(asset);
                        }}
                        className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/20 p-2 rounded-xl transition-all bg-slate-950/90 border border-red-500/30 shadow-xl"
                        title="Delete this design from Drive"
                        aria-label="Delete this design"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Bottom Floating Action Pill (Pinterest-style frosted glass strip) */}
                  <div className="absolute bottom-3 inset-x-3 pointer-events-auto">
                    <div className="backdrop-blur-xl bg-slate-950/85 border border-white/15 shadow-2xl rounded-2xl p-1.5 flex items-center justify-between transition-all transform group-hover:translate-y-0 translate-y-1 group-hover:opacity-100 opacity-90">
                      {/* Download button */}
                      <button
                        onClick={(e) => handleDownload(asset, e)}
                        className="cursor-pointer min-h-[34px] px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                        title="Direct HD Download"
                      >
                        <Download className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="hidden sm:inline">Download</span>
                      </button>

                      {/* Right icons: Lightbox & Share & Like & Delete */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxAsset(asset);
                            setZoomLevel(1);
                          }}
                          className="cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                          title="Open Fullscreen Lightbox"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => handleCopyLink(asset, e)}
                          className="cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                          title="Copy Google Drive Link"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => handleLike(asset.id, e)}
                          className="cursor-pointer min-h-[32px] px-2 flex items-center gap-1 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors text-[11px] font-semibold"
                          title="Like Asset"
                        >
                          <Heart className="w-3.5 h-3.5 fill-rose-500/30" />
                          <span>{asset.likesCount}</span>
                        </button>

                        {/* Red Delete Button on Card Pill */}
                        {userCanDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAssetToDelete(asset);
                            }}
                            className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/20 p-2 rounded-xl transition-all"
                            title="Delete this design from Drive"
                            aria-label="Delete this design"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="text-sky-400 font-semibold">{asset.category}</span>
                    <span className="font-mono text-slate-400">{asset.fileSize}</span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-indigo-300 transition-colors">
                    {asset.title}
                  </h3>

                  {/* Card Action Row: Set as Hero Spotlight Pill & Date */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                    <button
                      onClick={(e) => handleSetHeroSpotlight(asset, e)}
                      className={`cursor-pointer px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 ${
                        isHeroPinned
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-white/10'
                      }`}
                    >
                      <Star className={`w-3 h-3 ${isHeroPinned ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                      <span>{isHeroPinned ? 'Active Hero' : '⭐ Set as Hero'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(asset.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      {userCanDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssetToDelete(asset);
                          }}
                          className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/20 p-1 rounded-lg transition-all"
                          title="Delete design"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      {/* 4. FULL-SCREEN LIGHTBOX MODAL */}
      <AnimatePresence>
        {lightboxAsset && (
          <div 
            role="dialog"
            aria-modal="true"
            aria-label="Design Asset Lightbox Inspection"
            className="fixed inset-0 z-50 bg-black/92 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden"
          >
            <div 
              onClick={() => setLightboxAsset(null)}
              className="absolute inset-0 cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full max-w-6xl max-h-[92vh] rounded-3xl border border-white/15 bg-[#090d16]/98 shadow-2xl flex flex-col lg:flex-row overflow-hidden"
            >
              {/* Top Bar for Mobile */}
              <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                <div className="truncate font-bold text-xs text-white">
                  {lightboxAsset.title}
                </div>
                <div className="flex items-center gap-1">
                  {canDeleteAsset(lightboxAsset) && (
                    <button
                      onClick={() => setAssetToDelete(lightboxAsset)}
                      className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/20 p-2 rounded-xl transition-all"
                      title="Delete design"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setLightboxAsset(null)}
                    className="cursor-pointer p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Main Image Viewer Section with Zoom Controls */}
              <div className="flex-1 relative flex items-center justify-center p-4 bg-slate-950/80 overflow-hidden min-h-[350px] lg:min-h-[550px]">
                <button
                  onClick={handlePrevLightbox}
                  className="cursor-pointer absolute left-4 z-20 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-white/15 text-white flex items-center justify-center transition-all shadow-xl active:scale-90"
                  title="Previous Asset"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={handleNextLightbox}
                  className="cursor-pointer absolute right-4 z-20 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-white/15 text-white flex items-center justify-center transition-all shadow-xl active:scale-90"
                  title="Next Asset"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Floating Zoom Toolbar */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-white/15 text-xs text-slate-200 shadow-xl">
                  <button
                    onClick={() => setZoomLevel((prev) => Math.max(0.5, prev - 0.25))}
                    className="cursor-pointer p-1 rounded-lg hover:bg-white/10 transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-[11px] font-bold px-2">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel((prev) => Math.min(3, prev + 0.25))}
                    className="cursor-pointer p-1 rounded-lg hover:bg-white/10 transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <div className="w-px h-3.5 bg-white/20 mx-1" />
                  <button
                    onClick={() => setZoomLevel(1)}
                    className="cursor-pointer p-1 rounded-lg hover:bg-white/10 transition-colors"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Main Image with Zoom Scale Transform */}
                <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={lightboxAsset.previewUrl}
                    alt={lightboxAsset.title}
                    referrerPolicy="no-referrer"
                    style={{ transform: `scale(${zoomLevel})` }}
                    className="max-h-[75vh] w-auto object-contain transition-transform duration-200 select-none shadow-2xl rounded-2xl"
                  />
                </div>
              </div>

              {/* Sidebar: Print Specifications & Master Actions */}
              <div className="w-full lg:w-96 p-6 border-t lg:border-t-0 lg:border-l border-white/10 bg-[#090d16] flex flex-col justify-between overflow-y-auto">
                <div className="space-y-5">
                  <div className="hidden lg:flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                      Asset Specifications
                    </span>
                    <div className="flex items-center gap-1.5">
                      {canDeleteAsset(lightboxAsset) && (
                        <button
                          onClick={() => setAssetToDelete(lightboxAsset)}
                          className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/20 p-2 rounded-xl transition-all"
                          title="Delete Design from Drive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setLightboxAsset(null)}
                        className="cursor-pointer p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-white leading-snug">
                      {lightboxAsset.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                      <FolderGit2 className="w-3.5 h-3.5 text-sky-400" />
                      <span className="font-mono truncate">{lightboxAsset.driveFolder}</span>
                    </p>
                  </div>

                  {/* Print Spec Grid */}
                  <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-slate-900/80 border border-white/10 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Format</span>
                      <p className="text-white font-bold">{lightboxAsset.format}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">File Size</span>
                      <p className="text-emerald-400 font-mono font-bold">{lightboxAsset.fileSize}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Resolution</span>
                      <p className="text-white font-medium">{lightboxAsset.resolution}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Dimensions</span>
                      <p className="text-white font-mono text-[11px] truncate">{lightboxAsset.dimensions}</p>
                    </div>
                  </div>

                  {/* Uploader Details */}
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/60 border border-white/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={lightboxAsset.uploaderAvatar}
                      alt={lightboxAsset.uploadedBy}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-xl object-cover border border-sky-400/30"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{lightboxAsset.uploadedBy}</div>
                      <div className="text-[10px] text-slate-400 truncate">{lightboxAsset.uploaderEmail}</div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Metadata Tags</span>
                    <div className="flex flex-wrap gap-1.5">
                      {lightboxAsset.tags.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded-lg text-[10px] bg-slate-800 text-slate-300 border border-white/5">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-6 space-y-2.5">
                  {/* Hero Spotlight Toggle in Lightbox */}
                  <button
                    onClick={(e) => handleSetHeroSpotlight(lightboxAsset, e)}
                    className="cursor-pointer w-full min-h-[42px] py-2.5 px-4 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>⭐ Set as Top Hero Spotlight</span>
                  </button>

                  <button
                    onClick={(e) => handleDownload(lightboxAsset, e)}
                    disabled={isDownloading}
                    className="cursor-pointer w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Master File ({lightboxAsset.fileSize})</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={(e) => handleCopyLink(lightboxAsset, e)}
                      className="cursor-pointer min-h-[38px] py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-white/10"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{isCopied ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                    <a
                      href={lightboxAsset.driveUrl || lightboxAsset.driveLink || lightboxAsset.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-pointer min-h-[38px] py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-white/10"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in Drive</span>
                    </a>
                  </div>

                  {/* Red Delete Button in Lightbox */}
                  {canDeleteAsset(lightboxAsset) && (
                    <button
                      onClick={() => setAssetToDelete(lightboxAsset)}
                      className="cursor-pointer w-full min-h-[40px] py-2 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 text-xs font-bold transition-all flex items-center justify-center gap-2 pt-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Design from Drive &amp; Vault</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. FLOATING BATCH UPLOAD PROGRESS DRAWER */}
      {uploadQueue.length > 0 && showQueueDrawer && (
        <div className="fixed bottom-6 right-6 z-40 w-80 sm:w-96 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-white">Batch Uploading to 5 TB Drive</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setUploadQueue([])}
                className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-800 cursor-pointer"
              >
                Clear
              </button>
              <button
                onClick={() => setShowQueueDrawer(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {uploadQueue.map((item) => (
              <div key={item.id} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium truncate max-w-[180px]">{item.name}</span>
                  <span className="text-[10px] font-mono text-slate-400">{item.size}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      item.status === 'completed'
                        ? 'bg-emerald-400'
                        : item.status === 'error'
                        ? 'bg-rose-500'
                        : 'bg-gradient-to-r from-sky-500 to-indigo-600'
                    }`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">
                    {item.status === 'completed' && <span className="text-emerald-400 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Done! 🎉</span>}
                    {item.status === 'error' && <span className="text-rose-400 font-semibold">{item.error || 'Failed'}</span>}
                    {item.status === 'uploading' && (
                      <span className="text-sky-400 font-medium">
                        {item.statusText || (item.progress >= 90 ? 'Syncing to 5 TB Drive...' : 'Uploading to Server...')}
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-slate-400">{item.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. DETAILED CUSTOM SPEC UPLOAD MODAL */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div 
            role="dialog"
            aria-modal="true"
            aria-label="Upload POD Assets to Drive"
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto"
          >
            <div 
              onClick={() => !isCustomUploading && setIsUploadModalOpen(false)}
              className="absolute inset-0 cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full max-w-lg rounded-3xl border border-white/15 bg-[#090d16] p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Upload Asset to 5 TB Drive</h3>
                    <p className="text-xs text-slate-400">Custom specifications &amp; print readiness</p>
                  </div>
                </div>
                {!isCustomUploading && (
                  <button
                    onClick={() => setIsUploadModalOpen(false)}
                    className="cursor-pointer p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <form onSubmit={handleCustomUploadSubmit} className="space-y-4">
                {/* File Drop / Select Area */}
                <div 
                  onClick={() => {
                    const tempInput = document.createElement('input');
                    tempInput.type = 'file';
                    tempInput.accept = 'image/*,.psd,.pdf,.svg,.ai,.tiff';
                    tempInput.onchange = (e: any) => {
                      if (e.target.files?.[0]) {
                        const f = e.target.files[0];
                        setCustomFile(f);
                        if (!uploadTitle) {
                          setUploadTitle(f.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').toUpperCase());
                        }
                        setUploadFormat(determineFormat(f.name, f.type));
                        setUploadCategory(determineCategory(f.name, f.type));
                      }
                    };
                    tempInput.click();
                  }}
                  className="border-2 border-dashed border-white/20 hover:border-sky-500/50 rounded-2xl p-6 text-center bg-slate-900/40 hover:bg-slate-900/60 transition-all cursor-pointer"
                >
                  <UploadCloud className="w-8 h-8 text-sky-400 mx-auto mb-2 animate-bounce" />
                  {customFile ? (
                    <div>
                      <p className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Selected: {customFile.name}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        {formatFileSize(customFile.size)} &bull; Tap to change file
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-white">
                        Click or drag high-res PNG, PSD, AI, SVG, PDF or TIFF
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Direct sync to Sachin Barman&apos;s 5 TB root storage (Up to 2 GB per file)
                      </p>
                    </div>
                  )}
                </div>

                {/* Form Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Design Asset Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CYBER SHOGUN // ACID WASH HOODIE"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      className="w-full min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Category
                      </label>
                      <select
                        value={uploadCategory}
                        onChange={(e) => setUploadCategory(e.target.value as any)}
                        className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      >
                        <option value="T-Shirt Prints">T-Shirt Prints</option>
                        <option value="Hoodies & Winter">Hoodies &amp; Winter</option>
                        <option value="Mockup Renders">Mockup Renders</option>
                        <option value="Social Media / Posters">Social Media / Posters</option>
                        <option value="DTF Vectors">DTF Vectors</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        File Format
                      </label>
                      <select
                        value={uploadFormat}
                        onChange={(e) => setUploadFormat(e.target.value as any)}
                        className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      >
                        <option value="PNG">PNG (Transparent)</option>
                        <option value="PSD">PSD (Layered)</option>
                        <option value="AI">AI (Illustrator)</option>
                        <option value="SVG">SVG (Vector)</option>
                        <option value="TIFF">TIFF (Archival)</option>
                        <option value="PDF">PDF (Print Master)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Print Resolution
                      </label>
                      <input
                        type="text"
                        value={uploadResolution}
                        onChange={(e) => setUploadResolution(e.target.value)}
                        placeholder="300 DPI CMYK"
                        className="w-full min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Dimensions
                      </label>
                      <input
                        type="text"
                        value={uploadDimensions}
                        onChange={(e) => setUploadDimensions(e.target.value)}
                        placeholder="4500 x 5400 px"
                        className="w-full min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tags (Comma separated)
                    </label>
                    <input
                      type="text"
                      value={uploadTags}
                      onChange={(e) => setUploadTags(e.target.value)}
                      placeholder="Oversized, DTF, Print Ready"
                      className="w-full min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>

                {/* Custom Upload Progress */}
                {isCustomUploading && (
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-medium text-slate-300">
                        {customProgress >= 100 
                          ? 'Done! 🎉' 
                          : customProgress >= 90 
                          ? 'Syncing to 5 TB Drive...' 
                          : 'Uploading to server...'}
                      </span>
                      <span className="font-mono text-sky-400 font-bold">{customProgress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 transition-all duration-300"
                        style={{ width: `${customProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    disabled={isCustomUploading}
                    onClick={() => setIsUploadModalOpen(false)}
                    className="cursor-pointer px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCustomUploading || !customFile}
                    className="cursor-pointer min-h-[42px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-sky-500/20 active:scale-95 disabled:opacity-50"
                  >
                    {isCustomUploading ? 'Uploading to 5 TB Drive...' : 'Save & Publish Asset'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. SAFE DELETION CONFIRMATION DIALOG MODAL */}
      <AnimatePresence>
        {assetToDelete && (
          <div 
            role="dialog"
            aria-modal="true"
            aria-label="Confirm Design Asset Deletion"
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div 
              onClick={() => !isDeleting && setAssetToDelete(null)}
              className="absolute inset-0 cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full max-w-md rounded-3xl border border-red-500/30 bg-[#090d16] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-red-500/15 text-red-400 border border-red-500/30">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Delete Design Permanently?</h3>
                  <p className="text-xs text-slate-400">Google Drive &amp; Trio Hub Removal</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                <p className="font-bold text-white truncate">{assetToDelete.title}</p>
                <p className="text-slate-400 text-[11px]">
                  {assetToDelete.category} &bull; {assetToDelete.fileSize} &bull; {assetToDelete.format}
                </p>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Delete this design? This will permanently remove the file from Trio INC. and Google Drive.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setAssetToDelete(null)}
                  className="cursor-pointer px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="cursor-pointer min-h-[40px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-red-950/40 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Confirm Delete</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
