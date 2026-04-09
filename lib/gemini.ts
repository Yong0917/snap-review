import { GoogleGenAI } from "@google/genai";
import type { GenerateContentParameters, GenerateContentResponse } from "@google/genai";

const DEFAULT_GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite-preview",
] as const;

type GenerateContentWithFallbackOptions = Omit<GenerateContentParameters, "model"> & {
  models?: string[];
};

export function getGeminiModelFallbacks() {
  const configuredModels = process.env.GEMINI_MODELS
    ?.split(",")
    .map((model) => model.trim())
    .filter(Boolean);

  return configuredModels?.length ? configuredModels : [...DEFAULT_GEMINI_MODELS];
}

export async function generateContentWithFallback(
  ai: GoogleGenAI,
  { models = getGeminiModelFallbacks(), ...params }: GenerateContentWithFallbackOptions
): Promise<{ model: string; response: GenerateContentResponse }> {
  let lastError: unknown;

  for (let i = 0; i < models.length; i += 1) {
    const model = models[i];

    try {
      const response = await ai.models.generateContent({
        ...params,
        model,
      });

      return { model, response };
    } catch (error) {
      lastError = error;

      if (!isRetryableQuotaError(error) || i === models.length - 1) {
        throw error;
      }

      console.warn(`[gemini] quota hit on ${model}, falling back to ${models[i + 1]}`);
    }
  }

  throw lastError ?? new Error("GEMINI_FALLBACK_FAILED");
}

export function isRetryableQuotaError(error: unknown) {
  const status = getErrorStatus(error);
  const message = getErrorMessage(error).toLowerCase();

  return (
    status === 429 ||
    status === 503 ||
    message.includes("quota") ||
    message.includes("resource_exhausted") ||
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("unavailable") ||
    message.includes("high demand")
  );
}

function getErrorStatus(error: unknown) {
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status?: unknown }).status;
    return typeof status === "number" ? status : undefined;
  }

  return undefined;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "";
}
