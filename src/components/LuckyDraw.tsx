import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { PrizeCard } from "./PrizeCard";
import { NumberDisplay } from "./NumberDisplay";
import { PrizeHistory } from "./PrizeHistory";
import { Button } from "./ui/button";
import { Sparkles, RotateCcw, ArrowLeft, Pause, Play, Volume2, Trophy, Award } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { soundManager, SoundPack } from "@/lib/sounds";

interface DrawnNumber {
  number: number;
  place: 0 | 1 | 2 | 3 | 4;
  round?: number; // For Giải Khuyến Khích: round 1 or 2
}

interface PrizeState {
  total: number;
  remaining: number;
}

const initialPrizes: Record<0 | 1 | 2 | 3 | 4, PrizeState> = {
  4: { total: 30, remaining: 30 },  // Giải Khuyến Khích: 30 prizes, 2 draws (15 + 15)
  3: { total: 15, remaining: 15 },  // Giải Ba: 15 prizes, 1 draw
  2: { total: 3, remaining: 3 },    // Combined Nhất+Nhì: 3 numbers drawn, facilitator decides
  1: { total: 1, remaining: 1 },    // Giải Nhất: included in combined draw
  0: { total: 1, remaining: 1 },    // Giải Đặc Biệt: 1 prize
};

// Batch sizes for each prize level
// Combined Giải Nhất + Nhì: draw 3 numbers at once
const batchSizes: Record<0 | 1 | 2 | 3 | 4, number[]> = {
  4: [15, 15],  // 2 draws: 15 then 15
  3: [15],      // 1 draw: all 15
  2: [3],       // Combined with prize 1: draw 3 numbers
  1: [3],       // Combined with prize 2: draw 3 numbers (not used separately)
  0: [1],       // 1 draw: 1
};

const placeLabels: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "Đặc Biệt",
  1: "Nhất",
  2: "Nhì",
  3: "Ba",
  4: "Khuyến Khích",
};

export const LuckyDraw = () => {
  const [prizes, setPrizes] = useState(initialPrizes);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [history, setHistory] = useState<DrawnNumber[]>([]);
  const [drawnNumbers, setDrawnNumbers] = useState<Set<number>>(new Set());
  const [selectedPlace, setSelectedPlace] = useState<0 | 1 | 2 | 3 | 4 | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [drawCounts, setDrawCounts] = useState<Record<0 | 1 | 2 | 3 | 4, number>>({
    0: 0, 1: 0, 2: 0, 3: 0, 4: 0
  });
  const [pendingNumbers, setPendingNumbers] = useState<number[]>([]);
  const [currentDrawIndex, setCurrentDrawIndex] = useState(0);
  const [soundPack, setSoundPackState] = useState<SoundPack>(soundManager.getSoundPack());
  const drawTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  
  // Warn user before accidental page refresh/close when there's draw history
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (history.length > 0) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [history.length]);
  const handleSoundPackChange = (pack: string) => {
    const newPack = pack as SoundPack;
    soundManager.setSoundPack(newPack);
    setSoundPackState(newPack);
    soundManager.playClick();
  };
  
  const currentPlace = selectedPlace;
  const isComplete = currentPlace === null || prizes[currentPlace].remaining === 0;
  
  const triggerConfetti = (place: 0 | 1 | 2 | 3 | 4) => {
    const intensity = {
      0: { particleCount: 300, spread: 120, startVelocity: 80 },
      1: { particleCount: 200, spread: 100, startVelocity: 60 },
      2: { particleCount: 150, spread: 80, startVelocity: 50 },
      3: { particleCount: 100, spread: 60, startVelocity: 40 },
      4: { particleCount: 50, spread: 40, startVelocity: 30 },
    };
    
    const colors = {
      0: ['#ff0080', '#ff00ff', '#8000ff', '#ffd700'],
      1: ['#ffd700', '#ffb700', '#ffa500'],
      2: ['#c0c0c0', '#a8a8a8', '#d4d4d4'],
      3: ['#cd7f32', '#b87333', '#a0522d'],
      4: ['#3b82f6', '#2563eb', '#60a5fa'],
    };
    
    confetti({
      ...intensity[place],
      colors: colors[place],
      origin: { y: 0.7 },
    });
  };
  
  const clearAllTimeouts = () => {
    drawTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
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
    if (isPaused && pendingNumbers.length > 0 && currentPlace !== null) {
      setIsPaused(false);
      continueDrawing(pendingNumbers, currentDrawIndex, currentPlace);
    }
  };
  
  const continueDrawing = (numbersToAdd: number[], startIndex: number, place: 0 | 1 | 2 | 3 | 4) => {
    // For Giải Khuyến Khích (4) and Giải Ba (3): draw all 15 numbers simultaneously
    if (place === 3 || place === 4) {
      const drawDuration = 2500; // Spin time
      
      // Start spinning
      setIsSpinning(true);
      
      // Land all numbers at once after spin time
      const landTimeout = setTimeout(() => {
        setIsSpinning(false);
        soundManager.playNumberLand();
        
        // Add all numbers to history at once
        const newHistoryItems = numbersToAdd.slice(startIndex).map(num => {
          const round = place === 4 ? drawCounts[place] + 1 : undefined;
          return { number: num, place, round };
        });
        
        setHistory(prev => [...newHistoryItems, ...prev]);
        
        // Set the last number as current display
        const lastNumber = numbersToAdd[numbersToAdd.length - 1];
        setCurrentNumber(lastNumber);
        setCurrentDrawIndex(numbersToAdd.length);
        
        // Update remaining prizes
        const drawnCount = numbersToAdd.length - startIndex;
        setPrizes(prev => ({
          ...prev,
          [place]: { ...prev[place], remaining: prev[place].remaining - drawnCount },
        }));
        
        triggerConfetti(place);
        
        // Play win sound
        const winIntensity = 'small';
        soundManager.playWin(winIntensity);
        
        // Finish drawing
        setDrawCounts(prev => ({
          ...prev,
          [place]: prev[place] + 1
        }));
        
        setIsDrawing(false);
        setPendingNumbers([]);
        setCurrentDrawIndex(0);
        
        // Reset slot machine to "- - -" after a brief delay for prizes 3 and 4
        const resetTimeout = setTimeout(() => {
          setCurrentNumber(null);
        }, 2000); // Wait 2 seconds before resetting
        
        drawTimeoutsRef.current.push(resetTimeout);
      }, drawDuration);
      
      drawTimeoutsRef.current.push(landTimeout);
      return;
    }
    
    // Original logic for other prizes
    // Custom spin times: Đặc Biệt 10s, Combined Nhất+Nhì 7s each
    const drawDurations: Record<0 | 1 | 2 | 3 | 4, number> = {
      0: 8000,  // Giải Đặc Biệt: 8s spin + 2s pause = 10s
      1: 3000,  // Combined Nhất+Nhì: 3s spin + 4s pause
      2: 3000,  // Combined Nhất+Nhì: 3s spin + 4s pause
      3: 2500,  // Giải Ba: default
      4: 2500,  // Giải Khuyến Khích: default
    };
    const drawDurationPerNumber = drawDurations[place];
    const pauseBetweenNumbers = (place === 1 || place === 2) ? 4000 : 2000;
    const totalTimePerNumber = drawDurationPerNumber + pauseBetweenNumbers;
    
    numbersToAdd.slice(startIndex).forEach((num, relativeIndex) => {
      const index = startIndex + relativeIndex;
      const startTime = relativeIndex * totalTimePerNumber;
      
      const spinTimeout = setTimeout(() => {
        setIsSpinning(true);
        
        const landTimeout = setTimeout(() => {
          setIsSpinning(false);
          soundManager.playNumberLand();
          setCurrentNumber(num);
          // For Giải Khuyến Khích, include round number (1 or 2)
          const round = place === 4 ? drawCounts[place] + 1 : undefined;
          setHistory(prev => [{ number: num, place, round }, ...prev]);
          setCurrentDrawIndex(index + 1);
          
          // Update remaining count
          setPrizes(prev => ({
            ...prev,
            [place]: { ...prev[place], remaining: prev[place].remaining - 1 },
          }));
          
          triggerConfetti(place);
          if (index === numbersToAdd.length - 1) {
            const winIntensity = place === 0 ? 'large' : place <= 2 ? 'medium' : 'small';
            soundManager.playWin(winIntensity);
          }
        }, drawDurationPerNumber);
        
        drawTimeoutsRef.current.push(landTimeout);
      }, startTime);
      
      drawTimeoutsRef.current.push(spinTimeout);
    });
    
    const remainingNumbers = numbersToAdd.length - startIndex;
    const totalTime = remainingNumbers * totalTimePerNumber;
    const finishTimeout = setTimeout(() => {
      setDrawCounts(prev => ({
        ...prev,
        [place]: prev[place] + 1
      }));
      
      setIsDrawing(false);
      setPendingNumbers([]);
      setCurrentDrawIndex(0);
    }, totalTime);
    
    drawTimeoutsRef.current.push(finishTimeout);
  };
  
  const drawNumber = useCallback(() => {
    if (isDrawing || currentPlace === null) return;
    
    // For combined Nhất+Nhì session, check if both are exhausted
    if (currentPlace === 2 && prizes[1].remaining === 0 && prizes[2].remaining === 0) return;
    
    soundManager.playClick();
    setIsDrawing(true);
    setIsFocusMode(true);
    setIsPaused(false);
    const place = currentPlace;
    
    // For combined Nhất+Nhì session, always draw 3 numbers
    const batchSize = (place === 1 || place === 2) ? 3 : Math.min(
      batchSizes[place][drawCounts[place]] || batchSizes[place][batchSizes[place].length - 1],
      prizes[place].remaining
    );
    
    // Generate all numbers at once
    const numbersToAdd: number[] = [];
    const newDrawnNumbers = new Set(drawnNumbers);
    
    for (let i = 0; i < batchSize; i++) {
      let newNumber: number;
      do {
        newNumber = Math.floor(Math.random() * 250) + 1; // Numbers 1-250
      } while (newDrawnNumbers.has(newNumber));
      numbersToAdd.push(newNumber);
      newDrawnNumbers.add(newNumber);
    }
    
    // Update drawnNumbers immediately to prevent duplicates across all prizes
    setDrawnNumbers(newDrawnNumbers);
    
    setPendingNumbers(numbersToAdd);
    setCurrentDrawIndex(0);
    continueDrawing(numbersToAdd, 0, place);
  }, [isDrawing, drawnNumbers, currentPlace, prizes, drawCounts]);
  
  const handlePrizeClick = (place: 0 | 1 | 2 | 3 | 4) => {
    // Allow clicking on any prize card (even completed ones) to view history
    if (!isDrawing) {
      soundManager.playClick();
      setSelectedPlace(place);
      setIsFocusMode(true);
      // Reset current number to show dashes when entering a new prize session
      setCurrentNumber(null);
    }
  };
  
  const reset = () => {
    soundManager.playClick();
    clearAllTimeouts();
    setIsDrawing(false);
    setIsSpinning(false);
    setIsPaused(false);
    setPrizes(initialPrizes);
    setCurrentNumber(null);
    setHistory([]);
    setDrawnNumbers(new Set());
    setSelectedPlace(null);
    setIsFocusMode(false);
    setDrawCounts({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 });
    setPendingNumbers([]);
    setCurrentDrawIndex(0);
  };
  
  const resetPrize = (place: 0 | 1 | 2 | 3 | 4) => {
    soundManager.playClick();
    
    // For combined Nhất+Nhì session, reset both prizes
    const placesToReset = (place === 1 || place === 2) ? [1, 2] : [place];
    
    // Get numbers that were drawn for these prizes
    const numbersToRemove = history
      .filter(item => placesToReset.includes(item.place))
      .map(item => item.number);
    
    // Remove from drawnNumbers set
    setDrawnNumbers(prev => {
      const newSet = new Set(prev);
      numbersToRemove.forEach(n => newSet.delete(n));
      return newSet;
    });
    
    // Remove from history
    setHistory(prev => prev.filter(item => !placesToReset.includes(item.place)));
    
    // Reset prize count
    setPrizes(prev => {
      const updates: any = {};
      placesToReset.forEach(p => {
        updates[p] = initialPrizes[p];
      });
      return { ...prev, ...updates };
    });
    
    // Reset draw count for these prizes
    setDrawCounts(prev => {
      const updates: any = { ...prev };
      placesToReset.forEach(p => {
        updates[p] = 0;
      });
      return updates;
    });
    
    // Clear current number if it was from these prizes
    if (currentNumber !== null && numbersToRemove.includes(currentNumber)) {
      setCurrentNumber(null);
    }
  };
  
  const clearHistory = () => {
    soundManager.playClick();
    setHistory([]);
  };
  
  const goBackHome = () => {
    // Allow going back if not drawing OR if paused
    if (!isDrawing || isPaused) {
      soundManager.playClick();
      
      // If paused mid-draw, clean up the pending draw
      if (isPaused) {
        clearAllTimeouts();
        setIsDrawing(false);
        setIsPaused(false);
        setPendingNumbers([]);
        setCurrentDrawIndex(0);
      }
      
      setIsFocusMode(false);
      setSelectedPlace(null);
    }
  };
  
  const getButtonText = () => {
    if (isPaused) return "Đã Tạm Dừng - Nhấn Tiếp Tục";
    if (isDrawing) return "Đang Bốc Thăm...";
    if (currentPlace === null) return "Chọn một giải thưởng để bắt đầu";
    if (currentPlace === 2 && prizes[1].remaining === 0 && prizes[2].remaining === 0) return "Giải này đã hết!";
    if (currentPlace !== 2 && prizes[currentPlace].remaining === 0) return "Giải này đã hết!";
    const placeLabels = { 0: "Đặc Biệt", 1: "Nhất+Nhì", 2: "Nhất+Nhì", 3: "Ba", 4: "Khuyến Khích" };
    return `Bốc Giải ${placeLabels[currentPlace]}`;
  };
  
  return (
    <div className="min-h-screen py-4 px-4 pt-20">      <div className="max-w-7xl mx-auto relative z-10">
        {/* Sound Pack Selector - Top Right */}
        <div className="absolute top-0 right-0 z-20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="icon"
                className="bg-white/10 border-white/20 hover:bg-white/20 text-white backdrop-blur-sm"
              >
                <Volume2 className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-slate-900/95 border-white/20 backdrop-blur-lg">
              <DropdownMenuLabel className="text-white/80">Âm Thanh</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/20" />
              <DropdownMenuRadioGroup value={soundPack} onValueChange={handleSoundPackChange}>
                <DropdownMenuRadioItem value="arcade" className="text-white focus:bg-white/20 focus:text-white">
                  🎮 Arcade - Kiểu 8-bit
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="vegas" className="text-white focus:bg-white/20 focus:text-white">
                  🎰 Vegas - Sòng bài cổ điển
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="retro" className="text-white focus:bg-white/20 focus:text-white">
                  ⚙️ Retro - Cơ khí cổ điển
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="modern" className="text-white focus:bg-white/20 focus:text-white">
                  ✨ Modern - Hiện đại
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Header */}
        <motion.div
          className="text-center mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 
            className="font-display text-4xl md:text-6xl font-black mb-2 text-white"
            style={{
              textShadow: '0 0 40px rgba(150, 200, 255, 0.8), 0 0 80px rgba(100, 150, 255, 0.5), 0 4px 8px rgba(0, 0, 0, 0.5)',
              letterSpacing: '0.05em'
            }}
          >
            LUCKY DRAW
          </h1>
        </motion.div>
        
        {/* Special Prize Card - Full Width */}
        <motion.div 
          className="mb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: isFocusMode && selectedPlace !== 0 ? 0 : 1, 
            y: isFocusMode && selectedPlace !== 0 ? 20 : 0,
            scale: isFocusMode && selectedPlace === 0 ? 1.1 : 1,
            height: isFocusMode && selectedPlace !== 0 ? 0 : 'auto'
          }}
          transition={{ delay: 0.05, duration: 0.5 }}
        >
          <PrizeCard place={0} total={prizes[0].total} remaining={prizes[0].remaining} isActive={currentPlace === 0} isSelected={selectedPlace === 0} isFocused={isFocusMode && selectedPlace === 0} onClick={() => handlePrizeClick(0)} />
        </motion.div>
        
        {/* Combined Giải Nhất + Nhì - Single Card */}
        <motion.div 
          className="mb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: isFocusMode && selectedPlace !== 1 && selectedPlace !== 2 ? 0 : 1, 
            y: isFocusMode && selectedPlace !== 1 && selectedPlace !== 2 ? 20 : 0,
            scale: isFocusMode && (selectedPlace === 1 || selectedPlace === 2) ? 1.1 : 1,
            height: isFocusMode && selectedPlace !== 1 && selectedPlace !== 2 ? 0 : 'auto'
          }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <motion.div
            onClick={() => handlePrizeClick(2)}
            className={`prize-card bg-gradient-to-br from-yellow-500/10 via-slate-100/10 to-transparent relative overflow-hidden cursor-pointer ${
              (selectedPlace === 1 || selectedPlace === 2) ? 'ring-4 ring-white/60' : ''
            } ${
              isFocusMode && (selectedPlace === 1 || selectedPlace === 2) ? 'ring-8 ring-white/80 shadow-2xl' : ''
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: (selectedPlace === 1 || selectedPlace === 2) && !isFocusMode ? 1.1 : ((currentPlace === 1 || currentPlace === 2) ? 1.05 : 1)
            }}
            transition={{ duration: 0.2, type: "spring", stiffness: 400, damping: 25 }}
            whileHover={{ scale: isFocusMode && (selectedPlace === 1 || selectedPlace === 2) ? 1.02 : ((selectedPlace === 1 || selectedPlace === 2) ? 1.12 : ((currentPlace === 1 || currentPlace === 2) ? 1.08 : 1.03)), y: isFocusMode && (selectedPlace === 1 || selectedPlace === 2) ? 0 : -4 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Animated background glow */}
            {((currentPlace === 1 || currentPlace === 2) || (isFocusMode && (selectedPlace === 1 || selectedPlace === 2))) && (
              <motion.div
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: (isFocusMode && (selectedPlace === 1 || selectedPlace === 2))
                    ? `radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.3) 0%, transparent 70%)`
                    : `radial-gradient(circle at 50% 50%, rgba(100, 150, 255, 0.2) 0%, transparent 70%)`,
                  opacity: (isFocusMode && (selectedPlace === 1 || selectedPlace === 2)) ? 0.4 : 0.2,
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: (isFocusMode && (selectedPlace === 1 || selectedPlace === 2)) ? [0.4, 0.6, 0.4] : [0.2, 0.3, 0.2],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-20 py-6 pb-14">
              {/* Giải Nhất */}
              <div className="flex flex-col items-center">
                <motion.div
                  animate={(currentPlace === 1 || currentPlace === 2) ? { y: [0, -5, 0] } : {}}
                  transition={{ duration: 0.6, repeat: Infinity }}
                >
                  <div className="text-3xl md:text-4xl mb-1">👑</div>
                  <Trophy className="w-7 h-7 md:w-9 md:h-9 mx-auto mb-2 text-yellow-300" />
                </motion.div>
                <h3 className="font-display font-bold text-sm md:text-base mb-1">Giải Nhất</h3>
                <div className="mb-2">
                  <div className="text-lg md:text-xl font-black text-yellow-300">10,000,000</div>
                  <div className="text-xs text-blue-100/60 font-medium">VND</div>
                </div>
              </div>
              
              {/* Divider */}
              <div className="hidden md:block w-px h-24 bg-white/20"></div>
              <div className="md:hidden w-24 h-px bg-white/20"></div>
              
              {/* Giải Nhì */}
              <div className="flex flex-col items-center">
                <motion.div
                  animate={(currentPlace === 1 || currentPlace === 2) ? { y: [0, -5, 0] } : {}}
                  transition={{ duration: 0.6, repeat: Infinity }}
                >
                  <div className="text-3xl md:text-4xl mb-1">🥈</div>
                  <Award className="w-7 h-7 md:w-9 md:h-9 mx-auto mb-2 text-slate-100" />
                </motion.div>
                <h3 className="font-display font-bold text-sm md:text-base mb-1">Giải Nhì</h3>
                <div className="mb-2">
                  <div className="text-lg md:text-xl font-black text-slate-100">7,000,000</div>
                  <div className="text-xs text-blue-100/60 font-medium">VND</div>
                </div>
              </div>
              
              {/* Total Count - Centered Below */}
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
                <div className="text-2xl md:text-3xl font-display font-black">
                  3 <span className="text-muted-foreground text-base md:text-lg font-semibold">Giải</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Prize Cards */}
        <motion.div 
          className={`grid gap-2 md:gap-3 mb-4 transition-all duration-500 ${isFocusMode && selectedPlace !== null && selectedPlace !== 0 && selectedPlace !== 1 && selectedPlace !== 2 ? 'grid-cols-1 place-items-center' : 'grid-cols-2'}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div 
            className="w-full"
            animate={{
              opacity: isFocusMode && selectedPlace !== null && selectedPlace !== 3 ? 0 : 1,
              scale: isFocusMode && selectedPlace === 3 ? 1.2 : 1,
              height: isFocusMode && selectedPlace !== null && selectedPlace !== 3 ? 0 : 'auto'
            }}
            transition={{ duration: 0.5 }}
          >
            <PrizeCard place={3} total={prizes[3].total} remaining={prizes[3].remaining} isActive={currentPlace === 3} isSelected={selectedPlace === 3} isFocused={isFocusMode && selectedPlace === 3} onClick={() => handlePrizeClick(3)} />
          </motion.div>
          <motion.div 
            className="w-full"
            animate={{
              opacity: isFocusMode && selectedPlace !== null && selectedPlace !== 4 ? 0 : 1,
              scale: isFocusMode && selectedPlace === 4 ? 1.2 : 1,
              height: isFocusMode && selectedPlace !== null && selectedPlace !== 4 ? 0 : 'auto'
            }}
            transition={{ duration: 0.5 }}
          >
            <PrizeCard place={4} total={prizes[4].total} remaining={prizes[4].remaining} isActive={currentPlace === 4} isSelected={selectedPlace === 4} isFocused={isFocusMode && selectedPlace === 4} onClick={() => handlePrizeClick(4)} />
          </motion.div>
        </motion.div>
        
        {/* Number Display - Only in focus mode */}
        {isFocusMode && (
        <motion.div
          className="flex flex-col items-center justify-center mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* For prizes 3 and 4, show history first */}
          {selectedPlace !== null && (selectedPlace === 3 || selectedPlace === 4) && (
            <>
              {/* Prize-specific History for prizes 3 and 4 */}
              <PrizeHistory history={history} place={selectedPlace} />
              
              {/* Draw Button */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-center">
                {isDrawing && !isPaused ? (
                  <Button
                    onClick={pauseDraw}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white min-w-[220px] px-6 py-5 text-lg md:text-xl"
                    size="lg"
                  >
                    <Pause className="w-7 h-7 mr-3" />
                    Tạm Dừng ({currentDrawIndex}/{pendingNumbers.length})
                  </Button>
                ) : isPaused ? (
                  <Button
                    onClick={resumeDraw}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white min-w-[220px] px-6 py-5 text-lg md:text-xl"
                    size="lg"
                  >
                    <Play className="w-7 h-7 mr-3" />
                    Tiếp Tục ({currentDrawIndex}/{pendingNumbers.length})
                  </Button>
                ) : (
                  <Button
                    onClick={drawNumber}
                    disabled={currentPlace === null || (currentPlace !== null && prizes[currentPlace].remaining === 0)}
                    className="draw-button text-primary-foreground min-w-[220px] px-6 py-5 text-lg md:text-xl"
                    size="lg"
                  >
                    <Sparkles className="w-7 h-7 mr-3" />
                    {getButtonText()}
                  </Button>
                )}
              </div>
              
              {/* Slot machine below for prizes 3 and 4 */}
              <div className="mt-8">
                <NumberDisplay number={currentNumber} isDrawing={isSpinning} selectedPlace={selectedPlace} isComplete={!isDrawing} />
              </div>
            </>
          )}
          
          {/* For other prizes, show slot machine first (default order) */}
          {selectedPlace !== null && selectedPlace !== 3 && selectedPlace !== 4 && (
            <>
              <NumberDisplay number={currentNumber} isDrawing={isSpinning} selectedPlace={selectedPlace} isComplete={!isDrawing} />
              
              {/* Draw Button */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-center">
                {isDrawing && !isPaused ? (
                  <Button
                    onClick={pauseDraw}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white min-w-[220px] px-6 py-5 text-lg md:text-xl"
                    size="lg"
                  >
                    <Pause className="w-7 h-7 mr-3" />
                    Tạm Dừng ({currentDrawIndex}/{pendingNumbers.length})
                  </Button>
                ) : isPaused ? (
                  <Button
                    onClick={resumeDraw}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white min-w-[220px] px-6 py-5 text-lg md:text-xl"
                    size="lg"
                  >
                    <Play className="w-7 h-7 mr-3" />
                    Tiếp Tục ({currentDrawIndex}/{pendingNumbers.length})
                  </Button>
                ) : (
                  <Button
                    onClick={drawNumber}
                    disabled={currentPlace === null || (currentPlace !== null && prizes[currentPlace].remaining === 0)}
                    className="draw-button text-primary-foreground min-w-[220px] px-6 py-5 text-lg md:text-xl"
                    size="lg"
                  >
                    <Sparkles className="w-7 h-7 mr-3" />
                    {getButtonText()}
                  </Button>
                )}
              </div>
              
              {/* Prize-specific History - only in focus mode */}
              {(selectedPlace === 1 || selectedPlace === 2) ? (
                <>
                  <PrizeHistory history={history} place={1} />
                  <PrizeHistory history={history} place={2} />
                </>
              ) : (
                <PrizeHistory history={history} place={selectedPlace} />
              )}
            </>
          )}
          
          {/* Back to Home and Reset buttons - positioned below history */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mt-12">
            {/* Back to Home Button */}
            {isFocusMode && (
              <Button
                onClick={goBackHome}
                disabled={isDrawing && !isPaused}
                variant="outline"
                size="default"
                className="px-5 py-3 text-base font-bold bg-white/10 border-blue-400/50 text-blue-100 hover:bg-blue-500/20 hover:border-blue-400 transition-all backdrop-blur-sm shadow-lg"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Trang Chủ
              </Button>
            )}
            
            {/* Reset button - context aware */}
            {isFocusMode && selectedPlace !== null && (
              (selectedPlace === 1 || selectedPlace === 2) 
                ? (history.some(h => h.place === 1 || h.place === 2)) 
                : history.some(h => h.place === selectedPlace)
            ) && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="default"
                    className="px-5 py-3 text-base font-bold bg-white/10 border-blue-400/50 text-blue-100 hover:bg-blue-500/20 hover:border-blue-400 transition-all backdrop-blur-sm shadow-lg"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Làm Lại Giải Này
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Làm lại Giải {(selectedPlace === 1 || selectedPlace === 2) ? "Nhất+Nhì" : placeLabels[selectedPlace]}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Hành động này sẽ xóa các số đã bốc cho Giải {(selectedPlace === 1 || selectedPlace === 2) ? "Nhất+Nhì" : placeLabels[selectedPlace]} và cho phép bốc lại. Các giải khác không bị ảnh hưởng.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={() => resetPrize(selectedPlace)}>Xác Nhận</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </motion.div>
        )}
        
        {/* Global reset button - only on homepage */}
        {!isFocusMode && history.length > 0 && (
          <div className="flex justify-center mb-8">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  className="px-6"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Bạn có chắc chắn muốn làm lại tất cả?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Hành động này sẽ xóa toàn bộ lịch sử bốc thăm và đặt lại tất cả giải thưởng. Không thể hoàn tác sau khi thực hiện.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={reset}>Xác Nhận Làm Lại</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
        
        
        {/* Completion Message */}
        {Object.values(prizes).every(p => p.remaining === 0) && (
          <motion.div
            className="text-center mt-8"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h2 className="font-display text-3xl font-bold text-gold mb-2">
              🎉 Đã Bốc Hết Giải Thưởng! 🎉
            </h2>
            <p className="text-muted-foreground">
              Chúc mừng tất cả {history.length} người trúng thưởng!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};
