import { motion } from "framer-motion";
import { Trophy, Award, Medal, Star } from "lucide-react";

interface PrizeCardProps {
  place: 0 | 1 | 2 | 3 | 4;
  total: number;
  remaining: number;
  isActive: boolean;
  isSelected?: boolean;
  isFocused?: boolean;
  onClick?: () => void;
}

const prizeConfig = {
  0: {
    label: "Giải Đặc Biệt",
    icon: Trophy,
    className: "prize-card-special",
    iconColor: "text-pink-300",
    bgGradient: "from-pink-500/10 via-purple-500/10 to-transparent",
    emoji: "💎",
    prizeAmount: "15,000,000",
  },
  1: {
    label: "Giải Nhất",
    icon: Trophy,
    className: "prize-card-gold",
    iconColor: "text-yellow-300",
    bgGradient: "from-yellow-500/10 via-yellow-400/5 to-transparent",
    emoji: "👑",
    prizeAmount: "10,000,000",
  },
  2: {
    label: "Giải Nhì",
    icon: Award,
    className: "prize-card-silver",
    iconColor: "text-slate-100",
    bgGradient: "from-slate-100/10 via-slate-200/5 to-transparent",
    emoji: "🥈",
    prizeAmount: "7,000,000",
  },
  3: {
    label: "Giải Ba",
    icon: Medal,
    className: "prize-card-bronze",
    iconColor: "text-orange-300",
    bgGradient: "from-orange-400/10 via-orange-300/5 to-transparent",
    emoji: "🥉",
    prizeAmount: "3,000,000",
  },
  4: {
    label: "Giải Khuyến Khích",
    icon: Star,
    className: "prize-card-fourth",
    iconColor: "text-blue-300",
    bgGradient: "from-blue-400/10 via-blue-300/5 to-transparent",
    emoji: "⭐",
    prizeAmount: "1,000,000",
  },
};

export const PrizeCard = ({ place, total, remaining, isActive, isSelected = false, isFocused = false, onClick }: PrizeCardProps) => {
  const config = prizeConfig[place];
  const Icon = config.icon;
  const progress = ((total - remaining) / total) * 100;
  
  return (
    <motion.div
      onClick={onClick}
      className={`prize-card ${config.className} ${isSelected ? 'ring-4 ring-white/60' : ''} ${isFocused ? 'ring-8 ring-white/80 shadow-2xl' : ''} bg-gradient-to-br ${config.bgGradient} relative overflow-hidden cursor-pointer`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        scale: isSelected && !isFocused ? 1.1 : (isActive ? 1.05 : 1)
      }}
      transition={{ duration: 0.2, type: "spring", stiffness: 400, damping: 25 }}
      whileHover={{ scale: isFocused ? 1.02 : (isSelected ? 1.12 : (isActive ? 1.08 : 1.03)), y: isFocused ? 0 : -4 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Animated background glow */}
      {(isActive || isFocused) && (
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: isFocused 
              ? `radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.3) 0%, transparent 70%)`
              : `radial-gradient(circle at 50% 50%, rgba(100, 150, 255, 0.2) 0%, transparent 70%)`,
            opacity: isFocused ? 0.4 : 0.2,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: isFocused ? [0.4, 0.6, 0.4] : [0.2, 0.3, 0.2],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      <motion.div
        className="relative z-10"
        animate={isActive ? { 
          y: [0, -5, 0],
        } : {}}
        transition={{ duration: 0.6, repeat: Infinity }}
      >
        <div className="text-3xl md:text-4xl mb-1">{config.emoji}</div>
        <Icon className={`w-7 h-7 md:w-9 md:h-9 mx-auto mb-2 ${config.iconColor}`} />
      </motion.div>
      <h3 className="font-display font-bold text-sm md:text-base mb-1 relative z-10">{config.label}</h3>
      
      {/* Prize Amount */}
      <div className="mb-2 relative z-10">
        <div className={`text-lg md:text-xl font-black ${config.iconColor}`}>
          {config.prizeAmount}
        </div>
        <div className="text-xs text-blue-100/60 font-medium">VND</div>
      </div>
      
      <div className="text-2xl md:text-3xl font-display font-black mb-1 relative z-10">
        {total} <span className="text-muted-foreground text-base md:text-lg font-semibold">Giải</span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden backdrop-blur-sm relative z-10">
        <motion.div 
          className={`h-full ${config.iconColor} bg-current rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            boxShadow: `0 0 10px currentColor`,
          }}
        />
      </div>
    </motion.div>
  );
};
