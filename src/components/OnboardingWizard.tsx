import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    DrawConfig,
    PrizeCardConfig,
    DEFAULT_CONFIG,
    loadConfig,
    saveConfig,
    markOnboardingDone,
    loadBgImage,
    saveBgImage,
    clearBgImage,
    BG_IMAGE_MAX_BYTES,
    FONT_OPTIONS,
    EMOJI_SETS,
    COMMON_EMOJIS,
    loadCustomFont,
    saveCustomFont,
    clearCustomFont,
    registerCustomFont,
    applyAccentTheme,
} from "@/lib/drawConfig";
import {
    Image,
    Trophy,
    Clock,
    Users,
    ChevronRight,
    ChevronLeft,
    Check,
    Plus,
    Trash2,
    Sparkles,
    Star,
    Award,
    Medal,
    Zap,
    Palette,
    Upload,
    X,
    Type,
    LayoutGrid,
    Maximize2,
    Minimize2,
    GripVertical,
    Eye,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// ─── helpers ────────────────────────────────────────────────────────────────

const ALL_STEP_LABELS = [
    { icon: Type, label: "Title" },
    { icon: Image, label: "Background" },
    { icon: Trophy, label: "Prizes" },
    { icon: Palette, label: "Style" },
    { icon: Clock, label: "Timing" },
    { icon: Users, label: "Batch Size" },
    { icon: LayoutGrid, label: "Layout" },
];

const ALL_STEP_TITLES = [
    "✏️  Draw Title",
    "🎨  Background",
    "🏆  Prize Cards",
    "🎭  Style",
    "⏱️  Timing",
    "🎯  Batch Size",
    "📐  Card Layout",
];

const CARD_COLORS = [
    { border: "rgba(236,72,153,0.7)", glow: "rgba(236,72,153,0.3)", gradient: "from-pink-500/20 via-purple-500/10 to-transparent" },
    { border: "rgba(251,191,36,0.7)", glow: "rgba(251,191,36,0.3)", gradient: "from-yellow-400/20 via-yellow-300/10 to-transparent" },
    { border: "rgba(226,232,240,0.6)", glow: "rgba(226,232,240,0.2)", gradient: "from-slate-100/20 via-slate-200/10 to-transparent" },
    { border: "rgba(251,146,60,0.7)", glow: "rgba(251,146,60,0.3)", gradient: "from-orange-400/20 via-orange-300/10 to-transparent" },
    { border: "rgba(96,165,250,0.7)", glow: "rgba(96,165,250,0.3)", gradient: "from-blue-400/20 via-blue-300/10 to-transparent" },
];
const CARD_ICONS = [Trophy, Trophy, Award, Medal, Star];

function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}

// ─── sub-components ──────────────────────────────────────────────────────────

function SliderRow({
    label, value, min, max, step, unit = "%",
    onChange,
}: {
    label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void
}) {
    return (
        <div className="onb-slider-row">
            <div className="onb-slider-label">
                <span>{label}</span>
                <span className="onb-slider-value">{value}{unit}</span>
            </div>
            <input type="range" min={min} max={max} step={step ?? 1} value={value}
                onChange={e => onChange(Number(e.target.value))} className="onb-slider" />
        </div>
    );
}

function ColorPickerCard({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
    const [hex, setHex] = useState(value);
    const handleHex = (v: string) => {
        setHex(v);
        if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v);
    };
    return (
        <div className="onb-card" style={{ marginBottom: 16 }}>
            <label className="onb-label" style={{ marginBottom: 8, display: 'block' }}>{label}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label style={{
                    width: 36, height: 36, borderRadius: 8, background: value,
                    border: '2px solid rgba(255,255,255,0.3)', cursor: 'pointer',
                    position: 'relative', overflow: 'hidden', flexShrink: 0,
                }}>
                    <input type="color" value={value} onChange={e => { onChange(e.target.value); setHex(e.target.value); }}
                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                </label>
                <input type="text" value={hex} onChange={e => handleHex(e.target.value)}
                    className="onb-input" style={{ width: 100, fontFamily: 'monospace', fontSize: 14 }} maxLength={7} />
                {['#ffffff', '#000000', '#f0f0f0', '#1a1a2e'].map(c => (
                    <button key={c} type="button" onClick={() => { onChange(c); setHex(c); }}
                        style={{
                            width: 24, height: 24, borderRadius: 6, background: c,
                            border: value === c ? '2px solid hsl(var(--primary))' : '1px solid rgba(255,255,255,0.2)',
                            cursor: 'pointer',
                        }} />
                ))}
            </div>
        </div>
    );
}

// ─── Step Indicator ──────────────────────────────────────────────────────────
function StepIndicator({ steps, currentStep, onStepClick, freeNav }: {
    steps: { icon: any; label: string }[];
    currentStep: number;
    onStepClick: (i: number) => void;
    freeNav?: boolean;
}) {
    return (
        <div className="onb-step-indicator">
            {steps.map((s, i) => {
                const Icon = s.icon;
                const isDone = i < currentStep;
                const isActive = i === currentStep;
                const isClickable = freeNav || i <= currentStep;
                return (
                    <div key={i} className="onb-step-indicator-item">
                        {i > 0 && (
                            <div className={`onb-step-line ${i <= currentStep ? 'onb-step-line--active' : ''}`} />
                        )}
                        <button
                            type="button"
                            onClick={() => isClickable && onStepClick(i)}
                            className={`onb-step-circle ${isDone ? 'onb-step-circle--done' : ''} ${isActive ? 'onb-step-circle--active' : ''}`}
                            disabled={!isClickable}
                            title={s.label}
                        >
                            {isDone ? <Check size={14} /> : <span className="onb-step-number">{i + 1}</span>}
                        </button>
                        <span className={`onb-step-label-text ${isActive ? 'onb-step-label-text--active' : ''} ${isDone ? 'onb-step-label-text--done' : ''}`}>
                            {s.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Step 1 – Title ──────────────────────────────────────────────────────────
function StepTitle({ cfg, onChange }: { cfg: DrawConfig; onChange: (partial: Partial<DrawConfig>) => void }) {
    return (
        <div className="onb-step-content">
            <div className="onb-card">
                <label className="onb-label" style={{ marginBottom: 8, display: 'block' }}>Draw Title</label>
                <input
                    type="text"
                    value={cfg.drawTitle}
                    onChange={e => onChange({ drawTitle: e.target.value })}
                    className="onb-input"
                    placeholder="e.g. LUCKY DRAW"
                    maxLength={50}
                    style={{ fontSize: 18, fontWeight: 700, fontFamily: `'${cfg.fontFamily}', sans-serif` }}
                />
            </div>
            <div style={{
                marginTop: 20, textAlign: 'center', padding: '24px 16px',
                background: 'rgba(20,30,60,0.6)', borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.1)',
            }}>
                <h1 style={{
                    fontFamily: `'${cfg.fontFamily}', sans-serif`,
                    fontSize: 32, fontWeight: 900, color: 'white',
                    textShadow: '0 0 40px rgba(150,200,255,0.8), 0 0 80px rgba(100,150,255,0.5)',
                    letterSpacing: '0.05em',
                }}>
                    {cfg.drawTitle || 'LUCKY DRAW'}
                </h1>
            </div>
        </div>
    );
}

// ─── Step 2 – Background ─────────────────────────────────────────────────────
function StepBackground({ cfg, onChange }: { cfg: DrawConfig; onChange: (partial: Partial<DrawConfig>) => void }) {
    const [bgImageUrl, setBgImageUrl] = useState<string | null>(() => loadBgImage());
    const [dragOver, setDragOver] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const src = bgImageUrl ?? '/background.webp';
        document.body.style.backgroundImage = `url('${src}')`;
        document.body.style.backgroundSize = `${cfg.bgWidth}% auto`;
        document.body.style.backgroundPosition = `${cfg.bgPosX}% ${cfg.bgPosY}%`;
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundAttachment = 'fixed';
        document.documentElement.style.setProperty('--bg-overlay-opacity', String(cfg.bgOverlayOpacity / 100));
        const oc = cfg.bgOverlayColor || '#000000';
        const r = parseInt(oc.slice(1, 3), 16), g = parseInt(oc.slice(3, 5), 16), b = parseInt(oc.slice(5, 7), 16);
        document.documentElement.style.setProperty('--bg-overlay-computed', `rgba(${r},${g},${b},${cfg.bgOverlayOpacity / 100})`);
    }, [cfg.bgWidth, cfg.bgPosX, cfg.bgPosY, cfg.bgOverlayOpacity, cfg.bgOverlayColor, bgImageUrl]);

    const processFile = (file: File) => {
        setUploadError(null);
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowed.includes(file.type)) { setUploadError('Unsupported format. Please use JPEG, PNG, WebP, or GIF.'); return; }
        if (file.size > BG_IMAGE_MAX_BYTES) { setUploadError(`File is ${(file.size / 1024 / 1024).toFixed(1)} MB. Max 6 MB.`); return; }
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            try { saveBgImage(dataUrl); setBgImageUrl(dataUrl); }
            catch { setUploadError('Could not save — browser storage may be full.'); }
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) processFile(file); e.target.value = ''; };
    const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files?.[0]; if (file) processFile(file); };
    const removeImage = () => { clearBgImage(); setBgImageUrl(null); setUploadError(null); };

    return (
        <div className="onb-step-content">
            <div
                className={`onb-upload-zone ${dragOver ? 'onb-upload-zone--drag' : ''} ${bgImageUrl ? 'onb-upload-zone--has-image' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                role="button" tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
                aria-label="Upload background image"
            >
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="onb-upload-input" onChange={handleFileChange} />
                {bgImageUrl ? (
                    <div className="onb-upload-preview">
                        <img src={bgImageUrl} alt="Current background" className="onb-upload-thumb" />
                        <div className="onb-upload-overlay-label">
                            <span>✅ Custom image active</span>
                            <span className="onb-upload-change">Click to change</span>
                        </div>
                    </div>
                ) : (
                    <div className="onb-upload-empty">
                        <div className="onb-upload-icon">🖼️</div>
                        <div className="onb-upload-title">{dragOver ? 'Drop to upload' : 'Upload Background Image'}</div>
                        <div className="onb-upload-sub">Drag & drop or <span className="onb-upload-link">click to browse</span></div>
                        <div className="onb-upload-limits">JPEG · PNG · WebP · GIF &nbsp;·&nbsp; Max 6 MB</div>
                    </div>
                )}
            </div>
            {uploadError && <div className="onb-upload-error">⚠️ {uploadError}</div>}
            {bgImageUrl && (
                <button type="button" className="onb-remove-image-btn" onClick={e => { e.stopPropagation(); removeImage(); }}>
                    🗑️ Remove image (use default)
                </button>
            )}
            
        </div>
    );
}

// ─── Step 2 – Prize Cards ────────────────────────────────────────────────────
function StepPrizeCards({ cfg, onChange }: { cfg: DrawConfig; onChange: (partial: Partial<DrawConfig>) => void }) {
    const cards = cfg.prizeCards;
    const updateCard = useCallback((i: number, patch: Partial<PrizeCardConfig>) => {
        onChange({ prizeCards: cards.map((c, idx) => idx === i ? { ...c, ...patch } : c) });
    }, [cards, onChange]);

    const addCard = () => {
        if (cards.length >= 8) return;
        onChange({ prizeCards: [...cards, { id: cards.length, name: `Prize ${cards.length + 1}`, totalPrizes: 5, drawSeconds: 3, drawsPerSession: 5, emoji: COMMON_EMOJIS[cards.length % COMMON_EMOJIS.length], showNumber: true }] });
    };

    const removeCard = (i: number) => {
        if (cards.length <= 0) return;
        onChange({ prizeCards: cards.filter((_, idx) => idx !== i).map((c, idx) => ({ ...c, id: idx })) });
    };

    const [emojiPickerOpen, setEmojiPickerOpen] = useState<number | null>(null);

    return (
        <div className="onb-step-content">
            <div className="onb-cards-list">
                {cards.map((card, i) => {
                    const fallbackColor = CARD_COLORS[i % CARD_COLORS.length];
                    const IconComp = CARD_ICONS[i % CARD_ICONS.length];
                    const cardHex = card.accentColor || cfg.accentColor;
                    const usedBorder = card.accentColor ? `${cardHex}b3` : fallbackColor.border;
                    const usedGlow = card.accentColor ? `${cardHex}40` : fallbackColor.glow;
                    return (
                        <motion.div key={i} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="onb-prize-card" style={{ borderColor: usedBorder, boxShadow: `0 0 16px ${usedGlow}` }}>
                            <div className="onb-prize-card-header">
                                {/* Emoji selector */}
                                <button type="button" onClick={() => setEmojiPickerOpen(emojiPickerOpen === i ? null : i)}
                                    style={{ fontSize: 28, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, width: 48, height: 48, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="Choose emoji">
                                    {card.emoji || '🏆'}
                                </button>
                                <div className="onb-prize-card-fields">
                                    <label className="onb-label">Prize Name</label>
                                    <input type="text" value={card.name} maxLength={30} onChange={e => updateCard(i, { name: e.target.value })}
                                        className="onb-input onb-input-name" placeholder="e.g. Grand Prize" />
                                </div>
                                <button type="button" onClick={() => removeCard(i)} className="onb-remove-btn" title="Remove this prize">
                                    <Trash2 size={15} />
                                </button>
                            </div>
                            {/* Emoji picker grid */}
                            {emojiPickerOpen === i && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 8 }}>
                                    {COMMON_EMOJIS.map(em => (
                                        <button key={em} type="button" onClick={() => { updateCard(i, { emoji: em }); setEmojiPickerOpen(null); }}
                                            style={{ fontSize: 22, width: 36, height: 36, borderRadius: 8, border: card.emoji === em ? '2px solid white' : '1px solid rgba(255,255,255,0.1)', background: card.emoji === em ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {em}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="onb-prize-card-body">
                                <div className="onb-field-group">
                                    <label className="onb-label">Total Prizes</label>
                                    <div className="onb-number-row">
                                        <button type="button" className="onb-num-btn" onClick={() => updateCard(i, { totalPrizes: clamp(card.totalPrizes - 1, 1, 500) })}>−</button>
                                        <input type="number" min={1} max={500} value={card.totalPrizes}
                                            onChange={e => updateCard(i, { totalPrizes: clamp(Number(e.target.value), 1, 500) })} className="onb-input onb-input-num" />
                                        <button type="button" className="onb-num-btn" onClick={() => updateCard(i, { totalPrizes: clamp(card.totalPrizes + 1, 1, 500) })}>+</button>
                                    </div>
                                </div>
                                {/* Per-card accent color */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                                    <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>Card Color</label>
                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                                        <button type="button" onClick={() => updateCard(i, { accentColor: undefined })}
                                            style={{
                                                width: 24, height: 24, borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #888 50%, #444 50%)',
                                                border: !card.accentColor ? '2px solid white' : '1px solid rgba(255,255,255,0.2)',
                                                cursor: 'pointer', fontSize: 10, color: 'white',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}
                                            title="Use global theme color">
                                            G
                                        </button>
                                        {['#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316'].map(c => (
                                            <button key={c} type="button" onClick={() => updateCard(i, { accentColor: c })}
                                                style={{
                                                    width: 24, height: 24, borderRadius: '50%', background: c,
                                                    border: card.accentColor === c ? '2px solid white' : '1px solid rgba(255,255,255,0.15)',
                                                    cursor: 'pointer', transition: 'all 0.15s',
                                                    boxShadow: card.accentColor === c ? `0 0 8px ${c}` : 'none',
                                                }} />
                                        ))}
                                        <label style={{
                                            width: 24, height: 24, borderRadius: '50%',
                                            background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
                                            border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
                                            position: 'relative', overflow: 'hidden',
                                        }}>
                                            <input type="color" value={card.accentColor || cfg.accentColor}
                                                onChange={e => updateCard(i, { accentColor: e.target.value })}
                                                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                        </label>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                                    <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Show prize count</label>
                                    <button type="button" onClick={() => updateCard(i, { showNumber: !card.showNumber })}
                                        style={{ width: 40, height: 22, borderRadius: 11, background: card.showNumber !== false ? 'var(--accent-color-hex, #3b82f6)' : 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                                        <span style={{ position: 'absolute', top: 2, left: card.showNumber !== false ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {cards.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
                    No prize cards added. The draw will start immediately after setup.
                </div>
            )}

            {cards.length < 8 && (
                <button type="button" className="onb-add-btn" onClick={addCard}>
                    <Plus size={16} /> Add Prize Card
                </button>
            )}

            <div className="onb-field-group onb-max-number">
                <label className="onb-label">Max Ticket Number <span className="onb-required">*</span></label>
                
                <input type="number" min={1} max={9999} value={cfg.maxNumber}
                    onChange={e => onChange({ maxNumber: clamp(Number(e.target.value), 1, 9999) })}
                    className="onb-input onb-input-max" placeholder="e.g. 250" />
            </div>
        </div>
    );
}

// ─── Drag & Drop Reorder List ────────────────────────────────────────────────
function DragReorderList<T extends string>({ items, onReorder, renderItem }: {
    items: T[];
    onReorder: (newItems: T[]) => void;
    renderItem: (item: T, index: number) => React.ReactNode;
}) {
    const [dragIdx, setDragIdx] = useState<number | null>(null);
    const [overIdx, setOverIdx] = useState<number | null>(null);

    const handleDragStart = (idx: number) => (e: React.DragEvent) => {
        setDragIdx(idx);
        e.dataTransfer.effectAllowed = 'move';
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '0.5';
        }
    };

    const handleDragEnd = (e: React.DragEvent) => {
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '1';
        }
        if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
            const arr = [...items];
            const [moved] = arr.splice(dragIdx, 1);
            arr.splice(overIdx, 0, moved);
            onReorder(arr);
        }
        setDragIdx(null);
        setOverIdx(null);
    };

    const handleDragOver = (idx: number) => (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setOverIdx(idx);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {items.map((item, idx) => (
                <div
                    key={item}
                    draggable
                    onDragStart={handleDragStart(idx)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver(idx)}
                    onDragEnter={(e) => { e.preventDefault(); setOverIdx(idx); }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: overIdx === idx && dragIdx !== null && dragIdx !== idx
                            ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.06)',
                        borderRadius: 8, padding: '10px 12px',
                        border: overIdx === idx && dragIdx !== null && dragIdx !== idx
                            ? '1px solid rgba(96,165,250,0.4)' : '1px solid rgba(255,255,255,0.1)',
                        cursor: 'grab', transition: 'background 0.15s, border-color 0.15s',
                        userSelect: 'none',
                    }}
                >
                    {renderItem(item, idx)}
                </div>
            ))}
        </div>
    );
}

// ─── Step 3 – Style ──────────────────────────────────────────────────────────
function StepStyle({ cfg, onChange }: { cfg: DrawConfig; onChange: (partial: Partial<DrawConfig>) => void }) {
    const ACCENT_PRESETS = ['#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#6366f1', '#14b8a6'];
    const [hexInput, setHexInput] = useState(cfg.accentColor);
    const [customFontLoaded, setCustomFontLoaded] = useState(false);
    const [customFontError, setCustomFontError] = useState<string | null>(null);
    const fontFileRef = useRef<HTMLInputElement>(null);

    // Load existing custom font on mount
    useEffect(() => {
        if (cfg.customFontName) {
            const stored = loadCustomFont();
            if (stored) {
                registerCustomFont(cfg.customFontName, stored).then(() => setCustomFontLoaded(true)).catch(() => {});
            }
        }
    }, []);

    const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCustomFontError(null);

        if (!file.name.match(/\.(ttf|otf|woff|woff2)$/i)) {
            setCustomFontError('Please upload a .ttf, .otf, .woff, or .woff2 font file.');
            return;
        }
        if (file.size > 4 * 1024 * 1024) {
            setCustomFontError('Font file too large (max 4 MB).');
            return;
        }

        try {
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const dataUrl = ev.target?.result as string;
                const fontName = file.name.replace(/\.(ttf|otf|woff|woff2)$/i, '').replace(/[^a-zA-Z0-9 -]/g, '');
                try {
                    await registerCustomFont(fontName, dataUrl);
                    saveCustomFont(dataUrl);
                    onChange({ fontFamily: fontName, customFontName: fontName });
                    setCustomFontLoaded(true);
                } catch {
                    setCustomFontError('Failed to load font. The file may be corrupted.');
                }
            };
            reader.readAsDataURL(file);
        } catch {
            setCustomFontError('Failed to read font file.');
        }
        e.target.value = '';
    };

    const removeCustomFont = () => {
        clearCustomFont();
        onChange({ fontFamily: 'Orbitron', customFontName: '' });
        setCustomFontLoaded(false);
    };

    const handleHexChange = (val: string) => {
        setHexInput(val);
        if (/^#[0-9a-fA-F]{6}$/.test(val)) {
            onChange({ accentColor: val });
            applyAccentTheme(val, cfg.titleColor, cfg.cardTextColor, cfg.bgOverlayColor);
        }
    };

    const activeFont = cfg.fontFamily;
    const elementOrder = cfg.cardElementOrder ?? ['emoji', 'name', 'number'];

    const moveElement = (from: number, to: number) => {
        const arr = [...elementOrder];
        const [el] = arr.splice(from, 1);
        arr.splice(to, 0, el);
        onChange({ cardElementOrder: arr });
    };

    const previewCard = cfg.prizeCards[0];

    return (
        <div className="onb-step-content" style={{ display: 'flex', gap: 16, flexDirection: 'row', flexWrap: 'wrap' }}>

            {/* ── Sticky Live Preview (right column on desktop) ── */}
            <div style={{
                order: 2, flex: '0 0 auto', width: '100%',
                position: 'sticky', top: 0, zIndex: 5,
                paddingBottom: 8,
            }}>
                <div style={{
                    background: 'rgba(10,15,40,0.9)', borderRadius: 12, padding: 12,
                    border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
                }}>
                    <label className="onb-label" style={{ marginBottom: 8, display: 'block', fontSize: 12 }}>👁️ Live Preview</label>
                    <div style={{
                        padding: cfg.cardPadding, borderRadius: cfg.cardBorderRadius,
                        background: `rgba(20,30,60,${cfg.cardOpacity / 100})`, backdropFilter: `blur(${cfg.cardBlur}px)`,
                        border: `2px solid ${(previewCard?.accentColor || cfg.accentColor)}40`, textAlign: cfg.cardTextAlign,
                        transition: 'all 0.3s ease',
                    }}>
                        {elementOrder.map(el => {
                            const cardAccent = previewCard?.accentColor || cfg.accentColor;
                            if (el === 'emoji') return (
                                <div key="emoji" style={{ fontSize: 28 * (cfg.cardFontSize / 100), marginBottom: 4 }}>
                                    {previewCard?.emoji ?? '🏆'}
                                </div>
                            );
                            if (el === 'name') return (
                                <div key="name" style={{ fontFamily: `'${activeFont}', sans-serif`, fontSize: 20 * (cfg.cardFontSize / 100), fontWeight: 800, color: cfg.cardTextColor || 'white', marginBottom: 4 }}>
                                    {previewCard?.name ?? 'Grand Prize'}
                                </div>
                            );
                            if (el === 'number') return (
                                <div key="number" style={{ fontFamily: `'${activeFont}', sans-serif`, fontSize: 32 * (cfg.cardFontSize / 100), fontWeight: 900, color: cardAccent, marginBottom: 4 }}>
                                    5 <span style={{ fontSize: 14 * (cfg.cardFontSize / 100), color: 'rgba(255,255,255,0.5)' }}>/ 10</span>
                                </div>
                            );
                            return null;
                        })}
                        <div style={{ width: '100%', height: 8, borderRadius: 4, background: 'rgba(0,0,0,0.3)', overflow: 'hidden' }}>
                            <div style={{ width: '50%', height: '100%', borderRadius: 4, background: previewCard?.accentColor || cfg.accentColor, transition: 'all 0.3s' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Settings (left column) ── */}
            <div style={{ order: 1, flex: 1, minWidth: 0, width: '100%' }}>

                {/* ── Font Section ── */}
                <div className="onb-card" style={{ marginBottom: 16 }}>
                    <label className="onb-label" style={{ marginBottom: 8, display: 'block' }}>🔤 Display Font</label>

                    {/* Upload custom font */}
                    <div style={{ marginBottom: 12 }}>
                        <input ref={fontFileRef} type="file" accept=".ttf,.otf,.woff,.woff2" style={{ display: 'none' }} onChange={handleFontUpload} />
                        {cfg.customFontName ? (
                            <div className="onb-style-option onb-style-option--active" style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <span style={{ fontFamily: `'${cfg.customFontName}', sans-serif`, fontWeight: 700 }}>
                                    ✅ {cfg.customFontName}
                                </span>
                                <button type="button" onClick={removeCustomFont} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <button type="button" onClick={() => fontFileRef.current?.click()}
                                className="onb-style-option" style={{ width: '100%', flexDirection: 'row', gap: 8 }}>
                                <Upload size={16} />
                                <span>Upload Custom Font (.ttf, .otf, .woff)</span>
                            </button>
                        )}
                        {customFontError && <div className="onb-upload-error" style={{ marginTop: 6 }}>⚠️ {customFontError}</div>}
                    </div>

                    {/* Preset fonts */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                        {FONT_OPTIONS.map(font => (
                            <button key={font.value} type="button" onClick={() => onChange({ fontFamily: font.value, customFontName: '' })}
                                className={`onb-style-option ${cfg.fontFamily === font.value && !cfg.customFontName ? 'onb-style-option--active' : ''}`}
                                style={{ fontFamily: `'${font.value}', sans-serif` }}>
                                <span style={{ fontSize: 16, fontWeight: 700 }}>{font.label}</span>
                                <span style={{ fontSize: 11, opacity: 0.6 }}>{font.style}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Primary Theme Color ── */}
                <div className="onb-card" style={{ marginBottom: 16 }}>
                    <label className="onb-label" style={{ marginBottom: 8, display: 'block' }}>🎨 Primary Theme Color</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                        {ACCENT_PRESETS.map(color => (
                            <button key={color} type="button" onClick={() => { onChange({ accentColor: color }); setHexInput(color); applyAccentTheme(color, cfg.titleColor, cfg.cardTextColor, cfg.bgOverlayColor); }}
                                style={{
                                    width: 36, height: 36, borderRadius: '50%', background: color,
                                    border: cfg.accentColor === color ? '3px solid white' : '2px solid rgba(255,255,255,0.2)',
                                    cursor: 'pointer', transition: 'all 0.2s',
                                    boxShadow: cfg.accentColor === color ? `0 0 12px ${color}` : 'none',
                                }} />
                        ))}
                        <label style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
                            border: '2px solid rgba(255,255,255,0.3)', cursor: 'pointer',
                            position: 'relative', overflow: 'hidden',
                        }}>
                            <input type="color" value={cfg.accentColor} onChange={e => { onChange({ accentColor: e.target.value }); setHexInput(e.target.value); applyAccentTheme(e.target.value, cfg.titleColor, cfg.cardTextColor, cfg.bgOverlayColor); }}
                                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                        </label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>HEX:</span>
                        <input type="text" value={hexInput} onChange={e => handleHexChange(e.target.value)}
                            placeholder="#3b82f6" className="onb-input" style={{ width: 120, fontFamily: 'monospace', fontSize: 14 }} maxLength={7} />
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: cfg.accentColor, border: '2px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
                    </div>
                </div>

                {/* ── Title / Heading Color ── */}
                <ColorPickerCard
                    label="✏️ Title / Heading Color"
                    value={cfg.titleColor || '#ffffff'}
                    onChange={(c) => { onChange({ titleColor: c }); applyAccentTheme(cfg.accentColor, c, cfg.cardTextColor, cfg.bgOverlayColor); }}
                />

                {/* ── Card Text Color ── */}
                <ColorPickerCard
                    label="📝 Card Text Color"
                    value={cfg.cardTextColor || '#ffffff'}
                    onChange={(c) => { onChange({ cardTextColor: c }); applyAccentTheme(cfg.accentColor, cfg.titleColor, c, cfg.bgOverlayColor); }}
                />

                {/* ── Background Overlay Tint ── */}
                <ColorPickerCard
                    label="🌗 Background Overlay Tint"
                    value={cfg.bgOverlayColor || '#000000'}
                    onChange={(c) => { onChange({ bgOverlayColor: c }); applyAccentTheme(cfg.accentColor, cfg.titleColor, cfg.cardTextColor, c); }}
                />

                {/* ── Card Layout (sizing) ── */}
                <div className="onb-card" style={{ marginBottom: 16 }}>
                    <label className="onb-label" style={{ marginBottom: 8, display: 'block' }}>📐 Card Styling</label>
                    <SliderRow label="Card Padding" value={cfg.cardPadding} min={8} max={40} step={2} onChange={v => onChange({ cardPadding: v })} unit="px" />
                    <SliderRow label="Border Radius" value={cfg.cardBorderRadius} min={0} max={32} step={2} onChange={v => onChange({ cardBorderRadius: v })} unit="px" />
                    <SliderRow label="Font Size" value={cfg.cardFontSize} min={50} max={150} step={5} onChange={v => onChange({ cardFontSize: v })} unit="%" />
                    <div style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {(['left', 'center', 'right'] as const).map(align => (
                                <button key={align} type="button" onClick={() => onChange({ cardTextAlign: align })}
                                    className={`onb-style-option ${cfg.cardTextAlign === align ? 'onb-style-option--active' : ''}`}
                                    style={{ flex: 1, textTransform: 'capitalize', padding: '8px 12px' }}>
                                    {align}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Element Order (drag & drop) ── */}
                <div className="onb-card" style={{ marginBottom: 16 }}>
                    <label className="onb-label" style={{ marginBottom: 8, display: 'block' }}>🔀 Card Element Order <span style={{ fontSize: 11, opacity: 0.5, fontWeight: 400 }}>drag to reorder</span></label>
                    <DragReorderList
                        items={elementOrder}
                        onReorder={(newOrder) => onChange({ cardElementOrder: newOrder as ('emoji' | 'name' | 'number')[] })}
                        renderItem={(el) => (
                            <>
                                <span style={{ fontSize: 18, pointerEvents: 'none' }}>
                                    {el === 'emoji' ? '😎' : el === 'name' ? '📝' : '🔢'}
                                </span>
                                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, textTransform: 'capitalize', color: 'white', pointerEvents: 'none' }}>
                                    {el === 'number' ? 'Prize Count' : el === 'name' ? 'Prize Name' : 'Emoji'}
                                </span>
                                <span style={{ fontSize: 16, opacity: 0.3, pointerEvents: 'none' }}>⠿</span>
                            </>
                        )}
                    />
                </div>

                {/* ── Card Effects ── */}
                <div className="onb-card" style={{ marginBottom: 16 }}>
                    <label className="onb-label" style={{ marginBottom: 8, display: 'block' }}>✨ Card Effects</label>
                    <SliderRow label="Card Opacity" value={cfg.cardOpacity} min={20} max={100} step={5} onChange={v => onChange({ cardOpacity: v })} unit="%" />
                    <SliderRow label="Card Blur" value={cfg.cardBlur} min={0} max={20} step={1} onChange={v => onChange({ cardBlur: v })} unit="px" />
                </div>
            </div>
        </div>
    );
}

// ─── Step 4 – Draw Timing ────────────────────────────────────────────────────
function StepDrawTiming({ cfg, onChange }: { cfg: DrawConfig; onChange: (partial: Partial<DrawConfig>) => void }) {
    const updateCard = useCallback((i: number, patch: Partial<PrizeCardConfig>) => {
        onChange({ prizeCards: cfg.prizeCards.map((c, idx) => idx === i ? { ...c, ...patch } : c) });
    }, [cfg.prizeCards, onChange]);

    return (
        <div className="onb-step-content">
            <div className="onb-cards-list">
                {cfg.prizeCards.map((card, i) => {
                    const color = CARD_COLORS[i % CARD_COLORS.length];
                    return (
                        <motion.div key={i} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                            className="onb-timing-row" style={{ borderColor: color.border }}>
                            <div className="onb-timing-name" style={{ color: color.border }}>{card.name}</div>
                            <div className="onb-timing-controls">
                                <Clock size={14} style={{ opacity: 0.6 }} />
                                <input type="range" min={1} max={30} step={0.5} value={card.drawSeconds}
                                    onChange={e => updateCard(i, { drawSeconds: Number(e.target.value) })}
                                    className="onb-slider onb-slider-timing" />
                                <span className="onb-timing-val">{card.drawSeconds}s</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
            
        </div>
    );
}

// ─── Step 5 – Winners Per Session ────────────────────────────────────────────
function StepWinnersPerSession({ cfg, onChange }: { cfg: DrawConfig; onChange: (partial: Partial<DrawConfig>) => void }) {
    const updateCard = useCallback((i: number, patch: Partial<PrizeCardConfig>) => {
        onChange({ prizeCards: cfg.prizeCards.map((c, idx) => idx === i ? { ...c, ...patch } : c) });
    }, [cfg.prizeCards, onChange]);

    return (
        <div className="onb-step-content">
            <div className="onb-cards-list">
                {cfg.prizeCards.map((card, i) => {
                    const color = CARD_COLORS[i % CARD_COLORS.length];
                    const max = card.totalPrizes;
                    const val = clamp(card.drawsPerSession, 1, max);
                    return (
                        <motion.div key={i} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                            className="onb-winners-row" style={{ borderColor: color.border }}>
                            <div className="onb-timing-name" style={{ color: color.border }}>
                                {card.name}<span className="onb-card-total"> (Total: {card.totalPrizes})</span>
                            </div>
                            <div className="onb-number-row">
                                <button type="button" className="onb-num-btn" onClick={() => updateCard(i, { drawsPerSession: clamp(val - 1, 1, max) })}>−</button>
                                <input type="number" min={1} max={max} value={val}
                                    onChange={e => updateCard(i, { drawsPerSession: clamp(Number(e.target.value), 1, max) })}
                                    className="onb-input onb-input-num" />
                                <button type="button" className="onb-num-btn" onClick={() => updateCard(i, { drawsPerSession: clamp(val + 1, 1, max) })}>+</button>
                                <span className="onb-per-session">winners/press</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
            
        </div>
    );
}

// ─── Layout Grid Preview (reusable) ──────────────────────────────────────────
function LayoutGridPreview({ cfg }: { cfg: DrawConfig }) {
    const cards = cfg.prizeCards;
    if (cards.length === 0) return (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: 24, fontSize: 13 }}>
            No prize cards configured yet
        </div>
    );
    const gridCols = cfg.cardLayout === 'small' ? 4 : cfg.cardLayout === 'large' ? 2 : (cards.length <= 2 ? 2 : cards.length === 3 ? 3 : cards.length === 4 ? 2 : 3);
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            gap: 8,
        }}>
            {cards.map((card, idx) => {
                const cardAccent = card.accentColor || cfg.accentColor;
                const span = card.colSpan ?? 1;
                return (
                    <div
                        key={`preview-${idx}`}
                        style={{
                            gridColumn: `span ${Math.min(span, gridCols)}`,
                            padding: cfg.cardPadding ? cfg.cardPadding * 0.6 : 12,
                            borderRadius: cfg.cardBorderRadius ?? 16,
                            background: `rgba(20,30,60,${(cfg.cardOpacity ?? 70) / 100})`,
                            border: `2px solid ${cardAccent}60`,
                            boxShadow: `0 4px 16px rgba(0,0,0,0.3), 0 0 12px ${cardAccent}25`,
                            textAlign: cfg.cardTextAlign ?? 'center',
                            minHeight: 80,
                            display: 'flex',
                            flexDirection: 'column' as const,
                            alignItems: cfg.cardTextAlign === 'left' ? 'flex-start' : cfg.cardTextAlign === 'right' ? 'flex-end' : 'center',
                            justifyContent: 'center',
                            gap: 2,
                        }}
                    >
                        {(cfg.cardElementOrder ?? ['emoji', 'name', 'number']).map(el => {
                            const scale = (cfg.cardFontSize ?? 100) / 100 * 0.7;
                            if (el === 'emoji') return <div key="emoji" style={{ fontSize: 22 * scale }}>{card.emoji || '🏆'}</div>;
                            if (el === 'name') return (
                                <div key="name" style={{
                                    fontSize: 11 * scale, fontWeight: 700, color: 'white',
                                    fontFamily: `'${cfg.fontFamily}', sans-serif`, lineHeight: 1.2,
                                }}>{card.name}</div>
                            );
                            if (el === 'number' && card.showNumber !== false) return (
                                <div key="number" style={{
                                    fontSize: 18 * scale, fontWeight: 900, color: cardAccent,
                                    fontFamily: `'${cfg.fontFamily}', sans-serif`,
                                }}>{card.totalPrizes}</div>
                            );
                            return null;
                        })}
                        <div style={{ width: '80%', height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.3)', overflow: 'hidden', marginTop: 4 }}>
                            <div style={{ width: '50%', height: '100%', borderRadius: 2, background: cardAccent }} />
                        </div>
                        {span === 2 && (
                            <div style={{ position: 'absolute', bottom: 4, right: 6, fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>WIDE</div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Step 6 – Card Layout Organizer ──────────────────────────────────────────
function StepLayout({ cfg, onChange }: { cfg: DrawConfig; onChange: (partial: Partial<DrawConfig>) => void }) {
    const cards = cfg.prizeCards;
    const [dragIdx, setDragIdx] = useState<number | null>(null);
    const [overIdx, setOverIdx] = useState<number | null>(null);

    const handleDragStart = (idx: number) => (e: React.DragEvent) => {
        setDragIdx(idx);
        e.dataTransfer.effectAllowed = 'move';
        if (e.currentTarget instanceof HTMLElement) e.currentTarget.style.opacity = '0.5';
    };

    const handleDragEnd = (e: React.DragEvent) => {
        if (e.currentTarget instanceof HTMLElement) e.currentTarget.style.opacity = '1';
        if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
            const arr = [...cards];
            const [moved] = arr.splice(dragIdx, 1);
            arr.splice(overIdx, 0, moved);
            onChange({ prizeCards: arr.map((c, i) => ({ ...c, id: i })) });
        }
        setDragIdx(null);
        setOverIdx(null);
    };

    const handleDragOver = (idx: number) => (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setOverIdx(idx);
    };

    const toggleSpan = (idx: number) => {
        const card = cards[idx];
        const newSpan: 1 | 2 = (card.colSpan ?? 1) === 1 ? 2 : 1;
        onChange({ prizeCards: cards.map((c, i) => i === idx ? { ...c, colSpan: newSpan } : c) });
    };

    const gridCols = cfg.cardLayout === 'small' ? 4 : cfg.cardLayout === 'large' ? 2 : (cards.length <= 2 ? 2 : cards.length === 3 ? 3 : cards.length === 4 ? 2 : 3);

    return (
        <div className="onb-step-content">
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 12, textAlign: 'center' }}>
                Drag cards to reorder · Click resize to make cards wider
            </div>

            {/* Grid preview */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
                gap: 8,
                marginBottom: 16,
            }}>
                {cards.map((card, idx) => {
                    const cardAccent = card.accentColor || cfg.accentColor;
                    const span = card.colSpan ?? 1;
                    const isDragOver = overIdx === idx && dragIdx !== null && dragIdx !== idx;
                    return (
                        <div
                            key={`layout-${idx}`}
                            draggable
                            onDragStart={handleDragStart(idx)}
                            onDragEnd={handleDragEnd}
                            onDragOver={handleDragOver(idx)}
                            onDragEnter={(e) => { e.preventDefault(); setOverIdx(idx); }}
                            style={{
                                gridColumn: `span ${Math.min(span, gridCols)}`,
                                padding: cfg.cardPadding ? cfg.cardPadding * 0.6 : 12,
                                borderRadius: cfg.cardBorderRadius ?? 16,
                                background: isDragOver
                                    ? 'rgba(96,165,250,0.2)'
                                    : `rgba(20,30,60,${(cfg.cardOpacity ?? 70) / 100})`,
                                border: isDragOver
                                    ? `2px solid rgba(96,165,250,0.6)`
                                    : `2px solid ${cardAccent}60`,
                                boxShadow: `0 4px 16px rgba(0,0,0,0.3), 0 0 12px ${cardAccent}25`,
                                cursor: 'grab',
                                userSelect: 'none',
                                transition: 'all 0.15s ease',
                                textAlign: cfg.cardTextAlign ?? 'center',
                                position: 'relative',
                                minHeight: 80,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: cfg.cardTextAlign === 'left' ? 'flex-start' : cfg.cardTextAlign === 'right' ? 'flex-end' : 'center',
                                justifyContent: 'center',
                                gap: 2,
                            }}
                        >
                            {/* Drag handle */}
                            <div style={{ position: 'absolute', top: 6, left: 8, opacity: 0.3 }}>
                                <GripVertical size={14} />
                            </div>

                            {/* Resize button */}
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); toggleSpan(idx); }}
                                style={{
                                    position: 'absolute', top: 4, right: 4,
                                    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: 6, width: 26, height: 26,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', transition: 'all 0.15s',
                                }}
                                title={span === 1 ? 'Make wider' : 'Make normal'}
                            >
                                {span === 1 ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
                            </button>

                            {/* Card content preview */}
                            {(cfg.cardElementOrder ?? ['emoji', 'name', 'number']).map(el => {
                                const scale = (cfg.cardFontSize ?? 100) / 100 * 0.7;
                                if (el === 'emoji') return (
                                    <div key="emoji" style={{ fontSize: 22 * scale, pointerEvents: 'none' }}>{card.emoji || '🏆'}</div>
                                );
                                if (el === 'name') return (
                                    <div key="name" style={{
                                        fontSize: 11 * scale, fontWeight: 700, color: 'white',
                                        fontFamily: `'${cfg.fontFamily}', sans-serif`,
                                        pointerEvents: 'none', lineHeight: 1.2,
                                    }}>{card.name}</div>
                                );
                                if (el === 'number' && card.showNumber !== false) return (
                                    <div key="number" style={{
                                        fontSize: 18 * scale, fontWeight: 900, color: cardAccent,
                                        fontFamily: `'${cfg.fontFamily}', sans-serif`,
                                        pointerEvents: 'none',
                                    }}>
                                        {card.totalPrizes}
                                    </div>
                                );
                                return null;
                            })}

                            {/* Progress bar preview */}
                            <div style={{ width: '80%', height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.3)', overflow: 'hidden', marginTop: 4, pointerEvents: 'none' }}>
                                <div style={{ width: '50%', height: '100%', borderRadius: 2, background: cardAccent }} />
                            </div>

                            {/* Size badge */}
                            {span === 2 && (
                                <div style={{
                                    position: 'absolute', bottom: 4, right: 6,
                                    fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 600,
                                }}>WIDE</div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div style={{
                display: 'flex', gap: 16, justifyContent: 'center',
                fontSize: 11, color: 'rgba(255,255,255,0.4)',
            }}>
                <span>🖱️ Drag to reorder</span>
                <span>↔️ Click ⤢ to resize</span>
            </div>
        </div>
    );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────
interface OnboardingWizardProps {
    onComplete: (config: DrawConfig) => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
    const [step, setStep] = useState(0);
    const [cfg, setCfg] = useState<DrawConfig>(() => ({ ...DEFAULT_CONFIG, ...(loadConfig() ?? {}) }));
    const [direction, setDirection] = useState(1);
    const [showPreview, setShowPreview] = useState(false);

    // Steps: 0=Title, 1=Background, 2=Prizes, 3=Style, 4=Timing, 5=BatchSize
    const hasPrizes = cfg.prizeCards.length > 0;
    const hasMultipleCards = cfg.prizeCards.length >= 2;
    const activeStepIndices = hasPrizes
        ? (hasMultipleCards ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4, 5])
        : [0, 1, 2, 3];
    const totalSteps = activeStepIndices.length;

    const handleChange = useCallback((partial: Partial<DrawConfig>) => {
        setCfg(prev => ({ ...prev, ...partial }));
    }, []);

    const finalize = (config: DrawConfig) => {
        const finalCfg: DrawConfig = {
            ...config,
            prizeCards: config.prizeCards.map(c => ({
                ...c,
                drawsPerSession: clamp(c.drawsPerSession, 1, c.totalPrizes),
            })),
        };
        saveConfig(finalCfg);
        markOnboardingDone();
        onComplete(finalCfg);
    };

    const currentRealStep = activeStepIndices[step];

    const next = () => {
        if (step < totalSteps - 1) {
            setDirection(1);
            setStep(s => s + 1);
        } else {
            finalize(cfg);
        }
    };

    const back = () => {
        if (step > 0) { setDirection(-1); setStep(s => s - 1); }
    };

    const goToStep = (i: number) => {
        if (i <= step) {
            setDirection(i < step ? -1 : 1);
            setStep(i);
        }
    };

    const variants = {
        enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
    };

    const stepLabels = activeStepIndices.map(i => ALL_STEP_LABELS[i]);
    const stepTitle = ALL_STEP_TITLES[currentRealStep];

    return (
        <div className="onb-overlay">
            <div className="onb-particles" aria-hidden>
                {Array.from({ length: 18 }).map((_, i) => (
                    <div key={i} className="onb-particle" style={{
                        left: `${Math.random() * 100}%`,
                        animationDuration: `${4 + Math.random() * 6}s`,
                        animationDelay: `${Math.random() * 5}s`,
                        width: `${4 + Math.random() * 6}px`,
                        height: `${4 + Math.random() * 6}px`,
                    }} />
                ))}
            </div>

            <motion.div className="onb-modal"
                initial={{ scale: 0.85, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}>

                <div className="onb-header">
                    <div className="onb-logo">
                        <Sparkles size={22} className="onb-logo-icon" />
                        <span>Lucky Draw Setup</span>
                    </div>
                </div>

                {/* Step Indicator with connecting lines */}
                <StepIndicator steps={stepLabels} currentStep={step} onStepClick={goToStep} />

                <div className="onb-progress-bar">
                    <motion.div className="onb-progress-fill"
                        animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
                        transition={{ duration: 0.4, ease: "easeInOut" }} />
                </div>

                <div className="onb-step-header">
                    <AnimatePresence mode="wait">
                        <motion.div key={`title-${step}`} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                            <h2 className="onb-step-title">{stepTitle}</h2>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="onb-body">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div key={step} custom={direction} variants={variants}
                            initial="enter" animate="center" exit="exit"
                            transition={{ duration: 0.28, ease: "easeInOut" }}>
                            {currentRealStep === 0 && <StepTitle cfg={cfg} onChange={handleChange} />}
                            {currentRealStep === 1 && <StepBackground cfg={cfg} onChange={handleChange} />}
                            {currentRealStep === 2 && <StepPrizeCards cfg={cfg} onChange={handleChange} />}
                            {currentRealStep === 3 && <StepStyle cfg={cfg} onChange={handleChange} />}
                            {currentRealStep === 4 && <StepDrawTiming cfg={cfg} onChange={handleChange} />}
                            {currentRealStep === 5 && <StepWinnersPerSession cfg={cfg} onChange={handleChange} />}
                            {currentRealStep === 6 && <StepLayout cfg={cfg} onChange={handleChange} />}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="onb-footer">
                    <button type="button" onClick={back} className={`onb-btn-back ${step === 0 ? "invisible" : ""}`}>
                        <ChevronLeft size={18} /> Back
                    </button>

                    {/* Preview Layout button – visible on all steps except the Layout step itself */}
                    {currentRealStep !== 6 && cfg.prizeCards.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setShowPreview(true)}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '8px 14px', borderRadius: 10,
                                background: 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.15)'; }}
                            onMouseLeave={e => { (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; }}
                            title="Preview home screen layout"
                        >
                            <Eye size={15} /> Preview
                        </button>
                    )}

                    <button type="button" onClick={next} className="onb-btn-next">
                        {step < totalSteps - 1 ? (
                            <><span>Next</span> <ChevronRight size={18} /></>
                        ) : (
                            <><Zap size={16} /> <span>Start Lucky Draw!</span></>
                        )}
                    </button>
                </div>

                {/* Layout Preview Dialog */}
                <Dialog open={showPreview} onOpenChange={setShowPreview}>
                    <DialogContent style={{
                        background: 'rgba(10,15,30,0.95)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        backdropFilter: 'blur(20px)',
                        maxWidth: 520,
                    }}>
                        <DialogHeader>
                            <DialogTitle style={{ color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <LayoutGrid size={18} /> Home Screen Preview
                            </DialogTitle>
                        </DialogHeader>
                        <div style={{ padding: '8px 0' }}>
                            <LayoutGridPreview cfg={cfg} />
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 4 }}>
                            You can customize the layout in the final step
                        </div>
                    </DialogContent>
                </Dialog>
            </motion.div>
        </div>
    );
}
