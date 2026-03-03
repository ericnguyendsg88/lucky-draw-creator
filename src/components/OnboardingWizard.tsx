import { useState, useEffect, useCallback, useRef } from "react";
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
    loadCustomFont,
    saveCustomFont,
    clearCustomFont,
    registerCustomFont,
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
} from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────────────────

const ALL_STEP_LABELS = [
    { icon: Type, label: "Title" },
    { icon: Image, label: "Background" },
    { icon: Trophy, label: "Prizes" },
    { icon: Palette, label: "Style" },
    { icon: Clock, label: "Timing" },
    { icon: Users, label: "Batch Size" },
];

const ALL_STEP_TITLES = [
    "✏️  Draw Title",
    "🎨  Background",
    "🏆  Prize Cards",
    "🎭  Style",
    "⏱️  Timing",
    "🎯  Batch Size",
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

// ─── Step Indicator ──────────────────────────────────────────────────────────
function StepIndicator({ steps, currentStep, onStepClick }: {
    steps: { icon: any; label: string }[];
    currentStep: number;
    onStepClick: (i: number) => void;
}) {
    return (
        <div className="onb-step-indicator">
            {steps.map((s, i) => {
                const Icon = s.icon;
                const isDone = i < currentStep;
                const isActive = i === currentStep;
                const isClickable = i <= currentStep;
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
        const id = 'bg-overlay-style';
        const existing = document.getElementById(id);
        if (existing) existing.remove();
        const s = document.createElement('style');
        s.id = id;
        s.innerHTML = `body::after { background: rgba(0,0,0,${cfg.bgOverlayOpacity / 100}) !important; }`;
        document.head.appendChild(s);
    }, [cfg.bgWidth, cfg.bgPosX, cfg.bgPosY, cfg.bgOverlayOpacity, bgImageUrl]);

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
        onChange({ prizeCards: [...cards, { id: cards.length, name: `Prize ${cards.length + 1}`, totalPrizes: 5, drawSeconds: 3, drawsPerSession: 5 }] });
    };

    const removeCard = (i: number) => {
        if (cards.length <= 0) return;
        onChange({ prizeCards: cards.filter((_, idx) => idx !== i).map((c, idx) => ({ ...c, id: idx })) });
    };

    return (
        <div className="onb-step-content">
            <p className="onb-step-desc">Set up your prize tiers — name and total prizes for each. Remove all cards to skip directly to the draw screen.</p>
            <div className="onb-cards-list">
                {cards.map((card, i) => {
                    const color = CARD_COLORS[i % CARD_COLORS.length];
                    const IconComp = CARD_ICONS[i % CARD_ICONS.length];
                    return (
                        <motion.div key={i} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="onb-prize-card" style={{ borderColor: color.border, boxShadow: `0 0 16px ${color.glow}` }}>
                            <div className="onb-prize-card-header">
                                <div className="onb-prize-card-icon" style={{ color: color.border }}>
                                    <IconComp size={18} /><span className="onb-card-index">#{i + 1}</span>
                                </div>
                                <div className="onb-prize-card-fields">
                                    <label className="onb-label">Prize Name</label>
                                    <input type="text" value={card.name} maxLength={30} onChange={e => updateCard(i, { name: e.target.value })}
                                        className="onb-input onb-input-name" placeholder="e.g. Grand Prize" />
                                </div>
                                <button type="button" onClick={() => removeCard(i)} className="onb-remove-btn" title="Remove this prize">
                                    <Trash2 size={15} />
                                </button>
                            </div>
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
                <p className="onb-sublabel">Numbers from 1 to ? will be entered into the draw</p>
                <input type="number" min={1} max={9999} value={cfg.maxNumber}
                    onChange={e => onChange({ maxNumber: clamp(Number(e.target.value), 1, 9999) })}
                    className="onb-input onb-input-max" placeholder="e.g. 250" />
            </div>
        </div>
    );
}

// ─── Step 3 – Style ──────────────────────────────────────────────────────────
function StepStyle({ cfg, onChange }: { cfg: DrawConfig; onChange: (partial: Partial<DrawConfig>) => void }) {
    const ACCENT_PRESETS = ['#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#6366f1', '#14b8a6'];
    const [hexInput, setHexInput] = useState(cfg.accentColor);
    const [customFontLoaded, setCustomFontLoaded] = useState(false);
    const [customFontError, setCustomFontError] = useState<string | null>(null);
    const [emojiInput, setEmojiInput] = useState('');
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
        }
    };

    const addCustomEmoji = () => {
        const trimmed = emojiInput.trim();
        if (!trimmed) return;
        // Split into individual characters/emoji - simple approach
        const chars = Array.from(trimmed).filter(s => s.trim().length > 0);
        if (chars.length > 0) {
            const updated = [...cfg.customEmojis, ...chars].slice(0, 20); // max 20
            onChange({ customEmojis: updated });
        }
        setEmojiInput('');
    };

    const removeCustomEmoji = (idx: number) => {
        onChange({ customEmojis: cfg.customEmojis.filter((_, i) => i !== idx) });
    };

    const activeFont = cfg.fontFamily;
    const previewEmojis = cfg.customEmojis.length > 0 ? cfg.customEmojis : (EMOJI_SETS[cfg.emojiSet]?.emojis ?? EMOJI_SETS.classic.emojis);

    return (
        <div className="onb-step-content">
            <p className="onb-step-desc">Customize the look — choose fonts, emojis, accent color, and card layout.</p>

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

            {/* ── Emoji Section ── */}
            <div className="onb-card" style={{ marginBottom: 16 }}>
                <label className="onb-label" style={{ marginBottom: 8, display: 'block' }}>😎 Emojis</label>

                {/* Custom emoji input */}
                <div style={{ marginBottom: 12 }}>
                    <label className="onb-sublabel">Type or paste emojis from your keyboard:</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input
                            type="text"
                            value={emojiInput}
                            onChange={e => setEmojiInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomEmoji())}
                            placeholder="🎉🏆🥇..."
                            className="onb-input"
                            style={{ flex: 1, fontSize: 18 }}
                        />
                        <button type="button" onClick={addCustomEmoji}
                            className="onb-num-btn" style={{ width: 40, height: 36 }}>+</button>
                    </div>
                    {cfg.customEmojis.length > 0 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                            {cfg.customEmojis.map((e, i) => (
                                <button key={i} type="button" onClick={() => removeCustomEmoji(i)}
                                    style={{
                                        fontSize: 22, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                                        borderRadius: 8, padding: '4px 8px', cursor: 'pointer', position: 'relative',
                                    }}
                                    title="Click to remove">
                                    {e}
                                    <span style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', borderRadius: '50%', width: 14, height: 14, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>×</span>
                                </button>
                            ))}
                            <button type="button" onClick={() => onChange({ customEmojis: [] })}
                                style={{ fontSize: 11, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
                                Clear all
                            </button>
                        </div>
                    )}
                </div>

                {/* Preset emoji sets */}
                <label className="onb-sublabel">Or choose a preset set:</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {Object.entries(EMOJI_SETS).map(([key, set]) => (
                        <button key={key} type="button" onClick={() => { onChange({ emojiSet: key, customEmojis: [] }); }}
                            className={`onb-style-option ${cfg.emojiSet === key && cfg.customEmojis.length === 0 ? 'onb-style-option--active' : ''}`}
                            style={{ justifyContent: 'flex-start', gap: 12 }}>
                            <span style={{ fontSize: 14, fontWeight: 600 }}>{set.label}</span>
                            <span style={{ fontSize: 18, letterSpacing: 4 }}>{set.emojis.slice(0, 5).join(' ')}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Accent Color ── */}
            <div className="onb-card" style={{ marginBottom: 16 }}>
                <label className="onb-label" style={{ marginBottom: 8, display: 'block' }}>🎨 Accent Color</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    {ACCENT_PRESETS.map(color => (
                        <button key={color} type="button" onClick={() => { onChange({ accentColor: color }); setHexInput(color); }}
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
                        <input type="color" value={cfg.accentColor} onChange={e => { onChange({ accentColor: e.target.value }); setHexInput(e.target.value); }}
                            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                    </label>
                </div>
                {/* Hex input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>HEX:</span>
                    <input
                        type="text"
                        value={hexInput}
                        onChange={e => handleHexChange(e.target.value)}
                        placeholder="#3b82f6"
                        className="onb-input"
                        style={{ width: 120, fontFamily: 'monospace', fontSize: 14 }}
                        maxLength={7}
                    />
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: cfg.accentColor, border: '2px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
                </div>
            </div>

            {/* ── Card Layout ── */}
            <div className="onb-card" style={{ marginBottom: 16 }}>
                <label className="onb-label" style={{ marginBottom: 8, display: 'block' }}>📐 Card Layout</label>
                <SliderRow label="Card Padding" value={cfg.cardPadding} min={8} max={40} step={2} onChange={v => onChange({ cardPadding: v })} unit="px" />
                <SliderRow label="Border Radius" value={cfg.cardBorderRadius} min={0} max={32} step={2} onChange={v => onChange({ cardBorderRadius: v })} unit="px" />
                <SliderRow label="Font Size" value={cfg.cardFontSize} min={50} max={150} step={5} onChange={v => onChange({ cardFontSize: v })} unit="%" />
                <div style={{ marginTop: 8 }}>
                    <label className="onb-sublabel" style={{ marginBottom: 6 }}>Text Alignment</label>
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

            {/* ── Card Effects ── */}
            <div className="onb-card" style={{ marginBottom: 16 }}>
                <label className="onb-label" style={{ marginBottom: 8, display: 'block' }}>✨ Card Effects</label>
                <SliderRow label="Card Opacity" value={cfg.cardOpacity} min={20} max={100} step={5} onChange={v => onChange({ cardOpacity: v })} unit="%" />
                <SliderRow label="Card Blur" value={cfg.cardBlur} min={0} max={20} step={1} onChange={v => onChange({ cardBlur: v })} unit="px" />
            </div>

            {/* ── Live Preview ── */}
            <div className="onb-card">
                <label className="onb-label" style={{ marginBottom: 10, display: 'block' }}>👁️ Card Preview</label>
                <div style={{
                    padding: cfg.cardPadding,
                    borderRadius: cfg.cardBorderRadius,
                    background: `rgba(20,30,60,${cfg.cardOpacity / 100})`,
                    backdropFilter: `blur(${cfg.cardBlur}px)`,
                    border: `2px solid ${cfg.accentColor}40`,
                    textAlign: cfg.cardTextAlign,
                    transition: 'all 0.3s ease',
                }}>
                    <div style={{
                        fontSize: 28 * (cfg.cardFontSize / 100),
                        marginBottom: 4,
                    }}>
                        {previewEmojis[0] ?? '🏆'}
                    </div>
                    <div style={{
                        fontFamily: `'${activeFont}', sans-serif`,
                        fontSize: 20 * (cfg.cardFontSize / 100),
                        fontWeight: 800,
                        color: 'white',
                        marginBottom: 4,
                    }}>
                        Grand Prize
                    </div>
                    <div style={{
                        fontFamily: `'${activeFont}', sans-serif`,
                        fontSize: 32 * (cfg.cardFontSize / 100),
                        fontWeight: 900,
                        color: cfg.accentColor,
                        marginBottom: 4,
                    }}>
                        5 <span style={{ fontSize: 14 * (cfg.cardFontSize / 100), color: 'rgba(255,255,255,0.5)' }}>/ 10</span>
                    </div>
                    <div style={{
                        width: '100%', height: 8, borderRadius: 4,
                        background: 'rgba(0,0,0,0.3)', overflow: 'hidden',
                    }}>
                        <div style={{
                            width: '50%', height: '100%', borderRadius: 4,
                            background: cfg.accentColor, transition: 'all 0.3s',
                        }} />
                    </div>
                    <div style={{
                        fontFamily: `'${activeFont}', sans-serif`,
                        fontSize: 11 * (cfg.cardFontSize / 100),
                        color: 'rgba(255,255,255,0.5)',
                        marginTop: 6,
                    }}>
                        Font: {activeFont} · Align: {cfg.cardTextAlign}
                    </div>
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
            <p className="onb-step-desc">How long should the spinner run (in seconds) before revealing the result?</p>
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
            <p className="onb-hint">💡 Tip: 8–10s for top prizes, 2–3s for bulk prizes.</p>
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
            <p className="onb-step-desc">How many winners are drawn at once each time you press the draw button?</p>
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
            <p className="onb-hint">💡 e.g. 30 prizes, 15/press → press twice to award all.</p>
        </div>
    );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────
interface OnboardingWizardProps {
    onComplete: (config: DrawConfig) => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
    const [step, setStep] = useState(0);
    const [cfg, setCfg] = useState<DrawConfig>(() => loadConfig() ?? DEFAULT_CONFIG);
    const [direction, setDirection] = useState(1);

    // When no prize cards, only show steps 0 (bg), 1 (prizes), 2 (style) → then finish
    const hasPrizes = cfg.prizeCards.length > 0;
    const activeStepIndices = hasPrizes ? [0, 1, 2, 3, 4] : [0, 1, 2];
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
                            <p className="onb-step-subtitle">Step {step + 1} / {totalSteps}</p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="onb-body">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div key={step} custom={direction} variants={variants}
                            initial="enter" animate="center" exit="exit"
                            transition={{ duration: 0.28, ease: "easeInOut" }}>
                            {currentRealStep === 0 && <StepBackground cfg={cfg} onChange={handleChange} />}
                            {currentRealStep === 1 && <StepPrizeCards cfg={cfg} onChange={handleChange} />}
                            {currentRealStep === 2 && <StepStyle cfg={cfg} onChange={handleChange} />}
                            {currentRealStep === 3 && <StepDrawTiming cfg={cfg} onChange={handleChange} />}
                            {currentRealStep === 4 && <StepWinnersPerSession cfg={cfg} onChange={handleChange} />}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="onb-footer">
                    <button type="button" onClick={back} className={`onb-btn-back ${step === 0 ? "invisible" : ""}`}>
                        <ChevronLeft size={18} /> Back
                    </button>
                    <button type="button" onClick={next} className="onb-btn-next">
                        {step < totalSteps - 1 ? (
                            <><span>Next</span> <ChevronRight size={18} /></>
                        ) : (
                            <><Zap size={16} /> <span>Start Lucky Draw!</span></>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
