import React, { useEffect, useRef } from 'react';
import { useZomraStore } from '../store/useZomraStore';
import { Terminal as TerminalIcon, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PicoClawTerminal() {
  const { terminalLogs, isTerminalOpen, setIsTerminalOpen, language } = useZomraStore();
  const isRtl = language === 'AR';
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs, isTerminalOpen]);

  if (!isTerminalOpen) return null;

  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 250, opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="absolute bottom-0 left-0 w-full bg-[#050505] border-t border-[#0f0]/20 flex flex-col z-20 shadow-[0_-5px_20px_rgba(0,255,0,0.1)]"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="flex items-center justify-between px-4 py-2 bg-[#000] border-b border-[#0f0]/20">
        <div className="flex items-center gap-2 text-xs font-bold text-[#0f0]">
          <TerminalIcon size={14} />
          PicoClaw Execution Engine
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsTerminalOpen(false)} className="text-[#0f0]/50 hover:text-[#0f0] transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1">
        {terminalLogs.map((log) => (
          <div key={log.id} className={`whitespace-pre-wrap
            ${log.type === 'error' || log.type === 'stderr' ? 'text-red-500' : 'text-[#0f0]'}
            ${log.type === 'info' ? 'opacity-70' : ''}
          `}>
            <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString()}]</span>
            {log.text}
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>
    </motion.div>
  );
}
