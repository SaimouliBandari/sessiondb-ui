// Copyright (c) 2026 Sai Mouli Bandari Licensed under Business Source License 1.1.
/**
 * AI API client for Phase 3 (BYOK): config, generate-SQL, and explain.
 * Uses shared api client; all paths are under /ai.
 */
import apiClient from './client';

/** Current AI provider config (no API key exposed). */
export type AIConfig = {
  configured: boolean;
  providerType?: string;
  modelName?: string;
  baseUrl?: string | null;
};

/** Response from generate-SQL endpoint. */
export type GenerateSQLResponse = { sql: string; requiresApproval: boolean };

/** Response from explain endpoint. */
export type ExplainResponse = { explanation: string };

/**
 * Fetches the current user's AI provider configuration.
 * @returns Current AI config (configured, provider type, model, base URL; never API key)
 */
export async function getAIConfig(): Promise<AIConfig> {
  const res = await apiClient.get<{ data?: AIConfig } | AIConfig>('/ai/config');
  const raw = res.data;
  return typeof raw === 'object' && raw !== null && 'data' in raw ? (raw as { data: AIConfig }).data : (raw as AIConfig);
}

/**
 * Updates the user's AI provider configuration (BYOK).
 * @param params - providerType, apiKey, optional baseUrl, modelName
 */
export async function updateAIConfig(params: {
  providerType: string;
  apiKey: string;
  baseUrl?: string | null;
  modelName: string;
}): Promise<void> {
  await apiClient.put('/ai/config', params);
}

/**
 * Generates SQL from a natural-language prompt for the given instance.
 * @param instanceId - Target DB instance UUID
 * @param prompt - Natural-language description
 * @returns Generated SQL and whether it may require approval
 */
export async function generateSQL(instanceId: string, prompt: string): Promise<GenerateSQLResponse> {
  const { data } = await apiClient.post<{ data?: GenerateSQLResponse } & GenerateSQLResponse>('/ai/generate-sql', {
    instanceId,
    prompt,
  });
  return data.data ?? data;
}

/**
 * Returns a plain-language explanation of the given SQL query.
 * @param query - SQL query text
 * @returns Explanation string
 */
export async function explainQuery(query: string): Promise<ExplainResponse> {
  const { data } = await apiClient.post<{ data?: ExplainResponse } & ExplainResponse>('/ai/explain', { query });
  return data.data ?? data;
}
