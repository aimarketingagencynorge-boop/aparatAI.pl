
export enum AppState {
  LENS = 'LENS',
  MISSION_HUB = 'MISSION_HUB',
  RESULT = 'RESULT',
  CAMPAIGN = 'CAMPAIGN',
  LOCKED = 'LOCKED'
}

export type MissionType = 'PERCEPTION' | 'SCENOGRAPHY' | 'BRAND_LAB' | 'SOCIAL_LAB' | 'MISSION';

export interface Scenography {
  id: string;
  name: string;
  description: string;
  gradient?: string;
}

export interface ProcessingResult {
  url: string;
  badge: string;
  isEnhanced?: boolean;
  isProRequired?: boolean;
  originalUrl?: string;
  isExample?: boolean;
}

export interface CampaignAsset {
  type: 'INSTAGRAM' | 'TIKTOK' | 'FACEBOOK';
  label: string;
  format: string;
  description: string;
}

export interface UploadedFile {
  name: string;
  url: string;
  timestamp: number;
}
