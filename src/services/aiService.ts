
import { GoogleGenAI, Type } from "@google/genai";

export enum AIProvider {
  GEMINI = 'GEMINI',
  LOCAL = 'LOCAL'
}

interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  localEndpoint?: string;
}

// Default configuration - can be overridden by environment variables or user settings
const config: AIConfig = {
  provider: (process.env.AI_PROVIDER as AIProvider) || AIProvider.GEMINI,
  apiKey: process.env.GEMINI_API_KEY,
  localEndpoint: process.env.LOCAL_AI_ENDPOINT || 'http://localhost:11434/v1' // Default for Ollama/LocalAI
};

export const AIService = {
  async generateContent(params: {
    systemInstruction?: string;
    prompt: string;
    responseSchema?: any;
    temperature?: number;
  }) {
    if (config.provider === AIProvider.LOCAL) {
      return this.callLocalAI(params);
    } else {
      return this.callGemini(params);
    }
  },

  async callGemini(params: {
    systemInstruction?: string;
    prompt: string;
    responseSchema?: any;
    temperature?: number;
  }) {
    const ai = new GoogleGenAI({ apiKey: config.apiKey! });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: params.prompt,
      config: {
        systemInstruction: params.systemInstruction,
        responseMimeType: params.responseSchema ? "application/json" : "text/plain",
        responseSchema: params.responseSchema,
        temperature: params.temperature ?? 1,
      }
    });
    return response.text;
  },

  async callLocalAI(params: {
    systemInstruction?: string;
    prompt: string;
    responseSchema?: any;
    temperature?: number;
  }) {
    // OpenAI-compatible local API call (Ollama, LocalAI, vLLM, etc.)
    const response = await fetch(`${config.localEndpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey || 'local-no-key'}`
      },
      body: JSON.stringify({
        model: "local-model", // User can configure this
        messages: [
          ...(params.systemInstruction ? [{ role: "system", content: params.systemInstruction }] : []),
          { role: "user", content: params.prompt }
        ],
        temperature: params.temperature ?? 1,
        response_format: params.responseSchema ? { type: "json_object" } : undefined
      })
    });

    if (!response.ok) {
      throw new Error(`LOCAL_AI_ERR: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
};
