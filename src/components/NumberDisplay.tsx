import { useEffect, useState, useRef, memo, useCallback } from "react";
import { soundManager } from "@/lib/sounds";
import type { DrawConfig } from "@/lib/drawConfig";
import { getRandomSpinChar, getSlotDigits } from "@/lib/ticketPool";

interface NumberDisplayProps {
  number: number | null;
  isDrawing: boolean;
  selectedPlace?: 0 | 1 | 2 | 3 | 4 | null;
  isComplete?: boolean;
  drawConfig?: DrawConfig;
}

const SlotDigit = memo(({ digit, isDrawing, drawConfig, position }: { digit: string; isDrawing: boolean; drawConfig?: DrawConfig; position?: number }) => {
  const [displayDigit, setDisplayDigit] = useState<string>(digit);
  const rafRef = useRef<number>(0);
  const lastTickRef = useRef(0);

  useEffect(() => {
    if (isDrawing) {
      const tick = (time: number) => {
        if (time - lastTickRef.current >= 66) {
          lastTickRef.current = time;
          if (drawConfig) {
            setDisplayDigit(getRandomSpinChar(position ?? 0, drawConfig));
          } else {
            setDisplayDigit(String(Math.floor(Math.random() * 10)));
          }
          soundManager.playRolling();
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);

      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    } else {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      setDisplayDigit(digit);
    }
  }, [isDrawing, digit, drawConfig, position]);

  return (
    <div className="slot-digit-container">
      <div className="slot-digit-frame">
        <div className={`slot-digit ${isDrawing ? 'slot-digit-spinning' : ''}`}>
          {displayDigit ?? "-"}
        </div>
      </div>
    </div>
  );
});

SlotDigit.displayName = 'SlotDigit';

export const NumberDisplay = memo(({ number, isDrawing, selectedPlace, isComplete, drawConfig }: NumberDisplayProps) => {
  const [displayDigits, setDisplayDigits] = useState<string[]>(["-", "-", "-"]);

  const shouldBeSmall = isComplete && (selectedPlace === 3 || selectedPlace === 4);

  useEffect(() => {
    if (!isDrawing && number !== null) {
      if (drawConfig) {
        setDisplayDigits(getSlotDigits(number, drawConfig));
      } else {
        const numStr = String(number).padStart(3, "0");
        setDisplayDigits([numStr[0], numStr[1], numStr[2]]);
      }
    } else if (!isDrawing && number === null) {
      setDisplayDigits(["-", "-", "-"]);
    }
  }, [isDrawing, number, drawConfig]);

  return (
    <div className={`relative ${shouldBeSmall ? 'scale-75' : ''} transition-transform duration-500`}>
      {/* Glow effect */}
      <div className={`absolute inset-0 bg-primary/15 blur-2xl rounded-full transition-opacity duration-200 ${isDrawing ? 'slot-glow-pulse' : 'opacity-20'}`} />

      {/* Slot machine container */}
      <div className="slot-machine-container relative z-10">
        <div className="slot-digits-wrapper">
          {displayDigits.map((digit, index) => (
            <SlotDigit key={`digit-${index}`} digit={digit} isDrawing={isDrawing} drawConfig={drawConfig} position={index} />
          ))}
        </div>
      </div>
    </div>
  );
});

NumberDisplay.displayName = 'NumberDisplay';
