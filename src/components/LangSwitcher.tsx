import { motion } from "framer-motion";

const UsaFlag = () => (
  <svg viewBox="0 0 64 48" className="w-full h-full rounded-full object-cover">
    <rect width="64" height="48" fill="#fff"/>
    <path d="M0 0h64v8H0zm0 16h64v8H0zm0 16h64v8H0z" fill="#CE1126"/>
    <rect width="32" height="24" fill="#002664"/>
    <circle cx="8" cy="6" r="1.5" fill="#fff"/><circle cx="16" cy="6" r="1.5" fill="#fff"/><circle cx="24" cy="6" r="1.5" fill="#fff"/>
    <circle cx="12" cy="12" r="1.5" fill="#fff"/><circle cx="20" cy="12" r="1.5" fill="#fff"/>
    <circle cx="8" cy="18" r="1.5" fill="#fff"/><circle cx="16" cy="18" r="1.5" fill="#fff"/><circle cx="24" cy="18" r="1.5" fill="#fff"/>
  </svg>
);

const EgyptFlag = () => (
  <svg viewBox="0 0 64 48" className="w-full h-full rounded-full object-cover">
    <rect width="64" height="16" fill="#CE1126"/>
    <rect y="16" width="64" height="16" fill="#fff"/>
    <rect y="32" width="64" height="16" fill="#000"/>
    <circle cx="32" cy="24" r="4" fill="#C09307"/>
  </svg>
);

export default function LangSwitcher({ language, onToggle }: { language: 'EN' | 'AR', onToggle: (val: 'EN' | 'AR') => void }) {
  const isAr = language === 'AR';

  return (
    <motion.button
      className="relative w-16 h-8 bg-crisp-white/10 rounded-full p-1 cursor-pointer flex items-center justify-between px-2 border border-crisp-white/20 shadow-inner"
      onClick={() => onToggle(isAr ? 'EN' : 'AR')}
      whileTap={{ scale: 0.95 }}
      dir="ltr"
    >
      <span className={`text-[10px] font-bold z-10 transition-opacity ${isAr ? 'opacity-50' : 'opacity-0'}`}>EN</span>
      <span className={`text-[10px] font-bold z-10 transition-opacity ${isAr ? 'opacity-0' : 'opacity-50'}`}>AR</span>
      
      <motion.div
        className="absolute top-1 w-6 h-6 bg-deep-black rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.5)] border border-crisp-white/20 flex items-center justify-center overflow-hidden"
        initial={false}
        animate={{ x: isAr ? 32 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {isAr ? <EgyptFlag /> : <UsaFlag />}
      </motion.div>
    </motion.button>
  );
}
