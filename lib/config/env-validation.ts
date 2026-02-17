/**
 * Environment Variable Validation
 *
 * Validates required environment variables on application startup.
 * This helps catch configuration errors early in development and deployment.
 */

type EnvVar = {
  name: string;
  required: boolean;
  description: string;
};

const REQUIRED_ENV_VARS: EnvVar[] = [
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    required: true,
    description: "Supabase project URL",
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    required: true,
    description: "Supabase anonymous/public key",
  },
  {
    name: "NEXT_PUBLIC_API_URL",
    required: false,
    description: "Backend API URL (defaults to http://localhost:8080)",
  },
];

export function validateEnvironmentVariables() {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar.name];

    if (!value) {
      if (envVar.required) {
        errors.push(
          `Missing required environment variable: ${envVar.name} (${envVar.description})`,
        );
      } else {
        warnings.push(
          `Missing optional environment variable: ${envVar.name} (${envVar.description})`,
        );
      }
    }
  }

  // Additional validation for Supabase URL format
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.startsWith("https://")) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL must start with https://");
  }

  // Log results
  if (errors.length > 0) {
    console.error("❌ Environment variable validation failed:");
    errors.forEach((error) => console.error(`  - ${error}`));
    throw new Error(
      "Environment validation failed. Check console for details.",
    );
  }

  if (warnings.length > 0) {
    console.warn("⚠️  Environment variable warnings:");
    warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  console.log("✅ Environment variables validated successfully");
}

/**
 * Get backend API URL with fallback
 */
export function getBackendApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}
