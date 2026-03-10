// Copyright (c) 2026 Sai Mouli Bandari Licensed under Business Source License 1.1.
/**
 * API error helpers for consistent error handling across the UI.
 * Backend returns { code?: string; error?: string } in error responses.
 */
import axios from 'axios';

/**
 * Returns a user-facing error message from an API error.
 * Prefers backend `error` field, then Error message, then fallback.
 * @param err - Caught error (Axios or other)
 * @returns Human-readable error message
 */
export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.data?.error) {
    return err.response.data.error;
  }
  return err instanceof Error ? err.message : 'Request failed';
}

/**
 * Returns the backend error code if present (e.g. AUTH002, USR001).
 * @param err - Caught error (Axios or other)
 * @returns Error code string or undefined
 */
export function getApiErrorCode(err: unknown): string | undefined {
  if (axios.isAxiosError(err) && err.response?.data?.code) {
    return err.response.data.code;
  }
  return undefined;
}
