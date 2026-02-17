#!/usr/bin/env node
/**
 * Build wrapper that clears __NEXT_PRIVATE_STANDALONE_CONFIG before running next build.
 *
 * This env var is set by Next.js standalone server and persists in VS Code terminals.
 * It causes loadConfig() to use a JSON-serialized config, which strips all functions
 * (webpack, headers, generateBuildId), leading to "generate is not a function" errors.
 */
delete process.env.__NEXT_PRIVATE_STANDALONE_CONFIG;

const { execSync } = require("child_process");
const path = require("path");

// Resolve the project root (one level up from scripts/)
const projectRoot = path.resolve(__dirname, "..");

try {
  // Use the project-local next binary directly
  // This works on Vercel, CI, and local dev without pulling a different version via npx
  execSync("node node_modules/next/dist/bin/next build", {
    stdio: "inherit",
    env: process.env,
    cwd: projectRoot,
  });
} catch (e) {
  process.exit(e.status || 1);
}
