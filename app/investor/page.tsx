import { redirect } from "next/navigation";

/**
 * /investor — redirects to the authenticated Investor dashboard.
 * Investor-specific views (portfolio, deal discovery, commitments)
 * live in the dashboard, not on a public page.
 */
export default function InvestorPage() {
  redirect("/dashboard");
}
