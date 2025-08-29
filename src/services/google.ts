import type { ChatRequest, ChatResponse, APIConfig } from "./types";

export class GoogleService {
  private config: APIConfig;

  constructor(config: APIConfig) {
    this.config = config;
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const model = this.config.model || "gemini-2.5-flash";
    const url = `/api/gemini/v1beta/models/${model}:generateContent`;

    const contents = [
      ...(request.conversationHistory?.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      })) || []),
      {
        role: "user",
        parts: [{ text: request.message }],
      },
    ];

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.config.apiKey,
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Google API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Google API Response:", data);

    if (data.error) {
      throw new Error(`Google API error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
      throw new Error("Invalid response from Google API: Missing candidates");
    }

    const candidate = data.candidates[0];
    const content = candidate.content;

    if (
      content &&
      content.parts &&
      Array.isArray(content.parts) &&
      content.parts.length > 0 &&
      typeof content.parts[0].text === "string"
    ) {
      const textContent = content.parts[0].text;
      return {
        content: textContent,
        provider: "gemini",
        usage: data.usageMetadata
          ? {
              promptTokens: data.usageMetadata.promptTokenCount,
              completionTokens: data.usageMetadata.candidatesTokenCount,
              totalTokens: data.usageMetadata.totalTokenCount,
            }
          : undefined,
      };
    } else {
      throw new Error("Invalid response from Google API: Cannot find text content");
    }
  }
}
