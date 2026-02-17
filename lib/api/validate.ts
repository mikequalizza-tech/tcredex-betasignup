import { NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";

/**
 * Parse and validate a request body against a Zod schema.
 * Returns the parsed data or a 400 NextResponse with validation errors.
 */
export async function parseBody<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<T | NextResponse> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: formatZodErrors(result.error),
      },
      { status: 400 },
    );
  }

  return result.data;
}

/**
 * Type guard to check if parseBody returned a NextResponse (validation error).
 */
export function isValidationError(result: unknown): result is NextResponse {
  return result instanceof NextResponse;
}

function formatZodErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_root";
    errors[path] = issue.message;
  }
  return errors;
}
