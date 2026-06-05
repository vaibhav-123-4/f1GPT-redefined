import { OpenRouterMessage } from "@/types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Free-tier models with tool-calling support
const FREE_MODELS = [
  "google/gemma-4-31b-it-20260402:free",
  
  
];

export const F1_SYSTEM_PROMPT =
  "You are an expert Formula 1 assistant. Respond in English only. You provide accurate, concise, and engaging answers about F1. Never fabricate dates, schedules, results, standings, or statistics. If the user asks for factual or time-based info (like next race date, standings, winners), call the provided tools and use their output.";

export const ENGLISH_ONLY_GUARD =
  "IMPORTANT: Output English text only. Do not output any other language.";

interface ChatCompletionOptions {
  messages: OpenRouterMessage[];
  tools?: unknown[];
  toolChoice?: "auto" | "none";
}

interface OpenRouterResponse {
  choices?: Array<{
    message?: OpenRouterMessage;
  }>;
  error?: {
    message?: string;
    code?: number;
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getAppOrigin() {
  // Prefer explicit configuration for consistent headers.
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit;

  // Vercel provides VERCEL_URL without protocol.
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  return "http://localhost:3000";
}

export class OpenRouterError extends Error {
  readonly status?: number;
  readonly model?: string;

  constructor(message: string, status?: number, model?: string) {
    super(message);
    this.name = "OpenRouterError";
    this.status = status;
    this.model = model;
  }
}

export async function createChatCompletion({
  messages,
  tools,
  toolChoice = "auto",
}: ChatCompletionOptions): Promise<OpenRouterMessage> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY in environment.");
  }

  let lastError: Error | null = null;

  for (const model of FREE_MODELS) {
    // Retry a bit on transient upstream/provider rate limits.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await fetch(OPENROUTER_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": getAppOrigin(),
            "X-Title": "F1 GPT Redefined",
          },
          body: JSON.stringify({
            model,
            messages,
            tools,
            tool_choice: toolChoice,
            temperature: 0.2,
          }),
        });

        const text = await response.text();
        const data: OpenRouterResponse = text ? (JSON.parse(text) as OpenRouterResponse) : {};

        if (!response.ok) {
          const message =
            data?.error?.message ?? `OpenRouter request failed with status ${response.status}`;

          // If this model has no endpoints on OpenRouter, immediately try the next model.
          if (response.status === 404) {
            throw new OpenRouterError(message, response.status, model);
          }

          // Transient upstream rate limit/provider failures.
          if ((response.status === 429 || response.status === 502 || response.status === 503) && attempt < 2) {
            await sleep(350 * Math.pow(2, attempt));
            continue;
          }

          throw new OpenRouterError(message, response.status, model);
        }

        const resolvedMessage = data.choices?.[0]?.message;

        if (!resolvedMessage) {
          throw new Error(`OpenRouter returned no message for model ${model}.`);
        }

        return resolvedMessage;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown OpenRouter error.");

        // If it's JSON parse or other transient issue, small delay before retrying this model.
        if (attempt < 2) {
          await sleep(200 * Math.pow(2, attempt));
          continue;
        }
      }
    }
  }

  throw lastError ?? new Error("All OpenRouter free models failed. They may not be available in your region.");
}
