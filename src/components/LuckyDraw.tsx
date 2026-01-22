import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { PrizeCard } from "./PrizeCard";
import { NumberDisplay } from "./NumberDisplay";
import { DrawHistory } from "./DrawHistory";
import { Button } from "./ui/button";
import { Sparkles, RotateCcw } from "lucide-react";

interface DrawnNumber {
  number: number;
  place: 1 | 2 | 3 | 4;
}

interface PrizeState {
  total: number;
  remaining: number;
}

const initialPrizes: Record<1 | 2 | 3 | 4, PrizeState> = {
  4: { total: 60, remaining: 60 },
  3: { total: 30, remaining: 30 },
  2: { total: 2, remaining: 2 },
  1: { total: 1, remaining: 1 },
};

export const LuckyDraw = () => {
  const [prizes, setPrizes] = useState(initialPrizes);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<DrawnNumber[]>([]);
  const [drawnNumbers, setDrawnNumbers] = useState<Set<number>>(new Set());
  
  const getCurrentPlace = useCallback((): 1 | 2 | 3 | 4 | null => {
    if (prizes[4].remaining > 0) return 4;
    if (prizes[3].remaining > 0) return 3;
    if (prizes[2].remaining > 0) return 2;
    if (prizes[1].remaining > 0) return 1;
    return null;
  }, [prizes]);
  
  const currentPlace = getCurrentPlace();
  const isComplete = currentPlace === null;
  
  const triggerConfetti = (place: 1 | 2 | 3 | 4) => {
    const intensity = {
      1: { particleCount: 200, spread: 100, startVelocity: 60 },
      2: { particleCount: 150, spread: 80, startVelocity: 50 },
      3: { particleCount: 100, spread: 60, startVelocity: 40 },
      4: { particleCount: 50, spread: 40, startVelocity: 30 },
    };
    
    const colors = {
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
    if (isDrawing || isComplete) return;
    
    setIsDrawing(true);
    
    // Animate for 2 seconds
    setTimeout(() => {
      let newNumber: number;
      do {
        newNumber = Math.floor(Math.random() * 1000);
      } while (drawnNumbers.has(newNumber));
      
      setCurrentNumber(newNumber);
      setDrawnNumbers(prev => new Set([...prev, newNumber]));
      setIsDrawing(false);
      
      const place = currentPlace!;
      setPrizes(prev => ({
        ...prev,
        [place]: { ...prev[place], remaining: prev[place].remaining - 1 },
      }));
      
      setHistory(prev => [{ number: newNumber, place }, ...prev]);
      triggerConfetti(place);
    }, 2000);
  }, [isDrawing, isComplete, drawnNumbers, currentPlace]);
  
  const reset = () => {
    setPrizes(initialPrizes);
    setCurrentNumber(null);
    setHistory([]);
    setDrawnNumbers(new Set());
  };
  
  const getButtonText = () => {
    if (isComplete) return "All Prizes Drawn!";
    if (isDrawing) return "Drawing...";
    const placeLabels = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th" };
    return `Draw ${placeLabels[currentPlace!]} Place (${prizes[currentPlace!].remaining} left)`;
  };
  
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-2 bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent">
            Lucky Draw
          </h1>
          <p className="text-muted-foreground">93 Prizes • Numbers 0-999</p>
        </motion.div>
        
        {/* Prize Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <PrizeCard place={1} total={prizes[1].total} remaining={prizes[1].remaining} isActive={currentPlace === 1} />
          <PrizeCard place={2} total={prizes[2].total} remaining={prizes[2].remaining} isActive={currentPlace === 2} />
          <PrizeCard place={3} total={prizes[3].total} remaining={prizes[3].remaining} isActive={currentPlace === 3} />
          <PrizeCard place={4} total={prizes[4].total} remaining={prizes[4].remaining} isActive={currentPlace === 4} />
        </div>
        
        {/* Number Display */}
        <motion.div
          className="flex flex-col items-center justify-center mb-12"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <NumberDisplay number={currentNumber} isDrawing={isDrawing} />
          
          {/* Draw Button */}
          <div className="mt-8 flex gap-4">
            <Button
              onClick={drawNumber}
              disabled={isDrawing || isComplete}
              className="draw-button text-primary-foreground"
              size="lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {getButtonText()}
            </Button>
            
            {history.length > 0 && (
              <Button
                onClick={reset}
                variant="outline"
                size="lg"
                className="px-6"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Reset
              </Button>
            )}
          </div>
        </motion.div>
        
        {/* History */}
        <DrawHistory history={history} />
        
        {/* Completion Message */}
        {isComplete && (
          <motion.div
            className="text-center mt-8"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
          >
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
