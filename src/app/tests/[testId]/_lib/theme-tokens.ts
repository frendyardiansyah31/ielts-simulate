/**
 * Verbatim from design_handoff_ielts_reading/IELTS Reading Test.dc.html —
 * this screen's own Light/Dark tokens, independent of the app's next-themes
 * dark mode (see README "Theme — Light/Dark").
 */
export type ExamTheme = "light" | "dark";

export type ThemeTokens = {
  bgApp: string;
  panelBg: string;
  bgQuestionPanel: string;
  cardBg: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textStrong: string;
};

const LIGHT_TOKENS: ThemeTokens = {
  bgApp: "#EEF1F4",
  panelBg: "#fff",
  bgQuestionPanel: "#F8FAFC",
  cardBg: "#fff",
  border: "#D8DEE4",
  textPrimary: "#1A2530",
  textSecondary: "#6B7684",
  textStrong: "#3A4653",
};

const DARK_TOKENS: ThemeTokens = {
  bgApp: "#10151B",
  panelBg: "#1B232C",
  bgQuestionPanel: "#141A21",
  cardBg: "#1F2830",
  border: "#2A343E",
  textPrimary: "#E7ECF1",
  textSecondary: "#93A1AF",
  textStrong: "#F5F7F9",
};

export function getThemeTokens(theme: ExamTheme): ThemeTokens {
  return theme === "dark" ? DARK_TOKENS : LIGHT_TOKENS;
}
