import { GoogleGenAI } from '@google/genai';

export type LLMProvider = 'gemini' | 'openai' | 'anthropic' | 'ollama';

export interface GatewayConfig {
  provider: LLMProvider;
  apiKey?: string;
  ollamaEndpoint?: string;
}

/**
 * Agnostic LLM Gateway
 * Decouples the intelligence layer from the UI and business logic.
 */
export const generateContentAgnostic = async (
  messages: any[], // Currently accepts Gemini-formatted history, will be fully abstracted in next iterations
  systemInstruction: string,
  tools: any[] | undefined,
  config: GatewayConfig
) => {
  if (config.provider === 'gemini') {
    let envKey = '';
    try {
      envKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '');
    } catch (e) {
      // Ignore
    }
    const apiKey = config.apiKey || envKey;
    if (!apiKey) throw new Error('Gemini API key is missing. Please add it in Settings.');
    
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: messages.filter(Boolean),
      config: {
        systemInstruction,
        ...(tools && { tools })
      }
    });
    
    return response;
  } 
  
  else if (config.provider === 'ollama') {
    const endpoint = config.ollamaEndpoint || 'http://localhost:11434';
    
    // Map Gemini-style messages to Ollama format
    const ollamaMessages = messages.map(m => {
       let role = m.role === 'user' ? 'user' : 'assistant';
       // Extract text from parts
       let content = '';
       if (m.parts && Array.isArray(m.parts)) {
           content = m.parts.map((p: any) => p.text || JSON.stringify(p)).join('\n');
       } else if (typeof m === 'string') {
           content = m;
       }
       return { role, content };
    });

    if (systemInstruction) {
        ollamaMessages.unshift({ role: 'system', content: systemInstruction });
    }

    const res = await fetch(`${endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemma:2b', // Local-first Gemma 2B
        messages: ollamaMessages,
        stream: false
      })
    });

    if (!res.ok) throw new Error(`Ollama error: ${res.statusText}`);
    const data = await res.json();
    
    // Return a mocked Gemini-style response to maintain compatibility with CommandCenter's current loop
    return {
      text: data.message.content,
      functionCalls: [], // Gemma 2B via Ollama doesn't natively support structured tool calls well yet
      candidates: [{ content: { role: 'model', parts: [{ text: data.message.content }] } }]
    };
  } 
  
  else if (config.provider === 'openai') {
     throw new Error('OpenAI integration is pending implementation.');
  } 
  
  else if (config.provider === 'anthropic') {
     throw new Error('Anthropic integration is pending implementation.');
  }
  
  throw new Error(`Provider ${config.provider} not supported yet.`);
};
