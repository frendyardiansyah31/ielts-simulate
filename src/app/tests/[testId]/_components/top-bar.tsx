import type { ExamTheme, ThemeTokens } from "../_lib/theme-tokens";
import { SettingsDropdown } from "./settings-dropdown";

type TopBarProps = {
  passageLabel: string;
  timeDisplay: string;
  timerColor: string;
  settingsOpen: boolean;
  onToggleSettings: () => void;
  onToggleHelp: () => void;
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

export function TopBar({
  passageLabel,
  timeDisplay,
  timerColor,
  settingsOpen,
  onToggleSettings,
  onToggleHelp,
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
}: TopBarProps) {
  return (
    <div
      style={{
        height: 56,
        flex: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        background: "#0B4F8A",
        color: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        zIndex: 20,
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 20, letterSpacing: 0.5 }}>IELTS</div>
        <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.3)" }}></div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.85)" }}>
          {passageLabel}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-50%)",
          display: "flex",
          alignItems: "center",
          gap: 7,
          background: "rgba(255,255,255,0.12)",
          padding: "7px 16px",
          borderRadius: 6,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={timerColor} strokeWidth="2">
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M12 7v5l3 2"></path>
        </svg>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
          Time Remaining
        </span>
        <span style={{ fontSize: 15, fontWeight: 700, color: timerColor }}>{timeDisplay}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, justifyContent: "flex-end" }}>
        <button
          className="toolbtn"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.4)",
            color: "#fff",
            padding: "7px 12px",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
          onClick={onToggleHelp}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 2-3 4"></path>
            <circle cx="12" cy="17" r=".5" fill="currentColor"></circle>
          </svg>
          Help
        </button>

        <div style={{ position: "relative" }}>
          <button
            className="toolbtn"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 34,
              height: 34,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.4)",
              color: "#fff",
              borderRadius: 6,
              cursor: "pointer",
            }}
            onClick={onToggleSettings}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>

          {settingsOpen && (
            <SettingsDropdown
              theme={theme}
              lineSpacing={lineSpacing}
              examTheme={examTheme}
              onDecFont={onDecFont}
              onIncFont={onIncFont}
              onResetFont={onResetFont}
              onSetSpacingStd={onSetSpacingStd}
              onSetSpacingWide={onSetSpacingWide}
              onSetThemeLight={onSetThemeLight}
              onSetThemeDark={onSetThemeDark}
            />
          )}
        </div>
      </div>
    </div>
  );
}
