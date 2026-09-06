/**
 * Scans a summary_completion template for ___N___ blank tokens.
 * Shared by the admin form (live preview/validation) and the group-create
 * API route (server-side cross-check against the submitted blanks array).
 */
export function parseBlankTemplate(template: string): number[] {
  const matches = template.matchAll(/___(\d+)___/g);
  return Array.from(matches, (m) => Number(m[1]));
}
