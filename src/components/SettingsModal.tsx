import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Key, Brain, Database, Lock } from 'lucide-react';
import { useZomraStore } from '../store/useZomraStore';
import { LLMProvider } from '../services/llmGateway';

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const { 
    language, 
    isLicenseEnforced, setIsLicenseEnforced,
    llmProvider, setLlmProvider,
    apiKeys, setApiKey,
    ollamaEndpoint, setOllamaEndpoint
  } = useZomraStore();
  const isRtl = language === 'AR';
  const [activeTab, setActiveTab] = useState<'general' | 'ai'>('general');

  return (
    <div className="fixed inset-0 z-[9999] bg-deep-black/80 backdrop-blur-sm flex items-center justify-center p-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-deep-black border border-crisp-white/10 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="flex justify-between items-center p-4 border-b border-crisp-white/10 bg-crisp-white/5 shrink-0">
          <h2 className="text-lg font-bold text-crisp-white flex items-center gap-2">
            <Shield className="text-power-red" size={20} />
            {isRtl ? 'إعدادات النظام' : 'System Settings'}
          </h2>
          <button onClick={onClose} className="text-crisp-white/50 hover:text-power-red transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-48 border-b md:border-b-0 md:border-e border-crisp-white/10 bg-crisp-white/5 flex flex-row md:flex-col p-2 shrink-0 overflow-x-auto gap-2">
            <button 
              onClick={() => setActiveTab('general')}
              className={`p-3 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'general' ? 'bg-power-red text-white' : 'text-crisp-white/60 hover:bg-crisp-white/10'}`}
            >
              <Shield size={16} />
              {isRtl ? 'عام' : 'General'}
            </button>
            <button 
              onClick={() => setActiveTab('ai')}
              className={`p-3 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'ai' ? 'bg-power-red text-white' : 'text-crisp-white/60 hover:bg-crisp-white/10'}`}
            >
              <Brain size={16} />
              {isRtl ? 'نماذج الذكاء' : 'AI Models'}
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'general' ? (
                <motion.div 
                  key="general"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-crisp-white flex items-center gap-2">
                        <Key size={16} className="text-eagle-gold" />
                        {isRtl ? 'فرض مفتاح الترخيص' : 'Enforce License Key'}
                      </h3>
                      <p className="text-xs text-crisp-white/50 mt-1 max-w-[250px]">
                        {isRtl 
                          ? 'تفعيل أو إيقاف شاشة الترخيص الإجبارية للمستخدمين.' 
                          : 'Enable or disable the mandatory license screen for users.'}
                      </p>
                    </div>
                    <button 
                      onClick={() => setIsLicenseEnforced(!isLicenseEnforced)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isLicenseEnforced ? 'bg-power-red' : 'bg-crisp-white/20'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isLicenseEnforced ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  
                  <div className="bg-power-red/10 border border-power-red/20 rounded-lg p-3 text-xs text-power-red/80">
                    {isRtl 
                      ? 'ملاحظة: عند نشر المشروع كـ Open Source على GitHub، يمكنك إيقاف هذا الخيار مؤقتاً، أو تركه مفعلاً لبيع التراخيص.' 
                      : 'Note: When publishing as Open Source on GitHub, you can disable this temporarily, or leave it enabled to sell licenses.'}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="ai"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-sm font-bold text-crisp-white mb-4 flex items-center gap-2">
                      <Database size={16} className="text-eagle-gold" />
                      {isRtl ? 'مزود الذكاء الاصطناعي (LLM Provider)' : 'LLM Provider'}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {(['gemini', 'openai', 'anthropic', 'ollama'] as LLMProvider[]).map((provider) => (
                        <button
                          key={provider}
                          onClick={() => setLlmProvider(provider)}
                          className={`p-3 rounded-xl border text-sm font-bold transition-all ${llmProvider === provider ? 'border-power-red bg-power-red/10 text-power-red' : 'border-crisp-white/10 bg-crisp-white/5 text-crisp-white/60 hover:border-crisp-white/30'}`}
                        >
                          {provider.charAt(0).toUpperCase() + provider.slice(1)}
                          {provider === 'ollama' && <span className="block text-[10px] opacity-70 font-normal mt-1">Local (Gemma 2B)</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-crisp-white/10">
                    <h3 className="text-sm font-bold text-crisp-white flex items-center gap-2">
                      <Lock size={16} className="text-power-red" />
                      {isRtl ? 'مفاتيح الربط (API Keys)' : 'API Keys'}
                    </h3>
                    <p className="text-[10px] text-crisp-white/40 mb-4">
                      {isRtl ? 'يتم تشفير المفاتيح وحفظها محلياً في متصفحك فقط.' : 'Keys are encrypted and stored locally in your browser only.'}
                    </p>

                    {llmProvider !== 'ollama' ? (
                      <div className="space-y-2">
                        <label className="text-xs text-crisp-white/70">
                          {llmProvider.charAt(0).toUpperCase() + llmProvider.slice(1)} API Key
                        </label>
                        <input 
                          type="password"
                          value={apiKeys[llmProvider] || ''}
                          onChange={(e) => setApiKey(llmProvider, e.target.value)}
                          placeholder="sk-..."
                          className="w-full bg-deep-black border border-crisp-white/20 rounded-lg px-3 py-2 text-sm text-crisp-white focus:outline-none focus:border-power-red"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-xs text-crisp-white/70">
                          {isRtl ? 'رابط Ollama المحلي' : 'Ollama Local Endpoint'}
                        </label>
                        <input 
                          type="text"
                          value={ollamaEndpoint}
                          onChange={(e) => setOllamaEndpoint(e.target.value)}
                          placeholder="http://localhost:11434"
                          className="w-full bg-deep-black border border-crisp-white/20 rounded-lg px-3 py-2 text-sm text-crisp-white focus:outline-none focus:border-power-red"
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
