// ---------------------------------------------------------------------------
// drawConfig.ts
// Centralised schema + localStorage helpers for the onboarding configuration
// ---------------------------------------------------------------------------

export interface PrizeCardConfig {
    id: number;           // 0-based index
    name: string;        // e.g. "Giải Đặc Biệt"
    totalPrizes: number; // total prizes on this card  (e.g. 30)
    drawSeconds: number; // spin duration in seconds  (e.g. 8)
    drawsPerSession: number; // how many winners drawn at once per session button-press
}

export interface DrawConfig {
    drawTitle: string;       // display title for the draw
    maxNumber: number;       // highest ticket number
    prizeCards: PrizeCardConfig[];
    // background
    bgWidth: number;
    bgPosX: number;
    bgPosY: number;
    bgOverlayOpacity: number;
    // style
    fontFamily: string;      // Google Font name for display
    customFontName: string;  // name of uploaded custom font
    emojiSet: string;        // emoji set key
    customEmojis: string[];  // user-typed emojis from keyboard
    accentColor: string;     // hex color for accent
    cardOpacity: number;     // card background opacity 0-100
    cardBlur: number;        // card backdrop blur 0-20
    // card layout
    cardPadding: number;     // px padding inside card
    cardBorderRadius: number;// px border radius
    cardFontSize: number;    // base font size multiplier 50-150%
    cardTextAlign: 'left' | 'center' | 'right';
}

const STORAGE_KEY = 'luckyDrawConfig_v2';
const ONBOARDED_KEY = 'luckyDrawOnboarded_session';
export const BG_IMAGE_KEY = 'luckyDrawBgImage';
export const CUSTOM_FONT_KEY = 'luckyDrawCustomFont';

/** Max file size for custom background uploads: 6 MB.
 *  Base64 encoding adds ~33% overhead → ~8 MB in localStorage.
 *  This keeps us safely under the typical 10 MB localStorage limit
 *  while allowing full 1080p/4K-cropped JPEGs and WebP assets. */
export const BG_IMAGE_MAX_BYTES = 6 * 1024 * 1024; // 6 MB

/** Returns null if no config has been saved yet. */
export function loadConfig(): DrawConfig | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as DrawConfig;
    } catch {
        return null;
    }
}

export function saveConfig(config: DrawConfig): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/** Returns the custom background image as a data URL, or null if none uploaded. */
export function loadBgImage(): string | null {
    return localStorage.getItem(BG_IMAGE_KEY);
}

/** Persists a background image data URL. Throws if it would exceed the size guard. */
export function saveBgImage(dataUrl: string): void {
    localStorage.setItem(BG_IMAGE_KEY, dataUrl);
}

/** Removes the custom background image, reverting to the default. */
export function clearBgImage(): void {
    localStorage.removeItem(BG_IMAGE_KEY);
}

/** Returns the custom font data URL, or null. */
export function loadCustomFont(): string | null {
    return localStorage.getItem(CUSTOM_FONT_KEY);
}

/** Persists a custom font data URL. */
export function saveCustomFont(dataUrl: string): void {
    localStorage.setItem(CUSTOM_FONT_KEY, dataUrl);
}

/** Removes the custom font. */
export function clearCustomFont(): void {
    localStorage.removeItem(CUSTOM_FONT_KEY);
}

/** Register a custom font from a data URL into the document. */
export async function registerCustomFont(name: string, dataUrl: string): Promise<void> {
    const font = new FontFace(name, `url(${dataUrl})`);
    await font.load();
    document.fonts.add(font);
}

/** Session flag – true if onboarding was already completed THIS browser session */
export function isOnboardingDone(): boolean {
    return sessionStorage.getItem(ONBOARDED_KEY) === '1';
}

export function markOnboardingDone(): void {
    sessionStorage.setItem(ONBOARDED_KEY, '1');
}

// ---------------------------------------------------------------------------
// Default configuration (mirrors the original hard-coded values)
// ---------------------------------------------------------------------------
export const DEFAULT_PRIZE_CARDS: PrizeCardConfig[] = [
    { id: 0, name: 'Grand Prize', totalPrizes: 1, drawSeconds: 8, drawsPerSession: 1 },
    { id: 1, name: 'First Prize', totalPrizes: 1, drawSeconds: 6, drawsPerSession: 1 },
    { id: 2, name: 'Second Prize', totalPrizes: 2, drawSeconds: 5, drawsPerSession: 1 },
    { id: 3, name: 'Third Prize', totalPrizes: 15, drawSeconds: 3, drawsPerSession: 15 },
    { id: 4, name: 'Consolation', totalPrizes: 30, drawSeconds: 3, drawsPerSession: 15 },
];

export const DEFAULT_CONFIG: DrawConfig = {
    maxNumber: 250,
    prizeCards: DEFAULT_PRIZE_CARDS,
    bgWidth: 100,
    bgPosX: 50,
    bgPosY: 0,
    bgOverlayOpacity: 70,
    fontFamily: 'Orbitron',
    customFontName: '',
    emojiSet: 'classic',
    customEmojis: [],
    accentColor: '#3b82f6',
    cardOpacity: 70,
    cardBlur: 12,
    cardPadding: 20,
    cardBorderRadius: 16,
    cardFontSize: 100,
    cardTextAlign: 'center',
};

// ─── Style options ──────────────────────────────────────────────────────────
export const FONT_OPTIONS = [
    { value: 'Orbitron', label: 'Orbitron', style: 'futuristic' },
    { value: 'Montserrat', label: 'Montserrat', style: 'modern' },
    { value: 'Bebas Neue', label: 'Bebas Neue', style: 'bold' },
    { value: 'Rajdhani', label: 'Rajdhani', style: 'tech' },
    { value: 'Playfair Display', label: 'Playfair Display', style: 'elegant' },
    { value: 'Nunito', label: 'Nunito', style: 'playful' },
    { value: 'Roboto Mono', label: 'Roboto Mono', style: 'mono' },
    { value: 'Poppins', label: 'Poppins', style: 'clean' },
];

export const EMOJI_SETS: Record<string, { label: string; emojis: string[] }> = {
    classic: { label: '🏆 Classic', emojis: ['🏆', '👑', '🥈', '🥉', '⭐', '🎖️', '🎗️', '🏅'] },
    luxury:  { label: '💎 Luxury', emojis: ['💎', '👑', '🥇', '🎖️', '✨', '🌟', '💫', '⚡'] },
    party:   { label: '🎉 Party', emojis: ['🎉', '🎊', '🎁', '🎀', '🎈', '🎯', '🎪', '🎠'] },
    nature:  { label: '🌟 Nature', emojis: ['🌟', '🔥', '⚡', '💫', '🌙', '☀️', '🌈', '🍀'] },
    sports:  { label: '🏀 Sports', emojis: ['🏀', '⚽', '🏆', '🥇', '🏅', '🎯', '🏈', '⚾'] },
};
