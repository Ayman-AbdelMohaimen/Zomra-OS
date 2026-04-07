import Editor from '@monaco-editor/react';
import { Save, Check, Loader2 } from 'lucide-react';
import { useZomraStore } from '../store/useZomraStore';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PicoClawTerminal from './PicoClawTerminal';

export default function CodeEditor() {
  const { activeFileHandle, activeFileContent, isTerminalOpen } = useZomraStore();
  const [content, setContent] = useState(activeFileContent);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setContent(activeFileContent);
  }, [activeFileContent]);

  const handleSave = async () => {
    if (!activeFileHandle) return;
    try {
      setIsSaving(true);
      const writable = await activeFileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("Save failed:", e);
      alert("Failed to save file. Check permissions.");
    } finally {
      setIsSaving(false);
    }
  };

  const language = activeFileHandle?.name.endsWith('.tsx') || activeFileHandle?.name.endsWith('.ts') ? 'typescript' : 
                   activeFileHandle?.name.endsWith('.css') ? 'css' :
                   activeFileHandle?.name.endsWith('.html') ? 'html' :
                   activeFileHandle?.name.endsWith('.json') ? 'json' : 'javascript';

  return (
    <div className="relative h-full w-full flex flex-col">
      <div className="flex-1 rounded-lg overflow-hidden border border-crisp-white/10 shadow-lg">
        <Editor
          height="100%"
          language={language}
          value={content}
          onChange={(val) => setContent(val || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'JetBrains Mono',
            wordWrap: 'on',
          }}
        />
      </div>
      
      <motion.button 
        onClick={handleSave}
        disabled={!activeFileHandle || isSaving}
        className={`absolute ${isTerminalOpen ? 'bottom-[270px]' : 'bottom-6'} right-6 p-4 rounded-full transition-all z-10 flex items-center justify-center
          ${activeFileHandle 
            ? 'bg-power-red text-crisp-white shadow-[0_0_15px_#CE1126] hover:bg-red-700 hover:scale-105 active:scale-95' 
            : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-600 shadow-none'}`}
      >
        {isSaving ? <Loader2 size={24} className="animate-spin" /> : 
         saved ? <Check size={24} /> : 
         <Save size={24} />}
      </motion.button>

      <AnimatePresence>
        {isTerminalOpen && <PicoClawTerminal />}
      </AnimatePresence>
    </div>
  );
}
