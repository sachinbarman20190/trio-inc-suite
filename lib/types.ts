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

export interface ChatMessage {
  id: string;
  senderUid: string;
  senderEmail: string;
  senderName: string;
  senderRole: UserRole;
  type: 'text' | 'voice' | 'file';
  content?: string;
  audioUrl?: string;
  audioDuration?: number;
  fileName?: string;
  driveFileId?: string;
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

export type NotificationType = 'chat' | 'voice' | 'doubt' | 'update' | 'sales' | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  snippet: string;
  senderName?: string;
  senderAvatar?: string;
  senderRole?: string;
  targetTab: 'chat' | 'meetings' | 'doubts' | 'pod-calc' | 'creatives' | 'instagram' | 'analytics' | 'admin';
  timestamp: number;
  data?: Record<string, any>;
}
