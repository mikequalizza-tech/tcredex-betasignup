/**
 * Universal Fetch Utilities
 *
 * Provides standardized fetch functions with:
 * - Automatic credentials inclusion
 * - Consistent error handling
 * - Proper logging
 * - Type safety
 */

import { logger } from "@/lib/utils/logger";
import { getBackendApiUrl } from "@/lib/config/env-validation";

export interface FetchOptions extends RequestInit {
  requireAuth?: boolean; // Default: true - includes credentials
  baseUrl?: "frontend" | "backend"; // Default: 'frontend' (uses relative URLs)
}

export interface FetchResult<T> {
  data?: T;
  error?: string;
  success: boolean;
}

/**
 * Universal fetch function with automatic credentials and error handling
 *
 * @param url - Relative URL for frontend API, or full URL for backend
 * @param options - Fetch options (credentials always included unless requireAuth: false)
 */
export async function apiFetch<T = unknown>(
  url: string,
  options: FetchOptions = {},
): Promise<FetchResult<T>> {
  const {
    requireAuth = true,
    baseUrl = "frontend",
    headers = {},
    ...restOptions
  } = options;

  // Skip live calls during static/CI/Vercel build when no backend is running
  const isBuildTime =
    process.env.NEXT_PHASE === "phase-production-build" ||
    (typeof window === "undefined" && process.env.VERCEL === "1");
  if (isBuildTime) {
    return { success: false, error: "Skipped fetch during static build" };
  }

  // Determine full URL
  let fullUrl: string;
  if (baseUrl === "backend") {
    fullUrl = url.startsWith("http")
      ? url
      : `${getBackendApiUrl()}${url.startsWith("/") ? url : `/${url}`}`;
  } else {
    // Frontend API - need absolute URL in server-side contexts
    if (typeof window === "undefined") {
      // Server-side: construct absolute URL for frontend API routes
      const frontendBaseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:3000";
      fullUrl = url.startsWith("http")
        ? url
        : `${frontendBaseUrl}${url.startsWith("/") ? url : `/${url}`}`;
    } else {
      // Client-side: use relative URL
      fullUrl = url;
    }
  }

  // Always include credentials for authenticated requests
  const fetchOptions: RequestInit = {
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...(requireAuth && { credentials: "include" as RequestCredentials }),
  };

  try {
    const response = await fetch(fullUrl, fetchOptions);

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // If response isn't JSON, try to get text
        try {
          const errorText = await response.text();
          if (errorText) errorMessage = errorText;
        } catch {
          // Ignore - use default error message
        }
      }

      // Log with explicit URL in message for visibility
      const method = restOptions.method || "GET";
      logger.error(
        `API fetch failed: ${method} ${fullUrl} - ${response.status} ${errorMessage}`,
        {
          url: fullUrl,
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          method,
        },
      );

      return {
        success: false,
        error: errorMessage,
      };
    }

    // Parse JSON response
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      return {
        success: true,
        data: data.data || data, // Handle both { data: T } and T formats
      };
    }

    // Non-JSON response (unusual but handle it)
    const text = await response.text();
    return {
      success: true,
      data: text as unknown as T,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Network error or request failed";

    // Log with explicit string to ensure visibility
    logger.error(`API fetch exception: ${fullUrl} - ${errorMessage}`, {
      url: fullUrl,
      error: errorMessage,
      method: restOptions.method || "GET",
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Fetch from frontend API routes (relative URLs)
 */
export async function fetchApi<T = unknown>(
  endpoint: string,
  options: Omit<FetchOptions, "baseUrl"> = {},
): Promise<FetchResult<T>> {
  return apiFetch<T>(endpoint, { ...options, baseUrl: "frontend" });
}

/**
 * Fetch from backend API (full URL with backend base)
 */
export async function fetchBackend<T = unknown>(
  endpoint: string,
  options: Omit<FetchOptions, "baseUrl"> = {},
): Promise<FetchResult<T>> {
  return apiFetch<T>(endpoint, { ...options, baseUrl: "backend" });
}

/**
 * Convenience function for GET requests
 */
export async function apiGet<T = unknown>(
  url: string,
  options: Omit<FetchOptions, "method"> = {},
): Promise<FetchResult<T>> {
  return apiFetch<T>(url, { ...options, method: "GET" });
}

/**
 * Convenience function for POST requests
 */
export async function apiPost<T = unknown>(
  url: string,
  body?: unknown,
  options: Omit<FetchOptions, "method" | "body"> = {},
): Promise<FetchResult<T>> {
  return apiFetch<T>(url, {
    ...options,
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Convenience function for PUT requests
 */
export async function apiPut<T = unknown>(
  url: string,
  body?: unknown,
  options: Omit<FetchOptions, "method" | "body"> = {},
): Promise<FetchResult<T>> {
  return apiFetch<T>(url, {
    ...options,
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Convenience function for DELETE requests
 */
export async function apiDelete<T = unknown>(
  url: string,
  options: Omit<FetchOptions, "method"> = {},
): Promise<FetchResult<T>> {
  return apiFetch<T>(url, { ...options, method: "DELETE" });
}
