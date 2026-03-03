import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { NumberDisplay } from "./NumberDisplay";
import { Button } from "./ui/button";
import {
  Sparkles, RotateCcw, ArrowLeft, Pause, Play, Volume2, Trophy, Star, Award, Medal
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { soundManager, SoundPack } from "@/lib/sounds";
import { DrawConfig, PrizeCardConfig, loadCustomFont, registerCustomFont } from "@/lib/drawConfig";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DrawnNumber {
  number: number;
  cardId: number;   // index into config.prizeCards
  sessionRound?: number;
}

interface PrizeState {
  total: number;
  remaining: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CARD_COLORS = [
  { border: "rgba(236,72,153,0.6)", glow: "rgba(236,72,153,0.25)", gradient: "from-pink-500/10 via-purple-500/10 to-transparent", iconColor: "text-pink-300" },
  { border: "rgba(251,191,36,0.6)", glow: "rgba(251,191,36,0.25)", gradient: "from-yellow-500/10 via-yellow-400/5 to-transparent", iconColor: "text-yellow-300" },
  { border: "rgba(226,232,240,0.5)", glow: "rgba(226,232,240,0.15)", gradient: "from-slate-100/10 via-slate-200/5 to-transparent", iconColor: "text-slate-100" },
  { border: "rgba(251,146,60,0.6)", glow: "rgba(251,146,60,0.25)", gradient: "from-orange-400/10 via-orange-300/5 to-transparent", iconColor: "text-orange-300" },
  { border: "rgba(96,165,250,0.6)", glow: "rgba(96,165,250,0.25)", gradient: "from-blue-400/10 via-blue-300/5 to-transparent", iconColor: "text-blue-300" },
  { border: "rgba(167,139,250,0.6)", glow: "rgba(167,139,250,0.25)", gradient: "from-violet-400/10 via-violet-300/5 to-transparent", iconColor: "text-violet-300" },
  { border: "rgba(52,211,153,0.6)", glow: "rgba(52,211,153,0.25)", gradient: "from-emerald-400/10 via-emerald-300/5 to-transparent", iconColor: "text-emerald-300" },
  { border: "rgba(244,114,182,0.6)", glow: "rgba(244,114,182,0.25)", gradient: "from-rose-400/10 via-rose-300/5 to-transparent", iconColor: "text-rose-300" },
];

const CARD_ICONS = [Trophy, Trophy, Award, Medal, Star, Star, Trophy, Award];

// Icons kept for potential future use


const CARD_CSS_CLASSES = [
  "prize-card-special",
  "prize-card-gold",
  "prize-card-silver",
  "prize-card-bronze",
  "prize-card-fourth",
  "prize-card-fourth",
  "prize-card-fourth",
  "prize-card-fourth",
];

function buildInitialPrizes(cards: PrizeCardConfig[]): Record<number, PrizeState> {
  const p: Record<number, PrizeState> = {};
  cards.forEach(c => { p[c.id] = { total: c.totalPrizes, remaining: c.totalPrizes }; });
  return p;
}

// ─── Dynamic Prize Card (replaces the old hard-coded PrizeCard) ───────────────
interface DynPrizeCardProps {
  card: PrizeCardConfig;
  prizeState: PrizeState;
  isActive: boolean;
  isSelected: boolean;
  isFocused: boolean;
  onClick: () => void;
  fontFamily: string;
  accentColor: string;
  cardTextColor?: string;
  cardOpacity: number;
  cardBlur: number;
  cardPadding: number;
  cardBorderRadius: number;
  cardFontSize: number;
  cardTextAlign: 'left' | 'center' | 'right';
  cardElementOrder: ('emoji' | 'name' | 'number')[];
}

function DynPrizeCard({ card, prizeState, isActive, isSelected, isFocused, onClick, fontFamily, accentColor, cardTextColor, cardOpacity, cardBlur, cardPadding, cardBorderRadius, cardFontSize, cardTextAlign, cardElementOrder }: DynPrizeCardProps) {
  const fallbackColor = CARD_COLORS[card.id % CARD_COLORS.length];
  const cssClass = CARD_CSS_CLASSES[card.id % CARD_CSS_CLASSES.length];
  const emoji = card.emoji || '🏆';
  const progress = ((prizeState.total - prizeState.remaining) / prizeState.total) * 100;
  const sizeScale = cardFontSize / 100;
  const showNumber = card.showNumber !== false;
  const order = cardElementOrder ?? ['emoji', 'name', 'number'];

  // Per-card color: use card.accentColor if set, otherwise fall back to global accentColor
  const cardColor = card.accentColor || accentColor;
  const borderColor = `${cardColor}99`; // 60% opacity
  const glowColor = `${cardColor}40`;   // 25% opacity

  const renderElement = (el: string) => {
    if (el === 'emoji') return (
      <div key="emoji" className="text-3xl md:text-4xl mb-1" style={{ fontSize: 28 * sizeScale }}>{emoji}</div>
    );
    if (el === 'name') return (
      <h3 key="name" className="font-display font-bold text-sm md:text-base mb-1 relative z-10 leading-tight px-1"
        style={{ fontSize: 14 * sizeScale, color: cardTextColor || 'white' }}>{card.name}</h3>
    );
    if (el === 'number' && showNumber) return (
      <div key="number" className="text-2xl md:text-3xl font-display font-black mb-1 relative z-10"
        style={{ fontSize: 28 * sizeScale, color: cardColor }}>
        {prizeState.remaining}
        <span className="text-muted-foreground text-sm md:text-base font-semibold ml-1" style={{ fontSize: 12 * sizeScale }}>/ {prizeState.total}</span>
      </div>
    );
    return null;
  };

  return (
    <motion.div
      onClick={onClick}
      className={`prize-card ${cssClass} ${isSelected ? 'ring-4 ring-white/60' : ''} ${isFocused ? 'ring-8 ring-white/80 shadow-2xl' : ''} relative overflow-hidden cursor-pointer`}
      style={{
        borderColor: borderColor,
        boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 20px ${glowColor}`,
        background: `rgba(20, 30, 60, ${cardOpacity / 100})`,
        backdropFilter: `blur(${cardBlur}px)`,
        fontFamily: `'${fontFamily}', sans-serif`,
        padding: cardPadding,
        borderRadius: cardBorderRadius,
        textAlign: cardTextAlign,
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: 1, y: 0,
        scale: isSelected && !isFocused ? 1.07 : (isActive ? 1.04 : 1),
      }}
      transition={{ duration: 0.2, type: "spring", stiffness: 400, damping: 25 }}
      whileHover={{ scale: isFocused ? 1.02 : (isSelected ? 1.10 : (isActive ? 1.07 : 1.03)), y: isFocused ? 0 : -4 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Glow animation */}
      {(isActive || isFocused) && (
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: isFocused
              ? `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.3) 0%, transparent 70%)`
              : `radial-gradient(circle at 50% 50%, ${glowColor} 0%, transparent 70%)`,
          }}
          animate={{ scale: [1, 1.2, 1], opacity: isFocused ? [0.4, 0.6, 0.4] : [0.2, 0.35, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      <div className="relative z-10">
        {order.map(el => renderElement(el))}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden backdrop-blur-sm relative z-10">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ background: cardColor, boxShadow: `0 0 8px ${cardColor}` }}
        />
      </div>
    </motion.div>
  );
}

// ─── LuckyDraw ────────────────────────────────────────────────────────────────

interface LuckyDrawProps {
  drawConfig: DrawConfig;
}

export const LuckyDraw = ({ drawConfig }: LuckyDrawProps) => {
  const { prizeCards, maxNumber } = drawConfig;

  // ── State ──────────────────────────────────────────────────────────────────
  const [prizes, setPrizes] = useState<Record<number, PrizeState>>(() => buildInitialPrizes(prizeCards));
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [history, setHistory] = useState<DrawnNumber[]>([]);
  const [drawnNumbers, setDrawnNumbers] = useState<Set<number>>(new Set());
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [drawCounts, setDrawCounts] = useState<Record<number, number>>(() => {
    const d: Record<number, number> = {};
    prizeCards.forEach(c => { d[c.id] = 0; });
    return d;
  });
  const [pendingNumbers, setPendingNumbers] = useState<number[]>([]);
  const [currentDrawIndex, setCurrentDrawIndex] = useState(0);
  const [soundPack, setSoundPackState] = useState<SoundPack>(soundManager.getSoundPack());

  const drawTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Load custom font if configured
  useEffect(() => {
    if (drawConfig.customFontName) {
      const stored = loadCustomFont();
      if (stored) {
        registerCustomFont(drawConfig.customFontName, stored).catch(() => {});
      }
    }
  }, [drawConfig.customFontName]);

  // Re-init when config changes (shouldn't happen during session, but defensive)
  useEffect(() => {
    setPrizes(buildInitialPrizes(prizeCards));
    const d: Record<number, number> = {};
    prizeCards.forEach(c => { d[c.id] = 0; });
    setDrawCounts(d);
  }, [prizeCards]);

  // ── Sound ──────────────────────────────────────────────────────────────────
  const handleSoundPackChange = (pack: string) => {
    const newPack = pack as SoundPack;
    soundManager.setSoundPack(newPack);
    setSoundPackState(newPack);
    soundManager.playClick();
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const currentCard = selectedCardId !== null ? prizeCards.find(c => c.id === selectedCardId) ?? null : null;
  const currentPrize = selectedCardId !== null ? prizes[selectedCardId] : null;
  const isComplete = currentCard === null || currentPrize === null || currentPrize.remaining === 0;

  const triggerConfetti = (cardId: number) => {
    const totalCards = prizeCards.length;
    const importance = 1 - cardId / (totalCards + 1); // 0=last, 1=first
    confetti({
      particleCount: Math.round(50 + importance * 250),
      spread: 40 + importance * 80,
      startVelocity: 30 + importance * 50,
      colors: CARD_COLORS[cardId % CARD_COLORS.length].border
        ? ['#ffd700', '#ff69b4', '#60a5fa', '#a78bfa']
        : ['#3b82f6', '#60a5fa', '#93c5fd'],
      origin: { y: 0.7 },
    });
  };

  const clearAllTimeouts = () => {
    drawTimeoutsRef.current.forEach(t => clearTimeout(t));
    drawTimeoutsRef.current = [];
  };

  const pauseDraw = () => {
    if (isDrawing && !isPaused) {
      setIsPaused(true);
      clearAllTimeouts();
      setIsSpinning(false);
    }
  };

  const resumeDraw = () => {
    if (isPaused && pendingNumbers.length > 0 && selectedCardId !== null) {
      setIsPaused(false);
      continueDrawing(pendingNumbers, currentDrawIndex, selectedCardId);
    }
  };

  const continueDrawing = (numbersToAdd: number[], startIndex: number, cardId: number) => {
    const card = prizeCards.find(c => c.id === cardId);
    if (!card) return;

    const drawsPerSession = card.drawsPerSession;
    const spinMs = card.drawSeconds * 1000;

    // If drawsPerSession > 1: draw all at once (like the original 15-at-once logic)
    if (drawsPerSession > 1) {
      setIsSpinning(true);
      const landTimeout = setTimeout(() => {
        setIsSpinning(false);
        soundManager.playNumberLand();

        const newItems = numbersToAdd.slice(startIndex).map(num => ({
          number: num, cardId, sessionRound: drawCounts[cardId] + 1,
        }));
        setHistory(prev => [...newItems, ...prev]);

        const lastNum = numbersToAdd[numbersToAdd.length - 1];
        setCurrentNumber(lastNum);
        setCurrentDrawIndex(numbersToAdd.length);

        const drawnCount = numbersToAdd.length - startIndex;
        setPrizes(prev => ({
          ...prev,
          [cardId]: { ...prev[cardId], remaining: prev[cardId].remaining - drawnCount },
        }));

        triggerConfetti(cardId);
        soundManager.playWin('small');

        setDrawCounts(prev => ({ ...prev, [cardId]: prev[cardId] + 1 }));
        setIsDrawing(false);
        setPendingNumbers([]);
        setCurrentDrawIndex(0);

        const resetTimeout = setTimeout(() => setCurrentNumber(null), 2000);
        drawTimeoutsRef.current.push(resetTimeout);
      }, spinMs);
      drawTimeoutsRef.current.push(landTimeout);
      return;
    }

    // Single draw per session: animate them one-by-one
    const pauseBetween = spinMs < 4000 ? 2000 : 4000;
    const totalTimePerNumber = spinMs + pauseBetween;

    numbersToAdd.slice(startIndex).forEach((num, relIdx) => {
      const idx = startIndex + relIdx;
      const startTime = relIdx * totalTimePerNumber;

      const spinTimeout = setTimeout(() => {
        setIsSpinning(true);
        const landTimeout = setTimeout(() => {
          setIsSpinning(false);
          soundManager.playNumberLand();
          setCurrentNumber(num);
          setHistory(prev => [{ number: num, cardId, sessionRound: drawCounts[cardId] + 1 }, ...prev]);
          setCurrentDrawIndex(idx + 1);
          setPrizes(prev => ({
            ...prev,
            [cardId]: { ...prev[cardId], remaining: prev[cardId].remaining - 1 },
          }));
          triggerConfetti(cardId);
          if (idx === numbersToAdd.length - 1) {
            const importance = 1 - cardId / (prizeCards.length + 1);
            soundManager.playWin(importance > 0.6 ? 'large' : importance > 0.3 ? 'medium' : 'small');
          }
        }, spinMs);
        drawTimeoutsRef.current.push(landTimeout);
      }, startTime);
      drawTimeoutsRef.current.push(spinTimeout);
    });

    const remainingNumbers = numbersToAdd.length - startIndex;
    const totalTime = remainingNumbers * totalTimePerNumber;
    const finishTimeout = setTimeout(() => {
      setDrawCounts(prev => ({ ...prev, [cardId]: prev[cardId] + 1 }));
      setIsDrawing(false);
      setPendingNumbers([]);
      setCurrentDrawIndex(0);
    }, totalTime);
    drawTimeoutsRef.current.push(finishTimeout);
  };

  const drawNumber = useCallback(() => {
    if (isDrawing || selectedCardId === null) return;
    const card = prizeCards.find(c => c.id === selectedCardId);
    if (!card) return;
    const prizeState = prizes[selectedCardId];
    if (prizeState.remaining === 0) return;

    soundManager.playClick();
    setIsDrawing(true);
    setIsFocusMode(true);
    setIsPaused(false);

    const batchSize = Math.min(card.drawsPerSession, prizeState.remaining);

    const numbersToAdd: number[] = [];
    const newDrawnNumbers = new Set(drawnNumbers);
    for (let i = 0; i < batchSize; i++) {
      let n: number;
      do { n = Math.floor(Math.random() * maxNumber) + 1; } while (newDrawnNumbers.has(n));
      numbersToAdd.push(n);
      newDrawnNumbers.add(n);
    }
    setDrawnNumbers(newDrawnNumbers);
    setPendingNumbers(numbersToAdd);
    setCurrentDrawIndex(0);
    continueDrawing(numbersToAdd, 0, selectedCardId);
  }, [isDrawing, drawnNumbers, selectedCardId, prizes, drawCounts, maxNumber, prizeCards]);

  // Free draw mode: draw a single number with no prize card
  const freeDrawNumber = useCallback(() => {
    if (isDrawing) return;
    if (drawnNumbers.size >= maxNumber) return; // all numbers exhausted

    soundManager.playClick();
    setIsDrawing(true);
    setIsPaused(false);

    let n: number;
    do { n = Math.floor(Math.random() * maxNumber) + 1; } while (drawnNumbers.has(n));

    const newDrawn = new Set(drawnNumbers);
    newDrawn.add(n);
    setDrawnNumbers(newDrawn);

    const spinMs = 3000; // 3 second spin
    setIsSpinning(true);

    const revealTimeout = setTimeout(() => {
      setCurrentNumber(n);
      setIsSpinning(false);
      setHistory(prev => [...prev, { number: n, cardId: -1 }]);
      triggerConfetti(0);
      soundManager.playWin('medium');
      setIsDrawing(false);
    }, spinMs);
    drawTimeoutsRef.current.push(revealTimeout);
  }, [isDrawing, drawnNumbers, maxNumber]);

  const handleCardClick = (cardId: number) => {
    if (!isDrawing) {
      soundManager.playClick();
      setSelectedCardId(cardId);
      setIsFocusMode(true);
      setCurrentNumber(null);
    }
  };

  const reset = () => {
    soundManager.playClick();
    clearAllTimeouts();
    setIsDrawing(false);
    setIsSpinning(false);
    setIsPaused(false);
    setPrizes(buildInitialPrizes(prizeCards));
    setCurrentNumber(null);
    setHistory([]);
    setDrawnNumbers(new Set());
    setSelectedCardId(null);
    setIsFocusMode(false);
    const d: Record<number, number> = {};
    prizeCards.forEach(c => { d[c.id] = 0; });
    setDrawCounts(d);
    setPendingNumbers([]);
    setCurrentDrawIndex(0);
  };

  const resetCard = (cardId: number) => {
    soundManager.playClick();
    const numbersToRemove = history.filter(h => h.cardId === cardId).map(h => h.number);
    setDrawnNumbers(prev => {
      const s = new Set(prev);
      numbersToRemove.forEach(n => s.delete(n));
      return s;
    });
    setHistory(prev => prev.filter(h => h.cardId !== cardId));
    setPrizes(prev => ({
      ...prev,
      [cardId]: { total: prizeCards.find(c => c.id === cardId)!.totalPrizes, remaining: prizeCards.find(c => c.id === cardId)!.totalPrizes },
    }));
    setDrawCounts(prev => ({ ...prev, [cardId]: 0 }));
    if (currentNumber !== null && numbersToRemove.includes(currentNumber)) setCurrentNumber(null);
  };

  const goBackHome = () => {
    if (!isDrawing || isPaused) {
      soundManager.playClick();
      if (isPaused) {
        clearAllTimeouts();
        setIsDrawing(false);
        setIsPaused(false);
        setPendingNumbers([]);
        setCurrentDrawIndex(0);
      }
      setIsFocusMode(false);
      setSelectedCardId(null);
    }
  };

  const getButtonText = () => {
    if (isPaused) return "Đã tạm dừng – Nhấn Tiếp Tục";
    if (isDrawing) return "Đang quay...";
    if (selectedCardId === null) return "Chọn giải thưởng";
    if (isComplete) return "Đã quay hết!";
    return `Bốc Thăm ${currentCard?.name ?? ""}`;
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  // Decide layout based on cardLayout config
  const cardLayout = drawConfig.cardLayout ?? 'auto';
  const gridCols = cardLayout === 'small'
    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
    : cardLayout === 'large'
      ? 'grid-cols-1 sm:grid-cols-2'
      : prizeCards.length <= 2 ? 'grid-cols-1 sm:grid-cols-2'
        : prizeCards.length === 3 ? 'grid-cols-3'
          : prizeCards.length === 4 ? 'grid-cols-2'
            : 'grid-cols-2 md:grid-cols-3';

  const allDone = prizeCards.length > 0 && prizeCards.every(c => prizes[c.id]?.remaining === 0);
  const isFreeDrawMode = prizeCards.length === 0;

  return (
    <div className="min-h-screen py-4 px-4 pt-20">
      <div className="max-w-7xl mx-auto relative z-10">

        {/* ── Sound Pack Selector – top right ── */}
        <div className="absolute top-0 right-0 z-20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon"
                className="bg-white/10 border-white/20 hover:bg-white/20 text-white backdrop-blur-sm">
                <Volume2 className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-slate-900/95 border-white/20 backdrop-blur-lg">
              <DropdownMenuLabel className="text-white/80">Âm Thanh</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/20" />
              <DropdownMenuRadioGroup value={soundPack} onValueChange={handleSoundPackChange}>
                {[
                  { value: "arcade", label: "🎮 Arcade – Phong cách 8-bit" },
                  { value: "vegas", label: "🎰 Vegas – Casino cổ điển" },
                  { value: "retro", label: "⚙️ Retro – Cơ khí" },
                  { value: "modern", label: "✨ Hiện đại – Tinh tế" },
                ].map(({ value, label }) => (
                  <DropdownMenuRadioItem key={value} value={value}
                    className="text-white focus:bg-white/20 focus:text-white">
                    {label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── Header ── */}
        <motion.div className="text-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-6xl font-black mb-2"
            style={{ fontFamily: `'${drawConfig.fontFamily}', sans-serif`, color: drawConfig.titleColor || '#ffffff', textShadow: '0 0 40px rgba(150,200,255,0.8), 0 0 80px rgba(100,150,255,0.5), 0 4px 8px rgba(0,0,0,0.5)', letterSpacing: '0.05em' }}>
            {drawConfig.drawTitle || 'BỐC THĂM MAY MẮN'}
          </h1>
        </motion.div>

        {/* ── Free Draw Mode (no prize cards) ── */}
        {isFreeDrawMode && (
          <motion.div className="flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>

            <div className="mt-4 mb-6">
              <NumberDisplay
                number={currentNumber}
                isDrawing={isSpinning}
                selectedPlace={null}
                isComplete={!isDrawing}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Button
                onClick={freeDrawNumber}
                disabled={isDrawing || drawnNumbers.size >= maxNumber}
                className="draw-button text-primary-foreground min-w-[220px] px-6 py-5 text-lg md:text-xl"
                size="lg">
                <Sparkles className="w-7 h-7 mr-3" />
                {isDrawing ? 'Đang quay...' : drawnNumbers.size >= maxNumber ? 'Đã hết số!' : 'Bốc Thăm'}
              </Button>
            </div>

            {/* Drawn numbers history */}
            {history.length > 0 && (
              <motion.div className="w-full max-w-2xl mt-8 p-4 rounded-2xl"
                style={{ background: 'rgba(20,30,70,0.7)', border: '1px solid hsl(var(--primary) / 0.4)' }}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="font-display font-bold text-sm mb-3" style={{ color: 'hsl(var(--primary))' }}>
                  Các Số Đã Bốc ({history.length} / {maxNumber})
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {history.map((item, i) => (
                    <motion.span key={i} className="history-number"
                      style={{ borderColor: 'hsl(var(--primary) / 0.5)' }}
                      initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.02 }}>
                      {String(item.number).padStart(3, '0')}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Reset */}
            {history.length > 0 && (
              <div className="flex justify-center mt-6">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="lg" className="px-6">
                      <RotateCcw className="w-5 h-5 mr-2" /> Làm Lại
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Đặt lại tất cả số đã bốc?</AlertDialogTitle>
                      <AlertDialogDescription>Toàn bộ lịch sử bốc thăm sẽ bị xóa. Không thể hoàn tác.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction onClick={reset}>Xác Nhận</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Prize Cards grid ── */}
        {!isFreeDrawMode && !isFocusMode && (
          <motion.div
            className={`grid gap-3 mb-6 ${gridCols}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {prizeCards.map((card) => (
              <motion.div key={card.id}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: card.id * 0.04 }}
                style={{ gridColumn: `span ${card.colSpan ?? 1}` }}
              >
                <DynPrizeCard
                  card={card}
                  prizeState={prizes[card.id] ?? { total: card.totalPrizes, remaining: card.totalPrizes }}
                  isActive={selectedCardId === card.id}
                  isSelected={selectedCardId === card.id}
                  isFocused={false}
                  onClick={() => handleCardClick(card.id)}
                  fontFamily={drawConfig.fontFamily}
                  accentColor={drawConfig.accentColor}
                  cardTextColor={drawConfig.cardTextColor}
                  cardOpacity={drawConfig.cardOpacity}
                  cardBlur={drawConfig.cardBlur}
                  cardPadding={drawConfig.cardPadding ?? 20}
                  cardBorderRadius={drawConfig.cardBorderRadius ?? 16}
                  cardFontSize={drawConfig.cardFontSize ?? 100}
                  cardTextAlign={drawConfig.cardTextAlign ?? 'center'}
                  cardElementOrder={drawConfig.cardElementOrder ?? ['emoji', 'name', 'number']}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ── Focus mode: single card + draw area ── */}
        {isFocusMode && selectedCardId !== null && currentCard !== null && (
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            {/* Focused card */}
            <motion.div className="w-full max-w-sm mb-6"
              animate={{ scale: 1.06 }}
              transition={{ duration: 0.4 }}
            >
              <DynPrizeCard
                card={currentCard}
                prizeState={prizes[currentCard.id] ?? { total: currentCard.totalPrizes, remaining: currentCard.totalPrizes }}
                isActive={isDrawing}
                isSelected
                isFocused
                onClick={() => { }}
                fontFamily={drawConfig.fontFamily}
                accentColor={drawConfig.accentColor}
                cardTextColor={drawConfig.cardTextColor}
                cardOpacity={drawConfig.cardOpacity}
                cardBlur={drawConfig.cardBlur}
                cardPadding={drawConfig.cardPadding ?? 20}
                cardBorderRadius={drawConfig.cardBorderRadius ?? 16}
                cardFontSize={drawConfig.cardFontSize ?? 100}
                cardTextAlign={drawConfig.cardTextAlign ?? 'center'}
                cardElementOrder={drawConfig.cardElementOrder ?? ['emoji', 'name', 'number']}
              />
            </motion.div>

            {/* History for multi-draw cards first, then slot machine */}
            {currentCard.drawsPerSession > 1 && (
              <div className="w-full mb-4">
                <PrizeHistoryDyn history={history} cardId={selectedCardId} accentColor={drawConfig.accentColor} cardAccentColor={currentCard.accentColor} />
              </div>
            )}

            {/* Draw button */}
            <div className="mt-2 flex flex-col sm:flex-row gap-4 items-center justify-center">
              {isDrawing && !isPaused ? (
                <Button onClick={pauseDraw}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white min-w-[220px] px-6 py-5 text-lg md:text-xl"
                  size="lg">
                  <Pause className="w-7 h-7 mr-3" />
                  Tạm Dừng ({currentDrawIndex}/{pendingNumbers.length})
                </Button>
              ) : isPaused ? (
                <Button onClick={resumeDraw}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white min-w-[220px] px-6 py-5 text-lg md:text-xl"
                  size="lg">
                  <Play className="w-7 h-7 mr-3" />
                  Tiếp Tục ({currentDrawIndex}/{pendingNumbers.length})
                </Button>
              ) : (
                <Button
                  onClick={drawNumber}
                  disabled={selectedCardId === null || isComplete}
                  className="draw-button text-primary-foreground min-w-[220px] px-6 py-5 text-lg md:text-xl"
                  size="lg">
                  <Sparkles className="w-7 h-7 mr-3" />
                  {getButtonText()}
                </Button>
              )}
            </div>

            {/* Slot machine (for single-draw cards: show first; for multi: show after) */}
            <div className="mt-8">
              <NumberDisplay
                number={currentNumber}
                isDrawing={isSpinning}
                selectedPlace={null}
                isComplete={!isDrawing}
              />
            </div>

            {/* History for single-draw cards */}
            {currentCard.drawsPerSession === 1 && (
              <div className="w-full mt-4">
                <PrizeHistoryDyn history={history} cardId={selectedCardId} accentColor={drawConfig.accentColor} cardAccentColor={currentCard.accentColor} />
              </div>
            )}

            {/* Back / Reset buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mt-10">
              <Button onClick={goBackHome}
                disabled={isDrawing && !isPaused}
                variant="outline"
                className="px-5 py-3 text-base font-bold bg-white/10 border-primary/50 text-primary-foreground hover:bg-primary/20 hover:border-primary transition-all backdrop-blur-sm shadow-lg">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Home
              </Button>

              {history.some(h => h.cardId === selectedCardId) && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline"
                      className="px-5 py-3 text-base font-bold bg-white/10 border-primary/50 text-primary-foreground hover:bg-primary/20 hover:border-primary transition-all backdrop-blur-sm shadow-lg">
                       <RotateCcw className="w-5 h-5 mr-2" />
                      Reset This Prize
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset {currentCard.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will clear all drawn numbers for {currentCard.name} and allow re-drawing.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => resetCard(selectedCardId)}>Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Global reset (homepage only) ── */}
        {!isFreeDrawMode && !isFocusMode && history.length > 0 && (
          <div className="flex justify-center mb-8">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="lg" className="px-6">
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Reset All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to reset everything?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will clear all draw history. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={reset}>Confirm Reset</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {/* ── Completion banner ── */}
        {allDone && (
          <motion.div className="text-center mt-8"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}>
            <h2 className="font-display text-3xl font-bold text-gold mb-2">
              🎉 All Prizes Drawn! 🎉
            </h2>
            <p className="text-muted-foreground">
              Congratulations to all {history.length} winners!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// ─── Inline prize history for dynamic cards ───────────────────────────────────

interface HistItem { number: number; cardId: number; sessionRound?: number; }

function PrizeHistoryDyn({ history, cardId, accentColor, cardAccentColor }: { history: HistItem[]; cardId: number; accentColor?: string; cardAccentColor?: string }) {
  const items = history.filter(h => h.cardId === cardId);
  if (items.length === 0) return null;
  const colorHex = cardAccentColor || accentColor || '#3b82f6';

  return (
    <motion.div
      className="w-full mt-6 p-4 rounded-2xl"
      style={{ background: 'rgba(20,30,70,0.7)', border: `1px solid ${colorHex}99` }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="font-display font-bold text-sm mb-3" style={{ color: colorHex }}>
        Winning Numbers ({items.length})
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {items.map((item, i) => (
          <motion.span
            key={i}
            className="history-number"
            style={{ borderColor: `${colorHex}99` }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
          >
            {String(item.number).padStart(3, '0')}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}
