export type TabType = 'inicio' | 'camara' | 'recuerdos' | 'album' | 'envivo' | 'proyector' | 'ajustes';

export type CelebrationType = 'Mis 15 Años' | 'Mis 18 Años' | 'Boda / Gala' | 'Cumpleaños Especial';

export type FrameType = 'elegante' | 'glitter' | 'polaroid' | 'retro';

export interface Memory {
  id: string;
  author: string;
  table: string;
  time: string;
  timestamp: number;
  message?: string;
  reaction?: string;
  likes: number;
  isLiked?: boolean;
  likedBy?: string[];
  image: string;
  mediaType?: 'photo' | 'video';
  videoUrl?: string;
  videoDuration?: number;
  memoryNumber?: number;
  instagramHandle?: string;
  momentTag?: string;
  cloudSynced?: boolean;
  driveSynced?: boolean;
  verified?: boolean;
}

export interface OnlineGuest {
  id: string;
  name: string;
  table?: string;
  lastActive: number;
}

export type StorageMethod =
  | 'cloud_firestore'
  | 'app_local'
  | 'backend_server'
  | 'device_gallery'
  | 'imgbb'
  | 'whatsapp'
  | 'drive';

export interface PlaylistItem {
  id: string;
  title: string;
  artist?: string;
  addedBy: string;
  table?: string;
  platform: 'youtube' | 'spotify' | 'audio';
  url: string;
  videoId?: string;
  spotifyId?: string;
  likes: number;
  likedBy?: string[];
  status?: 'pending' | 'playing' | 'played';
  timestamp: number;
  note?: string;
}

export interface EventSettings {
  eventName: string;
  honoreeName: string;
  celebrationType: CelebrationType;
  date: string;
  location: string;
  hashtag: string;
  coverImage: string;
  welcomeMessage: string;
  storageMethod?: StorageMethod;
  autoDownloadToDevice?: boolean;
  strictDeletePermission: boolean;
  moderationEnabled: boolean;
  eventSlug: string;
  adminUser?: string;
  adminPassword?: string;
  customLogoUrl?: string;
  backgroundSongUrl?: string;
  backgroundSongTitle?: string;
  settingsUpdatedAt?: number;
  // Deprecated fields kept optional for backward compatibility
  imgbbApiKey?: string;
  whatsappNumber?: string;
  whatsappGroupUrl?: string;
  driveAccount?: string;
  driveFolder?: string;
  driveFolderId?: string;
  driveWebhookUrl?: string;
  driveDirectFolderUrl?: string;
}
