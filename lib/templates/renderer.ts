/**
 * Template Renderer
 * Renders markdown templates with variable substitution
 */

interface TemplateVariables {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Render a template string with variables
 * Replaces {{variable}} with values from the variables object
 */
export function renderTemplate(
  template: string,
  variables: TemplateVariables,
): string {
  let rendered = template;

  // Replace all {{variable}} patterns
  Object.entries(variables).forEach(([key, value]) => {
    if (value !== undefined) {
      const pattern = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      rendered = rendered.replace(pattern, String(value));
    }
  });

  return rendered;
}

/**
 * Format currency for templates
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date for templates
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Get template variables from deal and organization data
 */
export function getTemplateVariables(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deal: Record<string, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  organization: Record<string, any> | null,
  additionalVars?: TemplateVariables,
): TemplateVariables {
  return {
    // Deal variables
    project_name: deal.project_name || deal.projectName,
    address: deal.address,
    city: deal.city,
    state: deal.state,
    allocation_amount: formatCurrency(deal.allocation || 0),
    credit_type: deal.program_type || deal.programType,
    expected_qei_date: deal.expected_qei_date
      ? formatDate(deal.expected_qei_date)
      : "",
    pricing: deal.credit_price ? deal.credit_price.toFixed(2) : "0.00",
    total_project_cost: formatCurrency(deal.project_cost || 0),

    // Organization variables
    sponsor_name: deal.sponsor_name || deal.sponsorName,
    cde_name: organization?.name || organization?.organization_name,
    cde_contact_name: organization?.contact_name,
    investor_name: organization?.name || organization?.organization_name,

    // Date
    date: formatDate(new Date()),

    // Additional variables
    ...additionalVars,
  };
}
