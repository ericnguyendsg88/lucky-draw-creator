import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { soundManager } from "@/lib/sounds";

interface NumberDisplayProps {
  number: number | null;
  isDrawing: boolean;
}

const SlotDigit = ({ digit, isDrawing }: { digit: string; isDrawing: boolean }) => {
  const [rollingDigits, setRollingDigits] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (isDrawing) {
      // Generate random rolling digits
      const digits = Array.from({ length: 20 }, () => Math.floor(Math.random() * 10));
      setRollingDigits(digits);
      setCurrentIndex(0);
      
      // Start rolling animation
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          soundManager.playRolling();
          return (prev + 1) % digits.length;
        });
      }, 50);
      
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } else {
      // Stop rolling and show final digit
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isDrawing]);
  
  const displayDigit = isDrawing ? rollingDigits[currentIndex] : digit;
  
  return (
    <div className="slot-digit-container">
      <div className="slot-digit-frame">
        <motion.div
          className="slot-digit"
          key={`${digit}-${isDrawing}-${currentIndex}`}
          animate={isDrawing ? { 
            y: [0, -10, 0],
          } : { y: 0 }}
          transition={{ 
            duration: 0.1,
            ease: "easeInOut"
          }}
        >
          {displayDigit ?? "-"}
        </motion.div>
      </div>
    </div>
  );
};

export const NumberDisplay = ({ number, isDrawing }: NumberDisplayProps) => {
  const [displayDigits, setDisplayDigits] = useState<string[]>(["-", "-", "-"]);
  
  useEffect(() => {
    if (!isDrawing && number !== null) {
      const numStr = String(number).padStart(3, "0");
      setDisplayDigits([numStr[0], numStr[1], numStr[2]]);
    } else if (!isDrawing && number === null) {
      setDisplayDigits(["-", "-", "-"]);
    }
  }, [isDrawing, number]);
  
  return (
    <div className="relative">
      {/* Glow effect */}
      <motion.div 
        className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"
        animate={isDrawing ? {
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        } : {}}
        transition={{
          duration: 0.5,
          repeat: isDrawing ? Infinity : 0,
          ease: "easeInOut"
        }}
      />
      
      {/* Slot machine container */}
      <motion.div
        className="slot-machine-container relative z-10"
        animate={isDrawing ? { 
          scale: [1, 1.02, 1],
        } : { scale: 1 }}
        transition={{ 
          duration: 0.3, 
          repeat: isDrawing ? Infinity : 0 
        }}
      >
        <div className="slot-digits-wrapper">
          {displayDigits.map((digit, index) => (
            <SlotDigit 
              key={`digit-${index}`} 
              digit={digit} 
              isDrawing={isDrawing} 
            />
          ))}
        </div>
      </motion.div>
      
      {/* Slot machine decorative frame */}
      <div className="slot-machine-frame" />
    </div>
  );
};
