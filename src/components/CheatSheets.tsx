import React from 'react';
import { useZomraStore } from '../store/useZomraStore';
import { motion } from 'framer-motion';
import { X, BookOpen, Terminal, Sparkles, Brain, Wrench } from 'lucide-react';

interface CheatSheetsProps {
  onClose: () => void;
}

export default function CheatSheets({ onClose }: CheatSheetsProps) {
  const { language } = useZomraStore();
  const isRtl = language === 'AR';

  const sections = [
    {
      title: isRtl ? 'أوامر النظام (OS Commands)' : 'OS Commands',
      icon: <Terminal className="text-power-red" size={20} />,
      items: [
        { cmd: 'zomra --clean', desc: isRtl ? 'تنظيف الكود الميت والملفات غير المستخدمة' : 'Clean dead code and unused files' },
        { cmd: 'zomra --verify', desc: isRtl ? 'التحقق من صحة الكود واختبار التراجعات' : 'Verify code health and test regressions' },
        { cmd: 'zomra --sync', desc: isRtl ? 'مزامنة حالة السرب مع العقد الأخرى' : 'Sync swarm state with other nodes' },
      ]
    },
    {
      title: isRtl ? 'نصائح Vibe-Coding' : 'Vibe-Coding Tips',
      icon: <Sparkles className="text-eagle-gold" size={20} />,
      items: [
        { cmd: 'Green Code', desc: isRtl ? 'اكتب كوداً مستداماً، قلل من إعادة التصيير (Re-renders)' : 'Write sustainable code, minimize re-renders' },
        { cmd: 'Glassmorphism', desc: isRtl ? 'استخدم bg-white/5 مع backdrop-blur-md للشفافية' : 'Use bg-white/5 with backdrop-blur-md for glass effect' },
        { cmd: 'Micro-interactions', desc: isRtl ? 'أضف حركات بسيطة باستخدام framer-motion' : 'Add subtle animations using framer-motion' },
      ]
    },
    {
      title: isRtl ? 'اختصارات هيرميس' : 'Hermes Shortcuts',
      icon: <Brain className="text-power-red" size={20} />,
      items: [
        { cmd: '@learn', desc: isRtl ? 'إجبار هيرميس على حفظ المهارة الحالية في .zomra_skills.json' : 'Force Hermes to save current skill to .zomra_skills.json' },
        { cmd: '@recall', desc: isRtl ? 'استرجاع المهارات السابقة قبل البدء بمهمة جديدة' : 'Recall previous skills before starting a new task' },
        { cmd: '@explain', desc: isRtl ? 'شرح الكود المحدد بالتفصيل' : 'Explain the selected code in detail' },
      ]
    },
    {
      title: isRtl ? 'أدوات هيرميس (Tools)' : 'Hermes Tools',
      icon: <Wrench className="text-eagle-gold" size={20} />,
      items: [
        { cmd: 'read_current_file()', desc: isRtl ? 'قراءة محتوى الملف المفتوح حالياً' : 'Read the content of the currently open file' },
        { cmd: 'write_to_file(content)', desc: isRtl ? 'كتابة الكود الجديد في الملف المفتوح' : 'Write new code to the open file' },
        { cmd: 'scan_directory()', desc: isRtl ? 'قراءة محتويات مجلد المشروع لبناء خريطة ذهنية' : 'Scan project directory to build a mental map' },
      ]
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-deep-black/80 backdrop-blur-sm"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-deep-black border border-power-red/30 rounded-2xl shadow-[0_0_40px_rgba(229,62,62,0.15)] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-crisp-white/10 bg-gradient-to-r from-power-red/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-power-red/20 flex items-center justify-center border border-power-red/50">
              <BookOpen className="text-power-red" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-crisp-white tracking-wide">
                {isRtl ? 'كتاب تعاويذ زُمرة' : 'Zomra Grimoire'}
              </h2>
              <p className="text-xs text-eagle-gold">
                {isRtl ? 'دليل الاختصارات والأدوات (CheatSheets)' : 'Shortcuts & Tools Reference'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-crisp-white/50 hover:text-power-red hover:bg-power-red/10 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sections.map((section, idx) => (
              <div key={idx} className="bg-crisp-white/5 border border-crisp-white/10 rounded-xl p-5 hover:border-power-red/30 transition-colors group">
                <div className="flex items-center gap-2 mb-4">
                  {section.icon}
                  <h3 className="font-bold text-crisp-white">{section.title}</h3>
                </div>
                <div className="space-y-3">
                  {section.items.map((item, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <code className="text-xs font-mono text-power-red bg-power-red/10 px-2 py-1 rounded w-fit border border-power-red/20">
                        {item.cmd}
                      </code>
                      <p className="text-sm text-crisp-white/70 pl-2 border-l-2 border-crisp-white/10 group-hover:border-eagle-gold/50 transition-colors">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
