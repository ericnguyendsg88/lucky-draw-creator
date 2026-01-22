import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface NumberDisplayProps {
  number: number | null;
  isDrawing: boolean;
}

export const NumberDisplay = ({ number, isDrawing }: NumberDisplayProps) => {
  const [displayNumber, setDisplayNumber] = useState<string>("---");
  
  useEffect(() => {
    if (isDrawing) {
      const interval = setInterval(() => {
        setDisplayNumber(String(Math.floor(Math.random() * 1000)).padStart(3, "0"));
      }, 50);
      return () => clearInterval(interval);
    } else if (number !== null) {
      setDisplayNumber(String(number).padStart(3, "0"));
    } else {
      setDisplayNumber("---");
    }
  }, [isDrawing, number]);
  
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
      <motion.div
        className="number-display text-foreground relative z-10"
        animate={isDrawing ? { scale: [1, 1.02, 1] } : { scale: 1 }}
        transition={{ duration: 0.1, repeat: isDrawing ? Infinity : 0 }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={displayNumber}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.05 }}
          >
            {displayNumber}
          </motion.span>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
