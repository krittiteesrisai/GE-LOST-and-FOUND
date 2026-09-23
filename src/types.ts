import { Timestamp } from 'firebase/firestore';

export type ItemType = 'lost' | 'found';
export type ItemStatus = 'active' | 'resolved';
export type TrackingStage = 'reported' | 'review' | 'contacted' | 'resolved';

export const CATEGORIES = [
  'บัตรนักศึกษา/บัตรประจำตัว',
  'อุปกรณ์อิเล็กทรอนิกส์',
  'กระเป๋า/กระเป๋าสตางค์',
  'กุญแจ',
  'เอกสาร/หนังสือ/อุปกรณ์การเรียน',
  'เครื่องประดับ',
  'อื่นๆ'
];

export interface Item {
  id?: string;
  type: ItemType;
  title: string;
  category: string;
  description: string;
  location: string;
  currentLocation?: string; // Only for 'found'
  date: string; // ISO string for the date/time the item was lost or found
  contact?: string; // Contact info (phone/line/email) - wait, it is required for lost, maybe for found too
  imageUrl?: string; // base64 or URL
  status: ItemStatus;
  stage?: TrackingStage; // Tracking stage: reported -> review -> contacted -> resolved
  adminNote?: string; // For admins to leave a note
  createdAt?: any;
  authorName?: string; // e.g. "Guest" or "กฤตติพงศ์"
  authorEmail?: string;
  authorId?: string; // uid if logged in, or 'guest'
  isGuest?: boolean;
}

export interface ChatMessage {
  id: string;
  itemId: string;
  text: string;
  authorName: string;
  authorId?: string;
  authorEmail?: string;
  authorAvatar?: string;
  isOwner?: boolean;
  isAdmin?: boolean;
  createdAt: any;
}

