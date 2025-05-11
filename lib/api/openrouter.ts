// OpenRouter API Configuration

export type OpenRouterModel = {
  id: string;
  name: string;
};

export const OPENROUTER_MODELS: OpenRouterModel[] = [
  {
    id: "anthropic/claude-3-opus:beta",
    name: "Claude 3 Opus",
  },
  {
    id: "anthropic/claude-3-sonnet:beta",
    name: "Claude 3 Sonnet",
  },
  {
    id: "anthropic/claude-3-haiku:beta",
    name: "Claude 3 Haiku",
  },
  {
    id: "anthropic/claude-3.7-sonnet",
    name: "Claude 3.7 Sonnet",
  },
  {
    id: "openai/gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
  },
  {
    id: "meta-llama/llama-3-70b-instruct",
    name: "Llama 3 70B",
  },
  {
    id: "google/gemini-pro",
    name: "Gemini Pro",
  },
];

export const OPENROUTER_API_URL =
  "https://openrouter.ai/api/v1/chat/completions";

export const DEFAULT_MODEL = "anthropic/claude-3.7-sonnet";
// export const DEFAULT_MODEL = "google/gemini-2.5-flash-preview";
// export const DEFAULT_MODEL = "openai/gpt-4.1";
// export const DEFAULT_MODEL = "deepseek/deepseek-chat-v3-0324";
// export const DEFAULT_MODEL = "google/gemini-2.0-flash-001";
// export const DEFAULT_MODEL = "google/gemini-2.5-pro-preview";

export function getApiHeaders(apiKey: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "",
    "X-Title": "OpenRouter Next.js Demo",
  };
}
