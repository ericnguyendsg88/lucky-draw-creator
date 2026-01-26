import { useEffect, useState, useRef } from "react";
import { soundManager } from "@/lib/sounds";

interface NumberDisplayProps {
  number: number | null;
  isDrawing: boolean;
  selectedPlace?: 0 | 1 | 2 | 3 | 4 | null;
  isComplete?: boolean;
}

const SlotDigit = ({ digit, isDrawing }: { digit: string; isDrawing: boolean }) => {
  const [displayDigit, setDisplayDigit] = useState<string | number>(digit);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (isDrawing) {
      intervalRef.current = setInterval(() => {
        setDisplayDigit(Math.floor(Math.random() * 10));
        soundManager.playRolling();
      }, 50);
      
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
        <div className={`slot-digit ${isDrawing ? 'slot-digit-spinning' : ''}`}>
          {displayDigit ?? "-"}
        </div>
      </div>
    </div>
  );
};

export const NumberDisplay = ({ number, isDrawing, selectedPlace, isComplete }: NumberDisplayProps) => {
  const [displayDigits, setDisplayDigits] = useState<string[]>(["-", "-", "-"]);
  
  // Check if this is prize 3 or 4 and drawing is complete
  const shouldBeSmall = isComplete && (selectedPlace === 3 || selectedPlace === 4);
  
  useEffect(() => {
    if (!isDrawing && number !== null) {
      const numStr = String(number).padStart(3, "0");
      setDisplayDigits([numStr[0], numStr[1], numStr[2]]);
    } else if (!isDrawing && number === null) {
      setDisplayDigits(["-", "-", "-"]);
    }
  }, [isDrawing, number]);
  
  return (
    <div className={`relative ${shouldBeSmall ? 'scale-75' : ''} transition-transform duration-500`}>
      {/* Glow effect */}
      <div className={`absolute inset-0 bg-primary/15 blur-2xl rounded-full transition-opacity duration-200 ${isDrawing ? 'slot-glow-pulse' : 'opacity-20'}`} />
      
      {/* Slot machine container */}
      <div className="slot-machine-container relative z-10">
        <div className="slot-digits-wrapper">
          {displayDigits.map((digit, index) => (
            <SlotDigit key={`digit-${index}`} digit={digit} isDrawing={isDrawing} />
          ))}
        </div>
      </div>
    </div>
  );
};
