import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Trash2 } from "lucide-react";

interface DrawnNumber {
  number: number;
  place: 0 | 1 | 2 | 3 | 4;
  round?: number;
}

interface DrawHistoryProps {
  history: DrawnNumber[];
  onClear: () => void;
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
  0: "px-6 py-4 text-xl md:text-2xl", // Special - Largest
  1: "px-6 py-4 text-lg md:text-xl",  // 1st - Large
  2: "px-5 py-3 text-lg md:text-xl",  // 2nd - Medium-Large
  3: "px-5 py-3 text-base md:text-lg", // 3rd - Medium
  4: "px-5 py-3 text-base md:text-lg", // 4th - Medium
};

const placeNames = {
  0: "Đặc Biệt",
  1: "Nhất",
  2: "Nhì",
  3: "Ba",
  4: "Khuyến Khích",
};

export const DrawHistory = ({ history, onClear }: DrawHistoryProps) => {
  if (history.length === 0) return null;
  
  // Group history by place and round for Giải Khuyến Khích
  const groupedHistory = () => {
    const groups: { label: string; place: 0 | 1 | 2 | 3 | 4; round?: number; items: DrawnNumber[] }[] = [];
    
    // Giải Khuyến Khích Round 1
    const kk1 = history.filter(h => h.place === 4 && h.round === 1);
    if (kk1.length > 0) {
      groups.push({ label: "Khuyến Khích - Lượt 1", place: 4, round: 1, items: kk1 });
    }
    
    // Giải Khuyến Khích Round 2
    const kk2 = history.filter(h => h.place === 4 && h.round === 2);
    if (kk2.length > 0) {
      groups.push({ label: "Khuyến Khích - Lượt 2", place: 4, round: 2, items: kk2 });
    }
    
    // Other prizes (in order: Ba, Nhì, Nhất, Đặc Biệt)
    [3, 2, 1, 0].forEach(place => {
      const items = history.filter(h => h.place === place);
      if (items.length > 0) {
        groups.push({ label: placeNames[place as 0 | 1 | 2 | 3 | 4], place: place as 0 | 1 | 2 | 3 | 4, items });
      }
    });
    
    return groups;
  };
  
  const groups = groupedHistory();
  
  // Count prizes by place
  const prizeCounts = history.reduce((acc, item) => {
    acc[item.place] = (acc[item.place] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  return (
    <motion.div
      className="mt-8 w-full max-w-5xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex flex-col items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h3 
            className="text-3xl md:text-4xl font-display font-black text-center text-white"
            style={{
              textShadow: '0 0 40px rgba(150, 200, 255, 0.9), 0 0 80px rgba(100, 150, 255, 0.5), 0 4px 8px rgba(0, 0, 0, 0.6)'
            }}
          >
            ✨ LỊCH SỬ BỐC THĂM ✨
          </h3>
          <Button
            onClick={onClear}
            variant="outline"
            size="sm"
            className="border-red-400/40 hover:bg-red-500/20 hover:border-red-400/60 text-red-200"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Xóa Lịch Sử
          </Button>
        </div>
        
        {/* Prize counts summary */}
        <div className="flex flex-wrap gap-3 justify-center">
          {([0, 1, 2, 3, 4] as const).map((place) => {
            const count = prizeCounts[place] || 0;
            if (count === 0) return null;
            return (
              <div
                key={place}
                className={`px-4 py-2 rounded-full border ${placeColors[place]} text-sm font-bold`}
              >
                {placeEmojis[place]} {placeNames[place]}: {count}
              </div>
            );
          })}
          <div className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm font-bold">
            Tổng: {history.length}
          </div>
        </div>
      </div>
      
      {/* Grouped sections */}
      <div className="space-y-6">
        {groups.map((group, groupIndex) => (
          <div key={`${group.place}-${group.round || 0}`}>
            <h4 className={`text-lg font-bold mb-3 ${placeColors[group.place].split(' ').find(c => c.startsWith('text-')) || 'text-white'}`}>
              {placeEmojis[group.place]} {group.label} ({group.items.length})
            </h4>
            <div 
              className="flex flex-wrap gap-3 md:gap-4 justify-start p-4 md:p-6 rounded-2xl"
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
                    <span className="text-lg mr-1">{placeEmojis[item.place]}</span>
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
