// Trio INC. Data Types & Whitelist Definitions

export type UserRole = 'admin' | 'member';

export interface TeamMember {
  uid?: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatarUrl?: string;
  title?: string;
}

export interface UserProfileDocument {
  uid: string;
  name: string | null;
  email: string | null;
  photoURL: string | null;
  role: UserRole;
  lastActive: any;
  isOnline: boolean;
  createdAt?: any;
}

// Predefined 3-member whitelist for Trio INC.
// Sachin Barman (sachinbarman20190@gmail.com) is the root Admin with the 5 TB Drive
export const DEFAULT_ADMIN_EMAIL = 'sachinbarman20190@gmail.com';

export const AUTHORIZED_WHITELIST_EMAILS = [
  'sachinbarman20190@gmail.com',
  'suraj.yt.science@gmail.com',
  'member3@gmail.com',
] as const;

export const INITIAL_WHITELIST: TeamMember[] = [
  {
    email: 'sachinbarman20190@gmail.com',
    displayName: 'Sachin Barman',
    role: 'admin',
    title: 'Founder & Admin (5 TB Drive Host)',
  },
  {
    email: 'suraj.yt.science@gmail.com',
    displayName: 'Suraj Barman',
    role: 'member',
    title: 'Team Member',
  },
  {
    email: 'member3@gmail.com',
    displayName: 'Member 3',
    role: 'member',
    title: 'Team Member (Slot 3)',
  },
];

export interface ActiveMeeting {
  isActive: boolean;
  meetUrl: string;
  startedBy: string;
  startedByEmail?: string;
  startedAt: any;
  title: string;
  endedAt?: any;
}

export interface MeetingSettings {
  permanentMeetUrl: string;
  defaultTitle: string;
  updatedAt?: any;
  updatedBy?: string;
}

export interface ChatMessage {
  id: string;
  senderUid: string;
  senderEmail: string;
  senderName: string;
  senderRole: UserRole;
  type: 'text' | 'voice' | 'file' | 'meet_broadcast';
  content?: string;
  audioUrl?: string;
  audioDuration?: number;
  fileName?: string;
  driveFileId?: string;
  meetUrl?: string;
  meetTitle?: string;
  createdAt: string; // ISO string
}

export interface MeetingItem {
  id: string;
  title: string;
  agenda: string;
  meetLink: string;
  scheduledTime: string; // ISO string
  status: 'upcoming' | 'in-progress' | 'completed';
  createdBy: string;
  creatorName: string;
  createdAt: string;
}

export interface DoubtItem {
  id: string;
  title: string;
  description: string;
  category: 'doubt' | 'update' | 'bug' | 'design';
  status: 'open' | 'in-review' | 'resolved';
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'none';
  fileName?: string;
  driveFileId?: string;
  createdBy: string;
  creatorName: string;
  creatorEmail: string;
  createdAt: string;
  commentsCount?: number;
}

export interface DoubtComment {
  id: string;
  doubtId: string;
  authorUid: string;
  authorName: string;
  authorEmail: string;
  content: string;
  createdAt: string;
}

export interface PODPreset {
  id: string;
  name: string;
  garmentCost: number;
  printingCost: number;
  packagingCourier: number;
  platformFeePct: number;
  sellingPrice: number;
  netProfit: number;
  profitMarginPct: number;
  breakEvenPrice: number;
  currency: string;
  savedBy: string;
  createdAt: string;
}

export interface AdCreative {
  id: string;
  title: string;
  campaign: string;
  platform: 'Instagram' | 'Facebook' | 'TikTok' | 'YouTube' | 'Other';
  mediaType: 'video' | 'image';
  driveFileId: string;
  previewUrl: string;
  downloadUrl: string;
  fileSize: string;
  uploadedBy: string;
  uploaderName: string;
  createdAt: string;
  tags?: string[];
}

export interface InstagramPost {
  id: string;
  memberEmail: string;
  memberName: string;
  accountHandle: string;
  postUrl: string;
  views: number;
  impressions: number;
  likes: number;
  postDate: string;
  createdAt: string;
}

export interface SalesLog {
  id: string;
  productName: string;
  unitsSold: number;
  grossRevenue: number;
  netProfit: number;
  date: string;
  channel: string;
  loggedBy: string;
  createdAt: string;
}

export type NotificationType = 'chat' | 'voice' | 'doubt' | 'update' | 'sales' | 'system' | 'meeting';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  snippet: string;
  senderName?: string;
  senderAvatar?: string;
  senderRole?: string;
  targetTab: 'chat' | 'meetings' | 'doubts' | 'pod-calc' | 'creatives' | 'instagram' | 'analytics' | 'admin' | 'media-hub';
  timestamp: number;
  data?: Record<string, any>;
}

export type MediaAssetCategory =
  | 'All Assets'
  | 'T-Shirt Prints'
  | 'Hoodies & Winter'
  | 'Mockup Renders'
  | 'Social Media / Posters'
  | 'DTF Vectors';

export interface MediaAssetItem {
  id: string;
  title: string;
  category: 'T-Shirt Prints' | 'Hoodies & Winter' | 'Mockup Renders' | 'Social Media / Posters' | 'DTF Vectors';
  format: 'PNG' | 'PSD' | 'AI' | 'SVG' | 'TIFF';
  resolution: string; // e.g. "300 DPI", "600 DPI Vector", "4K DTF"
  dimensions: string; // e.g. "4500 x 5400 px"
  fileSize: string; // e.g. "14.8 MB"
  fileSizeBytes: number;
  downloadsCount: number;
  likesCount: number;
  uploadedBy: string;
  uploaderEmail: string;
  uploaderAvatar?: string;
  createdAt: string;
  driveFolder: string;
  driveLink: string;
  previewUrl: string;
  masterDownloadUrl: string;
  tags: string[];
  isSpotlight?: boolean;
  colorway?: string;
  mockupGarment?: string;
}

export type TaskCategory = 'Design' | 'Shopify Listing' | 'Social Marketing' | 'Fulfillment' | 'General';
export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface DailyTask {
  id: string;
  title: string;
  category: TaskCategory;
  assignedTo: string;
  assignedToEmail?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  dateKey?: string;
  createdBy: string;
  createdByEmail?: string;
  completedAt: string | null;
  createdAt: string;
}

