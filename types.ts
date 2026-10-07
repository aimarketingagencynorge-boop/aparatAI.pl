
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export type Language = 'pl' | 'en' | 'no' | 'ru';

export type UserPlan = 'free' | 'starter' | 'pro' | 'enterprise';

export interface UserAccount {
  plan: UserPlan;
  credits: number;
  totalCredits: number;
  apiAccess: boolean;
  subscriptionId?: string;
  isAuthenticated?: boolean;
  uid?: string;
  email?: string;
}

export interface SystemLog {
  timestamp: string;
  type: 'info' | 'error' | 'success' | 'warning';
  msg: string;
}

export interface HealthStats {
  gemini: string;
  stripe: string;
  zapier: string;
  storage: number;
  latency: string;
}

export interface FoodAnalysis {
  productName: string;
  visualCharacteristics: string;
  lightingAnalysis: string;
  segmentationFocus: string;
  aiPromptSuggestion: string;
  colorPalette: string[];
}

export interface SocialPost {
  slogan: string;
  content: string;
  hashtags: string[];
  cta: string;
}

export interface SocialCopyResults {
  elegant: SocialPost;
  promo: SocialPost;
  storytelling: SocialPost;
}

export interface SocialStyle {
  id: string;
  label: string;
  prompt: string;
  gradient: string;
}

export interface StudioItem {
  id: string;
  originalImage: string;
  transformedImage: string | null;
  videoUrl?: string | null;
  isAnalyzing: boolean;
  isGenerating: boolean;
  isGeneratingVideo: boolean;
  analysis: FoodAnalysis | null;
  feedback: string;
  error: string | null;
  debugInfo?: string;
  forceFlash?: boolean;
}

export interface MenuDish {
  name: string;
  description: string;
  price: string;
  suggestedScenography: string;
}

export interface BrandAsset {
  id: string;
  url: string;
  type: 'background' | 'ref_good' | 'ref_bad' | 'logo';
  isDefault?: boolean;
}

export interface LogoSettings {
  enabled: boolean;
  mode: 'watermark' | 'brand';
  position: 'top-left' | 'top-center' | 'top-right' | 'mid-left' | 'center' | 'mid-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  margin: number;
  scale: number;
  opacity: number;
}

export interface BrandVersion {
  id: number;
  description: string;
  styleTags: string[];
  lighting: 'soft' | 'hard' | 'rim';
  retouchLevel: number;
  cameraAngle: 'packshot' | 'flatlay' | '3-4' | 'hero';
  shadowMode: 'none' | 'soft_contact' | 'hard';
  alwaysRules: string;
  neverRules: string;
  noText: boolean;
  logo: LogoSettings;
  assets: BrandAsset[];
}

export interface BrandSlot {
  id: number;
  name: string;
  activeVersionId: number;
  versions: BrandVersion[];
}

export interface StudioSettings {
  backgroundStyle: string;
  lightingType: 'golden-hour' | 'studio-soft' | 'dramatic-noir' | 'window-light';
  angle: 'table-level' | 'flatlay' | 'macro-focus';
  quality: 'standard' | 'hd' | '4k';
  aspectRatio: AspectRatio;
  presentationType: PresentationType;
  refinementText: string;
  modelPreference: 'pro' | 'flash';
  brandKit: {
    activeSlotId: number | null;
    activeVersionId: number | null;
    seriesLock: boolean;
    bgColor?: string;
    activePreset?: number | null;
    referenceImage?: string | null;
  };
}

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9" | "1:4" | "4:1" | "1:8" | "8:1" | "3:2" | "2:3";
export type PresentationType = "model" | "mannequin" | "hanger_standing" | "hanger_hanging" | "flat" | "table";

export interface StudioState {
  items: StudioItem[];
  selectedItemId: null | string;
  settings: StudioSettings;
  language: Language;
}

export type AppView = 'studio' | 'menu-parser' | 'brand-kit' | 'billing' | 'social' | 'api-management' | 'system-health' | 'login' | 'capabilities';

export const STUDIO_STYLES = [
  { id: 'black-satin', label: 'Czarne Satynowe Tło', description: 'Gładka, bezmateriałowa powierzchnia o satynowym odcieniu głębokiej czerni.', prompt: 'seamless smooth black satin finish background, non-material abstract surface, elegant semi-glossy texture, professional studio lighting with soft reflections' },
  { id: 'white-room', label: 'Biały Pokój', description: 'Minimalistyczne białe studio, czysta estetyka, jasne i prestiżowe wnętrze.', prompt: 'ultra-minimalist high-end bright white designer room, architectural clean lines, soft diffused daylight, spacious luxury studio aesthetic' },
  { id: 'creamy-cappuccino', label: 'Kremowe Cappuccino', description: 'Ciepła paleta beżu, aksamitna gładkość, przytulna i apetyczna atmosfera.', prompt: 'smooth creamy beige cappuccino color palette, velvet-like neutral surface, warm morning sun glow, soft and sophisticated professional backdrop' },
  { id: 'anthracite-flow', label: 'Anthracite Flow', description: 'Minimalist dark stone, deep matte shadows.', prompt: 'matte anthracite stone' },
  { id: 'ny-loft', label: 'NY Loft Style', description: 'Industrial brick, large factory windows.', prompt: 'industrial loft brick' },
  { id: 'tokyo-style', label: 'Tokyo Style', description: 'Neon futuristic night, wet asphalt.', prompt: 'cyberpunk neon tokyo night, wet asphalt' },
  { id: 'italian-style', label: 'Italian Style', description: 'Warm oak wood, Mediterranean sun.', prompt: 'warm oak wood, sunny mediterranean rustic kitchen' },
  { id: 'urban-minimalism', label: 'Urban Minimalism', description: 'Clean concrete, architectural shadows.', prompt: 'clean concrete, minimalist architectural shadows' },
  { id: 'oslo-minimal', label: 'Oslo Minimal', description: 'Scandinavian design, light ash wood.', prompt: 'light ash wood, scandinavian interior' }
];

export const SOCIAL_STYLES: SocialStyle[] = [
  { id: 'neon-vibe', label: 'Neon Vibe', prompt: 'cyberpunk neon lighting, deep blue and pink accents', gradient: 'from-pink-500 via-purple-600 to-blue-600' },
  { id: 'earthy-organic', label: 'Earthy Organic', prompt: 'natural textures, linen, soft sunlight, warm beige', gradient: 'from-orange-200 to-stone-400' }
];
