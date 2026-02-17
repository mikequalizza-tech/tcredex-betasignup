/**
 * Enhanced Input Validation Utilities
 * Provides additional security and sanitization beyond Zod schemas
 */

import { NextRequest } from "next/server";
import DOMPurify from "isomorphic-dompurify";

// SQL injection patterns (basic detection)
const SQL_INJECTION_PATTERNS = [
  /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
  /(-{2}|\/\*|\*\/)/, // Comments
  /('|(\\x27)|(\\x2D\\x2D)|(\\x2F\\x2A)|(\\x2A\\x2F))/i, // Quotes and comments
  /(<script|javascript:|vbscript:|onload=|onerror=)/i, // XSS patterns
];

// File upload validation
export const FILE_VALIDATION = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
    "text/plain",
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ],
  allowedExtensions: [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".pdf",
    ".txt",
    ".csv",
    ".xlsx",
    ".xls",
  ],
};

// Rate limiting for specific operations
export const OPERATION_LIMITS = {
  dealCreation: { maxPerHour: 10, maxPerDay: 50 },
  messageSending: { maxPerMinute: 30, maxPerHour: 200 },
  fileUpload: { maxPerHour: 20, maxPerDay: 100 },
};

/**
 * Sanitize string input to prevent XSS attacks
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") return "";

  // Remove null bytes and control characters
  let sanitized = input.replace(/[\x00-\x1F\x7F-\x9F]/g, "");

  // Use DOMPurify for HTML sanitization
  sanitized = DOMPurify.sanitize(sanitized, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [],
  });

  // Trim whitespace
  return sanitized.trim();
}

/**
 * Validate string input for SQL injection and other attacks
 */
export function validateString(
  input: string,
  options: {
    maxLength?: number;
    minLength?: number;
    allowHtml?: boolean;
    allowSpecialChars?: boolean;
  } = {},
): { isValid: boolean; sanitized: string; errors: string[] } {
  const errors: string[] = [];
  let sanitized = input;

  // Basic type check
  if (typeof input !== "string") {
    return {
      isValid: false,
      sanitized: "",
      errors: ["Input must be a string"],
    };
  }

  // Length validation
  if (options.maxLength && input.length > options.maxLength) {
    errors.push(
      `Input exceeds maximum length of ${options.maxLength} characters`,
    );
  }

  if (options.minLength && input.length < options.minLength) {
    errors.push(`Input must be at least ${options.minLength} characters long`);
  }

  // SQL injection detection
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      errors.push("Input contains potentially malicious content");
      break;
    }
  }

  // Sanitization
  if (!options.allowHtml) {
    sanitized = sanitizeString(input);
  }

  // Special characters validation
  if (!options.allowSpecialChars && /[<>'"&]/.test(sanitized)) {
    errors.push("Input contains invalid special characters");
  }

  return {
    isValid: errors.length === 0,
    sanitized,
    errors,
  };
}

/**
 * Validate email address with enhanced checks
 */
export function validateEmail(email: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push("Invalid email format");
  }

  // Length checks
  if (email.length > 254) {
    errors.push("Email address is too long");
  }

  // Domain validation (basic)
  const [, domain] = email.split("@");
  if (domain) {
    if (domain.length > 253) {
      errors.push("Email domain is too long");
    }

    // Check for suspicious patterns
    if (
      domain.includes("..") ||
      domain.startsWith(".") ||
      domain.endsWith(".")
    ) {
      errors.push("Invalid email domain format");
    }
  }

  // Check for common attack patterns
  if (/<script|javascript:|data:/i.test(email)) {
    errors.push("Email contains potentially malicious content");
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate file upload
 */
export function validateFile(file: {
  name: string;
  size: number;
  type: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Size validation
  if (file.size > FILE_VALIDATION.maxSize) {
    errors.push(
      `File size exceeds maximum of ${FILE_VALIDATION.maxSize / (1024 * 1024)}MB`,
    );
  }

  // Type validation
  if (!FILE_VALIDATION.allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`);
  }

  // Extension validation
  const extension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf("."));
  if (!FILE_VALIDATION.allowedExtensions.includes(extension)) {
    errors.push(`File extension ${extension} is not allowed`);
  }

  // Filename validation
  if (
    file.name.includes("..") ||
    file.name.includes("/") ||
    file.name.includes("\\")
  ) {
    errors.push("Invalid filename");
  }

  // Check for null bytes in filename
  if (file.name.includes("\0")) {
    errors.push("Invalid filename characters");
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate URL input
 */
export function validateUrl(url: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  try {
    const parsedUrl = new URL(url);

    // Only allow http and https
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      errors.push("Only HTTP and HTTPS URLs are allowed");
    }

    // Check for localhost/internal URLs in production
    if (process.env.NODE_ENV === "production") {
      if (
        parsedUrl.hostname === "localhost" ||
        parsedUrl.hostname === "127.0.0.1" ||
        parsedUrl.hostname.startsWith("192.168.") ||
        parsedUrl.hostname.startsWith("10.") ||
        parsedUrl.hostname.startsWith("172.")
      ) {
        errors.push("Internal URLs are not allowed in production");
      }
    }

    // Check for suspicious patterns
    if (/<script|javascript:|data:|vbscript:/i.test(url)) {
      errors.push("URL contains potentially malicious content");
    }
  } catch {
    errors.push("Invalid URL format");
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate numeric input with bounds checking
 */
export function validateNumber(
  input: string | number,
  options: {
    min?: number;
    max?: number;
    integer?: boolean;
  } = {},
): { isValid: boolean; value: number; errors: string[] } {
  const errors: string[] = [];
  let value = NaN;

  // Type conversion
  if (typeof input === "string") {
    value = parseFloat(input);
  } else if (typeof input === "number") {
    value = input;
  } else {
    errors.push("Input must be a number or numeric string");
    return { isValid: false, value: 0, errors };
  }

  // NaN check
  if (isNaN(value)) {
    errors.push("Invalid number format");
    return { isValid: false, value: 0, errors };
  }

  // Integer check
  if (options.integer && !Number.isInteger(value)) {
    errors.push("Value must be an integer");
  }

  // Bounds checking
  if (options.min !== undefined && value < options.min) {
    errors.push(`Value must be at least ${options.min}`);
  }

  if (options.max !== undefined && value > options.max) {
    errors.push(`Value must be at most ${options.max}`);
  }

  return { isValid: errors.length === 0, value, errors };
}

/**
 * Create a validation middleware for API routes
 */
export function createValidationMiddleware(
  schema: {
    safeParse: (data: unknown) => {
      success: boolean;
      data?: unknown;
      error?: { errors: { path: (string | number)[]; message: string }[] };
    };
  } | null,
) {
  return async (request: NextRequest) => {
    try {
      const body = await request.json();

      // Apply additional security validations beyond the schema
      const securityErrors: string[] = [];

      // Recursively validate all string fields
      const validateObject = (obj: Record<string, unknown>, path = "") => {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;

          if (typeof value === "string") {
            const validation = validateString(value, { maxLength: 10000 });
            if (!validation.isValid) {
              securityErrors.push(
                `${currentPath}: ${validation.errors.join(", ")}`,
              );
            }
            obj[key] = validation.sanitized;
          } else if (typeof value === "object" && value !== null) {
            validateObject(value as Record<string, unknown>, currentPath);
          }
        }
      };

      validateObject(body);

      if (securityErrors.length > 0) {
        return {
          success: false,
          errors: securityErrors,
          sanitizedBody: body,
        };
      }

      // Validate against schema if provided
      if (schema) {
        const result = schema.safeParse(body);
        if (!result.success) {
          return {
            success: false,
            errors: result.error?.errors.map(
              (e: { path: (string | number)[]; message: string }) =>
                `${e.path.join(".")}: ${e.message}`,
            ) || ["Validation failed"],
            sanitizedBody: body,
          };
        }
        return {
          success: true,
          data: result.data,
          sanitizedBody: body,
        };
      }

      return {
        success: true,
        data: body,
        sanitizedBody: body,
      };
    } catch (_error) {
      return {
        success: false,
        errors: ["Invalid JSON in request body"],
        sanitizedBody: null,
      };
    }
  };
}

/**
 * Log security events for monitoring
 */
export function logSecurityEvent(event: {
  type:
    | "suspicious_input"
    | "rate_limit_exceeded"
    | "auth_failure"
    | "file_upload_attempt";
  details: Record<string, unknown>;
  ip?: string;
  userId?: string;
}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...event,
  };

  // In production, send to security monitoring service
  if (process.env.NODE_ENV === "production") {
    console.warn("[SECURITY]", JSON.stringify(logEntry));
    // TODO: Send to monitoring service like DataDog, Sentry, etc.
  } else {
    console.log("[SECURITY EVENT]", logEntry);
  }
}
