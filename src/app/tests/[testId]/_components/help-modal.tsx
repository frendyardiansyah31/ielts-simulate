import type { ThemeTokens } from "../_lib/theme-tokens";

type HelpModalProps = {
  theme: ThemeTokens;
  onClose: () => void;
};

export function HelpModal({ theme, onClose }: HelpModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,20,30,0.45)",
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: theme.cardBg,
          borderRadius: 10,
          maxWidth: 420,
          padding: 26,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: theme.textStrong }}>
          How to answer
        </div>
        <p style={{ fontSize: 13.5, lineHeight: 1.6, color: theme.textStrong, margin: "0 0 10px" }}>
          Read the passage on the left and answer the questions on the right. Select an option for
          each question. Use the numbered bar at the bottom to jump between questions.
        </p>
        <p style={{ fontSize: 13.5, lineHeight: 1.6, color: theme.textStrong, margin: "0 0 16px" }}>
          Select any text to Highlight it or attach a Note. Drag the divider in the middle to resize
          the passage and question panes.
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginBottom: 20,
            fontSize: 12.5,
            color: theme.textStrong,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 11, height: 11, borderRadius: 2, background: "#0B4F8A" }}></div>
            Answered
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 11,
                height: 11,
                borderRadius: 2,
                background: theme.cardBg,
                border: "1.5px solid #B0BAC4",
              }}
            ></div>
            Unanswered
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#F59E0B" }}></div>
            Flagged for review
          </div>
        </div>
        <button
          style={{
            width: "100%",
            padding: 10,
            background: "#0B4F8A",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontWeight: 600,
            fontSize: 13.5,
            cursor: "pointer",
          }}
          onClick={onClose}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
