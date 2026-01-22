import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { PrizeCard } from "./PrizeCard";
import { NumberDisplay } from "./NumberDisplay";
import { DrawHistory } from "./DrawHistory";
import { Button } from "./ui/button";
import { Sparkles, RotateCcw } from "lucide-react";
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
  4: { total: 60, remaining: 60 },
  3: { total: 30, remaining: 30 },
  2: { total: 2, remaining: 2 },
  1: { total: 1, remaining: 1 },
  0: { total: 1, remaining: 1 },
};

const batchSizes: Record<0 | 1 | 2 | 3 | 4, number> = {
  4: 20,
  3: 10,
  2: 1,
  1: 1,
  0: 1,
};

export const LuckyDraw = () => {
  const [prizes, setPrizes] = useState(initialPrizes);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [history, setHistory] = useState<DrawnNumber[]>([]);
  const [drawnNumbers, setDrawnNumbers] = useState<Set<number>>(new Set());
  const [selectedPlace, setSelectedPlace] = useState<0 | 1 | 2 | 3 | 4 | null>(null);
  
  // Auto-select first available prize if none selected
  const getFirstAvailablePlace = useCallback((): 0 | 1 | 2 | 3 | 4 | null => {
    if (prizes[4].remaining > 0) return 4;
    if (prizes[3].remaining > 0) return 3;
    if (prizes[2].remaining > 0) return 2;
    if (prizes[1].remaining > 0) return 1;
    if (prizes[0].remaining > 0) return 0;
    return null;
  }, [prizes]);
  
  const currentPlace = selectedPlace !== null && prizes[selectedPlace].remaining > 0 
    ? selectedPlace 
    : getFirstAvailablePlace();
  const isComplete = currentPlace === null;
  
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
  
  const drawNumber = useCallback(() => {
    if (isDrawing || isComplete || currentPlace === null) return;
    
    soundManager.playClick();
    setIsDrawing(true);
    const place = currentPlace;
    const batchSize = Math.min(batchSizes[place], prizes[place].remaining);
    // Each number gets 2.5s animation + 5s clear display pause
    const drawDurationPerNumber = 2500; // Slot machine spinning time
    const pauseBetweenNumbers = 5000; // Longer pause to clearly display each number
    const totalTimePerNumber = drawDurationPerNumber + pauseBetweenNumbers;
    
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
    
    // Draw numbers sequentially
    numbersToAdd.forEach((num, index) => {
      const startTime = index * totalTimePerNumber;
      
      // Start spinning for this number
      setTimeout(() => {
        setIsSpinning(true);
        const rollingSound = soundManager.startContinuousRolling();
        
        // Stop spinning and show the number after animation
        setTimeout(() => {
          rollingSound?.stop();
          setIsSpinning(false);
          soundManager.playNumberLand();
          setCurrentNumber(num);
          setHistory(prev => [{ number: num, place }, ...prev]);
          
          // Trigger confetti and win sound for each number
          triggerConfetti(place);
          if (index === numbersToAdd.length - 1) {
            const winIntensity = place === 0 ? 'large' : place <= 2 ? 'medium' : 'small';
            soundManager.playWin(winIntensity);
          }
        }, drawDurationPerNumber);
      }, startTime);
    });
    
    // Update state after all numbers are shown
    const totalTime = numbersToAdd.length * totalTimePerNumber;
    setTimeout(() => {
      setDrawnNumbers(newDrawnNumbers);
      setPrizes(prev => ({
        ...prev,
        [place]: { ...prev[place], remaining: prev[place].remaining - batchSize },
      }));
      
      // Clear history if this prize is now fully drawn
      const newRemaining = prizes[place].remaining - batchSize;
      if (newRemaining === 0) {
        setHistory([]);
      }
      
      setIsDrawing(false);
    }, totalTime);
  }, [isDrawing, isComplete, drawnNumbers, currentPlace, prizes]);
  
  const handlePrizeClick = (place: 0 | 1 | 2 | 3 | 4) => {
    if (prizes[place].remaining > 0 && !isDrawing) {
      soundManager.playClick();
      setSelectedPlace(place);
    }
  };
  
  const reset = () => {
    soundManager.playClick();
    setIsDrawing(false);
    setIsSpinning(false);
    setPrizes(initialPrizes);
    setCurrentNumber(null);
    setHistory([]);
    setDrawnNumbers(new Set());
    setSelectedPlace(null);
  };
  
  const clearHistory = () => {
    soundManager.playClick();
    setHistory([]);
  };
  
  const getButtonText = () => {
    if (isComplete) return "Đã Bốc Hết Giải Thưởng!";
    if (isDrawing) return "Đang Bốc Thăm...";
    if (currentPlace === null) return "Không có giải";
    const placeLabels = { 0: "Đặc Biệt", 1: "Nhất", 2: "Nhì", 3: "Ba", 4: "Tư" };
    const batchSize = Math.min(batchSizes[currentPlace], prizes[currentPlace].remaining);
    const remaining = prizes[currentPlace].remaining;
    return `Bốc ${batchSize} Giải ${placeLabels[currentPlace]} (Còn ${remaining})`;
  };
  
  return (
    <div className="min-h-screen py-8 px-4 pt-32">
      {/* Animated floating particles */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      
      {/* Moving spotlight beams */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30">
        <motion.div
          className="absolute w-32 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
          style={{ left: '-10%', top: 0, transform: 'skewX(-20deg)' }}
          animate={{
            left: ['0%', '110%'],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute w-32 h-full bg-gradient-to-r from-transparent via-blue-200/20 to-transparent"
          style={{ left: '-10%', top: 0, transform: 'skewX(-20deg)' }}
          animate={{
            left: ['0%', '110%'],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear",
            delay: 2,
          }}
        />
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
          <p className="text-xl md:text-2xl text-blue-100/80 font-bold mt-2">94 Giải Thưởng • Số may mắn từ 0-999</p>
        </motion.div>
        
        {/* Special Prize Card - Full Width */}
        <motion.div 
          className="mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div onClick={() => handlePrizeClick(0)} className="cursor-pointer">
            <PrizeCard place={0} total={prizes[0].total} remaining={prizes[0].remaining} isActive={currentPlace === 0} isSelected={selectedPlace === 0} />
          </div>
        </motion.div>
        
        {/* Prize Cards */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div onClick={() => handlePrizeClick(1)} className="cursor-pointer">
            <PrizeCard place={1} total={prizes[1].total} remaining={prizes[1].remaining} isActive={currentPlace === 1} isSelected={selectedPlace === 1} />
          </div>
          <div onClick={() => handlePrizeClick(2)} className="cursor-pointer">
            <PrizeCard place={2} total={prizes[2].total} remaining={prizes[2].remaining} isActive={currentPlace === 2} isSelected={selectedPlace === 2} />
          </div>
          <div onClick={() => handlePrizeClick(3)} className="cursor-pointer">
            <PrizeCard place={3} total={prizes[3].total} remaining={prizes[3].remaining} isActive={currentPlace === 3} isSelected={selectedPlace === 3} />
          </div>
          <div onClick={() => handlePrizeClick(4)} className="cursor-pointer">
            <PrizeCard place={4} total={prizes[4].total} remaining={prizes[4].remaining} isActive={currentPlace === 4} isSelected={selectedPlace === 4} />
          </div>
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
            <Button
              onClick={drawNumber}
              disabled={isDrawing || isComplete}
              className="draw-button text-primary-foreground min-w-[320px] px-8 py-6 text-xl md:text-2xl"
              size="lg"
            >
              <Sparkles className="w-7 h-7 mr-3" />
              {getButtonText()}
            </Button>
            
            {history.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="lg"
                    className="px-6"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Làm Lại
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Bạn có chắc chắn muốn làm lại?</AlertDialogTitle>
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
        </motion.div>
        
        {/* History */}
        <DrawHistory history={history} onClear={clearHistory} />
        
        {/* Completion Message */}
        {isComplete && (
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
