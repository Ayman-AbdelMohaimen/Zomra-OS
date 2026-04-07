import { create } from 'zustand';
import { User } from 'firebase/auth';
import { LLMProvider } from '../services/llmGateway';

export type SwarmLog = {
  id: string;
  from: string;
  to: string;
  message: string;
  timestamp: number;
  type: 'info' | 'error' | 'success';
};

export type AgentPhase = 'Idle' | 'Cleanup' | 'Plan' | 'Exec' | 'Verify';
export type SkillPulseState = 'idle' | 'reading' | 'learning' | 'searching';

interface ZomraState {
  // Original requirements
  isProcessing: boolean;
  swarmLogs: SwarmLog[];
  activeModel: string;
  terminalOutput: string;
  
  // AppContext state
  language: 'EN' | 'AR';
  theme: 'Light' | 'Dark';
  isLicensed: boolean;
  isLicenseEnforced: boolean;
  llmProvider: LLMProvider;
  apiKeys: Record<string, string>;
  ollamaEndpoint: string;
  directoryHandle: any | null;
  activeFileHandle: any | null;
  activeFileContent: string;
  user: User | null;
  isAuthReady: boolean;
  agentPhase: AgentPhase;
  skillPulse: SkillPulseState;
  skills: string[];
  hermesMessages: {role: 'user'|'agent', text: string, isTool?: boolean, latency?: number}[];
  hermesHistory: any[];
  taskQueue: string[];
  isProcessingTask: boolean;
  processingStatus: string;
  totalTokens: number;
  terminalLogs: { id: string, text: string, type: 'info' | 'error' | 'success' | 'stdout' | 'stderr' }[];
  isTerminalOpen: boolean;

  // Actions
  setIsProcessing: (isProcessing: boolean) => void;
  addSwarmLog: (log: Omit<SwarmLog, 'id' | 'timestamp'>) => void;
  setActiveModel: (model: string) => void;
  appendTerminalOutput: (output: string) => void;
  clearTerminalOutput: () => void;
  
  // Setters for AppContext state
  setLanguage: (lang: 'EN' | 'AR') => void;
  setTheme: (theme: 'Light' | 'Dark') => void;
  setIsLicensed: (isLicensed: boolean) => void;
  setIsLicenseEnforced: (enforce: boolean) => void;
  setLlmProvider: (provider: LLMProvider) => void;
  setApiKey: (provider: string, key: string) => void;
  setOllamaEndpoint: (endpoint: string) => void;
  setDirectoryHandle: (handle: any | null) => void;
  setActiveFileHandle: (handle: any | null) => void;
  setActiveFileContent: (content: string) => void;
  setUser: (user: User | null) => void;
  setIsAuthReady: (isAuthReady: boolean) => void;
  setAgentPhase: (phase: AgentPhase) => void;
  setSkillPulse: (state: SkillPulseState) => void;
  setSkills: (skills: string[]) => void;
  learnSkill: (skill: string) => Promise<void>;
  setHermesMessages: (messages: any | ((prev: any) => any)) => void;
  setHermesHistory: (history: any | ((prev: any) => any)) => void;
  setTaskQueue: (queue: string[] | ((prev: string[]) => string[])) => void;
  setIsProcessingTask: (isProcessing: boolean | ((prev: boolean) => boolean)) => void;
  setProcessingStatus: (status: string | ((prev: string) => string)) => void;
  setTotalTokens: (tokens: number | ((prev: number) => number)) => void;
  addTerminalLog: (text: string, type?: 'info' | 'error' | 'success' | 'stdout' | 'stderr') => void;
  setIsTerminalOpen: (isOpen: boolean) => void;
}

export const useZomraStore = create<ZomraState>((set, get) => ({
  isProcessing: false,
  swarmLogs: [],
  activeModel: 'gemini-3.1-pro-preview',
  terminalOutput: '',
  language: 'EN',
  theme: 'Dark',
  isLicensed: false,
  isLicenseEnforced: false,
  llmProvider: 'gemini',
  apiKeys: {},
  ollamaEndpoint: 'http://localhost:11434',
  directoryHandle: null,
  activeFileHandle: null,
  activeFileContent: '// Zomra OS Editor\n// Open a folder to start editing files.',
  user: null,
  isAuthReady: false,
  agentPhase: 'Idle',
  skillPulse: 'idle',
  skills: [],
  hermesMessages: [{role: 'agent', text: 'Hermes Intelligence Layer initialized. Awaiting instructions.'}],
  hermesHistory: [],
  taskQueue: [],
  isProcessingTask: false,
  processingStatus: '',
  totalTokens: 0,
  terminalLogs: [],
  isTerminalOpen: false,

  setIsProcessing: (isProcessing) => set({ isProcessing }),
  addSwarmLog: (log) => set((state) => ({
    swarmLogs: [
      { 
        ...log, 
        id: Math.random().toString(36).substring(7), 
        timestamp: Date.now() 
      }, 
      ...state.swarmLogs
    ].slice(0, 100)
  })),
  setActiveModel: (activeModel) => set({ activeModel }),
  appendTerminalOutput: (output) => set((state) => ({
    terminalOutput: state.terminalOutput + output
  })),
  clearTerminalOutput: () => set({ terminalOutput: '' }),
  setLanguage: (language) => set({ language }),
  setTheme: (theme) => set({ theme }),
  setIsLicensed: (isLicensed) => set({ isLicensed }),
  setIsLicenseEnforced: (isLicenseEnforced) => set({ isLicenseEnforced }),
  setLlmProvider: (llmProvider) => set({ llmProvider }),
  setApiKey: (provider, key) => set((state) => ({ apiKeys: { ...state.apiKeys, [provider]: key } })),
  setOllamaEndpoint: (ollamaEndpoint) => set({ ollamaEndpoint }),
  setDirectoryHandle: (directoryHandle) => set({ directoryHandle }),
  setActiveFileHandle: (activeFileHandle) => set({ activeFileHandle }),
  setActiveFileContent: (activeFileContent) => set({ activeFileContent }),
  setUser: (user) => set({ user }),
  setIsAuthReady: (isAuthReady) => set({ isAuthReady }),
  setAgentPhase: (agentPhase) => set({ agentPhase }),
  setSkillPulse: (skillPulse) => set({ skillPulse }),
  setSkills: (skills) => set({ skills }),
  learnSkill: async (skill: string) => {
    const { directoryHandle, skills, setSkills, setSkillPulse } = get();
    if (!directoryHandle) return;
    try {
      setSkillPulse('learning');
      const newSkills = [...skills, skill];
      setSkills(newSkills);
      const fileHandle = await directoryHandle.getFileHandle('.zomra_skills.json', { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(newSkills, null, 2));
      await writable.close();
    } catch (e) {
      console.error("Error saving skill", e);
    } finally {
      setTimeout(() => setSkillPulse('idle'), 2000);
    }
  },
  setHermesMessages: (hermesMessages) => set((state) => ({ hermesMessages: typeof hermesMessages === 'function' ? (hermesMessages as any)(state.hermesMessages) : hermesMessages })),
  setHermesHistory: (hermesHistory) => set((state) => ({ hermesHistory: typeof hermesHistory === 'function' ? (hermesHistory as any)(state.hermesHistory) : hermesHistory })),
  setTaskQueue: (taskQueue) => set((state) => ({ taskQueue: typeof taskQueue === 'function' ? (taskQueue as any)(state.taskQueue) : taskQueue })),
  setIsProcessingTask: (isProcessingTask) => set((state) => ({ isProcessingTask: typeof isProcessingTask === 'function' ? (isProcessingTask as any)(state.isProcessingTask) : isProcessingTask })),
  setProcessingStatus: (processingStatus) => set((state) => ({ processingStatus: typeof processingStatus === 'function' ? (processingStatus as any)(state.processingStatus) : processingStatus })),
  setTotalTokens: (totalTokens) => set((state) => ({ totalTokens: typeof totalTokens === 'function' ? (totalTokens as any)(state.totalTokens) : totalTokens })),
  addTerminalLog: (text, type = 'info') => set((state) => ({
    terminalLogs: [...state.terminalLogs, { id: Math.random().toString(36).substring(7), text, type }]
  })),
  setIsTerminalOpen: (isTerminalOpen) => set({ isTerminalOpen }),
}));
