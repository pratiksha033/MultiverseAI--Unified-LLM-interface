import type { ChatRequest, ChatResponse, APIConfig } from "./types";

export class OpenRouterService {
  private config: APIConfig;

  constructor(config: APIConfig) {
    if (!config.apiKey) {
      throw new Error("OpenRouter API key not provided in configuration");
    }
    this.config = config;
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const url = `${this.config.baseUrl || "https://openrouter.ai/api/v1"}/chat/completions`;

    console.log("Sending request to OpenRouter with API Key Loaded:", !!this.config.apiKey);

    // ✅ Normalize messages
    const messages = request.messages
      ? request.messages
      : [
          ...(request.conversationHistory || []),
          request.message
            ? { role: "user", content: request.message }
            : null,
        ].filter(Boolean); // remove null if no message

    if (!messages.length) {
      throw new Error("No valid messages provided for OpenRouter request.");
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model || this.config.model || "openai/gpt-3.5-turbo",
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error response:", errorText);
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();
    console.log("OpenRouter API response:", data);

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      console.error("Invalid OpenRouter API response:", data);
      throw new Error("Invalid response from OpenRouter API");
    }

    return {
      content,
      provider: "openrouter",
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }
}
