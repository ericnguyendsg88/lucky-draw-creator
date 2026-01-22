import { motion } from "framer-motion";
import { Trophy, Award, Medal, Star } from "lucide-react";

interface PrizeCardProps {
  place: 1 | 2 | 3 | 4;
  total: number;
  remaining: number;
  isActive: boolean;
}

const prizeConfig = {
  1: {
    label: "1st Place",
    icon: Trophy,
    className: "prize-card-gold",
    iconColor: "text-gold",
    bgGradient: "from-gold/20 to-gold/5",
  },
  2: {
    label: "2nd Place",
    icon: Award,
    className: "prize-card-silver",
    iconColor: "text-silver",
    bgGradient: "from-silver/20 to-silver/5",
  },
  3: {
    label: "3rd Place",
    icon: Medal,
    className: "prize-card-bronze",
    iconColor: "text-bronze",
    bgGradient: "from-bronze/20 to-bronze/5",
  },
  4: {
    label: "4th Place",
    icon: Star,
    className: "prize-card-fourth",
    iconColor: "text-fourth",
    bgGradient: "from-fourth/20 to-fourth/5",
  },
};

export const PrizeCard = ({ place, total, remaining, isActive }: PrizeCardProps) => {
  const config = prizeConfig[place];
  const Icon = config.icon;
  
  return (
    <motion.div
      className={`prize-card ${config.className} ${isActive ? 'ring-2 ring-primary scale-105' : ''} bg-gradient-to-b ${config.bgGradient}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (4 - place) * 0.1 }}
      whileHover={{ scale: isActive ? 1.05 : 1.02 }}
    >
      <Icon className={`w-8 h-8 mx-auto mb-2 ${config.iconColor}`} />
      <h3 className="font-display font-bold text-lg mb-1">{config.label}</h3>
      <div className="text-3xl font-display font-bold mb-1">
        {remaining}<span className="text-muted-foreground text-lg">/{total}</span>
      </div>
      <p className="text-xs text-muted-foreground">remaining</p>
    </motion.div>
  );
};
