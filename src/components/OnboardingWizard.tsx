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
} from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────────────────

const STEP_LABELS = [
    { icon: Image, label: "Hình Nền" },
    { icon: Trophy, label: "Giải Thưởng" },
    { icon: Clock, label: "Thời Gian Quay" },
    { icon: Users, label: "Lượt Rút" },
];

const EMOJI_OPTIONS = ["🏆", "👑", "🥇", "🥈", "🥉", "⭐", "💎", "🎖️", "🎗️", "🎁", "🎀", "🎊", "🎉", "🏅", "✨", "🌟", "💫", "⚡", "🔥", "🎯"];
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
    label: string
    value: number
    min: number
    max: number
    step?: number
    unit?: string
    onChange: (v: number) => void
}) {
    return (
        <div className="onb-slider-row">
            <div className="onb-slider-label">
                <span>{label}</span>
                <span className="onb-slider-value">{value}{unit}</span>
            </div>
            <input
                type="range"
                min={min} max={max} step={step ?? 1} value={value}
                onChange={e => onChange(Number(e.target.value))}
                className="onb-slider"
            />
        </div>
    );
}

// ─── Step 1 – Background ─────────────────────────────────────────────────────
function StepBackground({
    cfg,
    onChange,
}: {
    cfg: DrawConfig
    onChange: (partial: Partial<DrawConfig>) => void
}) {
    const [bgImageUrl, setBgImageUrl] = useState<string | null>(() => loadBgImage());
    const [dragOver, setDragOver] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Apply live to body whenever sliders or image change
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

        // Validate type
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowed.includes(file.type)) {
            setUploadError('Unsupported format. Please use JPEG, PNG, WebP, or GIF.');
            return;
        }

        // Validate size (6 MB raw — becomes ~8 MB in base64)
        if (file.size > BG_IMAGE_MAX_BYTES) {
            const mb = (file.size / 1024 / 1024).toFixed(1);
            setUploadError(`File is ${mb} MB. Maximum allowed is 6 MB for background images.`);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            try {
                saveBgImage(dataUrl);
                setBgImageUrl(dataUrl);
            } catch {
                setUploadError('Could not save image — your browser storage may be full. Try a smaller file.');
            }
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
        // reset so same file can be re-selected
        e.target.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    const removeImage = () => {
        clearBgImage();
        setBgImageUrl(null);
        setUploadError(null);
    };

    return (
        <div className="onb-step-content">
            <p className="onb-step-desc">
                Tải lên ảnh nền của bạn hoặc giữ nguyên ảnh mặc định. Các thay đổi sẽ được xem trước trực tiếp phía dưới bảng này.
            </p>

            {/* ── Upload zone ── */}
            <div
                className={`onb-upload-zone ${dragOver ? 'onb-upload-zone--drag' : ''} ${bgImageUrl ? 'onb-upload-zone--has-image' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
                aria-label="Upload background image"
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="onb-upload-input"
                    onChange={handleFileChange}
                />

                {bgImageUrl ? (
                    /* Thumbnail preview */
                    <div className="onb-upload-preview">
                        <img src={bgImageUrl} alt="Current background" className="onb-upload-thumb" />
                        <div className="onb-upload-overlay-label">
                            <span>✅ Đang dùng ảnh tùy chỉnh</span>
                            <span className="onb-upload-change">Nhấn để thay đổi</span>
                        </div>
                    </div>
                ) : (
                    /* Empty state */
                    <div className="onb-upload-empty">
                        <div className="onb-upload-icon">🖼️</div>
                        <div className="onb-upload-title">
                            {dragOver ? 'Thả tải để bắt đầu' : 'Tải Lên Hình Ảnh Nền'}
                        </div>
                        <div className="onb-upload-sub">
                            Kéo thả vào hoặc <span className="onb-upload-link">nhấn để duyệt file</span>
                        </div>
                        <div className="onb-upload-limits">
                            JPEG · PNG · WebP · GIF &nbsp;·&nbsp; Tối đa 6 MB
                        </div>
                    </div>
                )}
            </div>

            {/* Error message */}
            {uploadError && (
                <div className="onb-upload-error">
                    ⚠️ {uploadError}
                </div>
            )}

            {/* Remove button */}
            {bgImageUrl && (
                <button type="button" className="onb-remove-image-btn" onClick={e => { e.stopPropagation(); removeImage(); }}>
                    🗑️ Xóa ảnh của bạn (sử dụng ảnh mặc định)
                </button>
            )}

            {/* ── Position sliders ── */}
            <div className="onb-card" style={{ marginTop: 16 }}>
                <SliderRow label="Chiều Rộng Ảnh" value={cfg.bgWidth} min={50} max={200} onChange={v => onChange({ bgWidth: v })} unit="%" />
                <SliderRow label="Vị Trí X" value={cfg.bgPosX} min={0} max={100} onChange={v => onChange({ bgPosX: v })} unit="%" />
                <SliderRow label="Vị Trí Y" value={cfg.bgPosY} min={0} max={100} onChange={v => onChange({ bgPosY: v })} unit="%" />
                <SliderRow label="Mức Độ Phủ Đen" value={cfg.bgOverlayOpacity} min={0} max={100} step={5} onChange={v => onChange({ bgOverlayOpacity: v })} unit="%" />
            </div>
            <p className="onb-hint">💡 Hình ảnh và thiết lập vị trí sẽ được lưu vào trình duyệt của bạn và dùng cho các phiên sau.</p>
        </div>
    );
}


// ─── Step 2 – Prize Cards ────────────────────────────────────────────────────
function StepPrizeCards({
    cfg, onChange,
}: {
    cfg: DrawConfig
    onChange: (partial: Partial<DrawConfig>) => void
}) {
    const cards = cfg.prizeCards;

    const updateCard = useCallback((i: number, patch: Partial<PrizeCardConfig>) => {
        const newCards = cards.map((c, idx) => idx === i ? { ...c, ...patch } : c);
        onChange({ prizeCards: newCards });
    }, [cards, onChange]);

    const addCard = () => {
        if (cards.length >= 8) return;
        const newCard: PrizeCardConfig = {
            id: cards.length,
            name: `Giải ${cards.length + 1}`,
            totalPrizes: 5,
            drawSeconds: 3,
            drawsPerSession: 5,
        };
        onChange({ prizeCards: [...cards, newCard] });
    };

    const removeCard = (i: number) => {
        if (cards.length <= 1) return;
        const newCards = cards.filter((_, idx) => idx !== i).map((c, idx) => ({ ...c, id: idx }));
        onChange({ prizeCards: newCards });
    };

    return (
        <div className="onb-step-content">
            <p className="onb-step-desc">
                Thiết lập các mốc giải thưởng — tên giải và tổng số lượng giải của từng mốc.
                Các giải thưởng sẽ được rút theo thứ tự từ trên xuống dưới.
            </p>

            <div className="onb-cards-list">
                {cards.map((card, i) => {
                    const color = CARD_COLORS[i % CARD_COLORS.length];
                    const IconComp = CARD_ICONS[i % CARD_ICONS.length];
                    return (
                        <motion.div
                            key={i}
                            layout
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="onb-prize-card"
                            style={{ borderColor: color.border, boxShadow: `0 0 16px ${color.glow}` }}
                        >
                            <div className="onb-prize-card-header">
                                <div className="onb-prize-card-icon" style={{ color: color.border }}>
                                    <IconComp size={18} />
                                    <span className="onb-card-index">#{i + 1}</span>
                                </div>
                                <div className="onb-prize-card-fields">
                                    <label className="onb-label">Tên Giải Thưởng</label>
                                    <input
                                        type="text"
                                        value={card.name}
                                        maxLength={30}
                                        onChange={e => updateCard(i, { name: e.target.value })}
                                        className="onb-input onb-input-name"
                                        placeholder="VD: Đặc Biệt"
                                    />
                                </div>
                                {cards.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeCard(i)}
                                        className="onb-remove-btn"
                                        title="Xóa giải này"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                )}
                            </div>

                            <div className="onb-prize-card-body">
                                <div className="onb-field-group">
                                    <label className="onb-label">Số Lượng Giải</label>
                                    <div className="onb-number-row">
                                        <button type="button" className="onb-num-btn" onClick={() => updateCard(i, { totalPrizes: clamp(card.totalPrizes - 1, 1, 500) })}>−</button>
                                        <input
                                            type="number" min={1} max={500}
                                            value={card.totalPrizes}
                                            onChange={e => updateCard(i, { totalPrizes: clamp(Number(e.target.value), 1, 500) })}
                                            className="onb-input onb-input-num"
                                        />
                                        <button type="button" className="onb-num-btn" onClick={() => updateCard(i, { totalPrizes: clamp(card.totalPrizes + 1, 1, 500) })}>+</button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {cards.length < 8 && (
                <button type="button" className="onb-add-btn" onClick={addCard}>
                    <Plus size={16} /> Thêm Nút Giải Thưởng
                </button>
            )}

            <div className="onb-field-group onb-max-number">
                <label className="onb-label">
                    Số Vé Tối Đa (Tham Gia) <span className="onb-required">*</span>
                </label>
                <p className="onb-sublabel">Các số từ 1 – ? sẽ được đưa vào lồng quay</p>
                <input
                    type="number" min={1} max={9999}
                    value={cfg.maxNumber}
                    onChange={e => onChange({ maxNumber: clamp(Number(e.target.value), 1, 9999) })}
                    className="onb-input onb-input-max"
                    placeholder="VD: 250"
                />
            </div>
        </div>
    );
}

// ─── Step 3 – Draw Timing ────────────────────────────────────────────────────
function StepDrawTiming({
    cfg, onChange,
}: {
    cfg: DrawConfig
    onChange: (partial: Partial<DrawConfig>) => void
}) {
    const updateCard = useCallback((i: number, patch: Partial<PrizeCardConfig>) => {
        const newCards = cfg.prizeCards.map((c, idx) => idx === i ? { ...c, ...patch } : c);
        onChange({ prizeCards: newCards });
    }, [cfg.prizeCards, onChange]);

    return (
        <div className="onb-step-content">
            <p className="onb-step-desc">
                Lồng quay số sẽ chạy trong bao lâu (tính bằng giây) trước khi hiển thị kết quả?
                Cài đặt thời gian lâu hơn sẽ tạo thêm hồi hộp cho các giải thưởng quan trọng.
            </p>
            <div className="onb-cards-list">
                {cfg.prizeCards.map((card, i) => {
                    const color = CARD_COLORS[i % CARD_COLORS.length];
                    return (
                        <motion.div
                            key={i}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="onb-timing-row"
                            style={{ borderColor: color.border }}
                        >
                            <div className="onb-timing-name" style={{ color: color.border }}>{card.name}</div>
                            <div className="onb-timing-controls">
                                <Clock size={14} style={{ opacity: 0.6 }} />
                                <input
                                    type="range" min={1} max={30} step={0.5}
                                    value={card.drawSeconds}
                                    onChange={e => updateCard(i, { drawSeconds: Number(e.target.value) })}
                                    className="onb-slider onb-slider-timing"
                                />
                                <span className="onb-timing-val">{card.drawSeconds} giây</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
            <p className="onb-hint">💡 Gợi ý: Tại mỗi giải thường là 8–10 giây cho giải lớn, 2–3 giây cho các giải có nhiều người trúng.</p>
        </div>
    );
}

// ─── Step 4 – Winners Per Session ────────────────────────────────────────────
function StepWinnersPerSession({
    cfg, onChange,
}: {
    cfg: DrawConfig
    onChange: (partial: Partial<DrawConfig>) => void
}) {
    const updateCard = useCallback((i: number, patch: Partial<PrizeCardConfig>) => {
        const newCards = cfg.prizeCards.map((c, idx) => idx === i ? { ...c, ...patch } : c);
        onChange({ prizeCards: newCards });
    }, [cfg.prizeCards, onChange]);

    return (
        <div className="onb-step-content">
            <p className="onb-step-desc">
                Mỗi lần người quản trò bấm nút "Bốc Thăm", sẽ có bao nhiêu người trúng giải được chọn cùng lúc?
                Số người trúng mỗi lượt quay không thể lớn hơn tổn số lượng của giải.
            </p>
            <div className="onb-cards-list">
                {cfg.prizeCards.map((card, i) => {
                    const color = CARD_COLORS[i % CARD_COLORS.length];
                    const max = card.totalPrizes;
                    const val = clamp(card.drawsPerSession, 1, max);
                    return (
                        <motion.div
                            key={i}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="onb-winners-row"
                            style={{ borderColor: color.border }}
                        >
                            <div className="onb-timing-name" style={{ color: color.border }}>
                                {card.name}
                                <span className="onb-card-total"> (Tổng giải: {card.totalPrizes})</span>
                            </div>
                            <div className="onb-number-row">
                                <button type="button" className="onb-num-btn" onClick={() => updateCard(i, { drawsPerSession: clamp(val - 1, 1, max) })}>−</button>
                                <input
                                    type="number" min={1} max={max}
                                    value={val}
                                    onChange={e => updateCard(i, { drawsPerSession: clamp(Number(e.target.value), 1, max) })}
                                    className="onb-input onb-input-num"
                                />
                                <button type="button" className="onb-num-btn" onClick={() => updateCard(i, { drawsPerSession: clamp(val + 1, 1, max) })}>+</button>
                                <span className="onb-per-session">lượt trúng/lần bấm</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
            <p className="onb-hint">💡 VD: Nếu có tổng số 30 giải và bốc 15 giải mỗi lần, bạn sẽ nhấn nút 2 lần để trao hết các giải này.</p>
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

    const handleChange = useCallback((partial: Partial<DrawConfig>) => {
        setCfg(prev => ({ ...prev, ...partial }));
    }, []);

    const next = () => {
        if (step < 3) {
            setDirection(1);
            setStep(s => s + 1);
        } else {
            // Clamp drawsPerSession
            const finalCfg: DrawConfig = {
                ...cfg,
                prizeCards: cfg.prizeCards.map(c => ({
                    ...c,
                    drawsPerSession: clamp(c.drawsPerSession, 1, c.totalPrizes),
                })),
            };
            saveConfig(finalCfg);
            markOnboardingDone();
            onComplete(finalCfg);
        }
    };

    const back = () => {
        if (step > 0) {
            setDirection(-1);
            setStep(s => s - 1);
        }
    };

    const variants = {
        enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
    };

    return (
        <div className="onb-overlay">
            {/* Floating particles */}
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

            <motion.div
                className="onb-modal"
                initial={{ scale: 0.85, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
            >
                {/* ── Header ── */}
                <div className="onb-header">
                    <div className="onb-logo">
                        <Sparkles size={22} className="onb-logo-icon" />
                        <span>Lucky Draw Setup</span>
                    </div>

                    {/* Step pills */}
                    <div className="onb-steps">
                        {STEP_LABELS.map((s, i) => {
                            const Icon = s.icon;
                            const done = i < step;
                            const active = i === step;
                            return (
                                <div
                                    key={i}
                                    className={`onb-step-pill ${active ? "active" : ""} ${done ? "done" : ""}`}
                                >
                                    <div className="onb-step-pill-icon">
                                        {done ? <Check size={13} /> : <Icon size={13} />}
                                    </div>
                                    <span className="onb-step-pill-label">{s.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Step progress bar */}
                <div className="onb-progress-bar">
                    <motion.div
                        className="onb-progress-fill"
                        animate={{ width: `${((step + 1) / 4) * 100}%` }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                    />
                </div>

                {/* ── Step title ── */}
                <div className="onb-step-header">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`title-${step}`}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                        >
                            <h2 className="onb-step-title">
                                {["🎨  Cài Đặt Ảnh Nền", "🏆  Cài Đặt Các Giải Thưởng", "⏱️  Thời Gian Quay Số", "🎯  Lượt Bốc Thăm (Làm Tính)"][step]}
                            </h2>
                            <p className="onb-step-subtitle">Bước {step + 1} / 4</p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* ── Body ── */}
                <div className="onb-body">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={step}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.28, ease: "easeInOut" }}
                        >
                            {step === 0 && <StepBackground cfg={cfg} onChange={handleChange} />}
                            {step === 1 && <StepPrizeCards cfg={cfg} onChange={handleChange} />}
                            {step === 2 && <StepDrawTiming cfg={cfg} onChange={handleChange} />}
                            {step === 3 && <StepWinnersPerSession cfg={cfg} onChange={handleChange} />}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* ── Footer ── */}
                <div className="onb-footer">
                    <button
                        type="button"
                        onClick={back}
                        className={`onb-btn-back ${step === 0 ? "invisible" : ""}`}
                    >
                        <ChevronLeft size={18} /> Quay Lại
                    </button>

                    <button type="button" onClick={next} className="onb-btn-next">
                        {step < 3 ? (
                            <><span>Tiếp Theo</span> <ChevronRight size={18} /></>
                        ) : (
                            <><Zap size={16} /> <span>Bắt Đầu Lucky Draw!</span></>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
