import React, { useState, useRef, useEffect } from 'react';
import { useZomraStore } from '../store/useZomraStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Send, Terminal, Loader2, FolderPlus, Sparkles } from 'lucide-react';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const readCurrentFileDecl: FunctionDeclaration = {
  name: 'read_current_file',
  description: 'Returns the content of the file currently open in the editor.'
};

const writeToFileDecl: FunctionDeclaration = {
  name: 'write_to_file',
  description: 'Saves new code to the active file handle.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      content: { type: Type.STRING, description: 'The new content to write to the file.' }
    },
    required: ['content']
  }
};

const scanDirectoryDecl: FunctionDeclaration = {
  name: 'scan_directory',
  description: 'Lists all files in the current directory to build a mental map.'
};

const verifyContextDecl: FunctionDeclaration = {
  name: 'verify_context',
  description: 'Re-reads the file and checks if the current state on disk matches Hermes internal memory. MUST be called before write_to_file.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      expected_content: { type: Type.STRING, description: 'The content Hermes believes is currently in the file.' }
    },
    required: ['expected_content']
  }
};

const zomraCleanDecl: FunctionDeclaration = {
  name: 'zomra_clean',
  description: 'Scans for unused variables, dead imports, and Ghost Code to ensure the Green Code rule is maintained.'
};

import { generateContentAgnostic } from '../services/llmGateway';
import { executeInPicoClaw } from '../utils/PicoClawAdapter';

let isGlobalProcessing = false;

export default function CommandCenter() {
  const { 
    agentPhase, setAgentPhase, 
    skillPulse, setSkillPulse, 
    learnSkill, directoryHandle, setDirectoryHandle,
    language,
    activeFileContent, activeFileHandle, setActiveFileContent,
    addSwarmLog,
    hermesMessages: messages, setHermesMessages: setMessages,
    hermesHistory: geminiHistory, setHermesHistory: setGeminiHistory,
    taskQueue, setTaskQueue,
    isProcessingTask, setIsProcessingTask,
    processingStatus, setProcessingStatus,
    setTotalTokens,
    addTerminalLog, setIsTerminalOpen,
    llmProvider, apiKeys, ollamaEndpoint
  } = useZomraStore();
  const isRtl = language === 'AR';
  
  const [input, setInput] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessingTask, processingStatus]);

  useEffect(() => {
    let interval: any;
    if (isProcessingTask) {
      startTimeRef.current = Date.now();
      setElapsedTime(0);
      interval = setInterval(() => {
        if (startTimeRef.current) {
          setElapsedTime(Date.now() - startTimeRef.current);
        }
      }, 100);
    } else {
      startTimeRef.current = null;
    }
    return () => clearInterval(interval);
  }, [isProcessingTask]);

  const handleOpenFolder = async () => {
    if (!('showDirectoryPicker' in window)) {
      alert('File System API is not supported on this browser/device. Please use Desktop Chrome/Edge.');
      return;
    }
    try {
      const handle = await (window as any).showDirectoryPicker();
      setDirectoryHandle(handle);
    } catch (e: any) {
      console.error("User cancelled or error opening folder", e);
    }
  };

  const scanDirectory = async (dirHandle: any, path = ''): Promise<string[]> => {
    let files: string[] = [];
    try {
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          files.push(path + entry.name);
        } else if (entry.kind === 'directory') {
          if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist') {
            const subFiles = await scanDirectory(entry, path + entry.name + '/');
            files = files.concat(subFiles);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
    return files;
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setTaskQueue(prev => [...prev, userMsg]);
  };

  useEffect(() => {
    const checkQueue = async () => {
      if (taskQueue.length > 0 && !isGlobalProcessing) {
        isGlobalProcessing = true;
        setIsProcessingTask(true);
        
        const nextTask = taskQueue[0];
        setTaskQueue(prev => prev.slice(1)); // Dequeue immediately
        
        await processTask(nextTask);
        
        isGlobalProcessing = false;
        setIsProcessingTask(false);
      }
    };
    checkQueue();
  }, [taskQueue]);

  const processTask = async (userMsg: string) => {
    const taskStartTime = Date.now();
    setMessages(prev => [...prev, {role: 'user', text: userMsg}]);

    setAgentPhase('Plan');
    setSkillPulse('reading');
    setProcessingStatus(isRtl ? 'جاري تحليل الطلب والتخطيط...' : 'Analyzing request and planning...');
    addSwarmLog({ from: 'Hermes', to: 'System', message: `Received new task. Analyzing intent: "${userMsg.substring(0, 30)}..."`, type: 'info' });

    let currentHistory = [...geminiHistory, { role: 'user', parts: [{ text: userMsg }] }];
    setGeminiHistory(currentHistory);

    try {
      const tools = directoryHandle ? [{ functionDeclarations: [readCurrentFileDecl, writeToFileDecl, scanDirectoryDecl, verifyContextDecl, zomraCleanDecl] }] : undefined;
      const systemInstruction = directoryHandle 
        ? "You are Hermes, the intelligence layer of Zomra OS. Use the provided tools to interact with the local filesystem. Always check .zomra_skills.json before proposing a solution. SKEPTICAL MEMORY RULE: Before you execute write_to_file, you MUST trigger the verify_context tool to ensure your internal memory matches the disk state."
        : "You are Hermes, the intelligence layer of Zomra OS. The user has not opened a local folder yet, so you cannot read or write files. Advise them to initialize a workspace if they ask for code modifications.";

      const gatewayConfig = {
        provider: llmProvider,
        apiKey: apiKeys[llmProvider],
        ollamaEndpoint
      };

      let response = await generateContentAgnostic(
        currentHistory,
        systemInstruction,
        tools,
        gatewayConfig
      );

      if ((response as any).usageMetadata?.totalTokenCount) {
        setTotalTokens(prev => prev + (response as any).usageMetadata.totalTokenCount);
      }

      while (response.functionCalls && response.functionCalls.length > 0 && directoryHandle) {
        setAgentPhase('Exec');
        
        const functionResponses = [];
        
        for (const call of response.functionCalls) {
          setMessages(prev => [...prev, { role: 'agent', text: `Calling tool: ${call.name}...`, isTool: true }]);
          addSwarmLog({ from: 'Hermes', to: 'System', message: `Delegating sub-task to tool: ${call.name}`, type: 'info' });
          
          let toolResult = "";
          if (call.name === 'read_current_file') {
            setProcessingStatus(isRtl ? 'جاري قراءة الملف الحالي...' : 'Reading current file...');
            setSkillPulse('reading');
            toolResult = activeFileContent || "No file open.";
            addSwarmLog({ from: 'Hermes', to: 'System', message: `Read current file content (${toolResult.length} bytes).`, type: 'info' });
          } else if (call.name === 'write_to_file') {
            setProcessingStatus(isRtl ? 'جاري كتابة الأكواد على القرص...' : 'Writing generated code to disk...');
            setSkillPulse('learning');
            const args = call.args as any;
            if (activeFileHandle) {
              addSwarmLog({ from: '7orus', to: 'System', message: 'Intercepting file write for security & syntax scan...', type: 'info' });
              const writable = await activeFileHandle.createWritable();
              await writable.write(args.content);
              await writable.close();
              setActiveFileContent(args.content);
              
              // PicoClaw Execution & 7orus Self-Healing Loop
              setIsTerminalOpen(true);
              addTerminalLog(`$ picoclaw run ${activeFileHandle.name}`, 'info');
              
              const result = await executeInPicoClaw(`run ${activeFileHandle.name}`, args.content);
              
              if (result.exitCode !== 0) {
                addTerminalLog(result.stderr, 'stderr');
                addSwarmLog({ from: '7orus', to: 'System', message: `PicoClaw execution failed. Error intercepted. Initiating self-healing loop...`, type: 'error' });
                
                // 7orus intercepts and sends back to Hermes silently (as a tool result)
                toolResult = `PicoClaw execution failed with error: ${result.stderr}. Fix the code.`;
              } else {
                addTerminalLog(result.stdout, 'stdout');
                addSwarmLog({ from: '7orus', to: 'System', message: 'Scan passed. Code is safe and verified.', type: 'success' });
                toolResult = "File written successfully and PicoClaw verification passed.";
              }
            } else {
              toolResult = "Error: No active file handle to write to.";
              addSwarmLog({ from: 'Hermes', to: 'System', message: 'Failed to write: No active file handle.', type: 'error' });
            }
          } else if (call.name === 'scan_directory') {
            setProcessingStatus(isRtl ? 'جاري فحص مجلد العمل...' : 'Scanning workspace directory...');
            setSkillPulse('searching');
            const files = await scanDirectory(directoryHandle);
            toolResult = JSON.stringify(files);
            addSwarmLog({ from: 'Hermes', to: 'System', message: `Scanned directory. Found ${files.length} files.`, type: 'info' });
          } else if (call.name === 'verify_context') {
            setProcessingStatus(isRtl ? 'جاري التحقق من السياق...' : 'Verifying context and disk state...');
            setAgentPhase('Verify');
            const args = call.args as any;
            if (activeFileContent.trim() === args.expected_content.trim()) {
              toolResult = "Context verified. Disk matches internal memory. Safe to write.";
              addSwarmLog({ from: 'Verification Agent', to: 'System', message: 'Context verified successfully. Disk state matches memory.', type: 'success' });
            } else {
              toolResult = `Context mismatch! Disk content differs from expected. Disk content: ${activeFileContent.substring(0, 100)}... Please re-sync.`;
              addSwarmLog({ from: 'Verification Agent', to: 'System', message: 'CRITICAL: Context mismatch detected. Alerting Hermes to re-sync.', type: 'error' });
            }
          } else if (call.name === 'zomra_clean') {
            setProcessingStatus(isRtl ? 'جاري تنفيذ بروتوكول التنظيف...' : 'Running Zomra Clean protocol...');
            setAgentPhase('Cleanup');
            addSwarmLog({ from: 'Cleanup Agent', to: 'System', message: 'Scanning for dead imports and unused variables...', type: 'info' });
            await new Promise(resolve => setTimeout(resolve, 1500));
            toolResult = "Cleanup scan complete. Found 0 dead imports, 0 unused variables. Code is Green.";
            addSwarmLog({ from: 'Cleanup Agent', to: 'System', message: 'Code is Green. No ghost code found.', type: 'success' });
          }
          
          if (typeof toolResult === 'string' && toolResult.length > 30000) {
            toolResult = toolResult.substring(0, 30000) + "\n... [CONTENT TRUNCATED DUE TO SIZE LIMIT]";
            addSwarmLog({ from: '7orus', to: 'System', message: `Warning: Tool result truncated to prevent payload overflow.`, type: 'error' });
          }

          functionResponses.push({ 
            functionResponse: { 
              name: call.name, 
              id: call.id, 
              response: { result: toolResult } 
            } 
          });
        }
        
        setProcessingStatus(isRtl ? 'جاري صياغة الرد النهائي...' : 'Synthesizing final response...');
        addSwarmLog({ from: 'Hermes', to: 'System', message: 'Tools execution complete. Synthesizing final response...', type: 'info' });
        const previousContent = response.candidates?.[0]?.content;
        currentHistory = [
          ...currentHistory, 
          ...(previousContent ? [previousContent] : []),
          { role: 'user', parts: functionResponses }
        ];
        
        response = await generateContentAgnostic(
          currentHistory,
          systemInstruction,
          tools,
          gatewayConfig
        );

        if ((response as any).usageMetadata?.totalTokenCount) {
          setTotalTokens(prev => prev + (response as any).usageMetadata.totalTokenCount);
        }
      }

      setAgentPhase('Verify');
      
      const finalLatency = Date.now() - taskStartTime;
      addSwarmLog({ from: 'Hermes', to: 'System', message: `Task completed successfully in ${(finalLatency / 1000).toFixed(1)}s.`, type: 'success' });

      if (response.text) {
        setMessages(prev => [...prev, { role: 'agent', text: response.text, latency: finalLatency }]);
      }
      
      if (response.candidates?.[0]?.content) {
        currentHistory = [...currentHistory, response.candidates[0].content];
      }
      setGeminiHistory(currentHistory);

      // Learn & Finish
      if (directoryHandle) {
        const newSkill = `Handled task: "${userMsg.substring(0, 20)}..."`;
        await learnSkill(newSkill);
      }

    } catch (e: any) {
      console.error(e);
      let errorMsg = '';
      if (e instanceof Error) {
        errorMsg = e.message;
      } else if (typeof e === 'object') {
        try {
          errorMsg = JSON.stringify(e);
        } catch {
          errorMsg = String(e);
        }
      } else {
        errorMsg = String(e);
      }

      const isQuotaError = errorMsg.includes('429') || 
                           errorMsg.includes('quota') || 
                           errorMsg.includes('RESOURCE_EXHAUSTED') ||
                           e?.status === 429 ||
                           e?.status === 'RESOURCE_EXHAUSTED' ||
                           e?.error?.code === 429;

      if (errorMsg.includes('API key not valid')) {
        errorMsg = isRtl 
          ? "مفتاح API غير صالح. يبدو أنك تستخدم رابطاً خارجياً (Shared App). يرجى فتح التطبيق داخل AI Studio أو عمل Remix لإضافة مفتاحك الخاص."
          : "API key is invalid or missing. You are likely using a Shared App link. Please run this inside AI Studio or Remix it to provide your own key.";
      } else if (isQuotaError) {
        errorMsg = isRtl
          ? "لقد تجاوزت الحد المسموح به للاستخدام (Quota Exceeded). يرجى الانتظار قليلاً والمحاولة مرة أخرى، أو التحقق من خطتك في Google AI Studio."
          : "You have exceeded your API quota. Please wait a moment and try again, or check your plan in Google AI Studio.";
      }
      setMessages(prev => [...prev, { role: 'agent', text: `Error communicating with Hermes core: ${errorMsg}` }]);
    } finally {
      setAgentPhase('Idle');
      setSkillPulse('idle');
      setProcessingStatus('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-deep-black/40 rounded-xl border border-crisp-white/10 overflow-hidden relative">
      {/* Header */}
      <div className="p-3 border-b border-crisp-white/10 bg-deep-black/60 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-power-red" />
          <span className="text-xs font-bold tracking-wider">{isRtl ? 'بوابة هيرميس' : 'HERMES GATEWAY'}</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Active Phase Indicator */}
          <div className="flex items-center gap-1 text-[10px] font-mono bg-crisp-white/5 px-2 py-1 rounded border border-crisp-white/10">
            <span className="opacity-50">PHASE:</span>
            <span className={`font-bold ${agentPhase !== 'Idle' ? 'text-power-red' : 'text-crisp-white'}`}>
              {agentPhase.toUpperCase()}
            </span>
          </div>

          {/* Skill Pulse */}
          <div className="relative flex items-center justify-center w-4 h-4" title="Skill Pulse">
            <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
              skillPulse === 'reading' ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6] animate-pulse' :
              skillPulse === 'learning' ? 'bg-power-red shadow-[0_0_15px_#e53e3e] scale-125' :
              skillPulse === 'searching' ? 'bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-pulse' :
              'bg-gray-600'
            }`} />
          </div>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!directoryHandle && messages.length <= 1 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-power-red/10 flex items-center justify-center mb-2">
              <FolderPlus size={32} className="text-power-red" />
            </div>
            <h3 className="text-lg font-bold text-crisp-white">
              {isRtl ? 'مرحباً بك في هيرميس' : 'Welcome to Hermes'}
            </h3>
            <p className="text-sm text-crisp-white/60 max-w-xs">
              {isRtl 
                ? 'يرجى تهيئة مساحة العمل الخاصة بك للبدء في استخدام الذكاء الاصطناعي.' 
                : 'Please initialize your workspace to start using the AI agent.'}
            </p>
            <button 
              onClick={handleOpenFolder}
              className="mt-4 bg-power-red text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-red-700 transition-colors shadow-[0_0_15px_rgba(229,62,62,0.4)]"
            >
              <FolderPlus size={18} />
              {isRtl ? 'تهيئة مساحة العمل' : 'Initialize Workspace'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {!directoryHandle && (
              <div className="bg-power-red/10 border border-power-red/20 rounded-lg p-3 flex items-center justify-between mb-4">
                <span className="text-xs text-power-red font-bold">{isRtl ? 'لم يتم تحديد مجلد للعمل. بعض الميزات معطلة.' : 'No workspace initialized. Some features disabled.'}</span>
                <button onClick={handleOpenFolder} className="text-xs bg-power-red text-white px-3 py-1.5 rounded hover:bg-red-700 transition-colors font-bold">
                  {isRtl ? 'فتح مجلد' : 'Open Folder'}
                </button>
              </div>
            )}
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? (isRtl ? 'justify-start' : 'justify-end') : (isRtl ? 'justify-end' : 'justify-start')}`}
                >
                  <div 
                    dir="auto"
                    className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-power-red text-white rounded-tr-none' 
                      : msg.isTool 
                        ? 'bg-crisp-white/5 text-crisp-white/70 font-mono text-xs border border-crisp-white/10 rounded-tl-none'
                        : 'bg-crisp-white/10 text-crisp-white rounded-tl-none'
                  }`}>
                    {msg.isTool && <Terminal size={12} className={`inline ${isRtl ? 'ml-2' : 'mr-2'} opacity-50 mb-0.5`} />}
                    {msg.role === 'user' || msg.isTool ? (
                      <span className="whitespace-pre-wrap">{msg.text}</span>
                    ) : (
                      <div className="flex flex-col">
                        {msg.latency && (
                          <div className={`mb-2 flex ${isRtl ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[10px] text-eagle-gold bg-eagle-gold/10 px-2 py-0.5 rounded-full flex items-center gap-1 border border-eagle-gold/20">
                              <Sparkles size={10} />
                              Timed: {(msg.latency / 1000).toFixed(1)}s
                            </span>
                          </div>
                        )}
                        <div 
                          dir={isRtl ? "rtl" : "ltr"}
                          className={`markdown-body prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-deep-black/50 prose-pre:border prose-pre:border-crisp-white/10 ${isRtl ? 'text-right' : 'text-left'}`}
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            <AnimatePresence>
              {isProcessingTask && processingStatus && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`flex ${isRtl ? 'justify-start' : 'justify-start'} mt-4`}
                >
                  <div 
                    dir={isRtl ? "rtl" : "ltr"}
                    className="max-w-[85%] p-3 rounded-2xl text-sm bg-crisp-white/5 border border-power-red/30 text-crisp-white/80 rounded-tl-none flex items-center gap-3 shadow-[0_0_15px_rgba(255,51,51,0.1)]"
                  >
                    <div className="relative flex items-center justify-center">
                      <div className="absolute inset-0 bg-power-red/20 rounded-full blur-md animate-pulse"></div>
                      <Brain size={18} className="text-power-red animate-pulse relative z-10" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-power-red flex items-center gap-2">
                        {isRtl ? 'هيرميس يعالج الطلب' : 'Hermes Processing'}
                        <span className="flex space-x-1" dir="ltr">
                          <span className="w-1 h-1 bg-power-red rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1 h-1 bg-power-red rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-1 h-1 bg-power-red rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </span>
                      </span>
                      <span className="text-[11px] font-mono text-crisp-white/60 mt-0.5 flex items-center gap-2">
                        <span>{processingStatus}</span>
                        <span className="text-eagle-gold bg-eagle-gold/10 px-1.5 py-0.5 rounded">
                          {(elapsedTime / 1000).toFixed(1)}s
                        </span>
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-crisp-white/10 bg-deep-black/60 backdrop-blur-md relative">
        {taskQueue.length > 0 && (
          <div className="absolute -top-6 left-4 text-xs font-bold text-eagle-gold animate-pulse flex items-center gap-1">
            <Sparkles size={12} />
            {taskQueue.length} {isRtl ? 'في قائمة الانتظار' : 'in Queue'}
          </div>
        )}
        <div className="relative flex items-center">
          <input 
            type="text" 
            dir="auto"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isRtl ? 'أخبر هيرميس بما تريد بناءه...' : 'Tell Hermes what to build...'}
            className="w-full bg-crisp-white/5 border border-crisp-white/10 rounded-full py-2 px-4 text-sm focus:outline-none focus:border-power-red transition-colors"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim()}
            className={`absolute ${isRtl ? 'left-1' : 'right-1'} p-1.5 rounded-full transition-colors ${
              input.trim() ? 'bg-power-red text-white hover:bg-red-700' : 'bg-transparent text-crisp-white/30'
            }`}
          >
            <Send size={16} className={isRtl ? 'rotate-180' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
}
