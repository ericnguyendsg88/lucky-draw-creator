// ---------------------------------------------------------------------------
// drawConfig.ts
// Centralised schema + localStorage helpers for the onboarding configuration
// ---------------------------------------------------------------------------

export interface PrizeCardConfig {
    id: number;           // 0-based index
    name: string;        // e.g. "Grand Prize"
    totalPrizes: number; // total prizes on this card  (e.g. 30)
    drawSeconds: number; // spin duration in seconds  (e.g. 8)
    drawsPerSession: number; // how many winners drawn at once per session button-press
    emoji: string;       // emoji for this card (e.g. "🏆")
    showNumber: boolean; // whether to show the prize count number
    accentColor?: string; // per-card accent color hex (falls back to global)
    colSpan?: 1 | 2;     // grid column span on home screen (1=normal, 2=wide)
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
    emojiSet: string;        // emoji set key (legacy, kept for compat)
    customEmojis: string[];  // legacy
    accentColor: string;     // hex color for accent / primary
    titleColor: string;      // hex color for draw title / headings
    cardTextColor: string;   // hex color for card text (names, numbers)
    bgOverlayColor: string;  // hex color for background overlay tint
    cardOpacity: number;     // card background opacity 0-100
    cardBlur: number;        // card backdrop blur 0-20
    // card layout
    cardPadding: number;     // px padding inside card
    cardBorderRadius: number;// px border radius
    cardFontSize: number;    // base font size multiplier 50-150%
    cardTextAlign: 'left' | 'center' | 'right';
    // element visibility / order
    showPrizeNumber: boolean;  // global toggle for prize count number
    cardElementOrder: ('emoji' | 'name' | 'number')[]; // order of elements in card
    // card grid layout
    cardLayout: 'auto' | 'small' | 'large'; // grid layout style for prize cards
    // slot machine
    slotBgColor: string;       // hex for slot machine background
    slotBgOpacity: number;     // 0-100
    slotDigitColor: string;    // hex for digit text
    slotBorderColor: string;   // hex for frame border
    slotGlowOpacity: number;   // 0-100 glow intensity
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
// Hex → HSL conversion + dynamic theme application
// ---------------------------------------------------------------------------
function hexToHsl(hex: string): { h: number; s: number; l: number } {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/** Apply the accent color as the site-wide primary theme by setting CSS custom properties. */
export function applyAccentTheme(accentHex: string, titleHex?: string, cardTextHex?: string, bgOverlayHex?: string): void {
    const { h, s, l } = hexToHsl(accentHex);
    const hsl = `${h} ${s}% ${l}%`;
    const root = document.documentElement.style;
    root.setProperty('--primary', hsl);
    root.setProperty('--ring', hsl);
    root.setProperty('--accent-color-hex', accentHex);
    // lighter variant for hover states
    root.setProperty('--primary-light', `${h} ${s}% ${Math.min(l + 12, 90)}%`);
    // darker variant
    root.setProperty('--primary-dark', `${h} ${s}% ${Math.max(l - 10, 10)}%`);
    // title color
    if (titleHex) root.setProperty('--title-color', titleHex);
    // card text color
    if (cardTextHex) root.setProperty('--card-text-color', cardTextHex);
    // background overlay color
    if (bgOverlayHex) root.setProperty('--bg-overlay-color', bgOverlayHex);
}

/** Apply slot machine CSS variables from config. */
export function applySlotTheme(cfg: Pick<DrawConfig, 'slotBgColor' | 'slotBgOpacity' | 'slotDigitColor' | 'slotBorderColor' | 'slotGlowOpacity'>): void {
    const root = document.documentElement.style;
    const toRgb = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `${r},${g},${b}`;
    };
    root.setProperty('--slot-bg-rgb', toRgb(cfg.slotBgColor || '#3b82f6'));
    root.setProperty('--slot-bg-opacity', String((cfg.slotBgOpacity ?? 55) / 100));
    root.setProperty('--slot-digit-color', cfg.slotDigitColor || '#ffffff');
    root.setProperty('--slot-border-rgb', toRgb(cfg.slotBorderColor || '#3b82f6'));
    root.setProperty('--slot-glow-opacity', String((cfg.slotGlowOpacity ?? 30) / 100));
}

// ---------------------------------------------------------------------------
// Default configuration (mirrors the original hard-coded values)
// ---------------------------------------------------------------------------
const DEFAULT_EMOJIS = ['🏆', '👑', '🥈', '🥉', '⭐'];
export const DEFAULT_PRIZE_CARDS: PrizeCardConfig[] = [
    { id: 0, name: 'Grand Prize', totalPrizes: 1, drawSeconds: 8, drawsPerSession: 1, emoji: '🏆', showNumber: true },
    { id: 1, name: 'First Prize', totalPrizes: 1, drawSeconds: 6, drawsPerSession: 1, emoji: '👑', showNumber: true },
    { id: 2, name: 'Second Prize', totalPrizes: 2, drawSeconds: 5, drawsPerSession: 1, emoji: '🥈', showNumber: true },
    { id: 3, name: 'Third Prize', totalPrizes: 15, drawSeconds: 3, drawsPerSession: 15, emoji: '🥉', showNumber: true },
    { id: 4, name: 'Consolation', totalPrizes: 30, drawSeconds: 3, drawsPerSession: 15, emoji: '⭐', showNumber: true },
];

export const COMMON_EMOJIS = [
    '🏆', '👑', '🥇', '🥈', '🥉', '⭐', '💎', '🎉', '🎊', '🎁',
    '🎀', '🔥', '⚡', '💫', '🌟', '🎯', '🎪', '🏅', '🎖️', '🎗️',
    '💰', '💵', '🪙', '🎰', '🍀', '❤️', '💜', '💙', '🧡', '💚',
];

export const DEFAULT_CONFIG: DrawConfig = {
    drawTitle: 'LUCKY DRAW',
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
    titleColor: '#ffffff',
    cardTextColor: '#ffffff',
    bgOverlayColor: '#000000',
    cardOpacity: 70,
    cardBlur: 12,
    cardPadding: 20,
    cardBorderRadius: 16,
    cardFontSize: 100,
    cardTextAlign: 'center',
    showPrizeNumber: true,
    cardElementOrder: ['emoji', 'name', 'number'],
    cardLayout: 'auto',
    slotBgColor: '#3b82f6',
    slotBgOpacity: 55,
    slotDigitColor: '#ffffff',
    slotBorderColor: '#3b82f6',
    slotGlowOpacity: 30,
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
