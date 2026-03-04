import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useEffect, useState, useRef } from 'react';
import { Settings, Wand2, RotateCcw, X } from 'lucide-react';
import { OnboardingWizard } from "@/components/OnboardingWizard";
import {
  DrawConfig,
  loadConfig,
  saveConfig,
  isOnboardingDone,
  markOnboardingDone,
  DEFAULT_CONFIG,
  loadBgImage,
  saveBgImage,
  clearBgImage,
  clearCustomFont,
  BG_IMAGE_MAX_BYTES,
  BG_IMAGE_KEY,
  CUSTOM_FONT_KEY,
  applyAccentTheme,
  applySlotTheme,
  applyDrawnNumTheme,
} from "@/lib/drawConfig";

// ─── Background adjuster (quick tweaks after onboarding) ─────────────────────
function BackgroundAdjuster({ cfg, onSave }: { cfg: DrawConfig; onSave: (c: DrawConfig) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [width, setWidth] = useState(cfg.bgWidth);
  const [posX, setPosX] = useState(cfg.bgPosX);
  const [posY, setPosY] = useState(cfg.bgPosY);
  const [overlayOpacity, setOverlayOpacity] = useState(cfg.bgOverlayOpacity);

  const [bgImageUrl, setBgImageUrl] = useState<string | null>(() => loadBgImage());
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update CSS custom properties instantly — no DOM churn
  useEffect(() => {
    const src = bgImageUrl ?? '/background.webp';
    const s = document.body.style;
    s.backgroundImage = `url('${src}')`;
    s.backgroundSize = `${width}% auto`;
    s.backgroundPosition = `${posX}% ${posY}%`;
    s.backgroundRepeat = 'no-repeat';
    s.backgroundAttachment = 'fixed';
    document.documentElement.style.setProperty('--bg-overlay-opacity', String(overlayOpacity / 100));
    const overlayColor = cfg.bgOverlayColor || '#000000';
    const r = parseInt(overlayColor.slice(1, 3), 16), g = parseInt(overlayColor.slice(3, 5), 16), b = parseInt(overlayColor.slice(5, 7), 16);
    document.documentElement.style.setProperty('--bg-overlay-computed', `rgba(${r},${g},${b},${overlayOpacity / 100})`);
  }, [width, posX, posY, overlayOpacity, bgImageUrl, cfg.bgOverlayColor]);

  const processFile = (file: File) => {
    setUploadError(null);
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      setUploadError('Định dạng không hỗ trợ. Vui lòng dùng JPEG, PNG, WebP hoặc GIF.');
      return;
    }
    if (file.size > BG_IMAGE_MAX_BYTES) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      setUploadError(`File ${mb} MB. Tối đa 6 MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      try {
        saveBgImage(dataUrl);
        setBgImageUrl(dataUrl);
      } catch {
        setUploadError('Không thể lưu — bộ nhớ trình duyệt có thể đã đầy. Hãy thử file nhỏ hơn.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
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

  const save = () => {
    const updated: DrawConfig = { ...cfg, bgWidth: width, bgPosX: posX, bgPosY: posY, bgOverlayOpacity: overlayOpacity };
    saveConfig(updated);
    onSave(updated);
    setIsOpen(false);
  };

  const panelStyle: React.CSSProperties = {
    position: 'fixed', top: 80, right: 16, zIndex: 9999,
    background: 'rgba(15,23,42,0.95)', borderRadius: 12, padding: 20,
    color: 'white', fontSize: 14,
    boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
    border: '1px solid rgba(255,255,255,0.15)', minWidth: 280,
    width: 320,
    backdropFilter: 'blur(12px)',
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Cài đặt hình nền"
        style={{
          position: 'fixed', top: 16, right: 16, zIndex: 9999,
          background: 'rgba(0,0,0,0.7)', borderRadius: '50%',
          width: 48, height: 48, border: '2px solid rgba(255,255,255,0.3)',
          color: 'white', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
        }}
      >
        <Settings size={24} />
      </button>

      {isOpen && (
        <div style={panelStyle} className="onb-modal">
          <div style={{ marginBottom: 16, fontSize: 16, fontWeight: 'bold' }}>Cài Đặt Hình Nền</div>

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
            style={{ marginBottom: 16 }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="onb-upload-input"
              onChange={handleFileChange}
            />

            {bgImageUrl ? (
              <div className="onb-upload-preview">
                <img src={bgImageUrl} alt="Hình nền hiện tại" className="onb-upload-thumb" />
                <div className="onb-upload-overlay-label">
                  <span>✅ Đang dùng ảnh tùy chỉnh</span>
                  <span className="onb-upload-change">Nhấn để thay đổi</span>
                </div>
              </div>
            ) : (
              <div className="onb-upload-empty">
                <div className="onb-upload-icon">🖼️</div>
                <div className="onb-upload-title">
                  {dragOver ? 'Thả để tải lên' : 'Tải Ảnh Nền Lên'}
                </div>
                <div className="onb-upload-sub">
                  Kéo thả hoặc <span className="onb-upload-link">nhấn để chọn file</span>
                </div>
                <div className="onb-upload-limits">
                  JPEG · PNG · WebP · GIF &nbsp;·&nbsp; Tối đa 6 MB
                </div>
              </div>
            )}
          </div>

          {/* Error message */}
          {uploadError && (
            <div className="onb-upload-error" style={{ marginBottom: 12 }}>
              ⚠️ {uploadError}
            </div>
          )}

          {/* Remove button */}
          {bgImageUrl && (
            <button type="button" className="onb-remove-image-btn" onClick={e => { e.stopPropagation(); removeImage(); }} style={{ marginBottom: 16, width: '100%' }}>
              🗑️ Xóa ảnh
            </button>
          )}

          {[
            { label: `Chiều rộng: ${width}%`, val: width, set: setWidth, min: 50, max: 200 },
            { label: `Vị trí X: ${posX}%`, val: posX, set: setPosX, min: 0, max: 100 },
            { label: `Vị trí Y: ${posY}%`, val: posY, set: setPosY, min: 0, max: 100 },
            { label: `Độ tối phủ: ${overlayOpacity}%`, val: overlayOpacity, set: setOverlayOpacity, min: 0, max: 100, step: 5 },
          ].map(({ label, val, set, min, max, step }) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6 }}>{label}</label>
              <input type="range" min={min} max={max} step={step ?? 1} value={val}
                onChange={e => set(Number(e.target.value))} style={{ width: '100%' }} />
            </div>
          ))}

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={() => setIsOpen(false)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}>
              Đóng
            </button>
            <button onClick={save}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
              Lưu
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Settings Menu (Adjust / Reset) ──────────────────────────────────────────
function SettingsMenu({ onAdjust, onReset }: { onAdjust: () => void; onReset: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        title="Cài đặt"
        style={{
          position: 'fixed', top: 16, right: 80, zIndex: 9999,
          background: 'rgba(0,0,0,0.7)', borderRadius: '50%',
          width: 48, height: 48, border: '2px solid rgba(255,255,255,0.3)',
          color: 'white', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
          transition: 'all 0.2s',
        }}
      >
        <Wand2 size={22} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div onClick={() => setOpen(false)} style={{
            position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.3)',
          }} />
          {/* Dropdown */}
          <div style={{
            position: 'fixed', top: 72, right: 80, zIndex: 9999,
            background: 'rgba(15,23,42,0.95)', borderRadius: 12, padding: 8,
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(16px)', minWidth: 200,
          }}>
            <button
              onClick={() => { setOpen(false); onAdjust(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '10px 14px', borderRadius: 8, background: 'none',
                border: 'none', color: 'white', cursor: 'pointer', fontSize: 14,
                fontWeight: 600, transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <Wand2 size={18} /> Điều Chỉnh Cài Đặt
            </button>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 8px' }} />
            <button
              onClick={() => { setOpen(false); onReset(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '10px 14px', borderRadius: 8, background: 'none',
                border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 14,
                fontWeight: 600, transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <RotateCcw size={18} /> Đặt Lại Toàn Bộ
            </button>
          </div>
        </>
      )}
    </>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
const queryClient = new QueryClient();

const App = () => {
  // Show onboarding every NEW browser session; skip if already done this session
  const [showOnboarding, setShowOnboarding] = useState(() => !isOnboardingDone());
  const [drawConfig, setDrawConfig] = useState<DrawConfig>(() => loadConfig() ?? DEFAULT_CONFIG);

  // Apply accent theme on mount and config changes
  useEffect(() => {
    applyAccentTheme(drawConfig.accentColor, drawConfig.titleColor, drawConfig.cardTextColor, drawConfig.bgOverlayColor, drawConfig.fontFamily);
    applySlotTheme(drawConfig);
    applyDrawnNumTheme(drawConfig);
  }, [drawConfig]);

  const handleOnboardingComplete = (cfg: DrawConfig) => {
    setDrawConfig(cfg);
    applyAccentTheme(cfg.accentColor, cfg.titleColor, cfg.cardTextColor, cfg.bgOverlayColor);
    applySlotTheme(cfg);
    applyDrawnNumTheme(cfg);
    markOnboardingDone();
    setShowOnboarding(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        {showOnboarding ? (
          <OnboardingWizard onComplete={handleOnboardingComplete} />
        ) : (
          <>
            <BackgroundAdjuster cfg={drawConfig} onSave={setDrawConfig} />
            <SettingsMenu
              onAdjust={() => setShowOnboarding(true)}
              onReset={() => {
                if (window.confirm("⚠️ Đặt lại TOÀN BỘ cài đặt về mặc định? Thao tác này sẽ xóa cấu hình, hình nền và font tùy chỉnh. Lịch sử bốc thăm KHÔNG bị ảnh hưởng.")) {
                  // Clear all config from storage
                  localStorage.removeItem('luckyDrawConfig_v2');
                  localStorage.removeItem(BG_IMAGE_KEY);
                  localStorage.removeItem(CUSTOM_FONT_KEY);
                  clearBgImage();
                  clearCustomFont();
                  // Reset state
                  const fresh = { ...DEFAULT_CONFIG };
                  setDrawConfig(fresh);
                  applyAccentTheme(fresh.accentColor, fresh.titleColor, fresh.cardTextColor, fresh.bgOverlayColor);
                  applySlotTheme(fresh);
                  applyDrawnNumTheme(fresh);
                  // Reopen wizard
                  setShowOnboarding(true);
                }
              }}
            />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index drawConfig={drawConfig} />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
