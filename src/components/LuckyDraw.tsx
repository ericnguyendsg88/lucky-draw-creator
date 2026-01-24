import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { PrizeCard } from "./PrizeCard";
import { NumberDisplay } from "./NumberDisplay";
import { DrawHistory } from "./DrawHistory";
import { Button } from "./ui/button";
import { Sparkles, RotateCcw, ArrowLeft, Pause, Play } from "lucide-react";
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
import { soundManager } from "@/lib/sounds";

interface DrawnNumber {
  number: number;
  place: 0 | 1 | 2 | 3 | 4;
}

interface PrizeState {
  total: number;
  remaining: number;
}

const initialPrizes: Record<0 | 1 | 2 | 3 | 4, PrizeState> = {
  4: { total: 35, remaining: 35 },  // Giải Khuyến Khích: 35 prizes, 2 draws (17 + 18)
  3: { total: 10, remaining: 10 },  // Giải Ba: 10 prizes, 1 draw
  2: { total: 2, remaining: 2 },    // Giải Nhì: 2 prizes, 2 draws (1 each)
  1: { total: 1, remaining: 1 },    // Giải Nhất: 1 prize
  0: { total: 1, remaining: 1 },    // Giải Đặc Biệt: 1 prize
};

// Batch sizes for each prize level
// Giải Khuyến Khích: first draw 17, second draw 18 (handled dynamically)
const batchSizes: Record<0 | 1 | 2 | 3 | 4, number[]> = {
  4: [17, 18],  // 2 draws: 17 then 18
  3: [10],      // 1 draw: all 10
  2: [1, 1],    // 2 draws: 1 each
  1: [1],       // 1 draw: 1
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
  const drawTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const rollingSoundRef = useRef<{ stop: () => void } | null>(null);
  
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
    rollingSoundRef.current?.stop();
    rollingSoundRef.current = null;
  };
  
  const pauseDraw = () => {
    if (isDrawing && !isPaused) {
      setIsPaused(true);
      clearAllTimeouts();
      rollingSoundRef.current?.stop();
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
    const drawDurationPerNumber = 2500;
    const pauseBetweenNumbers = 5000;
    const totalTimePerNumber = drawDurationPerNumber + pauseBetweenNumbers;
    
    numbersToAdd.slice(startIndex).forEach((num, relativeIndex) => {
      const index = startIndex + relativeIndex;
      const startTime = relativeIndex * totalTimePerNumber;
      
      const spinTimeout = setTimeout(() => {
        setIsSpinning(true);
        rollingSoundRef.current = soundManager.startContinuousRolling();
        
        const landTimeout = setTimeout(() => {
          rollingSoundRef.current?.stop();
          setIsSpinning(false);
          soundManager.playNumberLand();
          setCurrentNumber(num);
          setHistory(prev => [{ number: num, place }, ...prev]);
          setCurrentDrawIndex(index + 1);
          
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
      setIsFocusMode(false);
      setPendingNumbers([]);
      setCurrentDrawIndex(0);
    }, totalTime);
    
    drawTimeoutsRef.current.push(finishTimeout);
  };
  
  const drawNumber = useCallback(() => {
    if (isDrawing || isComplete || currentPlace === null) return;
    
    soundManager.playClick();
    setIsDrawing(true);
    setIsFocusMode(true);
    setIsPaused(false);
    const place = currentPlace;
    const currentDrawCountIndex = drawCounts[place];
    const batchSize = Math.min(
      batchSizes[place][currentDrawCountIndex] || batchSizes[place][batchSizes[place].length - 1],
      prizes[place].remaining
    );
    
    // Generate all numbers at once
    const numbersToAdd: number[] = [];
    const newDrawnNumbers = new Set(drawnNumbers);
    
    for (let i = 0; i < batchSize; i++) {
      let newNumber: number;
      do {
        newNumber = Math.floor(Math.random() * 1000);
      } while (newDrawnNumbers.has(newNumber));
      numbersToAdd.push(newNumber);
      newDrawnNumbers.add(newNumber);
    }
    
    // Update drawnNumbers immediately to prevent duplicates across all prizes
    setDrawnNumbers(newDrawnNumbers);
    
    setPendingNumbers(numbersToAdd);
    setCurrentDrawIndex(0);
    continueDrawing(numbersToAdd, 0, place);
  }, [isDrawing, isComplete, drawnNumbers, currentPlace, prizes, drawCounts]);
  
  const handlePrizeClick = (place: 0 | 1 | 2 | 3 | 4) => {
    if (prizes[place].remaining > 0 && !isDrawing) {
      soundManager.playClick();
      setSelectedPlace(place);
      setIsFocusMode(true);
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
    // Get numbers that were drawn for this prize
    const numbersToRemove = history
      .filter(item => item.place === place)
      .map(item => item.number);
    
    // Remove from drawnNumbers set
    setDrawnNumbers(prev => {
      const newSet = new Set(prev);
      numbersToRemove.forEach(n => newSet.delete(n));
      return newSet;
    });
    
    // Remove from history
    setHistory(prev => prev.filter(item => item.place !== place));
    
    // Reset prize count
    setPrizes(prev => ({
      ...prev,
      [place]: initialPrizes[place]
    }));
    
    // Reset draw count for this prize
    setDrawCounts(prev => ({
      ...prev,
      [place]: 0
    }));
    
    // Clear current number if it was from this prize
    if (currentNumber !== null && numbersToRemove.includes(currentNumber)) {
      setCurrentNumber(null);
    }
  };
  
  const clearHistory = () => {
    soundManager.playClick();
    setHistory([]);
  };
  
  const goBackHome = () => {
    if (!isDrawing) {
      soundManager.playClick();
      setIsFocusMode(false);
      setSelectedPlace(null);
    }
  };
  
  const getButtonText = () => {
    if (isPaused) return "Đã Tạm Dừng - Nhấn Tiếp Tục";
    if (isDrawing) return `Đang Bốc Thăm... (${currentDrawIndex}/${pendingNumbers.length})`;
    if (currentPlace === null) return "Chọn một giải thưởng để bắt đầu";
    if (prizes[currentPlace].remaining === 0) return "Giải này đã hết!";
    const placeLabels = { 0: "Đặc Biệt", 1: "Nhất", 2: "Nhì", 3: "Ba", 4: "Khuyến Khích" };
    const currentDrawCountIndex = drawCounts[currentPlace];
    const batchSize = Math.min(
      batchSizes[currentPlace][currentDrawCountIndex] || batchSizes[currentPlace][batchSizes[currentPlace].length - 1],
      prizes[currentPlace].remaining
    );
    const remaining = prizes[currentPlace].remaining;
    return `Bốc ${batchSize} Giải ${placeLabels[currentPlace]} (Còn ${remaining})`;
  };
  
  return (
    <div className="min-h-screen py-8 px-4 pt-32">
      {/* CSS-based floating particles for better performance */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full floating-particle"
            style={{
              left: `${(i * 8.33) % 100}%`,
              top: `${(i * 15) % 100}%`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>
      
      {/* CSS-based spotlight beams */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30">
        <div className="spotlight-beam spotlight-beam-1" />
        <div className="spotlight-beam spotlight-beam-2" />
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.h1 
            className="font-display text-5xl md:text-7xl font-black mb-3 text-white"
            style={{
              textShadow: '0 0 40px rgba(150, 200, 255, 0.8), 0 0 80px rgba(100, 150, 255, 0.5), 0 4px 8px rgba(0, 0, 0, 0.5)',
              letterSpacing: '0.05em'
            }}
            animate={{
              textShadow: [
                '0 0 40px rgba(150, 200, 255, 0.8), 0 0 80px rgba(100, 150, 255, 0.5), 0 4px 8px rgba(0, 0, 0, 0.5)',
                '0 0 60px rgba(200, 230, 255, 1), 0 0 100px rgba(150, 200, 255, 0.7), 0 4px 8px rgba(0, 0, 0, 0.5)',
                '0 0 40px rgba(150, 200, 255, 0.8), 0 0 80px rgba(100, 150, 255, 0.5), 0 4px 8px rgba(0, 0, 0, 0.5)',
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            LUCKY DRAW
          </motion.h1>
          <motion.p 
            className="text-lg font-semibold text-blue-200"
            style={{
              textShadow: '0 0 20px rgba(150, 200, 255, 0.6)'
            }}
          >
            Chương Trình Bốc Thăm Trúng Thưởng
          </motion.p>
          <p className="text-xl md:text-2xl text-blue-100/80 font-bold mt-2">49 Giải Thưởng • Số may mắn từ 0-999</p>
        </motion.div>
        
        {/* Special Prize Card - Full Width */}
        <motion.div 
          className="mb-4"
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
        
        {/* Prize Cards */}
        <motion.div 
          className={`grid gap-3 md:gap-4 mb-8 transition-all duration-500 ${isFocusMode && selectedPlace !== null && selectedPlace !== 0 ? 'grid-cols-1 place-items-center' : 'grid-cols-2 md:grid-cols-4'}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div 
            className="w-full"
            animate={{
              opacity: isFocusMode && selectedPlace !== null && selectedPlace !== 1 ? 0 : 1,
              scale: isFocusMode && selectedPlace === 1 ? 1.2 : 1,
              height: isFocusMode && selectedPlace !== null && selectedPlace !== 1 ? 0 : 'auto'
            }}
            transition={{ duration: 0.5 }}
          >
            <PrizeCard place={1} total={prizes[1].total} remaining={prizes[1].remaining} isActive={currentPlace === 1} isSelected={selectedPlace === 1} isFocused={isFocusMode && selectedPlace === 1} onClick={() => handlePrizeClick(1)} />
          </motion.div>
          <motion.div 
            className="w-full"
            animate={{
              opacity: isFocusMode && selectedPlace !== null && selectedPlace !== 2 ? 0 : 1,
              scale: isFocusMode && selectedPlace === 2 ? 1.2 : 1,
              height: isFocusMode && selectedPlace !== null && selectedPlace !== 2 ? 0 : 'auto'
            }}
            transition={{ duration: 0.5 }}
          >
            <PrizeCard place={2} total={prizes[2].total} remaining={prizes[2].remaining} isActive={currentPlace === 2} isSelected={selectedPlace === 2} isFocused={isFocusMode && selectedPlace === 2} onClick={() => handlePrizeClick(2)} />
          </motion.div>
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
        
        {/* Number Display */}
        <motion.div
          className="flex flex-col items-center justify-center mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <NumberDisplay number={currentNumber} isDrawing={isSpinning} />
          
          {/* Draw Button */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-center">
            {isDrawing && !isPaused ? (
              <Button
                onClick={pauseDraw}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white min-w-[320px] px-8 py-6 text-xl md:text-2xl"
                size="lg"
              >
                <Pause className="w-7 h-7 mr-3" />
                Tạm Dừng ({currentDrawIndex}/{pendingNumbers.length})
              </Button>
            ) : isPaused ? (
              <Button
                onClick={resumeDraw}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white min-w-[320px] px-8 py-6 text-xl md:text-2xl"
                size="lg"
              >
                <Play className="w-7 h-7 mr-3" />
                Tiếp Tục ({currentDrawIndex}/{pendingNumbers.length})
              </Button>
            ) : (
              <Button
                onClick={drawNumber}
                disabled={currentPlace === null || (currentPlace !== null && prizes[currentPlace].remaining === 0)}
                className="draw-button text-primary-foreground min-w-[320px] px-8 py-6 text-xl md:text-2xl"
                size="lg"
              >
                <Sparkles className="w-7 h-7 mr-3" />
                {getButtonText()}
              </Button>
            )}
            
            {/* Reset button - context aware */}
            {isFocusMode && selectedPlace !== null && history.some(h => h.place === selectedPlace) && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="lg"
                    className="px-6"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Làm Lại Giải Này
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Làm lại Giải {placeLabels[selectedPlace]}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Hành động này sẽ xóa các số đã bốc cho Giải {placeLabels[selectedPlace]} và cho phép bốc lại. Các giải khác không bị ảnh hưởng.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={() => resetPrize(selectedPlace)}>Xác Nhận</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            
            {/* Global reset button - only on homepage */}
            {!isFocusMode && history.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="lg"
                    className="px-6"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Làm Lại Tất Cả
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
            )}
          </div>
          
          {/* Back to Home Button */}
          {isFocusMode && (
            <motion.div
              className="mt-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                onClick={goBackHome}
                disabled={isDrawing && !isPaused}
                variant="default"
                size="lg"
                className="px-10 py-6 text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-xl"
              >
                <ArrowLeft className="w-6 h-6 mr-3" />
                Quay Lại Trang Chủ
              </Button>
            </motion.div>
          )}
        </motion.div>
        
        {/* History */}
        <DrawHistory history={history} onClear={clearHistory} />
        
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
