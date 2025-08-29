// src/services/aiService.ts
import { OpenRouterService } from "./openrouter";
import { GoogleService } from "./google";
import type { ChatRequest, ChatResponse } from "./types";

export class AIService {
  private openRouter: OpenRouterService | null = null;
  private google: GoogleService | null = null;

  constructor() {
    this.initializeServices();
  }

  private initializeServices() {
    // 🔑 OpenRouter
    const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    console.log("OpenRouter API Key Loaded:", !!openRouterKey);
    const openRouterBaseUrl =
      import.meta.env.VITE_OPENROUTER_BASE_URL || "https://openrouter.ai/api";

    if (openRouterKey) {
      this.openRouter = new OpenRouterService({
        apiKey: openRouterKey,
        baseUrl: openRouterBaseUrl,
        model: "openai/gpt-3.5-turbo",
      });
    }

    // 🔑 Google Gemini
    const googleKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const googleBaseUrl = import.meta.env.VITE_GOOGLE_BASE_URL;

    if (googleKey && googleBaseUrl) {
      this.google = new GoogleService({
        apiKey: googleKey,
        baseUrl: googleBaseUrl,
        model: "gemini-2.5-flash",
      });
    }
  }

  /**
   * Sends a chat message to the selected provider
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    switch (request.provider) {
      case "openrouter-gpt":
      case "openrouter-claude":
        if (!this.openRouter) {
          throw new Error(
            "OpenRouter API key not configured. Please add VITE_OPENROUTER_API_KEY to your .env file."
          );
        }
        return await this.openRouter.sendMessage({
          provider: request.provider,
          model: request.model,
          // ✅ FIX: must pass `messages` not `message`
          messages: request.messages,
        });

      case "gemini":
        if (!this.google) {
          throw new Error(
            "Google API key not configured. Please add VITE_GOOGLE_API_KEY to your .env file."
          );
        }
        return await this.google.sendMessage(request);

      default:
        throw new Error(`Unsupported provider: ${request.provider}`);
    }
  }

  /**
   * Check if a provider is properly configured
   */
  isProviderConfigured(provider: string): boolean {
    switch (provider) {
      case "openrouter-gpt":
      case "openrouter-claude":
        return this.openRouter !== null;
      case "gemini":
        return this.google !== null;
      default:
        return false;
    }
  }

  /**
   * Returns all configured providers
   */
  getConfiguredProviders(): string[] {
    const providers: string[] = [];
    if (this.openRouter) {
      providers.push("openrouter-gpt", "openrouter-claude");
    }
    if (this.google) {
      providers.push("gemini");
    }
    return providers;
  }
}

// Singleton instance
export const aiService = new AIService();
