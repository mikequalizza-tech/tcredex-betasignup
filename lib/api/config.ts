/**
 * API Configuration
 *
 * Centralized configuration for backend API calls
 */

/**
 * Get the backend API base URL with versioning
 * @returns API base URL (e.g., "http://localhost:3000/api/v1")
 */
export function getApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const cleanUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
  return `${cleanUrl}/api/v1`;
}

/**
 * Get the API base URL for server-side calls
 * Falls back to localhost if NEXT_PUBLIC_API_URL is not set
 */
export const API_BASE_URL = getApiBaseUrl();

/**
 * API version
 */
export const API_VERSION = "v1";
