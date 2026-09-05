/**
 * Server-side word count for passage content (api-spec.md: "gak perlu dikirim dari client").
 */
export function computeWordCount(content: string): number {
  const trimmed = content.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}
