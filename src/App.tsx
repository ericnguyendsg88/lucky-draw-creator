import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useEffect, useState, useRef } from 'react';
import { Settings, Wand2 } from 'lucide-react';
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
  BG_IMAGE_MAX_BYTES,
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

  useEffect(() => {
    // Use custom uploaded image if one exists, otherwise fall back to the default
    const src = bgImageUrl ?? '/background.webp';
    document.body.style.backgroundImage = `url('${src}')`;
    document.body.style.backgroundSize = `${width}% auto`;
    document.body.style.backgroundPosition = `${posX}% ${posY}%`;
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';

    const id = 'bg-overlay-style';
    const existing = document.getElementById(id);
    if (existing) existing.remove();
    const style = document.createElement('style');
    style.id = id;
    style.innerHTML = `body::after { background: rgba(0,0,0,${overlayOpacity / 100}) !important; }`;
    document.head.appendChild(style);
  }, [width, posX, posY, overlayOpacity, bgImageUrl]);

  const processFile = (file: File) => {
    setUploadError(null);
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      setUploadError('Unsupported format. Please use JPEG, PNG, WebP, or GIF.');
      return;
    }
    if (file.size > BG_IMAGE_MAX_BYTES) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      setUploadError(`File is ${mb} MB. Max 6 MB for backgrounds.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      try {
        saveBgImage(dataUrl);
        setBgImageUrl(dataUrl);
      } catch {
        setUploadError('Could not save — browser storage may be full. Try a smaller file.');
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
        title="Background Settings"
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
          <div style={{ marginBottom: 16, fontSize: 16, fontWeight: 'bold' }}>Background Settings</div>

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
            aria-label="Tải lên ảnh nền"
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
                <img src={bgImageUrl} alt="Nền hiện tại" className="onb-upload-thumb" />
                <div className="onb-upload-overlay-label">
                  <span>✅ Đang dùng ảnh tùy chỉnh</span>
                  <span className="onb-upload-change">Nhấn để thay đổi</span>
                </div>
              </div>
            ) : (
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
            <div className="onb-upload-error" style={{ marginBottom: 12 }}>
              ⚠️ {uploadError}
            </div>
          )}

          {/* Remove button */}
          {bgImageUrl && (
            <button type="button" className="onb-remove-image-btn" onClick={e => { e.stopPropagation(); removeImage(); }} style={{ marginBottom: 16, width: '100%' }}>
              🗑️ Xóa ảnh của bạn
            </button>
          )}

          {[
            { label: `Độ Rộng: ${width}%`, val: width, set: setWidth, min: 50, max: 200 },
            { label: `Vị Trí X: ${posX}%`, val: posX, set: setPosX, min: 0, max: 100 },
            { label: `Vị Trí Y: ${posY}%`, val: posY, set: setPosY, min: 0, max: 100 },
            { label: `Độ Đen Nền: ${overlayOpacity}%`, val: overlayOpacity, set: setOverlayOpacity, min: 0, max: 100, step: 5 },
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

// ─── App ─────────────────────────────────────────────────────────────────────
const queryClient = new QueryClient();

const App = () => {
  // Show onboarding every NEW browser session; skip if already done this session
  const [showOnboarding, setShowOnboarding] = useState(() => !isOnboardingDone());
  const [drawConfig, setDrawConfig] = useState<DrawConfig>(() => loadConfig() ?? DEFAULT_CONFIG);

  const handleOnboardingComplete = (cfg: DrawConfig) => {
    setDrawConfig(cfg);
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
            <button
              onClick={() => {
                if (window.confirm("Bạn muốn quay lại trình Cài Đặt Ban Đầu? (Hình nền và thông số bốc thăm sẽ có thể thay đổi)")) {
                  setShowOnboarding(true);
                }
              }}
              title="Cài Đặt Ban Đầu (Wizard)"
              style={{
                position: 'fixed', top: 16, right: 80, zIndex: 9999,
                background: 'rgba(0,0,0,0.7)', borderRadius: '50%',
                width: 48, height: 48, border: '2px solid rgba(255,255,255,0.3)',
                color: 'white', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
              }}
            >
              <Wand2 size={24} />
            </button>
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
