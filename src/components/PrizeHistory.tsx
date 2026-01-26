import { motion, AnimatePresence } from "framer-motion";

interface DrawnNumber {
  number: number;
  place: 0 | 1 | 2 | 3 | 4;
  round?: number;
}

interface PrizeHistoryProps {
  history: DrawnNumber[];
  place: 0 | 1 | 2 | 3 | 4;
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

const placeSizes = {
  0: "px-6 py-4 text-xl md:text-2xl",
  1: "px-6 py-4 text-lg md:text-xl",
  2: "px-5 py-3 text-lg md:text-xl",
  3: "px-7 py-5 text-2xl md:text-3xl",
  4: "px-7 py-5 text-2xl md:text-3xl",
};

const placeNames = {
  0: "Đặc Biệt",
  1: "Nhất",
  2: "Nhì",
  3: "Ba",
  4: "Khuyến Khích",
};

export const PrizeHistory = ({ history, place }: PrizeHistoryProps) => {
  // Filter history for this specific prize
  const prizeHistory = history.filter(h => h.place === place);
  
  if (prizeHistory.length === 0) return null;
  
  // Check if this is prize 3 or 4 for larger display
  const isLargerDisplay = place === 3 || place === 4;
  
  // For Giải Khuyến Khích, group by round
  const groups = place === 4 
    ? [
        { label: "Lượt 1", round: 1, items: prizeHistory.filter(h => h.round === 1) },
        { label: "Lượt 2", round: 2, items: prizeHistory.filter(h => h.round === 2) },
      ].filter(g => g.items.length > 0)
    : [{ label: placeNames[place], items: prizeHistory }];
  
  return (
    <motion.div
      className={`mt-8 w-full mx-auto ${isLargerDisplay ? 'max-w-7xl' : 'max-w-4xl'}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 
        className={`font-display font-black text-center text-white mb-6 ${isLargerDisplay ? 'text-4xl md:text-5xl' : 'text-2xl md:text-3xl'}`}
        style={{
          textShadow: '0 0 40px rgba(150, 200, 255, 0.9), 0 0 80px rgba(100, 150, 255, 0.5), 0 4px 8px rgba(0, 0, 0, 0.6)'
        }}
      >
        {placeEmojis[place]} Danh sách trúng thưởng ({prizeHistory.length})
      </h3>
      
      <div className="space-y-4">
        {groups.map((group, groupIndex) => (
          <div key={`${place}-${group.round || 0}`}>
            {place === 4 && (
              <h4 className={`text-lg font-bold mb-3 ${placeColors[place].split(' ').find(c => c.startsWith('text-')) || 'text-white'}`}>
                {placeEmojis[place]} {group.label} ({group.items.length})
              </h4>
            )}
            <div 
              className={`flex flex-wrap justify-center p-4 md:p-6 rounded-2xl ${isLargerDisplay ? 'gap-4 md:gap-5' : 'gap-3 md:gap-4'}`}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <AnimatePresence initial={false}>
                {group.items.map((item, index) => (
                  <motion.div
                    key={`${item.number}-${item.place}-${item.round}-${index}`}
                    className={`history-number border ${placeColors[item.place]} ${placeSizes[item.place]}`}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    whileHover={{ scale: 1.08 }}
                  >
                    <span className="font-black">{String(item.number).padStart(3, "0")}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};