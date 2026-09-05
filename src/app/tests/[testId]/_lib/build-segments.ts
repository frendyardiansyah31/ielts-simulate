/**
 * Direct port of buildSegments() from the design handoff — splits text into
 * plain/marked segments so highlighted or noted substrings can render as
 * <mark>. Logic is unchanged from the source prototype.
 */
export type Highlight = {
  text: string;
  type: "highlight" | "note";
  note?: string;
};

export type Segment = {
  text: string;
  plain: boolean;
  marked: boolean;
  markClass?: string;
  note?: string;
};

export function buildSegments(text: string, highlights: Highlight[]): Segment[] {
  if (!highlights.length) return [{ text, plain: true, marked: false }];

  type Range = { start: number; end: number; cls: string; note: string };
  const ranges: Range[] = [];

  highlights.forEach((h) => {
    const idx = text.indexOf(h.text);
    if (idx !== -1) {
      ranges.push({
        start: idx,
        end: idx + h.text.length,
        cls: h.type === "note" ? "hl-note" : "hl-yellow",
        note: h.note || "",
      });
    }
  });

  if (!ranges.length) return [{ text, plain: true, marked: false }];

  ranges.sort((a, b) => a.start - b.start);

  const segments: Segment[] = [];
  let cursor = 0;

  ranges.forEach((r) => {
    if (r.start < cursor) return;
    if (r.start > cursor) {
      segments.push({ text: text.slice(cursor, r.start), plain: true, marked: false });
    }
    segments.push({
      text: text.slice(r.start, r.end),
      plain: false,
      marked: true,
      markClass: r.cls,
      note: r.note,
    });
    cursor = r.end;
  });

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), plain: true, marked: false });
  }

  return segments;
}
