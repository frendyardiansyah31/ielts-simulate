import type { ThemeTokens } from "../_lib/theme-tokens";

export type NavButtonData = {
  id: number;
  answered: boolean;
  isCurrent: boolean;
  flagged: boolean;
  onClick: () => void;
};

type BottomBarProps = {
  theme: ThemeTokens;
  isDark: boolean;
  navButtons: NavButtonData[];
  isLastPassage: boolean;
  onNextOrSubmit: () => void;
};

export function BottomBar({ theme, isDark, navButtons, isLastPassage, onNextOrSubmit }: BottomBarProps) {
  return (
    <div
      style={{
        height: 70,
        flex: "none",
        background: theme.cardBg,
        borderTop: `1px solid ${theme.border}`,
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 18,
        boxShadow: "0 -1px 4px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ flex: 1, overflowX: "auto", display: "flex", gap: 8, padding: "4px 2px" }}>
        {navButtons.map((nb) => (
          <button
            key={nb.id}
            className="navbtn"
            style={{
              flex: "none",
              position: "relative",
              width: 36,
              height: 36,
              borderRadius: 7,
              background: nb.answered ? "#0B4F8A" : theme.cardBg,
              color: nb.answered ? "#fff" : theme.textPrimary,
              border: nb.isCurrent
                ? "2px solid #0B4F8A"
                : `1.5px solid ${nb.answered ? theme.border : isDark ? "#5B6672" : "#B0BAC4"}`,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
            onClick={nb.onClick}
          >
            {nb.id}
            {nb.flagged && (
              <div
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: "#F59E0B",
                  border: "1.5px solid #fff",
                }}
              ></div>
            )}
          </button>
        ))}
      </div>
      <button
        style={{
          flex: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 36,
          height: 36,
          background: "#0B4F8A",
          color: "#fff",
          border: "none",
          borderRadius: 7,
          cursor: "pointer",
        }}
        onClick={onNextOrSubmit}
        title={isLastPassage ? "Submit Test" : "Next Passage"}
      >
        {isLastPassage ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6 9 17l-5-5"></path>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M13 6l6 6-6 6"></path>
          </svg>
        )}
      </button>
    </div>
  );
}
