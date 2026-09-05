import type { ThemeTokens } from "../_lib/theme-tokens";
import type { Segment } from "../_lib/build-segments";

type Paragraph = {
  label: string;
  segments: Segment[];
};

type PassagePanelProps = {
  theme: ThemeTokens;
  widthPercent: number;
  passageNumber: number;
  passageTitle: string;
  questionRangeLabel: string;
  paragraphs: Paragraph[];
  fontSize: number;
  lineHeight: number;
};

function renderSegments(segments: Segment[]) {
  return segments.map((seg, i) =>
    seg.marked ? (
      <mark key={i} className={seg.markClass} title={seg.note}>
        {seg.text}
      </mark>
    ) : (
      <span key={i}>{seg.text}</span>
    ),
  );
}

export function PassagePanel({
  theme,
  widthPercent,
  passageNumber,
  passageTitle,
  questionRangeLabel,
  paragraphs,
  fontSize,
  lineHeight,
}: PassagePanelProps) {
  return (
    <div
      style={{
        width: `${widthPercent}%`,
        minWidth: 220,
        overflowY: "auto",
        background: theme.panelBg,
        padding: "28px 30px 60px",
        borderRight: `1px solid ${theme.border}`,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#0B4F8A",
          letterSpacing: 1,
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        Reading Passage {passageNumber}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          fontFamily: "var(--font-source-serif), serif",
          marginBottom: 6,
          color: theme.textPrimary,
        }}
      >
        {passageTitle}
      </div>
      <p
        style={{
          fontSize: 13,
          fontStyle: "italic",
          color: theme.textSecondary,
          lineHeight: 1.6,
          margin: "0 0 22px",
        }}
      >
        You should spend about 20 minutes on Questions {questionRangeLabel}, which are based on
        Reading Passage {passageNumber} below.
      </p>

      {paragraphs.map((para, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 14,
            marginBottom: 20,
            fontFamily: "var(--font-source-serif), serif",
            fontSize,
            lineHeight,
          }}
        >
          <div
            style={{
              flex: "none",
              fontWeight: 700,
              color: "#0B4F8A",
              fontFamily: "var(--font-public-sans), sans-serif",
              fontSize: 13,
              paddingTop: 2,
            }}
          >
            {para.label}
          </div>
          <div style={{ color: theme.textPrimary }}>{renderSegments(para.segments)}</div>
        </div>
      ))}
    </div>
  );
}
