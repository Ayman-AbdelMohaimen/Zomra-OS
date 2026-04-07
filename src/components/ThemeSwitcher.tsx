import { motion } from "framer-motion";
import { Cloud, Star } from "lucide-react";

export default function ThemeSwitcher({ theme, onToggle }: { theme: 'Light' | 'Dark', onToggle: (val: 'Light' | 'Dark') => void }) {
  const isDark = theme === 'Dark';

  return (
    <motion.button
      className={`relative w-20 h-8 rounded-full p-1 cursor-pointer overflow-hidden shadow-inner border border-crisp-white/20 transition-colors duration-500 ${
        isDark ? 'bg-deep-black' : 'bg-sky-400'
      }`}
      onClick={() => onToggle(isDark ? 'Light' : 'Dark')}
      whileTap={{ scale: 0.95 }}
      dir="ltr"
    >
      {/* Background Elements (Clouds / Stars) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <motion.div 
            className="absolute top-1.5 left-2 text-white/80"
            initial={false}
            animate={{ opacity: isDark ? 0 : 1, x: isDark ? -10 : 0 }}
        >
            <Cloud size={12} fill="currentColor" />
        </motion.div>
        <motion.div 
            className="absolute top-2 right-3 text-eagle-gold/80"
            initial={false}
            animate={{ opacity: isDark ? 1 : 0, x: isDark ? 0 : 10 }}
        >
            <Star size={10} fill="currentColor" />
        </motion.div>
      </div>

      {/* 3D Knob (Sun / Moon) */}
      <motion.div
        className={`absolute top-1 w-6 h-6 rounded-full shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.3),_0_2px_4px_rgba(0,0,0,0.4)] flex items-center justify-center overflow-hidden ${
            isDark ? 'bg-gradient-to-br from-gray-300 to-gray-500' : 'bg-gradient-to-br from-yellow-200 to-eagle-gold'
        }`}
        initial={false}
        animate={{ 
            x: isDark ? 48 : 0,
            rotate: isDark ? 360 : 0
        }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        {/* Moon Craters */}
        {isDark && (
            <>
                <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-black/20 rounded-full shadow-inner" />
                <div className="absolute bottom-1 right-1.5 w-2 h-2 bg-black/20 rounded-full shadow-inner" />
                <div className="absolute top-3 left-3 w-1 h-1 bg-black/20 rounded-full shadow-inner" />
            </>
        )}
      </motion.div>
    </motion.button>
  );
}
