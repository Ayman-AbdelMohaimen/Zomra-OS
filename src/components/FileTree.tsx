import React, { useState } from 'react';
import { Folder, FolderOpen, FileCode, File } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useZomraStore } from '../store/useZomraStore';

export default function FileTree({ handle, depth = 0 }: { handle: any, depth?: number, key?: React.Key }) {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState<any[]>([]);
  const { setActiveFileHandle, setActiveFileContent, activeFileHandle } = useZomraStore();

  const toggleDir = async () => {
    if (!isOpen && children.length === 0) {
      try {
        const entries = [];
        for await (const entry of handle.values()) {
          entries.push(entry);
        }
        // Sort: directories first, then files alphabetically
        entries.sort((a, b) => {
          if (a.kind === b.kind) return a.name.localeCompare(b.name);
          return a.kind === 'directory' ? -1 : 1;
        });
        setChildren(entries);
      } catch (e) {
        console.error("Failed to read directory", e);
      }
    }
    setIsOpen(!isOpen);
  };

  const openFile = async () => {
    try {
      const file = await handle.getFile();
      const text = await file.text();
      setActiveFileHandle(handle);
      setActiveFileContent(text);
    } catch (e) {
      console.error("Error reading file", e);
    }
  };

  const isSelected = activeFileHandle?.name === handle.name;

  if (handle.kind === 'directory') {
    return (
      <div className="select-none">
        <div 
          className="flex items-center gap-2 p-1.5 rounded-md cursor-pointer text-sm hover:bg-current/10 transition-colors"
          style={{ paddingInlineStart: `${depth * 12 + 8}px` }}
          onClick={toggleDir}
        >
          {isOpen ? <FolderOpen size={14} className="text-eagle-gold shrink-0" /> : <Folder size={14} className="text-eagle-gold shrink-0" />}
          <span className="truncate font-medium">{handle.name}</span>
        </div>
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              {children.map(child => (
                <FileTree key={child.name} handle={child} depth={depth + 1} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // File Rendering
  const isCode = handle.name.match(/\.(tsx|ts|jsx|js|css|json|html|md)$/i);
  return (
    <div 
      className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer text-sm transition-colors ${isSelected ? 'bg-power-red/20 text-power-red' : 'hover:bg-current/10'}`}
      style={{ paddingInlineStart: `${depth * 12 + 8}px` }}
      onClick={openFile}
    >
      {isCode ? <FileCode size={14} className={isSelected ? "text-power-red shrink-0" : "text-eagle-gold shrink-0"} /> : <File size={14} className="text-current/70 shrink-0" />}
      <span className="truncate">{handle.name}</span>
    </div>
  );
}
