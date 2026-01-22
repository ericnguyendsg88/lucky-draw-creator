import { motion } from "framer-motion";

interface DrawnNumber {
  number: number;
  place: 1 | 2 | 3 | 4;
}

interface DrawHistoryProps {
  history: DrawnNumber[];
}

const placeColors = {
  1: "bg-gradient-to-r from-gold/30 to-gold/10 border-gold/50 text-gold",
  2: "bg-gradient-to-r from-silver/30 to-silver/10 border-silver/50 text-silver",
  3: "bg-gradient-to-r from-bronze/30 to-bronze/10 border-bronze/50 text-bronze",
  4: "bg-gradient-to-r from-fourth/30 to-fourth/10 border-fourth/50 text-fourth",
};

const placeLabels = {
  1: "1st",
  2: "2nd",
  3: "3rd",
  4: "4th",
};

export const DrawHistory = ({ history }: DrawHistoryProps) => {
  if (history.length === 0) return null;
  
  return (
    <motion.div
      className="mt-8 w-full max-w-4xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h3 className="text-lg font-display font-semibold mb-4 text-center text-muted-foreground">
        Draw History
      </h3>
      <div className="flex flex-wrap gap-2 justify-center max-h-48 overflow-y-auto p-2">
        {history.map((item, index) => (
          <motion.div
            key={`${item.number}-${index}`}
            className={`history-number border ${placeColors[item.place]}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <span className="opacity-60 mr-1">{placeLabels[item.place]}</span>
            {String(item.number).padStart(3, "0")}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
