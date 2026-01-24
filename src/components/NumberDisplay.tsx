import { useEffect, useState, useRef } from "react";
import { soundManager } from "@/lib/sounds";

interface NumberDisplayProps {
  number: number | null;
  isDrawing: boolean;
}

const SlotDigit = ({ digit, isDrawing }: { digit: string; isDrawing: boolean }) => {
  const [displayDigit, setDisplayDigit] = useState<string | number>(digit);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (isDrawing) {
      // Use faster interval with simple random digit
      intervalRef.current = setInterval(() => {
        setDisplayDigit(Math.floor(Math.random() * 10));
        soundManager.playRolling();
      }, 80);
      
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setDisplayDigit(digit);
    }
  }, [isDrawing, digit]);
  
  return (
    <div className="slot-digit-container">
      <div className="slot-digit-frame">
        <div 
          className={`slot-digit ${isDrawing ? 'slot-digit-spinning' : ''}`}
        >
          {displayDigit ?? "-"}
        </div>
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
      {/* Glow effect - CSS animation instead of framer-motion */}
      <div className={`absolute inset-0 bg-primary/20 blur-3xl rounded-full transition-opacity duration-300 ${isDrawing ? 'slot-glow-pulse' : 'opacity-30'}`} />
      
      {/* Slot machine container */}
      <div className={`slot-machine-container relative z-10 ${isDrawing ? 'slot-machine-active' : ''}`}>
        <div className="slot-digits-wrapper">
          {displayDigits.map((digit, index) => (
            <SlotDigit 
              key={`digit-${index}`} 
              digit={digit} 
              isDrawing={isDrawing} 
            />
          ))}
        </div>
      </div>
      
      {/* Slot machine decorative frame */}
      <div className="slot-machine-frame" />
    </div>
  );
};
