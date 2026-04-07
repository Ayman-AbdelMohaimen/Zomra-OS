import React, { useState, useEffect } from 'react';
import { FileCode, Activity, FolderOpen, Sparkles, Map, Play, ShieldCheck, FolderPlus, X, AlertCircle, LogIn, LogOut, User as UserIcon, Brain, BookOpen, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeSwitcher from './ThemeSwitcher';
import LangSwitcher from './LangSwitcher';
import FileTree from './FileTree';
import CommandCenter from './CommandCenter';
import CheatSheets from './CheatSheets';
import SettingsModal from './SettingsModal';
import { useZomraStore } from '../store/useZomraStore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, getDoc, doc, setDoc } from 'firebase/firestore';

import SwarmGraph from './SwarmGraph';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { 
    language, setLanguage, theme, setTheme, 
    directoryHandle, setDirectoryHandle, 
    user, isAuthReady, 
    agentPhase, skillPulse, 
    swarmLogs, addSwarmLog 
  } = useZomraStore();
  const isRtl = language === 'AR';
  
  const [isMobileExplorerOpen, setIsMobileExplorerOpen] = useState(false);
  const [isMobileRightPanelOpen, setIsMobileRightPanelOpen] = useState(false);
  const [isCheatSheetsOpen, setIsCheatSheetsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [rightTab, setRightTab] = useState<'hermes' | 'swarm'>('hermes');

  // 7orus Background Agent
  useEffect(() => {
    if (!directoryHandle) return;

    let isScanning = false;
    let scanInterval: any;

    const run7orusScan = async () => {
      if (isScanning) return;
      isScanning = true;
      
      try {
        addSwarmLog({ from: '7orus', to: 'System', message: 'Scanning dependencies...', type: 'info' });
        
        // Simulate a deep scan of the directory to build dependency graph
        const scanDir = async (dirHandle: any, path = '') => {
          let fileCount = 0;
          for await (const entry of dirHandle.values()) {
            if (entry.kind === 'file' && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js'))) {
              fileCount++;
            } else if (entry.kind === 'directory' && !['node_modules', '.git', 'dist'].includes(entry.name)) {
              fileCount += await scanDir(entry, path + entry.name + '/');
            }
          }
          return fileCount;
        };

        const count = await scanDir(directoryHandle);
        
        // Write to .zomra_graph.json
        const fileHandle = await directoryHandle.getFileHandle('.zomra_graph.json', { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify({ lastScan: Date.now(), filesAnalyzed: count, status: 'healthy' }, null, 2));
        await writable.close();

        addSwarmLog({ from: 'Verification Agent', to: 'System', message: `Codebase health 98%. Analyzed ${count} files.`, type: 'success' });
      } catch (e) {
        console.error("7orus Scan Error", e);
        addSwarmLog({ from: '7orus', to: 'System', message: 'Scan failed or interrupted.', type: 'error' });
      } finally {
        isScanning = false;
      }
    };

    // Run initial scan after a short delay
    const initialTimer = setTimeout(run7orusScan, 5000);
    
    // Run periodically every 2 minutes if idle (simulated)
    scanInterval = setInterval(run7orusScan, 120000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(scanInterval);
    };
  }, [directoryHandle]);

  // Auth Handlers
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Check if user document exists, if not create it
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          email: result.user.email,
          role: 'user'
        });
      }
    } catch (error) {
      console.error("Login failed", error);
      setToastMsg(isRtl ? 'فشل تسجيل الدخول' : 'Login failed');
      setTimeout(() => setToastMsg(''), 5000);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const iconVariants = {
    hover: { scale: 1.1, color: '#C09307' },
    tap: { scale: 0.9 }
  };

  const renderSwarmMonitor = () => (
    <div className="h-full flex flex-col">
      <div className="text-xs text-current/50 mb-4 flex items-center justify-between font-bold tracking-wider">
        <div className="flex items-center gap-2">
          <Activity size={14} /> {isRtl ? 'مراقب السرب' : 'SWARM MONITOR'}
        </div>
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
          {/* Nodes Graph */}
          <div className="h-[40%] min-h-[200px] mb-4">
            <SwarmGraph />
          </div>

          {/* Swarm Logs */}
          <div className="flex-1 flex flex-col border-t border-crisp-white/10 pt-4 overflow-hidden">
            <div className="text-[10px] text-current/50 mb-3 font-bold tracking-wider shrink-0">
              {isRtl ? 'سجل العمليات الخلفية (Agent Chat)' : 'BACKGROUND TASKS LOG (Agent Chat)'}
            </div>
            <div className="space-y-2 overflow-y-auto flex-1 pe-2 pb-4">
              <AnimatePresence>
                {swarmLogs.map(log => (
                  <motion.div 
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs font-mono bg-crisp-white/5 p-3 rounded-lg border border-crisp-white/10 flex flex-col gap-1.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-eagle-gold font-bold flex items-center gap-1.5">
                        {log.from === 'Hermes' && <Brain size={12} />}
                        {log.from === '7orus' && <ShieldCheck size={12} />}
                        {log.from === 'Cleanup Agent' && <Sparkles size={12} />}
                        {log.from}
                      </span>
                      <span className="text-[9px] text-crisp-white/30">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <span className="text-crisp-white/80 leading-relaxed">{log.message}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {swarmLogs.length === 0 && (
                <div className="text-xs text-current/40 text-center py-4">
                  {isRtl ? 'لا توجد عمليات حالية' : 'No active background tasks'}
                </div>
              )}
            </div>
          </div>
      </div>
    </div>
  );

  const handleOpenFolder = async () => {
    if (window.self !== window.top) {
      setToastMsg(isRtl ? 'يرجى فتح التطبيق في نافذة جديدة (New Tab) للوصول إلى ملفات جهازك.' : 'Please open the app in a new tab to access local files.');
      setTimeout(() => setToastMsg(''), 5000);
      return;
    }

    if (!('showDirectoryPicker' in window)) {
      setToastMsg(isRtl ? 'عذراً، متصفحك أو الموبايل لا يدعم File System API. يرجى فتحه على كمبيوتر (Chrome/Edge).' : 'File System API is not supported on this browser/device. Please use Desktop Chrome/Edge.');
      setTimeout(() => setToastMsg(''), 5000);
      return;
    }
    
    try {
      const handle = await (window as any).showDirectoryPicker();
      setDirectoryHandle(handle);
      setIsMobileExplorerOpen(false);
    } catch (e: any) {
      console.error("User cancelled or error opening folder", e);
      if (e.name !== 'AbortError') {
        setToastMsg(isRtl ? 'حدث خطأ أثناء فتح المجلد.' : 'Error opening folder.');
        setTimeout(() => setToastMsg(''), 5000);
      }
    }
  };

  return (
    <div 
      dir={isRtl ? 'rtl' : 'ltr'} 
      className={`flex h-screen w-full ${theme === 'Dark' ? 'bg-deep-black text-crisp-white' : 'bg-gray-100 text-deep-black'} overflow-hidden transition-colors duration-500`}
    >
      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-power-red text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm max-w-[90vw] text-center"
          >
            <AlertCircle size={16} />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Explorer Drawer */}
      <AnimatePresence>
        {isMobileExplorerOpen && (
          <motion.div 
            initial={{ x: isRtl ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: isRtl ? '100%' : '-100%' }}
            className={`fixed inset-y-0 ${isRtl ? 'right-0' : 'left-0'} w-64 bg-deep-black/95 backdrop-blur-3xl border-${isRtl ? 'l' : 'r'} border-crisp-white/10 z-[60] p-4 flex flex-col shadow-2xl`}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="text-sm font-bold flex items-center gap-2 text-crisp-white">
                <FolderOpen size={16} className="text-eagle-gold" />
                {isRtl ? 'المستكشف' : 'Explorer'}
              </div>
              <button onClick={() => setIsMobileExplorerOpen(false)} className="text-crisp-white/50 hover:text-power-red">
                <X size={20} />
              </button>
            </div>
            <button 
              onClick={handleOpenFolder}
              className="w-full py-2 mb-4 bg-power-red/20 text-power-red border border-power-red/50 rounded-lg flex items-center justify-center gap-2 hover:bg-power-red hover:text-white transition-colors text-sm font-bold"
            >
              <FolderPlus size={16} />
              {isRtl ? 'فتح مجلد' : 'Open Folder'}
            </button>
            <div className="flex-1 overflow-y-auto">
              {directoryHandle ? (
                <FileTree handle={directoryHandle} />
              ) : (
                <div className="text-xs text-current/40 text-center mt-10 border border-dashed border-current/20 p-4 rounded-lg">
                  {isRtl ? 'اضغط على فتح مجلد لاختيار مشروعك' : 'Click Open Folder to select a project'}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Right Drawer (Hermes & Swarm) */}
      <AnimatePresence>
        {isMobileRightPanelOpen && (
          <motion.div 
            initial={{ x: isRtl ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: isRtl ? '-100%' : '100%' }}
            className={`fixed inset-y-0 ${isRtl ? 'left-0' : 'right-0'} w-full bg-deep-black/95 backdrop-blur-3xl border-${isRtl ? 'r' : 'l'} border-crisp-white/10 z-[60] flex flex-col shadow-2xl`}
          >
            <div className="flex justify-between items-center p-4 border-b border-crisp-white/10">
              <div className="text-sm font-bold flex items-center gap-2 text-crisp-white">
                <Brain size={16} className="text-power-red" />
                {isRtl ? 'الذكاء والسرب' : 'Intelligence & Swarm'}
              </div>
              <button onClick={() => setIsMobileRightPanelOpen(false)} className="text-crisp-white/50 hover:text-power-red">
                <X size={20} />
              </button>
            </div>
            {/* Tabs */}
            <div className="flex border-b border-crisp-white/10">
              <button 
                onClick={() => setRightTab('hermes')} 
                className={`flex-1 p-4 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${rightTab === 'hermes' ? 'text-power-red border-b-2 border-power-red bg-power-red/5' : 'text-current/50 hover:bg-crisp-white/5'}`}
              >
                <Brain size={14} /> HERMES
              </button>
              <button 
                onClick={() => setRightTab('swarm')} 
                className={`flex-1 p-4 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${rightTab === 'swarm' ? 'text-power-red border-b-2 border-power-red bg-power-red/5' : 'text-current/50 hover:bg-crisp-white/5'}`}
              >
                <Activity size={14} /> SWARM
              </button>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-hidden p-4">
              {rightTab === 'hermes' ? <CommandCenter /> : renderSwarmMonitor()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (Explorer) */}
      <aside className="hidden md:flex w-64 border-e border-crisp-white/10 p-4 flex-col glassmorphism z-10">
        <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 flex items-center justify-center">
                <img src="/logo.png" alt="7orus Logo" className="w-full h-full object-contain drop-shadow-[0_0_8px_#C09307]" onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://api.iconify.design/lucide:eye.svg?color=%23C09307';
                }} />
            </div>
            <h1 className="text-xl font-bold tracking-tighter text-crisp-white drop-shadow-[0_0_8px_#C09307]">ZOMRA</h1>
        </div>
        <nav className="flex-1 flex flex-col overflow-hidden">
            <div className="text-xs text-current/50 mb-4 flex items-center justify-between font-bold tracking-wider">
              <div className="flex items-center gap-2">
                <FolderOpen size={14} /> {isRtl ? 'المستكشف' : 'EXPLORER'}
              </div>
            </div>
            <button 
              onClick={handleOpenFolder}
              className="w-full py-2 mb-4 bg-power-red/20 text-power-red border border-power-red/50 rounded-lg flex items-center justify-center gap-2 hover:bg-power-red hover:text-white transition-colors text-sm font-bold"
            >
              <FolderPlus size={16} />
              {isRtl ? 'فتح مجلد' : 'Open Folder'}
            </button>
            <div className="flex-1 overflow-y-auto -mx-2 px-2">
                {directoryHandle ? (
                  <FileTree handle={directoryHandle} />
                ) : (
                  <div className="text-xs text-current/40 text-center mt-10 border border-dashed border-current/20 p-4 rounded-lg">
                    {isRtl ? 'اضغط على فتح مجلد لاختيار مشروعك' : 'Click Open Folder to select a project'}
                  </div>
                )}
            </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-0">
        {/* Header */}
        <header className="h-16 border-b-2 border-power-red flex items-center justify-between px-4 md:px-6 glassmorphism">
            <div className="text-sm font-bold flex items-center gap-2">
              <button className="md:hidden p-2 text-eagle-gold hover:bg-white/5 rounded-lg" onClick={() => setIsMobileExplorerOpen(true)}>
                <FolderOpen size={20} />
              </button>
              <button 
                className={`md:hidden p-2 rounded-lg transition-colors ${
                  skillPulse === 'learning' ? 'text-power-red bg-power-red/10 animate-pulse' : 
                  skillPulse === 'searching' ? 'text-cyan-400 bg-cyan-400/10 animate-pulse' : 
                  agentPhase !== 'Idle' ? 'text-power-red bg-power-red/5' : 'text-power-red hover:bg-white/5'
                }`} 
                onClick={() => setIsMobileRightPanelOpen(true)}
              >
                <Brain size={20} />
              </button>
              <div 
                className={`hidden md:flex items-center justify-center p-2 rounded-lg transition-colors ${
                  skillPulse === 'learning' ? 'text-power-red bg-power-red/10 animate-pulse' : 
                  skillPulse === 'searching' ? 'text-cyan-400 bg-cyan-400/10 animate-pulse' : 
                  agentPhase !== 'Idle' ? 'text-power-red bg-power-red/5' : 'text-power-red'
                }`}
              >
                <Brain size={20} />
              </div>
              <span className="hidden md:inline ml-2">{isRtl ? 'لوحة القيادة' : 'Dashboard'}</span>
            </div>
            <div className="flex gap-2 md:gap-4 items-center">
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="text-xs text-eagle-gold hover:text-yellow-400 font-bold flex items-center gap-1 transition-colors p-2 rounded-lg hover:bg-white/5"
                  title={isRtl ? 'الإعدادات' : 'Settings'}
                >
                  <Settings size={18} />
                  <span className="hidden md:inline">{isRtl ? 'الإعدادات' : 'Settings'}</span>
                </button>
                <button 
                  onClick={() => setIsCheatSheetsOpen(true)}
                  className="text-xs text-eagle-gold hover:text-yellow-400 font-bold flex items-center gap-1 transition-colors p-2 rounded-lg hover:bg-white/5"
                  title={isRtl ? 'كتاب التعاويذ' : 'CheatSheets'}
                >
                  <BookOpen size={18} />
                  <span className="hidden md:inline">{isRtl ? 'التعاويذ' : 'Grimoire'}</span>
                </button>
                {user ? (
                  <div className="flex items-center gap-2">
                    <img src={user.photoURL || ''} alt="User" className="w-6 h-6 rounded-full border border-power-red" />
                    <button onClick={handleLogout} className="text-xs text-power-red hover:text-red-400 font-bold flex items-center gap-1">
                      <LogOut size={14} />
                      <span className="hidden md:inline">{isRtl ? 'خروج' : 'Logout'}</span>
                    </button>
                  </div>
                ) : (
                  <button onClick={handleLogin} className="text-xs bg-power-red text-white px-3 py-1.5 rounded-full font-bold flex items-center gap-1 hover:bg-red-700 transition-colors">
                    <LogIn size={14} />
                    {isRtl ? 'دخول' : 'Login'}
                  </button>
                )}
                <LangSwitcher language={language} onToggle={setLanguage} />
                <ThemeSwitcher theme={theme} onToggle={setTheme} />
            </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 relative">
            {/* Subtle Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-power-red/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="relative z-10 h-full">
              {children}
            </div>
        </div>
      </main>

      {/* Desktop Right Sidebar (Command Center & Swarm) */}
      <aside className="hidden lg:flex w-96 border-s border-crisp-white/10 flex-col glassmorphism z-10 bg-deep-black/40">
        {/* Tabs */}
        <div className="flex border-b border-crisp-white/10">
          <button 
            onClick={() => setRightTab('hermes')} 
            className={`flex-1 p-4 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${rightTab === 'hermes' ? 'text-power-red border-b-2 border-power-red bg-power-red/5' : 'text-current/50 hover:bg-crisp-white/5'}`}
          >
            <Brain size={14} /> HERMES
          </button>
          <button 
            onClick={() => setRightTab('swarm')} 
            className={`flex-1 p-4 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${rightTab === 'swarm' ? 'text-power-red border-b-2 border-power-red bg-power-red/5' : 'text-current/50 hover:bg-crisp-white/5'}`}
          >
            <Activity size={14} /> SWARM
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden p-4">
          {rightTab === 'hermes' ? (
            <CommandCenter />
          ) : (
            renderSwarmMonitor()
          )}
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-deep-black/60 backdrop-blur-2xl border-t border-crisp-white/10 flex justify-around p-2 pb-safe z-50">
        <NavItem icon={<Sparkles size={20} />} label={isRtl ? 'تنظيف' : 'Cleanup'} variants={iconVariants} active={agentPhase === 'Cleanup'} onClick={() => { setRightTab('hermes'); setIsMobileRightPanelOpen(true); }} />
        <NavItem icon={<Map size={20} />} label={isRtl ? 'تخطيط' : 'Plan'} variants={iconVariants} active={agentPhase === 'Plan'} onClick={() => { setRightTab('hermes'); setIsMobileRightPanelOpen(true); }} />
        <NavItem icon={<Play size={20} />} label={isRtl ? 'تنفيذ' : 'Exec'} variants={iconVariants} active={agentPhase === 'Exec'} onClick={() => { setRightTab('hermes'); setIsMobileRightPanelOpen(true); }} />
        <NavItem icon={<ShieldCheck size={20} />} label={isRtl ? 'تحقق' : 'Verify'} variants={iconVariants} active={agentPhase === 'Verify'} onClick={() => { setRightTab('hermes'); setIsMobileRightPanelOpen(true); }} />
      </nav>

      <AnimatePresence>
        {isCheatSheetsOpen && <CheatSheets onClose={() => setIsCheatSheetsOpen(false)} />}
        {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ icon, label, variants, active = false, onClick }: { icon: React.ReactNode, label: string, variants: any, active?: boolean, onClick?: () => void }) {
  return (
    <motion.div 
      variants={variants} 
      whileHover="hover" 
      whileTap="tap" 
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-2 cursor-pointer transition-colors ${active ? 'text-power-red' : 'text-crisp-white/70 hover:text-power-red'}`}
    >
      {icon}
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </motion.div>
  );
}
