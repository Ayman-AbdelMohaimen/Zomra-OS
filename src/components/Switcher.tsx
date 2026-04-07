import React from 'react';
import { motion } from "framer-motion";

export default function Switcher({ 
  active, 
  options, 
  onToggle, 
  icon 
}: { 
  active: string, 
  options: [string, string], 
  onToggle: (val: string) => void,
  icon?: React.ReactNode
}) {
  const toggle = () => {
    const next = active === options[0] ? options[1] : options[0];
    onToggle(next);
  };

  return (
    <motion.button
      className="relative w-16 h-8 bg-crisp-white/10 rounded-full p-1 cursor-pointer flex items-center justify-between px-2"
      onClick={toggle}
      whileTap={{ scale: 0.9 }}
    >
      <span className="text-[10px] font-bold">{options[0]}</span>
      <span className="text-[10px] font-bold">{options[1]}</span>
      <motion.div
        className="absolute top-1 w-6 h-6 bg-eagle-gold rounded-full shadow-lg flex items-center justify-center"
        animate={{ x: active === options[0] ? 0 : 32 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {icon}
      </motion.div>
    </motion.button>
  );
}
