export type TabType = 'inicio' | 'camara' | 'recuerdos' | 'album' | 'proyector' | 'ajustes';

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
  image: string;
  momentTag?: string;
  driveSynced: boolean;
  verified?: boolean;
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
  driveAccount: string;
  driveFolder: string;
  driveFolderId?: string;
  driveWebhookUrl: string;
  strictDeletePermission: boolean;
  moderationEnabled: boolean;
  eventSlug: string;
  adminUser?: string;
  adminPassword?: string;
}
