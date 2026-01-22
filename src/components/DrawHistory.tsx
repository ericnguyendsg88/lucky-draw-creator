import { motion } from "framer-motion";

interface DrawnNumber {
  number: number;
  place: 0 | 1 | 2 | 3 | 4;
}

interface DrawHistoryProps {
  history: DrawnNumber[];
}

const placeColors = {
  0: "bg-gradient-to-r from-pink-400/20 to-purple-500/20 border-pink-400/40 text-pink-200",
  1: "bg-gradient-to-r from-yellow-400/20 to-yellow-500/10 border-yellow-400/40 text-yellow-200",
  2: "bg-gradient-to-r from-slate-100/20 to-slate-200/10 border-slate-100/40 text-slate-50",
  3: "bg-gradient-to-r from-orange-400/20 to-orange-500/10 border-orange-400/40 text-orange-200",
  4: "bg-gradient-to-r from-blue-400/20 to-blue-500/10 border-blue-300/40 text-blue-100",
};

const placeEmojis = {
  0: "💎",
  1: "👑",
  2: "🥈",
  3: "🥉",
  4: "⭐",
};

const placeLabels = {
  1: "1st",
  2: "2nd",
  3: "3rd",
  4: "4th",
};

const placeSizes = {
  0: "px-6 py-4 text-xl md:text-2xl", // Special - Largest
  1: "px-6 py-4 text-lg md:text-xl",  // 1st - Large
  2: "px-5 py-3 text-lg md:text-xl",  // 2nd - Medium-Large
  3: "px-5 py-3 text-base md:text-lg", // 3rd - Medium
  4: "px-5 py-3 text-base md:text-lg", // 4th - Medium
};

export const DrawHistory = ({ history }: DrawHistoryProps) => {
  if (history.length === 0) return null;
  
  return (
    <motion.div
      className="mt-8 w-full max-w-5xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h3 
        className="text-3xl md:text-4xl font-display font-black mb-6 text-center text-white"
        style={{
          textShadow: '0 0 40px rgba(150, 200, 255, 0.9), 0 0 80px rgba(100, 150, 255, 0.5), 0 4px 8px rgba(0, 0, 0, 0.6)'
        }}
      >
        ✨ LỊCH SỬ BỐC THĂM ✨
      </h3>
      <div 
        className="flex flex-wrap gap-4 md:gap-5 justify-center max-h-80 overflow-y-auto p-6 md:p-8 rounded-3xl"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(15px)',
          border: '2px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}
      >
        {history.map((item, index) => (
          <motion.div
            key={`${item.number}-${index}`}
            className={`history-number border ${placeColors[item.place]} ${placeSizes[item.place]}`}
            initial={{ opacity: 0, scale: 0.5, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ 
              delay: 0.05,
              type: "spring",
              stiffness: 260,
              damping: 20
            }}
            whileHover={{ scale: item.place === 0 ? 1.15 : 1.12, y: -4 }}
          >
            <span className={item.place === 0 ? "text-2xl md:text-3xl mr-2" : "text-xl md:text-2xl mr-2"}>{placeEmojis[item.place]}</span>
            <span className="font-black">{String(item.number).padStart(3, "0")}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
