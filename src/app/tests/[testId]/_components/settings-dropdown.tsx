import type { ExamTheme, ThemeTokens } from "../_lib/theme-tokens";

type SettingsDropdownProps = {
  theme: ThemeTokens;
  lineSpacing: "std" | "wide";
  examTheme: ExamTheme;
  onDecFont: () => void;
  onIncFont: () => void;
  onResetFont: () => void;
  onSetSpacingStd: () => void;
  onSetSpacingWide: () => void;
  onSetThemeLight: () => void;
  onSetThemeDark: () => void;
};

export function SettingsDropdown({
  theme,
  lineSpacing,
  examTheme,
  onDecFont,
  onIncFont,
  onResetFont,
  onSetSpacingStd,
  onSetSpacingWide,
  onSetThemeLight,
  onSetThemeDark,
}: SettingsDropdownProps) {
  const isDark = examTheme === "dark";

  const stdActive = lineSpacing === "std";
  const wideActive = lineSpacing === "wide";

  return (
    <div
      style={{
        position: "absolute",
        top: 42,
        right: 0,
        width: 230,
        background: theme.cardBg,
        color: theme.textPrimary,
        borderRadius: 8,
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        padding: 14,
        zIndex: 30,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#8A97A3",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 10,
        }}
      >
        Display Settings
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Text Size</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <button
          style={{
            flex: 1,
            padding: "6px 0",
            border: "1px solid #D8DEE4",
            background: "#F4F6F8",
            color: "#3A4653",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
          }}
          onClick={onDecFont}
        >
          A-
        </button>
        <button
          style={{
            flex: 1,
            padding: "6px 0",
            border: "1px solid #D8DEE4",
            background: "#F4F6F8",
            color: "#3A4653",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
          }}
          onClick={onResetFont}
        >
          A
        </button>
        <button
          style={{
            flex: 1,
            padding: "6px 0",
            border: "1px solid #D8DEE4",
            background: "#F4F6F8",
            color: "#3A4653",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 15,
            fontWeight: 600,
          }}
          onClick={onIncFont}
        >
          A+
        </button>
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Line Spacing</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <button
          style={{
            flex: 1,
            padding: "6px 0",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            border: stdActive ? "1px solid #0B4F8A" : "1px solid #D8DEE4",
            background: stdActive ? "#0B4F8A" : "#F4F6F8",
            color: stdActive ? "#fff" : "#3A4653",
          }}
          onClick={onSetSpacingStd}
        >
          Standard
        </button>
        <button
          style={{
            flex: 1,
            padding: "6px 0",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            border: wideActive ? "1px solid #0B4F8A" : "1px solid #D8DEE4",
            background: wideActive ? "#0B4F8A" : "#F4F6F8",
            color: wideActive ? "#fff" : "#3A4653",
          }}
          onClick={onSetSpacingWide}
        >
          Relaxed
        </button>
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Appearance</div>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          style={{
            flex: 1,
            padding: "6px 0",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            border: !isDark ? "1px solid #0B4F8A" : `1px solid ${theme.border}`,
            background: !isDark ? "#0B4F8A" : theme.cardBg,
            color: !isDark ? "#fff" : theme.textSecondary,
          }}
          onClick={onSetThemeLight}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="4"></circle>
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path>
          </svg>
          Light
        </button>
        <button
          style={{
            flex: 1,
            padding: "6px 0",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            border: isDark ? "1px solid #0B4F8A" : `1px solid ${theme.border}`,
            background: isDark ? "#0B4F8A" : theme.cardBg,
            color: isDark ? "#fff" : theme.textSecondary,
          }}
          onClick={onSetThemeDark}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
          Dark
        </button>
      </div>
    </div>
  );
}
