import { redirect } from "next/navigation";

/**
 * /cde — redirects to the authenticated CDE dashboard.
 * CDE-specific views (deal matching, pipeline, allocation management)
 * live in the dashboard, not on a public page.
 * Individual CDE profiles are at /cde/[slug].
 */
export default function CDEPage() {
  redirect("/dashboard");
}
