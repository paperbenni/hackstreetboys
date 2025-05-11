import { OPENROUTER_API_URL, getApiHeaders, DEFAULT_MODEL } from "./openrouter";

// Types for LLM service
export type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type LlmRequest = {
  messages: Message[];
  model?: string;
  maxTokens?: number;
  stream?: boolean;
  temperature?: number;
  apiKey?: string;
};

export type LlmResponseChunk = {
  type: "delta" | "init" | "complete" | "error";
  content?: string;
  error?: string;
};

export type LlmResponse = {
  content: string;
};

export type LlmStreamController = {
  onData: (chunk: LlmResponseChunk) => void;
  onComplete: (finalResponse: LlmResponse) => void;
  onError: (error: string) => void;
};

// Main LLM service class to handle all LLM interactions
export class LlmService {
  private readonly apiKey: string;
  private readonly defaultModel: string;
  private readonly apiUrl: string;

  constructor({
    apiKey,
    defaultModel = DEFAULT_MODEL,
    apiUrl = OPENROUTER_API_URL,
  }: {
    apiKey: string;
    defaultModel?: string;
    apiUrl?: string;
  }) {
    if (!apiKey) {
      throw new Error("LLM API key is required");
    }
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
    this.apiUrl = apiUrl;
  }

  // Process a simple, non-streaming request
  async process(request: LlmRequest): Promise<LlmResponse> {
    const {
      messages,
      model = this.defaultModel,
      maxTokens = 100000,
      temperature = 0.7,
    } = request;

    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: getApiHeaders(this.apiKey),
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.error?.message ||
          `API request failed with status ${response.status}`,
      );
    }

    const responseData = await response.json();
    const content = responseData.choices?.[0]?.message?.content || "";

    return { content };
  }

  // Process a streaming request with callbacks
  async processStream(
    request: LlmRequest,
    controller: LlmStreamController,
  ): Promise<void> {
    const {
      messages,
      model = this.defaultModel,
      maxTokens = 100000,
      temperature = 0.7,
    } = request;

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: getApiHeaders(this.apiKey),
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          temperature,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error?.message ||
            `API request failed with status ${response.status}`,
        );
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Response body is null");

      let accumulatedContent = "";
      let buffer = "";
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Append new chunk to buffer with streaming mode
          buffer += decoder.decode(value, { stream: true });

          // Process complete lines from buffer
          while (true) {
            const lineEnd = buffer.indexOf("\n");
            if (lineEnd === -1) break;

            const line = buffer.slice(0, lineEnd).trim();
            buffer = buffer.slice(lineEnd + 1);

            if (!line || line === "data: [DONE]") continue;

            if (line.startsWith("data: ")) {
              const data = line.slice(6);

              // Skip OpenRouter processing messages
              if (data.includes("OPENROUTER PROCESSING")) continue;

              try {
                const parsed = JSON.parse(data);
                const contentDelta =
                  parsed.choices[0]?.delta?.content ||
                  parsed.choices[0]?.message?.content ||
                  "";

                if (contentDelta) {
                  // Append to the accumulated content
                  accumulatedContent += contentDelta;

                  // Send delta to the client
                  controller.onData({
                    type: "delta",
                    content: contentDelta,
                  });
                }
              } catch (e) {
                // Ignore invalid JSON but log error
                console.error(
                  "Error parsing JSON:",
                  e instanceof Error ? e.message : String(e),
                );
              }
            }
          }
        }
      } finally {
        reader.cancel();
      }

      // Notify about completion
      controller.onComplete({
        content: accumulatedContent,
      });
    } catch (error) {
      // Handle errors
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("LLM processing error:", errorMessage);
      controller.onError(errorMessage);
    }
  }

  // Create a response stream that can be returned from an API route
  async createResponseStream(
    request: LlmRequest,
  ): Promise<ReadableStream<Uint8Array>> {
    const encoder = new TextEncoder();
    const apiUrl = this.apiUrl;
    const apiKey = this.apiKey;
    const defaultModel = this.defaultModel;

    return new ReadableStream({
      async start(controller) {
        try {
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: getApiHeaders(apiKey),
            body: JSON.stringify({
              model: request.model || defaultModel,
              messages: request.messages,
              max_tokens: request.maxTokens || 100000,
              temperature: request.temperature || 0.7,
              stream: true,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(
              errorData?.error?.message ||
                `API request failed with status ${response.status}`,
            );
          }

          const reader = response.body?.getReader();
          if (!reader) throw new Error("Response body is null");

          let accumulatedContent = "";
          let buffer = "";
          const decoder = new TextDecoder();

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              // Append new chunk to buffer with streaming mode
              buffer += decoder.decode(value, { stream: true });

              // Process complete lines from buffer
              while (true) {
                const lineEnd = buffer.indexOf("\n");
                if (lineEnd === -1) break;

                const line = buffer.slice(0, lineEnd).trim();
                buffer = buffer.slice(lineEnd + 1);

                if (!line || line === "data: [DONE]") continue;

                if (line.startsWith("data: ")) {
                  const data = line.slice(6);

                  // Skip OpenRouter processing messages
                  if (data.includes("OPENROUTER PROCESSING")) continue;

                  try {
                    const parsed = JSON.parse(data);
                    const contentDelta =
                      parsed.choices[0]?.delta?.content ||
                      parsed.choices[0]?.message?.content ||
                      "";

                    if (contentDelta) {
                      // Append to the accumulated content
                      accumulatedContent += contentDelta;

                      // Send delta to the client
                      controller.enqueue(
                        encoder.encode(
                          JSON.stringify({
                            type: "delta",
                            content: contentDelta,
                          }) + "\n",
                        ),
                      );
                    }
                  } catch (e) {
                    // Ignore invalid JSON but log the error
                    console.error(
                      "Error parsing JSON:",
                      e instanceof Error ? e.message : String(e),
                    );
                  }
                }
              }
            }
          } finally {
            reader.cancel();
          }

          // Send completion message
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "complete",
                content: accumulatedContent,
              }) + "\n",
            ),
          );
        } catch (error) {
          console.error("Streaming error:", error);

          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "error",
                error: error instanceof Error ? error.message : String(error),
              }) + "\n",
            ),
          );
        } finally {
          controller.close();
        }
      },
    });
  }

  // Helper method to get a singleton instance
  static getInstance(apiKey: string): LlmService {
    return new LlmService({ apiKey });
  }
}

// Helper function to get LLM service instance with environment variables
export function getLlmService(): LlmService {
  const apiKey = process.env.OPENAI_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_KEY environment variable is not set");
  }

  return LlmService.getInstance(apiKey);
}
