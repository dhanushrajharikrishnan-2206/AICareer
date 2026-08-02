/**
 * Production-Grade AI/ML Gateway & Orchestrator
 * Implementing:
 * 1. Dynamic Task Routing (Classification by capability/latency tradeoffs)
 * 2. Jittered Exponential Backoff Retries (handles 429s, 503s, transient errors)
 * 3. Circuit Breaker Registry (tracks health and skips failed providers dynamically)
 * 4. Multi-Provider Fallback (Groq, OpenRouter, Gemini Direct, HuggingFace)
 * 
 * Powered by Google Gemini, Groq, and OpenRouter.
 */

import { GoogleGenAI } from "@google/genai";
import { headers } from "next/headers";

// ─── Environment Configuration ────────────────────────────────────────────────
export const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export let ai: GoogleGenAI | null = null;
if (geminiKey && geminiKey.length > 5) {
  ai = new GoogleGenAI({
    apiKey: geminiKey,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } },
  });
}

export const AI_MODEL = "gemini-2.5-flash";

// ─── Task Classification System ────────────────────────────────────────────────
export type TaskType = "EXTRACTION" | "CHAT" | "REASONING" | "TIMELINE";

/**
 * Classifies the incoming prompt to allocate appropriate models & provider budgets.
 */
function classifyTask(systemPrompt: string, userPrompt: string): TaskType {
  const combined = (systemPrompt + " " + userPrompt).toLowerCase();
  
  if (combined.includes("ats") || combined.includes("score") || combined.includes("critic") || combined.includes("analyze")) {
    return "REASONING"; // High intelligence, high structured JSON requirements
  }
  if (combined.includes("coach") || combined.includes("career advisor") || combined.includes("chat")) {
    return "CHAT"; // Interactive, low latency, high throughput
  }
  if (combined.includes("roadmap") || combined.includes("skills list") || combined.includes("mastery")) {
    return "TIMELINE"; // Sequential planning, template parsing
  }
  return "EXTRACTION"; // Low complexity, text transformation, format cleanups
}

// ─── Health Registry & Circuit Breaker ────────────────────────────────────────
interface ProviderStatus {
  consecutiveFailures: number;
  lastFailureTime: number;
  circuitOpen: boolean;
}

const HEALTH_REGISTRY: Record<string, ProviderStatus> = {
  gemini:      { consecutiveFailures: 0, lastFailureTime: 0, circuitOpen: false },
  groq:        { consecutiveFailures: 0, lastFailureTime: 0, circuitOpen: false },
  openrouter:  { consecutiveFailures: 0, lastFailureTime: 0, circuitOpen: false },
  huggingface: { consecutiveFailures: 0, lastFailureTime: 0, circuitOpen: false },
};

const CIRCUIT_BREAKER_COOLDOWN_MS = 60 * 1000; // 1 minute cooldown

function isProviderHealthy(id: string): boolean {
  const status = HEALTH_REGISTRY[id];
  if (!status) return true;

  if (status.circuitOpen) {
    const elapsed = Date.now() - status.lastFailureTime;
    if (elapsed > CIRCUIT_BREAKER_COOLDOWN_MS) {
      // Cooldown finished, attempt half-open state
      console.log(`[Circuit Breaker] Health check cooldown completed for ${id}. Retrying...`);
      status.circuitOpen = false;
      return true;
    }
    return false;
  }
  return true;
}

function recordSuccess(id: string) {
  const status = HEALTH_REGISTRY[id];
  if (status) {
    status.consecutiveFailures = 0;
    status.circuitOpen = false;
  }
}

function recordFailure(id: string) {
  const status = HEALTH_REGISTRY[id];
  if (status) {
    status.consecutiveFailures += 1;
    status.lastFailureTime = Date.now();
    if (status.consecutiveFailures >= 3) {
      console.error(`[Circuit Breaker] Trip open for provider: ${id}. Disabling for 60s.`);
      status.circuitOpen = true;
    }
  }
}

// ─── Backoff and Sleep Helper ──────────────────────────────────────────────────
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── API Clients ───────────────────────────────────────────────────────────────
function resolveGeminiModel(model?: string): string {
  if (!model) return AI_MODEL;
  const map: Record<string, string> = {
    "gemini-flash":          "gemini-2.5-flash",
    "gemini-pro":            "gemini-2.5-flash",
    "gemini-3.6-flash":      "gemini-2.5-flash",
    "gemini-3.5-flash":      "gemini-2.5-flash",
    "gemini-3.1-flash-lite": "gemini-2.0-flash-lite",
    "gemini-2.5-flash":      "gemini-2.5-flash",
    "gemini-2.5-pro":        "gemini-2.5-flash",
  };
  return map[model] ?? (model.startsWith("gemini-") ? model : AI_MODEL);
}

async function callOpenAICompatible(
  url: string,
  apiKey: string,
  model: string,
  systemPrompt?: string,
  messages: { role: string; content: string }[] = [],
  maxTokens?: number
): Promise<string> {
  const formattedMessages: { role: string; content: string }[] = [];
  if (systemPrompt) formattedMessages.push({ role: "system", content: systemPrompt });
  formattedMessages.push(
    ...messages.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }))
  );

  const body: Record<string, unknown> = { model, messages: formattedMessages };
  if (maxTokens) body.max_tokens = maxTokens;

  // Implement exponential backoff retry for OpenAI-compatible endpoints (handles HTTP 429/503)
  let attempt = 0;
  const maxAttempts = 3;
  
  while (attempt < maxAttempts) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (response.status === 429 || response.status >= 500) {
        attempt++;
        if (attempt >= maxAttempts) {
          const errText = await response.text();
          throw new Error(`API error (${response.status}): ${errText}`);
        }
        // Jittered backoff wait: 300ms, 600ms, 1200ms + random jitter
        const backoff = (300 * Math.pow(2, attempt)) + (Math.random() * 100);
        console.warn(`[API Backoff] Rate limit / Server overload (${response.status}). Retrying in ${Math.round(backoff)}ms...`);
        await sleep(backoff);
        continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content ?? "";
    } catch (e: any) {
      if (attempt >= maxAttempts - 1) throw e;
      attempt++;
      await sleep(300 * Math.pow(2, attempt));
    }
  }
  throw new Error("API call failed after max retry attempts.");
}

// ─── Multi-provider orchestrator with fallback ───────────────────────────────
export async function generateWithFallback(params: {
  system?: string;
  messages: { role: "user" | "assistant"; content: string }[];
  max_tokens?: number;
  preferredModel?: string;
}): Promise<string> {
  const { system, messages, max_tokens, preferredModel } = params;

  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const groqKey      = process.env.GROQ_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const hfKey        = process.env.HUGGINGFACE_API_KEY || process.env.HF_API_KEY || process.env.HF_TOKEN;

  // Validate API key configurations
  const isGeminiValid = !!(geminiApiKey && geminiApiKey.length > 5);
  const isGroqValid = !!(groqKey && groqKey.length > 5);
  const isOpenRouterValid = !!(openrouterKey && openrouterKey.length > 5);
  const isHFValid = !!(hfKey && hfKey.length > 5);

  // Determine Task Complexity
  const taskType = classifyTask(system || "", messages[0]?.content || "");
  console.log(`[AI Engine] Classified current workload as: ${taskType}`);

  const activeProviders: { id: string; key: string }[] = [];
  if (isGroqValid)        activeProviders.push({ id: "groq",       key: groqKey });
  if (isOpenRouterValid)  activeProviders.push({ id: "openrouter", key: openrouterKey });
  if (isGeminiValid)      activeProviders.push({ id: "gemini",     key: geminiApiKey });
  if (isHFValid)          activeProviders.push({ id: "huggingface",key: hfKey });

  // Filter healthy providers based on circuit breaker status
  let healthyProviders = activeProviders.filter((p) => isProviderHealthy(p.id));

  // Fallback to avoid empty lists if all circuit breakers are tripped
  if (healthyProviders.length === 0) {
    console.warn(`[AI Engine] Warning: All circuit breakers are tripped. Resetting and falling back to full registry.`);
    healthyProviders = [...activeProviders];
  }

  // Final emergency fallback if no validated keys match criteria
  if (healthyProviders.length === 0) {
    if (groqKey) healthyProviders.push({ id: "groq", key: groqKey });
    if (openrouterKey) healthyProviders.push({ id: "openrouter", key: openrouterKey });
    if (geminiApiKey) healthyProviders.push({ id: "gemini", key: geminiApiKey });
    if (hfKey) healthyProviders.push({ id: "huggingface", key: hfKey });
  }

  // Work Assignment Strategy based on Task Type
  let orderedProviders = [...healthyProviders];
  
  if (preferredModel) {
    const prefix = preferredModel.split("-")[0];
    // Route Gemini models through OpenRouter if direct keys are not active
    if (prefix === "gemini" && !isGeminiValid && isOpenRouterValid) {
      const idx = orderedProviders.findIndex(p => p.id === "openrouter");
      if (idx > -1) {
        const [pref] = orderedProviders.splice(idx, 1);
        orderedProviders.unshift(pref);
      }
    } else {
      const idx = orderedProviders.findIndex((p) => p.id === prefix);
      if (idx > -1) {
        const [pref] = orderedProviders.splice(idx, 1);
        orderedProviders.unshift(pref);
      }
    }
  } else {
    // Dynamic defaults based on Task Type:
    if (taskType === "REASONING" && isOpenRouterValid) {
      // Prioritize OpenRouter (Llama 3 70B / Gemini Pro) for advanced logical synthesis
      const idx = orderedProviders.findIndex(p => p.id === "openrouter");
      if (idx > -1) {
        const [pref] = orderedProviders.splice(idx, 1);
        orderedProviders.unshift(pref);
      }
    } else if ((taskType === "CHAT" || taskType === "TIMELINE" || taskType === "EXTRACTION") && isGroqValid) {
      // Prioritize Groq (Llama 3.3 70B) for ultra-fast conversational and listing operations
      const idx = orderedProviders.findIndex(p => p.id === "groq");
      if (idx > -1) {
        const [pref] = orderedProviders.splice(idx, 1);
        orderedProviders.unshift(pref);
      }
    }
  }

  let lastError: unknown = null;

  for (const provider of orderedProviders) {
    try {
      console.log(`[AI Work Dispatcher] Routing ${taskType} workload to: ${provider.id}`);

      // ── Gemini (Direct) ───────────────────────────────────────────────────
      if (provider.id === "gemini") {
        if (!ai) ai = new GoogleGenAI({ apiKey: provider.key });

        const geminiModel = resolveGeminiModel(preferredModel);
        const contents = messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

        const response = await ai.models.generateContent({
          model: geminiModel,
          contents,
          config: { systemInstruction: system, maxOutputTokens: max_tokens },
        });

        if (response.text) {
          recordSuccess(provider.id);
          return response.text;
        }
        throw new Error("Gemini returned empty text.");
      }

      // ── Groq (High Speed Text & Roadmaps) ──────────────────────────────────
      if (provider.id === "groq") {
        const modelName =
          preferredModel === "groq-mixtral"
            ? "mixtral-8x7b-32768"
            : "llama-3.3-70b-versatile";
        
        const result = await callOpenAICompatible(
          "https://api.groq.com/openai/v1/chat/completions",
          provider.key, modelName, system, messages, max_tokens
        );
        recordSuccess(provider.id);
        return result;
      }

      // ── OpenRouter (Robust Reasoning & Fallback Gemini) ────────────────────
      if (provider.id === "openrouter") {
        const useGemini = preferredModel && (preferredModel.startsWith("gemini-") || preferredModel.includes("flash") || preferredModel.includes("pro"));
        const modelName = useGemini
          ? "google/gemini-2.5-flash"
          : taskType === "REASONING" 
            ? "meta-llama/llama-3.3-70b-instruct" 
            : "google/gemini-2.5-flash";
          
        const result = await callOpenAICompatible(
          "https://openrouter.ai/api/v1/chat/completions",
          provider.key, modelName, system, messages, max_tokens
        );
        recordSuccess(provider.id);
        return result;
      }

      // ── HuggingFace ────────────────────────────────────────────────────────
      if (provider.id === "huggingface") {
        const modelName = "meta-llama/Meta-Llama-3-8B-Instruct";
        const result = await callOpenAICompatible(
          `https://api-inference.huggingface.co/models/${modelName}/v1/chat/completions`,
          provider.key, modelName, system, messages, max_tokens
        );
        recordSuccess(provider.id);
        return result;
      }
    } catch (err) {
      console.warn(`[AI Work Dispatcher] Provider ${provider.id} failed:`, (err as Error).message ?? err);
      recordFailure(provider.id);
      lastError = err;
    }
  }

  throw lastError ?? new Error("All AI providers failed.");
}

// ─── askAI — primary entry point ─────────────────────────────────────────────
export async function askAI(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 1500,
  preferredModel?: string
): Promise<string> {
  let model = preferredModel;
  if (!model) {
    try {
      const reqHeaders = headers();
      model = reqHeaders.get("x-ai-model") ?? undefined;
    } catch {
      /* outside request context */
    }
  }

  return generateWithFallback({
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
    max_tokens: maxTokens,
    preferredModel: model,
  });
}

// ─── generateContentWithFallback (used by coach-chat and generate-resume) ────
export async function generateContentWithFallback({
  systemInstruction,
  messages,
  preferredModel,
}: {
  systemInstruction?: string;
  messages: { role: "user" | "assistant"; content: string }[];
  preferredModel?: string;
}) {
  return generateWithFallback({ system: systemInstruction, messages, preferredModel });
}

// ─── JSON parser ──────────────────────────────────────────────────────────────
export function cleanAndParseJson<T = any>(text: string): T {
  const clean = text.trim();
  try { return JSON.parse(clean) as T; } catch { /* continue */ }

  const fence = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fence?.[1]) {
    try { return JSON.parse(fence[1].trim()) as T; } catch { /* continue */ }
  }

  const ob = clean.indexOf("{");
  const cb = clean.lastIndexOf("}");
  if (ob !== -1 && cb > ob) {
    try { return JSON.parse(clean.slice(ob, cb + 1)) as T; } catch { /* continue */ }
  }

  const oq = clean.indexOf("[");
  const cq = clean.lastIndexOf("]");
  if (oq !== -1 && cq > oq) {
    try { return JSON.parse(clean.slice(oq, cq + 1)) as T; } catch { /* continue */ }
  }

  throw new Error(`Could not parse JSON from AI response: ${clean.slice(0, 200)}`);
}
