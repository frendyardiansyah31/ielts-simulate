import type { ThemeTokens } from "../_lib/theme-tokens";
import type { Segment } from "../_lib/build-segments";

export type QuestionOptionData = {
  letter: string;
  checked: boolean;
  segments: Segment[];
  onSelect: () => void;
};

export type QuestionCardData = {
  id: number;
  isCurrent: boolean;
  isFlagged: boolean;
  answered: boolean;
  stemSegments: Segment[];
  options: QuestionOptionData[];
  onToggleFlag: () => void;
  setRef: (el: HTMLDivElement | null) => void;
};

type QuestionPanelProps = {
  theme: ThemeTokens;
  questionRangeLabel: string;
  questions: QuestionCardData[];
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

export function QuestionPanel({
  theme,
  questionRangeLabel,
  questions,
  fontSize,
  lineHeight,
}: QuestionPanelProps) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 260,
        overflowY: "auto",
        background: theme.bgQuestionPanel,
        padding: "28px 30px 60px",
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
        Questions {questionRangeLabel}
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
        Choose the correct letter, <strong>A</strong>, <strong>B</strong>, <strong>C</strong> or{" "}
        <strong>D</strong>.
      </p>

      {questions.map((q) => (
        <div
          key={q.id}
          ref={q.setRef}
          style={{
            background: theme.cardBg,
            border: `1px solid ${q.isCurrent ? "#0B4F8A" : "#E2E6EA"}`,
            borderRadius: 8,
            padding: "16px 18px",
            marginBottom: 14,
            boxShadow: q.isCurrent ? "0 0 0 2px rgba(11,79,138,0.15)" : "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
            <div
              style={{
                flex: "none",
                width: 26,
                height: 26,
                borderRadius: 6,
                background: q.answered ? "#0B4F8A" : theme.border,
                color: q.answered ? "#fff" : theme.textStrong,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {q.id}
            </div>
            <div
              style={{
                flex: 1,
                fontSize,
                lineHeight,
                fontWeight: 500,
                color: theme.textPrimary,
              }}
            >
              {renderSegments(q.stemSegments)}
            </div>
            <button
              style={{ flex: "none", background: "transparent", border: "none", cursor: "pointer", padding: 2 }}
              onClick={q.onToggleFlag}
              title="Mark for review"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={q.isFlagged ? "#F59E0B" : "none"}
                stroke={q.isFlagged ? "#F59E0B" : "#9AA5B1"}
                strokeWidth="2"
              >
                <path d="M4 22V4a1 1 0 0 1 1-1h13.4a1 1 0 0 1 .77 1.64l-3.9 4.7a1 1 0 0 0 0 1.28l3.9 4.7a1 1 0 0 1-.77 1.64H5"></path>
              </svg>
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 36 }}>
            {q.options.map((opt) => (
              <label
                key={opt.letter}
                className="answer-label"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  borderRadius: 6,
                  cursor: "pointer",
                  background: opt.checked ? "#EAF2FA" : "transparent",
                  fontSize,
                }}
              >
                <input
                  type="radio"
                  name={`q${q.id}`}
                  checked={opt.checked}
                  onChange={opt.onSelect}
                  style={{ accentColor: "#0B4F8A", width: 16, height: 16 }}
                />
                <span
                  style={{
                    fontWeight: 600,
                    color: opt.checked ? "#3A4653" : theme.textStrong,
                    width: 16,
                  }}
                >
                  {opt.letter}
                </span>
                <span style={{ color: opt.checked ? "#1A2530" : theme.textPrimary }}>
                  {renderSegments(opt.segments)}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
