import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ------------------------------------------------------------------ */
/* API Response Helpers                                              */
/* ------------------------------------------------------------------ */

/**
 * Standard error response structure for API endpoints
 */
export interface ErrorResponse {
  error: string;
  message?: string;
  details?: unknown;
}

/**
 * Create a JSON response with appropriate headers
 *
 * @param data - Data to be serialized as JSON
 * @param status - HTTP status code
 * @param additionalHeaders - Optional additional headers to include
 * @returns Response object with JSON content
 */
export function jsonResponse<T>(data: T, status: number, additionalHeaders?: Record<string, string>): Response {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store, private",
    ...additionalHeaders,
  };

  return new Response(JSON.stringify(data), {
    status,
    headers,
  });
}

/**
 * Create a standardized error response
 *
 * @param error - Error identifier/type
 * @param status - HTTP status code
 * @param message - Optional human-readable error message
 * @param details - Optional additional error details (e.g., validation errors)
 * @returns Response object with error JSON
 */
export function errorResponse(error: string, status: number, message?: string, details?: unknown): Response {
  const errorData: ErrorResponse = { error };

  if (message) {
    errorData.message = message;
  }

  if (details) {
    errorData.details = details;
  }

  return jsonResponse(errorData, status);
}
