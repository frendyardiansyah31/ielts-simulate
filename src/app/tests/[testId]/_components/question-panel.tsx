import type { ThemeTokens } from "../_lib/theme-tokens";
import type { Segment } from "../_lib/build-segments";

export type QuestionOptionData = {
  letter: string;
  checked: boolean;
  segments: Segment[];
  onSelect: () => void;
};

type CardBase = {
  id: number;
  isCurrent: boolean;
  isFlagged: boolean;
  answered: boolean;
  onToggleFlag: () => void;
  setRef: (el: HTMLDivElement | null) => void;
};

export type McCardData = CardBase & {
  kind: "mc";
  stemSegments: Segment[];
  options: QuestionOptionData[];
};

export type GapBlankData = {
  questionNumber: number;
  value: string;
  wordLimit?: string;
  isCurrent: boolean;
  onChange: (value: string) => void;
  setInputRef: (el: HTMLInputElement | null) => void;
};

export type GapPart =
  | { type: "text"; text: string }
  | { type: "blank"; blank: GapBlankData };

export type GapCardData = CardBase & {
  kind: "gap";
  instructions?: string;
  rangeLabel: string;
  parts: GapPart[];
};

export type TfngOptionData = {
  value: string;
  label: string;
  checked: boolean;
  onSelect: () => void;
};

export type TfngCardData = CardBase & {
  kind: "tfng";
  stemSegments: Segment[];
  options: TfngOptionData[];
};

export type QuestionCardData = McCardData | GapCardData | TfngCardData;

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

function FlagButton({
  isFlagged,
  onToggleFlag,
}: {
  isFlagged: boolean;
  onToggleFlag: () => void;
}) {
  return (
    <button
      style={{ flex: "none", background: "transparent", border: "none", cursor: "pointer", padding: 2 }}
      onClick={onToggleFlag}
      title="Mark for review"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={isFlagged ? "#F59E0B" : "none"}
        stroke={isFlagged ? "#F59E0B" : "#9AA5B1"}
        strokeWidth="2"
      >
        <path d="M4 22V4a1 1 0 0 1 1-1h13.4a1 1 0 0 1 .77 1.64l-3.9 4.7a1 1 0 0 0 0 1.28l3.9 4.7a1 1 0 0 1-.77 1.64H5"></path>
      </svg>
    </button>
  );
}

function NumberBadge({
  label,
  answered,
  theme,
}: {
  label: string | number;
  answered: boolean;
  theme: ThemeTokens;
}) {
  return (
    <div
      style={{
        flex: "none",
        minWidth: 26,
        height: 26,
        padding: "0 6px",
        borderRadius: 6,
        background: answered ? "#0B4F8A" : theme.border,
        color: answered ? "#fff" : theme.textStrong,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {label}
    </div>
  );
}

function McCard({
  q,
  theme,
  fontSize,
  lineHeight,
}: {
  q: McCardData;
  theme: ThemeTokens;
  fontSize: number;
  lineHeight: number;
}) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
        <NumberBadge label={q.id} answered={q.answered} theme={theme} />
        <div style={{ flex: 1, fontSize, lineHeight, fontWeight: 500, color: theme.textPrimary }}>
          {renderSegments(q.stemSegments)}
        </div>
        <FlagButton isFlagged={q.isFlagged} onToggleFlag={q.onToggleFlag} />
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
              style={{ fontWeight: 600, color: opt.checked ? "#3A4653" : theme.textStrong, width: 16 }}
            >
              {opt.letter}
            </span>
            <span style={{ color: opt.checked ? "#1A2530" : theme.textPrimary }}>
              {renderSegments(opt.segments)}
            </span>
          </label>
        ))}
      </div>
    </>
  );
}

function GapCard({
  q,
  theme,
  fontSize,
  lineHeight,
}: {
  q: GapCardData;
  theme: ThemeTokens;
  fontSize: number;
  lineHeight: number;
}) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
        <NumberBadge label={q.rangeLabel} answered={q.answered} theme={theme} />
        <div style={{ flex: 1, fontSize: 13, fontStyle: "italic", color: theme.textSecondary, lineHeight: 1.6 }}>
          {q.instructions || "Complete the summary. Write your answers in the boxes."}
        </div>
        <FlagButton isFlagged={q.isFlagged} onToggleFlag={q.onToggleFlag} />
      </div>
      <div
        style={{
          fontSize,
          lineHeight,
          color: theme.textPrimary,
          whiteSpace: "pre-wrap",
          paddingLeft: 36,
        }}
      >
        {q.parts.map((part, i) =>
          part.type === "text" ? (
            <span key={i}>{part.text}</span>
          ) : (
            <span
              key={i}
              style={{ display: "inline-flex", alignItems: "baseline", gap: 4, verticalAlign: "baseline" }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#0B4F8A",
                  transform: "translateY(-1px)",
                }}
              >
                {part.blank.questionNumber}
              </span>
              <input
                ref={part.blank.setInputRef}
                value={part.blank.value}
                onChange={(e) => part.blank.onChange(e.target.value)}
                title={part.blank.wordLimit}
                placeholder={part.blank.wordLimit}
                style={{
                  minWidth: 120,
                  padding: "2px 8px",
                  fontSize,
                  fontFamily: "inherit",
                  color: theme.textPrimary,
                  background: theme.cardBg,
                  border: `1.5px solid ${part.blank.isCurrent ? "#0B4F8A" : theme.border}`,
                  borderRadius: 5,
                  outline: "none",
                }}
              />
            </span>
          ),
        )}
      </div>
    </>
  );
}

function TfngCard({
  q,
  theme,
  fontSize,
  lineHeight,
}: {
  q: TfngCardData;
  theme: ThemeTokens;
  fontSize: number;
  lineHeight: number;
}) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
        <NumberBadge label={q.id} answered={q.answered} theme={theme} />
        <div style={{ flex: 1, fontSize, lineHeight, fontWeight: 500, color: theme.textPrimary }}>
          {renderSegments(q.stemSegments)}
        </div>
        <FlagButton isFlagged={q.isFlagged} onToggleFlag={q.onToggleFlag} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 36 }}>
        {q.options.map((opt) => (
          <label
            key={opt.value}
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
              style={{ fontWeight: 600, color: opt.checked ? "#1A2530" : theme.textStrong }}
            >
              {opt.label}
            </span>
          </label>
        ))}
      </div>
    </>
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
          marginBottom: 16,
        }}
      >
        Questions {questionRangeLabel}
      </div>

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
          {q.kind === "mc" ? (
            <McCard q={q} theme={theme} fontSize={fontSize} lineHeight={lineHeight} />
          ) : q.kind === "gap" ? (
            <GapCard q={q} theme={theme} fontSize={fontSize} lineHeight={lineHeight} />
          ) : (
            <TfngCard q={q} theme={theme} fontSize={fontSize} lineHeight={lineHeight} />
          )}
        </div>
      ))}
    </div>
  );
}
