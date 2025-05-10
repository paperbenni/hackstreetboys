// OpenRouter API Configuration

export type OpenRouterModel = {
  id: string;
  name: string;
  description: string;
  context_length: number;
  pricing?: {
    prompt: string;
    completion: string;
  };
};

export const OPENROUTER_MODELS: OpenRouterModel[] = [
  {
    id: "anthropic/claude-3-opus:beta",
    name: "Claude 3 Opus",
    description: "Anthropic's most powerful model for highly complex tasks",
    context_length: 200000,
    pricing: {
      prompt: "$15.00 / 1M tokens",
      completion: "$75.00 / 1M tokens",
    },
  },
  {
    id: "anthropic/claude-3-sonnet:beta",
    name: "Claude 3 Sonnet",
    description: "Balanced power and speed for enterprise workloads",
    context_length: 200000,
    pricing: {
      prompt: "$3.00 / 1M tokens",
      completion: "$15.00 / 1M tokens",
    },
  },
  {
    id: "anthropic/claude-3-haiku:beta",
    name: "Claude 3 Haiku",
    description:
      "Fastest and most compact Claude model for near-instant responses",
    context_length: 200000,
    pricing: {
      prompt: "$0.25 / 1M tokens",
      completion: "$1.25 / 1M tokens",
    },
  },
  {
    id: "anthropic/claude-3.7-sonnet",
    name: "Claude 3.7 Sonnet",
    description: "The thingy",
    context_length: 200000,
    pricing: {
      prompt: "$0.25 / 1M tokens",
      completion: "$1.25 / 1M tokens",
    },
  },
  {
    id: "openai/gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    description: "Fast and cost-effective for most use cases",
    context_length: 16385,
    pricing: {
      prompt: "$0.50 / 1M tokens",
      completion: "$1.50 / 1M tokens",
    },
  },
  {
    id: "meta-llama/llama-3-70b-instruct",
    name: "Llama 3 70B",
    description:
      "Meta's largest open Llama model with strong reasoning capabilities",
    context_length: 8192,
    pricing: {
      prompt: "$0.90 / 1M tokens",
      completion: "$0.90 / 1M tokens",
    },
  },
  {
    id: "google/gemini-pro",
    name: "Gemini Pro",
    description: "Google's flagship model balanced for performance and cost",
    context_length: 32768,
    pricing: {
      prompt: "$0.50 / 1M tokens",
      completion: "$1.50 / 1M tokens",
    },
  },
];

export const OPENROUTER_API_URL =
  "https://openrouter.ai/api/v1/chat/completions";

// export const DEFAULT_MODEL = "anthropic/claude-3.7-sonnet";
export const DEFAULT_MODEL = "google/gemini-2.5-flash-preview";
// export const DEFAULT_MODEL = "google/gemini-2.5-pro-preview";

export function getApiHeaders(apiKey: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "",
    "X-Title": "OpenRouter Next.js Demo",
  };
}
