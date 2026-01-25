import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useEffect, useState } from 'react';
import { Settings } from 'lucide-react';

function BackgroundAdjuster() {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(() => Number(localStorage.getItem('bgScale')) || 100);
  const [width, setWidth] = useState(() => Number(localStorage.getItem('bgWidth')) || 100);
  const [posX, setPosX] = useState(() => Number(localStorage.getItem('bgPosX')) || 50);
  const [posY, setPosY] = useState(() => Number(localStorage.getItem('bgPosY')) || 0);
  const [overlayOpacity, setOverlayOpacity] = useState(() => Number(localStorage.getItem('bgOverlayOpacity')) || 70);

  useEffect(() => {
    // Preload background image
    const img = new Image();
    img.src = '/background.webp';
    
    document.body.style.backgroundImage = `url('/background.webp')`;
    document.body.style.backgroundSize = `${width}% auto`;
    document.body.style.backgroundPosition = `${posX}% ${posY}%`;
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';
    
    // Update overlay opacity
    const style = document.createElement('style');
    style.id = 'bg-overlay-style';
    const existingStyle = document.getElementById('bg-overlay-style');
    if (existingStyle) existingStyle.remove();
    style.innerHTML = `body::after { background: rgba(0, 0, 0, ${overlayOpacity / 100}) !important; }`;
    document.head.appendChild(style);
  }, [width, posX, posY, overlayOpacity]);

  const saveSettings = () => {
    localStorage.setItem('bgScale', scale.toString());
    localStorage.setItem('bgWidth', width.toString());
    localStorage.setItem('bgPosX', posX.toString());
    localStorage.setItem('bgPosY', posY.toString());
    localStorage.setItem('bgOverlayOpacity', overlayOpacity.toString());
    alert('Settings saved!');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 9999,
          background: 'rgba(0,0,0,0.7)',
          borderRadius: '50%',
          width: 48,
          height: 48,
          border: '2px solid rgba(255,255,255,0.3)',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)'
        }}
      >
        <Settings size={24} />
      </button>
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 80,
          right: 16,
          zIndex: 9999,
          background: 'rgba(0,0,0,0.9)',
          borderRadius: 12,
          padding: 20,
          color: 'white',
          fontSize: 14,
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.2)',
          minWidth: 280
        }}>
          <div style={{marginBottom:16, fontSize:16, fontWeight:'bold'}}>Background Settings</div>
          
          <div style={{marginBottom:12}}>
            <label style={{display:'block', marginBottom:6}}>Width: {width}%</label>
            <input
              type="range"
              min="50"
              max="200"
              step="1"
              value={width}
              onChange={e => setWidth(Number(e.target.value))}
              style={{width:'100%'}}
            />
          </div>
          
          <div style={{marginBottom:12}}>
            <label style={{display:'block', marginBottom:6}}>Scale: {scale}%</label>
            <input
              type="range"
              min="50"
              max="150"
              step="1"
              value={scale}
              onChange={e => setScale(Number(e.target.value))}
              style={{width:'100%'}}
            />
          </div>
          
          <div style={{marginBottom:12}}>
            <label style={{display:'block', marginBottom:6}}>Position X: {posX}%</label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={posX}
              onChange={e => setPosX(Number(e.target.value))}
              style={{width:'100%'}}
            />
          </div>
          
          <div style={{marginBottom:16}}>
            <label style={{display:'block', marginBottom:6}}>Position Y: {posY}%</label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={posY}
              onChange={e => setPosY(Number(e.target.value))}
              style={{width:'100%'}}
            />
          </div>
          
          <div style={{marginBottom:16}}>
            <label style={{display:'block', marginBottom:6}}>Dark Overlay: {overlayOpacity}%</label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={overlayOpacity}
              onChange={e => setOverlayOpacity(Number(e.target.value))}
              style={{width:'100%'}}
            />
          </div>
          
          <button
            onClick={saveSettings}
            style={{
              width: '100%',
              padding: '8px 16px',
              borderRadius: 8,
              background: '#2563eb',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Save Settings
          </button>
        </div>
      )}
    </>
  );
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BackgroundAdjuster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
