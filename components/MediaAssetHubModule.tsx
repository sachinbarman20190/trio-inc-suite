'use client';

import React, { useState, useMemo } from 'react';
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
  Printer
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useNotification } from '@/lib/notification-context';
import { MediaAssetItem, MediaAssetCategory } from '@/lib/types';

// Curated 8 realistic POD design mockup items
const INITIAL_ASSETS: MediaAssetItem[] = [
  {
    id: 'asset-1',
    title: 'CYBERPUNK SHINOBI // OVERSIZED GRAPHIC TEE',
    category: 'T-Shirt Prints',
    format: 'PNG',
    resolution: '300 DPI CMYK',
    dimensions: '4500 x 5400 px (15" × 18")',
    fileSize: '28.4 MB',
    fileSizeBytes: 28400000,
    downloadsCount: 142,
    likesCount: 56,
    uploadedBy: 'Trio Studio Archive',
    uploaderEmail: 'archive@trioinc.internal',
    uploaderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
    createdAt: '2026-09-24T18:30:00Z',
    driveFolder: 'Trio-INC-Drive / 02_PrintReady_Assets / Oversized_Tees',
    driveLink: 'https://drive.google.com/drive/folders/trio-inc-cyberpunk-shinobi',
    previewUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&q=80',
    masterDownloadUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=2400&q=95',
    tags: ['Oversized Tee', 'DTF 300 DPI', 'PNG 4K', 'Neon Graphic', 'Front Chest'],
    isSpotlight: true,
    colorway: 'Pitch Black / Neon Cyan',
    mockupGarment: 'Heavyweight Box-Fit 260 GSM Tee'
  },
  {
    id: 'asset-2',
    title: 'TOKYO DRIFT KANJI ACID-WASH HOODIE',
    category: 'Hoodies & Winter',
    format: 'PSD',
    resolution: '300 DPI High-Res',
    dimensions: '5000 x 6000 px (16.6" × 20")',
    fileSize: '44.2 MB',
    fileSizeBytes: 44200000,
    downloadsCount: 98,
    likesCount: 42,
    uploadedBy: 'Suraj Barman',
    uploaderEmail: 'suraj.yt.science@gmail.com',
    uploaderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
    createdAt: '2026-09-23T14:15:00Z',
    driveFolder: 'Trio-INC-Drive / 02_PrintReady_Assets / Hoodies_Winter',
    driveLink: 'https://drive.google.com/drive/folders/trio-inc-tokyo-drift-hoodie',
    previewUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1200&q=80',
    masterDownloadUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=2400&q=95',
    tags: ['Heavyweight Fleece', 'Acid Wash', 'Chest & Sleeve Hit', 'Streetwear Kanji'],
    isSpotlight: false,
    colorway: 'Washed Charcoal Grey',
    mockupGarment: '400 GSM French Terry Hoodie'
  },
  {
    id: 'asset-3',
    title: 'VINTAGE RACING CLUB 1998 // VECTOR MASTER',
    category: 'DTF Vectors',
    format: 'AI',
    resolution: '600 DPI Vector',
    dimensions: 'Infinite Vector Scalable',
    fileSize: '18.6 MB',
    fileSizeBytes: 18600000,
    downloadsCount: 115,
    likesCount: 63,
    uploadedBy: 'Trio Studio Archive',
    uploaderEmail: 'archive@trioinc.internal',
    uploaderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
    createdAt: '2026-09-22T09:45:00Z',
    driveFolder: 'Trio-INC-Drive / 03_Vector_Masters / Racing_Club',
    driveLink: 'https://drive.google.com/drive/folders/trio-inc-vintage-racing',
    previewUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200&q=80',
    masterDownloadUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=2400&q=95',
    tags: ['Distressed Texture', 'Halftone Print', 'CMYK Ready', 'DTF Separation'],
    isSpotlight: false,
    colorway: 'Off-White Cream / Vintage Red',
    mockupGarment: 'Vintage Washed Tee'
  },
  {
    id: 'asset-4',
    title: 'ACID MATRIX RETRO SUNSET // DROP-SHOULDER TEE',
    category: 'T-Shirt Prints',
    format: 'PNG',
    resolution: '300 DPI CMYK',
    dimensions: '4200 x 4800 px (14" × 16")',
    fileSize: '22.8 MB',
    fileSizeBytes: 22800000,
    downloadsCount: 87,
    likesCount: 39,
    uploadedBy: 'Member 3',
    uploaderEmail: 'member3@gmail.com',
    uploaderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80',
    createdAt: '2026-09-21T16:20:00Z',
    driveFolder: 'Trio-INC-Drive / 02_PrintReady_Assets / Oversized_Tees',
    driveLink: 'https://drive.google.com/drive/folders/trio-inc-acid-matrix',
    previewUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1200&q=80',
    masterDownloadUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=2400&q=95',
    tags: ['Drop Shoulder', 'Vibrant Gradient', 'Sublimation + DTF', 'Summer Drop'],
    isSpotlight: false,
    colorway: 'Pure White / Purple Sunset Gradient',
    mockupGarment: '240 GSM Combed Cotton Tee'
  },
  {
    id: 'asset-5',
    title: 'CYBER DRAGON MECHA // 3D MOCKUP RENDER PACK',
    category: 'Mockup Renders',
    format: 'PSD',
    resolution: '4K Ultra-Sharp',
    dimensions: '3840 x 2160 px (16:9)',
    fileSize: '58.2 MB',
    fileSizeBytes: 58200000,
    downloadsCount: 167,
    likesCount: 78,
    uploadedBy: 'Trio Studio Archive',
    uploaderEmail: 'archive@trioinc.internal',
    uploaderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
    createdAt: '2026-09-20T11:10:00Z',
    driveFolder: 'Trio-INC-Drive / 01_Marketing_Mockups / 3D_Renders',
    driveLink: 'https://drive.google.com/drive/folders/trio-inc-dragon-mecha-mockup',
    previewUrl: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=1200&q=80',
    masterDownloadUrl: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=2400&q=95',
    tags: ['Ghost Mannequin', 'Realistic Wrinkles', 'Smart Object', 'Website Hero'],
    isSpotlight: false,
    colorway: 'Matte Shadow Black',
    mockupGarment: 'Studio 3D Mannequin Simulation'
  },
  {
    id: 'asset-6',
    title: 'STREETWEAR DROP CAMPAIGN POSTER 04',
    category: 'Social Media / Posters',
    format: 'TIFF',
    resolution: '300 DPI Archival',
    dimensions: '4000 x 5000 px (4:5 Ratio)',
    fileSize: '36.1 MB',
    fileSizeBytes: 36100000,
    downloadsCount: 74,
    likesCount: 31,
    uploadedBy: 'Suraj Barman',
    uploaderEmail: 'suraj.yt.science@gmail.com',
    uploaderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
    createdAt: '2026-09-19T20:00:00Z',
    driveFolder: 'Trio-INC-Drive / 04_Social_Creatives / Posters',
    driveLink: 'https://drive.google.com/drive/folders/trio-inc-poster-drop4',
    previewUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=80',
    masterDownloadUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=2400&q=95',
    tags: ['Story 9:16', 'Typography Grid', 'Feed Promo', 'Instagram Reel Cover'],
    isSpotlight: false,
    colorway: 'Editorial Cyan / Monochrome',
    mockupGarment: 'High-Gloss Promo Poster'
  },
  {
    id: 'asset-7',
    title: 'NEO-TOKYO MECHA ANGEL // DTF FILM SEPARATION',
    category: 'DTF Vectors',
    format: 'SVG',
    resolution: 'Vector DTF 600 DPI',
    dimensions: 'Direct-to-Film 12" × 16"',
    fileSize: '12.3 MB',
    fileSizeBytes: 12300000,
    downloadsCount: 130,
    likesCount: 52,
    uploadedBy: 'Trio Studio Archive',
    uploaderEmail: 'archive@trioinc.internal',
    uploaderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
    createdAt: '2026-09-18T13:40:00Z',
    driveFolder: 'Trio-INC-Drive / 03_Vector_Masters / DTF_Film_Separations',
    driveLink: 'https://drive.google.com/drive/folders/trio-inc-mecha-angel-dtf',
    previewUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&q=80',
    masterDownloadUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=2400&q=95',
    tags: ['White Underbase', 'Choke Applied', 'Ready to Print', 'Anime Mech'],
    isSpotlight: false,
    colorway: 'Multi-Spot Neon Fluo',
    mockupGarment: 'Direct-to-Film Transfer Sheet'
  },
  {
    id: 'asset-8',
    title: 'OBSIDIAN OVERSIZED BOX-FIT HOODIE MOCKUP',
    category: 'Mockup Renders',
    format: 'PSD',
    resolution: '300 DPI Studio',
    dimensions: '4800 x 4800 px (1:1 Square)',
    fileSize: '52.7 MB',
    fileSizeBytes: 52700000,
    downloadsCount: 88,
    likesCount: 45,
    uploadedBy: 'Member 3',
    uploaderEmail: 'member3@gmail.com',
    uploaderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80',
    createdAt: '2026-09-17T17:15:00Z',
    driveFolder: 'Trio-INC-Drive / 01_Marketing_Mockups / Hoodies',
    driveLink: 'https://drive.google.com/drive/folders/trio-inc-obsidian-hoodie',
    previewUrl: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=1200&q=80',
    masterDownloadUrl: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=2400&q=95',
    tags: ['Front & Back', 'Displacement Map', 'Studio Light', 'E-Com Ready'],
    isSpotlight: false,
    colorway: 'Deep Obsidian Black',
    mockupGarment: 'Boxy Heavyweight Hoodie'
  }
];

const CATEGORIES: MediaAssetCategory[] = [
  'All Assets',
  'T-Shirt Prints',
  'Hoodies & Winter',
  'Mockup Renders',
  'Social Media / Posters',
  'DTF Vectors',
];

type SortOption = 'newest' | 'file-size' | 'popular' | 'title';

export function MediaAssetHubModule() {
  const { teamMember } = useAuth();
  const { triggerToast } = useNotification();

  // State
  const [assets, setAssets] = useState<MediaAssetItem[]>(INITIAL_ASSETS);
  const [selectedCategory, setSelectedCategory] = useState<MediaAssetCategory>('All Assets');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  
  // Lightbox Modal state
  const [lightboxAsset, setLightboxAsset] = useState<MediaAssetItem | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Upload Modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<MediaAssetItem['category']>('T-Shirt Prints');
  const [uploadFormat, setUploadFormat] = useState<MediaAssetItem['format']>('PNG');
  const [uploadResolution, setUploadResolution] = useState('300 DPI CMYK');
  const [uploadDimensions, setUploadDimensions] = useState('4500 x 5400 px');
  const [uploadTags, setUploadTags] = useState('Oversized Tee, DTF, Print Ready');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Spotlight asset: first item with isSpotlight or first asset
  const spotlightAsset = useMemo(() => {
    return assets.find(a => a.isSpotlight) || assets[0];
  }, [assets]);

  // Filtering & Sorting
  const filteredAssets = useMemo(() => {
    return assets.filter(item => {
      // Category filter
      if (selectedCategory !== 'All Assets' && item.category !== selectedCategory) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesCategory = item.category.toLowerCase().includes(query);
        const matchesFormat = item.format.toLowerCase().includes(query);
        const matchesTags = item.tags.some(t => t.toLowerCase().includes(query));
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
    CATEGORIES.forEach(cat => {
      if (cat !== 'All Assets') {
        counts[cat] = assets.filter(a => a.category === cat).length;
      }
    });
    return counts;
  }, [assets]);

  // Download Trigger Handler
  const handleDownload = async (item: MediaAssetItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsDownloading(true);

    try {
      // Simulate real download by fetching blob or opening master download url
      const response = await fetch(item.previewUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanFileName = item.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
      link.download = `TrioINC_${cleanFileName}.${item.format.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Increment download counter
      setAssets(prev => prev.map(a => a.id === item.id ? { ...a, downloadsCount: a.downloadsCount + 1 } : a));

      triggerToast({
        type: 'system',
        title: 'Master Print File Downloaded',
        snippet: `${item.title} (${item.fileSize} - ${item.format}) saved to local disk.`,
        targetTab: 'media-hub'
      });
    } catch {
      // Fallback
      window.open(item.previewUrl, '_blank');
      triggerToast({
        type: 'system',
        title: 'Master File Opened',
        snippet: `${item.title} preview opened in new tab.`,
        targetTab: 'media-hub'
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Like Toggle
  const handleLike = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAssets(prev => prev.map(a => a.id === id ? { ...a, likesCount: a.likesCount + 1 } : a));
  };

  // Copy Link Handler
  const handleCopyLink = async (item: MediaAssetItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await navigator.clipboard.writeText(item.driveLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      triggerToast({
        type: 'system',
        title: 'Drive Link Copied',
        snippet: `Direct 5 TB Google Drive link for "${item.title}" copied to clipboard.`,
        targetTab: 'media-hub'
      });
    } catch {
      // Fallback
      triggerToast({
        type: 'system',
        title: 'Drive Link Ready',
        snippet: item.driveLink,
        targetTab: 'media-hub'
      });
    }
  };

  // Lightbox Navigation
  const handleNextLightbox = () => {
    if (!lightboxAsset) return;
    const currentIndex = filteredAssets.findIndex(a => a.id === lightboxAsset.id);
    const nextIndex = (currentIndex + 1) % filteredAssets.length;
    setLightboxAsset(filteredAssets[nextIndex]);
    setZoomLevel(1);
  };

  const handlePrevLightbox = () => {
    if (!lightboxAsset) return;
    const currentIndex = filteredAssets.findIndex(a => a.id === lightboxAsset.id);
    const prevIndex = (currentIndex - 1 + filteredAssets.length) % filteredAssets.length;
    setLightboxAsset(filteredAssets[prevIndex]);
    setZoomLevel(1);
  };

  // Mock Multi-file upload simulation
  const handleSimulateUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) return;

    setIsUploading(true);
    setUploadProgress(15);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 95;
        }
        return prev + 25;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);

      const newAsset: MediaAssetItem = {
        id: `asset-${Date.now()}`,
        title: uploadTitle.trim().toUpperCase(),
        category: uploadCategory,
        format: uploadFormat,
        resolution: uploadResolution,
        dimensions: uploadDimensions,
        fileSize: '34.8 MB',
        fileSizeBytes: 34800000,
        downloadsCount: 0,
        likesCount: 1,
        uploadedBy: teamMember?.displayName || 'Team Member',
        uploaderEmail: teamMember?.email || '',
        uploaderAvatar: teamMember?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
        createdAt: new Date().toISOString(),
        driveFolder: 'Trio-INC-Drive / 02_PrintReady_Assets / New_Uploads',
        driveLink: 'https://drive.google.com/drive/folders/trio-inc-new-uploads',
        previewUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1200&q=80',
        masterDownloadUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=2400&q=95',
        tags: uploadTags.split(',').map(t => t.trim()).filter(Boolean),
        isSpotlight: false,
        colorway: 'Default Colorway',
        mockupGarment: 'Premium Print Garment'
      };

      setAssets(prev => [newAsset, ...prev]);
      setIsUploading(false);
      setIsUploadModalOpen(false);
      setUploadProgress(0);
      setUploadTitle('');

      triggerToast({
        type: 'system',
        title: 'Asset Uploaded to 5 TB Drive',
        snippet: `"${newAsset.title}" is now synced across all 3 members.`,
        targetTab: 'media-hub'
      });
    }, 1200);
  };

  // Helper for format badge styling
  const getFormatBadge = (format: MediaAssetItem['format']) => {
    switch (format) {
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
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="space-y-8 select-none">
      {/* 1. HERO SPOTLIGHT BANNER (TOP SECTION) */}
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-indigo-950/50 to-slate-900/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden group">
        {/* Ambient atmospheric liquid glow highlights */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
          {/* Spotlight Mockup Image Preview */}
          <div className="lg:col-span-5 relative">
            <div 
              onClick={() => {
                setLightboxAsset(spotlightAsset);
                setZoomLevel(1);
              }}
              className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/15 bg-slate-950 shadow-2xl cursor-pointer group/spotlight transform transition-all duration-500 hover:scale-[1.02] hover:shadow-indigo-500/20"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={spotlightAsset.previewUrl} 
                alt={spotlightAsset.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/spotlight:scale-105"
              />

              {/* Spotlight Live Status Pill */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/15 text-xs font-bold text-white shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="tracking-wide text-[11px]">SPOTLIGHT PRINT READY</span>
              </div>

              {/* File Specs Ribbon Bottom */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent p-4 flex items-center justify-between text-xs text-slate-300">
                <span className="font-mono text-sky-300 font-semibold">{spotlightAsset.dimensions}</span>
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-white font-mono text-[11px] font-bold">
                  {spotlightAsset.resolution}
                </span>
              </div>
            </div>
          </div>

          {/* Spotlight Information & Primary Action Controls */}
          <div className="lg:col-span-7 space-y-5">
            {/* Header Badge & Sync Status */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Latest Approved Design
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">&bull; Direct 5 TB Google Drive v3</span>
              </div>

              {/* Multi-file Upload trigger button */}
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="cursor-pointer min-h-[40px] px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold rounded-2xl transition-all shadow-lg shadow-sky-500/20 flex items-center gap-2 active:scale-95 shrink-0"
              >
                <UploadCloud className="w-4 h-4" />
                <span>+ Upload Assets to Drive</span>
              </button>
            </div>

            {/* Design Title */}
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                {spotlightAsset.title}
              </h2>
              <p className="text-sm text-slate-300 mt-1.5 flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-sky-400" />
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
                    Lead Designer
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
            </div>
          </div>
        </div>
      </section>

      {/* 2. TOP CATEGORY & FILTER PILL BAR */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Floating Horizontal Scrolling Pills */}
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
            {/* Glass Search Input */}
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

            {/* Sorting Dropdown */}
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
      {filteredAssets.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Design Assets Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              We couldn&apos;t find any assets matching your search query or category filter.
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedCategory('All Assets');
              setSearchQuery('');
            }}
            className="cursor-pointer px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-5 space-y-5">
          {filteredAssets.map((asset) => {
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
                className="break-inside-avoid rounded-3xl overflow-hidden border border-white/10 bg-slate-900/60 hover:bg-slate-800/80 transition-all duration-300 group shadow-lg hover:shadow-indigo-500/15 cursor-pointer relative"
              >
                {/* Image Container with subtle zoom on hover */}
                <div className="relative overflow-hidden bg-slate-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.previewUrl}
                    alt={asset.title}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />

                  {/* Gradient shadow overlay for badge readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/40 pointer-events-none opacity-60 group-hover:opacity-80 transition-opacity" />

                  {/* Top Badge Overlays: File format badge & Resolution */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-1 pointer-events-none">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border backdrop-blur-md shadow-md ${getFormatBadge(asset.format)}`}>
                      {asset.format}
                    </span>

                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold bg-slate-950/80 backdrop-blur-md text-slate-200 border border-white/15 shadow-md">
                      {asset.resolution.split(' ')[0]} DPI
                    </span>
                  </div>

                  {/* Bottom Floating Action Pill (Pinterest-style frosted glass strip) */}
                  <div className="absolute bottom-3 inset-x-3 pointer-events-auto">
                    <div className="backdrop-blur-xl bg-slate-950/80 border border-white/15 shadow-2xl rounded-2xl p-1.5 flex items-center justify-between transition-all transform group-hover:translate-y-0 translate-y-1 group-hover:opacity-100 opacity-90">
                      {/* Download button */}
                      <button
                        onClick={(e) => handleDownload(asset, e)}
                        className="cursor-pointer min-h-[34px] px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                        title="Quick HD Download"
                      >
                        <Download className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="hidden sm:inline">Download</span>
                      </button>

                      {/* Right icons: Lightbox & Share & Like */}
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
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Info: Clean typography with design title, date, and file size */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="text-sky-400 font-semibold">{asset.category}</span>
                    <span className="font-mono text-slate-400">{asset.fileSize}</span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-indigo-300 transition-colors">
                    {asset.title}
                  </h3>

                  <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-slate-400">
                    <span className="truncate">{asset.uploadedBy}</span>
                    <span className="font-mono">{new Date(asset.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
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
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden"
          >
            {/* Backdrop Dismiss Button */}
            <div 
              onClick={() => setLightboxAsset(null)}
              className="absolute inset-0 cursor-pointer"
            />

            {/* Lightbox Dialog Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full max-w-6xl max-h-[92vh] rounded-3xl border border-white/15 bg-[#090d16]/98 shadow-2xl flex flex-col lg:flex-row overflow-hidden"
            >
              {/* Top Bar for Mobile / Compact Header */}
              <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                <div className="truncate font-bold text-xs text-white">
                  {lightboxAsset.title}
                </div>
                <button
                  onClick={() => setLightboxAsset(null)}
                  className="cursor-pointer p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Main Image Viewer Section with Zoom Controls */}
              <div className="flex-1 relative flex items-center justify-center p-4 bg-slate-950/80 overflow-hidden min-h-[350px] lg:min-h-[550px]">
                {/* Previous / Next Asset Navigation Floating Buttons */}
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

                {/* Floating Zoom Action Toolbar */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-white/15 text-xs text-slate-200 shadow-xl">
                  <button
                    onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                    className="cursor-pointer p-1 rounded-lg hover:bg-white/10 transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-[11px] font-bold px-2">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
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

                {/* Image Display */}
                <div className="w-full h-full flex items-center justify-center overflow-auto p-4 cursor-grab active:cursor-grabbing">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={lightboxAsset.previewUrl}
                    alt={lightboxAsset.title}
                    referrerPolicy="no-referrer"
                    style={{
                      transform: `scale(${zoomLevel})`,
                      transition: 'transform 0.15s ease-out'
                    }}
                    className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl shadow-2xl origin-center"
                  />
                </div>
              </div>

              {/* Side Panel with Full Metadata */}
              <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-white/10 bg-slate-900/90 backdrop-blur-2xl p-6 flex flex-col justify-between overflow-y-auto max-h-[45vh] lg:max-h-[92vh]">
                <div className="space-y-5">
                  {/* Header & Close */}
                  <div className="hidden lg:flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {lightboxAsset.category}
                    </span>
                    <button
                      onClick={() => setLightboxAsset(null)}
                      className="cursor-pointer p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Title & Production Tag */}
                  <div>
                    <h3 className="text-lg font-black text-white leading-tight">
                      {lightboxAsset.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Approved for POD Production
                      </span>
                    </div>
                  </div>

                  {/* Google Drive Location */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1.5 text-sky-400 font-semibold">
                        <HardDrive className="w-3.5 h-3.5" /> 5 TB Drive Repository
                      </span>
                      <button
                        onClick={(e) => handleCopyLink(lightboxAsset, e)}
                        className="cursor-pointer text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{isCopied ? 'Copied' : 'Copy Link'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] font-mono text-slate-300 break-all leading-relaxed">
                      {lightboxAsset.driveFolder}
                    </p>
                  </div>

                  {/* Technical Print Specifications */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" /> Print Specifications
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-950/50 border border-white/5">
                        <span className="text-slate-400 text-[10px] block">Master Format</span>
                        <strong className="text-white font-mono">{lightboxAsset.format}</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/50 border border-white/5">
                        <span className="text-slate-400 text-[10px] block">Print Resolution</span>
                        <strong className="text-sky-300 font-mono">{lightboxAsset.resolution}</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/50 border border-white/5">
                        <span className="text-slate-400 text-[10px] block">Pixel Canvas</span>
                        <strong className="text-white font-mono truncate block">{lightboxAsset.dimensions}</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/50 border border-white/5">
                        <span className="text-slate-400 text-[10px] block">Master File Size</span>
                        <strong className="text-emerald-400 font-mono">{lightboxAsset.fileSize}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Uploader Info */}
                  <div className="p-3 rounded-2xl bg-slate-950/50 border border-white/5 flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={lightboxAsset.uploaderAvatar}
                      alt={lightboxAsset.uploadedBy}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-xl object-cover border border-sky-400/30 shrink-0"
                    />
                    <div className="min-w-0 text-xs">
                      <div className="font-bold text-white truncate">{lightboxAsset.uploadedBy}</div>
                      <div className="text-[10px] text-slate-400 truncate">{lightboxAsset.uploaderEmail}</div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" /> Design Tags
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {lightboxAsset.tags.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded-lg bg-slate-800 text-[11px] text-slate-300 border border-white/5">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Big Direct Download Master File Button */}
                <div className="pt-6 space-y-2 shrink-0">
                  <button
                    onClick={(e) => handleDownload(lightboxAsset, e)}
                    disabled={isDownloading}
                    className="cursor-pointer min-h-[48px] w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm transition-all shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-75"
                  >
                    <Download className="w-4 h-4" />
                    <span>Direct Download Master File ({lightboxAsset.fileSize})</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={(e) => handleCopyLink(lightboxAsset, e)}
                      className="cursor-pointer min-h-[38px] py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-white/10"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Drive Link</span>
                    </button>
                    <a
                      href={lightboxAsset.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-pointer min-h-[38px] py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-white/10"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in Drive</span>
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. MULTI-FILE UPLOAD TO GOOGLE DRIVE MODAL */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div 
            role="dialog"
            aria-modal="true"
            aria-label="Upload POD Assets to Drive"
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto"
          >
            <div 
              onClick={() => !isUploading && setIsUploadModalOpen(false)}
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
                    <h3 className="text-base font-bold text-white">Upload Assets to 5 TB Drive</h3>
                    <p className="text-xs text-slate-400">Direct streaming &amp; print file storage</p>
                  </div>
                </div>
                {!isUploading && (
                  <button
                    onClick={() => setIsUploadModalOpen(false)}
                    className="cursor-pointer p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <form onSubmit={handleSimulateUpload} className="space-y-4">
                {/* Drag and Drop Zone */}
                <div className="border-2 border-dashed border-white/20 hover:border-sky-500/50 rounded-2xl p-6 text-center bg-slate-900/40 hover:bg-slate-900/60 transition-all cursor-pointer">
                  <UploadCloud className="w-8 h-8 text-sky-400 mx-auto mb-2 animate-bounce" />
                  <p className="text-xs font-bold text-white">
                    Drag and drop high-res PNG, PSD, AI or SVG files
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Direct sync to Sachin Barman&apos;s 5 TB root storage (Up to 2 GB per file)
                  </p>
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

                {/* Upload Progress Bar */}
                {isUploading && (
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Streaming to Google Drive API v3...</span>
                      <span className="font-mono text-sky-400 font-bold">{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => setIsUploadModalOpen(false)}
                    className="cursor-pointer px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading || !uploadTitle.trim()}
                    className="cursor-pointer min-h-[42px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-sky-500/20 active:scale-95 disabled:opacity-50"
                  >
                    {isUploading ? 'Uploading to 5 TB Drive...' : 'Save & Publish Asset'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
