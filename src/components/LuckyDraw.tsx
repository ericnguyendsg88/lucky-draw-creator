import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { PrizeCard } from "./PrizeCard";
import { NumberDisplay } from "./NumberDisplay";
import { DrawHistory } from "./DrawHistory";
import { Button } from "./ui/button";
import { Sparkles, RotateCcw, ArrowLeft } from "lucide-react";
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
  4: { total: 48, remaining: 48 },
  3: { total: 24, remaining: 24 },
  2: { total: 2, remaining: 2 },
  1: { total: 1, remaining: 1 },
  0: { total: 1, remaining: 1 },
};

const batchSizes: Record<0 | 1 | 2 | 3 | 4, number> = {
  4: 16,
  3: 12,
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
  const [isFocusMode, setIsFocusMode] = useState(false);
  
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
  
  const drawNumber = useCallback(() => {
    if (isDrawing || isComplete || currentPlace === null) return;
    
    soundManager.playClick();
    setIsDrawing(true);
    setIsFocusMode(true);
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
          
          // Decrease remaining count for this prize by 1
          setPrizes(prev => ({
            ...prev,
            [place]: { ...prev[place], remaining: prev[place].remaining - 1 },
          }));
          
          // Trigger confetti and win sound for each number
          triggerConfetti(place);
          if (index === numbersToAdd.length - 1) {
            const winIntensity = place === 0 ? 'large' : place <= 2 ? 'medium' : 'small';
            soundManager.playWin(winIntensity);
          }
        }, drawDurationPerNumber);
      }, startTime);
    });
    
    // Update drawn numbers and check if prize is complete
    const totalTime = numbersToAdd.length * totalTimePerNumber;
    setTimeout(() => {
      setDrawnNumbers(newDrawnNumbers);
      
      setIsDrawing(false);
      setIsFocusMode(false);
    }, totalTime);
  }, [isDrawing, isComplete, drawnNumbers, currentPlace, prizes]);
  
  const handlePrizeClick = (place: 0 | 1 | 2 | 3 | 4) => {
    if (prizes[place].remaining > 0 && !isDrawing) {
      soundManager.playClick();
      setSelectedPlace(place);
      setIsFocusMode(true);
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
    setIsFocusMode(false);
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
    if (isDrawing) return "Đang Bốc Thăm...";
    if (currentPlace === null) return "Chọn một giải thưởng để bắt đầu";
    if (prizes[currentPlace].remaining === 0) return "Giải này đã hết!";
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
          
          {/* Back to Home Button */}
          {isFocusMode && (
            <motion.div
              className="mb-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                onClick={goBackHome}
                disabled={isDrawing}
                variant="outline"
                size="lg"
                className="px-6"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Quay Lại Trang Chủ
              </Button>
            </motion.div>
          )}
          
          {/* Draw Button */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Button
              onClick={drawNumber}
              disabled={isDrawing || currentPlace === null || (currentPlace !== null && prizes[currentPlace].remaining === 0)}
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
