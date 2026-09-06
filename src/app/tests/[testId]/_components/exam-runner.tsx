"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api-client";
import { buildSegments, type Highlight } from "../_lib/build-segments";
import { getThemeTokens, type ExamTheme } from "../_lib/theme-tokens";
import type {
  AnswerValue,
  AttemptDetail,
  AttemptSummary,
  GapQuestionData,
  McQuestionData,
  PublicQuestion,
  TestDetail,
} from "../_lib/types";
import { TopBar } from "./top-bar";
import { HelpModal } from "./help-modal";
import { SelectionPopup } from "./selection-popup";
import { PassagePanel } from "./passage-panel";
import { QuestionPanel, type GapPart, type QuestionCardData } from "./question-panel";
import { BottomBar, type NavButtonData } from "./bottom-bar";

type LineSpacing = "std" | "wide";
type AttemptRef = { id: string; started_at: string };
type SelectionPopupState = { visible: boolean; x: number; y: number; text: string };

const LETTERS = ["A", "B", "C", "D", "E"];

function splitParagraphs(content: string): { label: string; text: string }[] {
  const blocks = content
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  return blocks.map((text, i) => ({ label: LETTERS[i] ?? String(i + 1), text }));
}

// summary_completion is stored one row per blank, all sharing one template —
// group consecutive such rows so the passage renders the summary once with an
// inline input per blank (same grouping the admin list does).
type PanelItem =
  | { kind: "mc"; question: PublicQuestion }
  | { kind: "gap"; questions: PublicQuestion[] };

function groupPassageQuestions(questions: PublicQuestion[]): PanelItem[] {
  const items: PanelItem[] = [];
  let i = 0;
  while (i < questions.length) {
    const q = questions[i];
    if (q.type === "summary_completion") {
      const template = (q.question_data as GapQuestionData).template;
      const group: PublicQuestion[] = [q];
      let j = i + 1;
      while (
        j < questions.length &&
        questions[j].type === "summary_completion" &&
        (questions[j].question_data as GapQuestionData).template === template
      ) {
        group.push(questions[j]);
        j += 1;
      }
      items.push({ kind: "gap", questions: group });
      i = j;
    } else {
      items.push({ kind: "mc", question: q });
      i += 1;
    }
  }
  return items;
}

function answerText(v: AnswerValue | undefined): string {
  return v && "text" in v ? v.text : "";
}

function answerIndex(v: AnswerValue | undefined): number | undefined {
  return v && "selected_index" in v ? v.selected_index : undefined;
}

function isAnswered(v: AnswerValue | undefined): boolean {
  if (!v) return false;
  if ("text" in v) return v.text.trim() !== "";
  return true;
}

export function ExamRunner({ testId }: { testId: string }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const qRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const gapInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const saveTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const pendingSaves = useRef<Record<number, { questionId: string; text: string }>>({});

  const [test, setTest] = useState<TestDetail | null>(null);
  const [attempt, setAttempt] = useState<AttemptRef | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentPassageIndex, setCurrentPassageIndex] = useState(0);
  const [currentQ, setCurrentQ] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, AnswerValue>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [highlights, setHighlights] = useState<Highlight[]>([]);

  const [fontScale, setFontScale] = useState(1);
  const [lineSpacing, setLineSpacing] = useState<LineSpacing>("std");
  const [examTheme, setExamTheme] = useState<ExamTheme>("light");
  const [leftWidth, setLeftWidth] = useState(50);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [selectionPopup, setSelectionPopup] = useState<SelectionPopupState>({
    visible: false,
    x: 0,
    y: 0,
    text: "",
  });
  const [nowMs, setNowMs] = useState(() => Date.now());

  // ---- load test + attempt on mount ----
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const testDetail = await apiRequest<TestDetail>(`/api/tests/${testId}`);
        if (cancelled) return;
        setTest(testDetail);
        setCurrentQ(testDetail.passages[0]?.questions[0]?.question_number ?? null);

        const existingAttempts = await apiRequest<AttemptSummary[]>(
          `/api/attempts?testId=${testId}`,
        );
        if (cancelled) return;
        const inProgress = existingAttempts.find((a) => a.status === "in_progress");

        if (inProgress) {
          setAttempt({ id: inProgress.id, started_at: inProgress.started_at });
          const detail = await apiRequest<AttemptDetail>(`/api/attempts/${inProgress.id}`);
          if (cancelled) return;
          const restored: Record<number, AnswerValue> = {};
          detail.questions.forEach((q) => {
            if (q.user_answer && typeof q.user_answer.selected_index === "number") {
              restored[q.question_number] = { selected_index: q.user_answer.selected_index };
            } else if (q.user_answer && typeof q.user_answer.text === "string") {
              restored[q.question_number] = { text: q.user_answer.text };
            }
          });
          setAnswers(restored);
        } else {
          const created = await apiRequest<{ id: string; started_at: string }>(
            "/api/attempts",
            { method: "POST", body: JSON.stringify({ test_id: testId }) },
          );
          if (cancelled) return;
          setAttempt({ id: created.id, started_at: created.started_at });
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Failed to load test");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [testId]);

  // ---- timer tick ----
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeLeftSeconds = useMemo(() => {
    if (!attempt || !test) return 0;
    const endMs = new Date(attempt.started_at).getTime() + test.time_limit_minutes * 60_000;
    return Math.max(0, Math.round((endMs - nowMs) / 1000));
  }, [attempt, test, nowMs]);

  // Fire any debounced gap-fill saves right now (before submit / unmount) so a
  // just-typed answer isn't lost.
  function flushPendingSaves(): Promise<unknown> {
    if (!attempt) return Promise.resolve();
    const attemptId = attempt.id;
    const saves = Object.entries(pendingSaves.current).map(([qn, payload]) => {
      clearTimeout(saveTimers.current[Number(qn)]);
      return apiRequest(`/api/attempts/${attemptId}/answers`, {
        method: "PATCH",
        body: JSON.stringify({ question_id: payload.questionId, user_answer: { text: payload.text } }),
      }).catch((err) => console.error("Failed to save answer", err));
    });
    pendingSaves.current = {};
    return Promise.all(saves);
  }

  async function submitAttempt() {
    if (!attempt || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await flushPendingSaves();
      await apiRequest(`/api/attempts/${attempt.id}/submit`, { method: "POST" });
      router.push(`/attempts/${attempt.id}`);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to submit test");
      setIsSubmitting(false);
    }
  }

  // ---- auto-submit when time runs out ----
  useEffect(() => {
    if (attempt && test && timeLeftSeconds === 0 && !isSubmitting) {
      submitAttempt();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeftSeconds, attempt, test]);

  // ---- scroll current question into view within its panel ----
  useEffect(() => {
    if (currentQ == null) return;
    const el = qRefs.current[currentQ];
    if (el?.parentElement) {
      const container = el.parentElement;
      container.scrollTo({ top: el.offsetTop - container.offsetTop - 12, behavior: "smooth" });
    }
  }, [currentQ]);

  // ---- divider drag ----
  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let pct = ((e.clientX - rect.left) / rect.width) * 100;
      pct = Math.max(25, Math.min(75, pct));
      setLeftWidth(pct);
    }
    function onUp() {
      draggingRef.current = false;
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  function startDrag(e: React.MouseEvent) {
    e.preventDefault();
    draggingRef.current = true;
  }

  function handleMouseUp() {
    const sel = window.getSelection();
    const text = sel ? sel.toString().trim() : "";
    if (!text || text.length < 2) {
      if (selectionPopup.visible) setSelectionPopup({ visible: false, x: 0, y: 0, text: "" });
      return;
    }
    const range = sel!.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setSelectionPopup({ visible: true, x: rect.left + rect.width / 2, y: rect.top - 8, text });
  }

  function applyHighlight() {
    const text = selectionPopup.text;
    if (text) setHighlights((prev) => [...prev, { text, type: "highlight" }]);
    setSelectionPopup({ visible: false, x: 0, y: 0, text: "" });
    window.getSelection()?.removeAllRanges();
  }

  function applyNote() {
    const text = selectionPopup.text;
    if (!text) return;
    const note = window.prompt(`Add a note for: "${text}"`, "");
    if (note !== null) setHighlights((prev) => [...prev, { text, type: "note", note }]);
    setSelectionPopup({ visible: false, x: 0, y: 0, text: "" });
    window.getSelection()?.removeAllRanges();
  }

  function applyClear() {
    const text = selectionPopup.text;
    setHighlights((prev) => prev.filter((h) => h.text !== text));
    setSelectionPopup({ visible: false, x: 0, y: 0, text: "" });
    window.getSelection()?.removeAllRanges();
  }

  function selectAnswer(questionId: string, questionNumber: number, optionIndex: number) {
    setAnswers((prev) => ({ ...prev, [questionNumber]: { selected_index: optionIndex } }));
    setCurrentQ(questionNumber);
    if (!attempt) return;
    apiRequest(`/api/attempts/${attempt.id}/answers`, {
      method: "PATCH",
      body: JSON.stringify({
        question_id: questionId,
        user_answer: { selected_index: optionIndex },
      }),
    }).catch((err) => {
      console.error("Failed to save answer", err);
    });
  }

  function setGapAnswer(questionId: string, questionNumber: number, text: string) {
    setAnswers((prev) => ({ ...prev, [questionNumber]: { text } }));
    setCurrentQ(questionNumber);
    if (!attempt) return;
    const attemptId = attempt.id;
    pendingSaves.current[questionNumber] = { questionId, text };
    clearTimeout(saveTimers.current[questionNumber]);
    saveTimers.current[questionNumber] = setTimeout(() => {
      delete pendingSaves.current[questionNumber];
      apiRequest(`/api/attempts/${attemptId}/answers`, {
        method: "PATCH",
        body: JSON.stringify({ question_id: questionId, user_answer: { text } }),
      }).catch((err) => console.error("Failed to save answer", err));
    }, 500);
  }

  function toggleFlag(questionNumber: number) {
    setFlagged((prev) => ({ ...prev, [questionNumber]: !prev[questionNumber] }));
  }

  function handleNextOrSubmit() {
    if (!test) return;
    const isLast = currentPassageIndex === test.passages.length - 1;
    if (isLast) {
      if (window.confirm("Are you sure you want to submit? Once submitted, answers cannot be changed.")) {
        submitAttempt();
      }
      return;
    }
    const nextIndex = currentPassageIndex + 1;
    setCurrentPassageIndex(nextIndex);
    setCurrentQ(test.passages[nextIndex]?.questions[0]?.question_number ?? null);
  }

  if (loadError) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          fontFamily: "sans-serif",
        }}
      >
        <p>{loadError}</p>
        <Link href="/tests" style={{ color: "#0B4F8A" }}>
          Back to test list
        </Link>
      </div>
    );
  }

  if (!test || !attempt || currentQ == null) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          color: "#6B7684",
        }}
      >
        Loading test...
      </div>
    );
  }

  const theme = getThemeTokens(examTheme);
  const isDark = examTheme === "dark";
  const currentPassage = test.passages[currentPassageIndex];
  const isLastPassage = currentPassageIndex === test.passages.length - 1;

  const mins = Math.floor(timeLeftSeconds / 60);
  const secs = timeLeftSeconds % 60;
  const timeDisplay = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  const timerColor = timeLeftSeconds < 600 ? "#FCA5A5" : "#fff";

  const passageFontSize = Math.round(17 * fontScale);
  const questionFontSize = Math.round(14.5 * fontScale);
  const lineHeightValue = lineSpacing === "wide" ? 2 : 1.75;

  const firstQ = currentPassage.questions[0]?.question_number;
  const lastQ = currentPassage.questions[currentPassage.questions.length - 1]?.question_number;
  const questionRangeLabel =
    firstQ === lastQ ? String(firstQ ?? "") : `${firstQ ?? ""}–${lastQ ?? ""}`;

  const paragraphs = splitParagraphs(currentPassage.content).map((p) => ({
    label: p.label,
    segments: buildSegments(p.text, highlights),
  }));

  function goToQuestion(qn: number) {
    setCurrentQ(qn);
    const input = gapInputRefs.current[qn];
    if (input) requestAnimationFrame(() => input.focus());
  }

  function setGroupFlag(numbers: number[]) {
    const nextFlag = !numbers.some((n) => flagged[n]);
    setFlagged((prev) => {
      const copy = { ...prev };
      numbers.forEach((n) => {
        copy[n] = nextFlag;
      });
      return copy;
    });
  }

  const questionCards: QuestionCardData[] = groupPassageQuestions(currentPassage.questions).map(
    (item) => {
      if (item.kind === "mc") {
        const q = item.question;
        const qn = q.question_number;
        const data = q.question_data as McQuestionData;
        return {
          kind: "mc",
          id: qn,
          isCurrent: currentQ === qn,
          isFlagged: !!flagged[qn],
          answered: isAnswered(answers[qn]),
          stemSegments: buildSegments(data.question_text, highlights),
          onToggleFlag: () => toggleFlag(qn),
          setRef: (el: HTMLDivElement | null) => {
            qRefs.current[qn] = el;
          },
          options: data.options.map((text, oi) => ({
            letter: LETTERS[oi] ?? String(oi + 1),
            checked: answerIndex(answers[qn]) === oi,
            segments: buildSegments(text, highlights),
            onSelect: () => selectAnswer(q.id, qn, oi),
          })),
        };
      }

      const group = item.questions;
      const data = group[0].question_data as GapQuestionData;
      const numbers = group.map((g) => g.question_number);
      const first = numbers[0];
      const last = numbers[numbers.length - 1];

      const parts: GapPart[] = [];
      const regex = /___\d+___/g;
      let cursor = 0;
      let ordinal = 0;
      for (let m = regex.exec(data.template); m !== null; m = regex.exec(data.template)) {
        if (m.index > cursor) {
          parts.push({ type: "text", text: data.template.slice(cursor, m.index) });
        }
        const gq = group[ordinal];
        ordinal += 1;
        if (gq) {
          const gqn = gq.question_number;
          const wordLimit = (gq.question_data as GapQuestionData).blanks?.[0]?.word_limit;
          parts.push({
            type: "blank",
            blank: {
              questionNumber: gqn,
              value: answerText(answers[gqn]),
              wordLimit,
              isCurrent: currentQ === gqn,
              onChange: (val: string) => setGapAnswer(gq.id, gqn, val),
              setInputRef: (el: HTMLInputElement | null) => {
                gapInputRefs.current[gqn] = el;
              },
            },
          });
        } else {
          parts.push({ type: "text", text: m[0] });
        }
        cursor = regex.lastIndex;
      }
      if (cursor < data.template.length) {
        parts.push({ type: "text", text: data.template.slice(cursor) });
      }

      return {
        kind: "gap",
        id: first,
        isCurrent: currentQ != null && numbers.includes(currentQ),
        isFlagged: numbers.some((n) => !!flagged[n]),
        answered: numbers.every((n) => isAnswered(answers[n])),
        instructions: data.instructions,
        rangeLabel: first === last ? String(first) : `${first}–${last}`,
        parts,
        onToggleFlag: () => setGroupFlag(numbers),
        setRef: (el: HTMLDivElement | null) => {
          numbers.forEach((n) => {
            qRefs.current[n] = el;
          });
        },
      };
    },
  );

  const navButtons: NavButtonData[] = currentPassage.questions.map((q) => {
    const qn = q.question_number;
    return {
      id: qn,
      answered: isAnswered(answers[qn]),
      isCurrent: currentQ === qn,
      flagged: !!flagged[qn],
      onClick: () => goToQuestion(qn),
    };
  });

  return (
    <div
      className="exam-root"
      style={{
        height: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        background: theme.bgApp,
        fontFamily: "var(--font-public-sans), system-ui, sans-serif",
        color: theme.textPrimary,
        overflow: "hidden",
      }}
    >
      <TopBar
        passageLabel={`Academic Reading · Passage ${currentPassage.passage_number}`}
        timeDisplay={timeDisplay}
        timerColor={timerColor}
        settingsOpen={settingsOpen}
        onToggleSettings={() => {
          setSettingsOpen((v) => !v);
          setHelpOpen(false);
        }}
        onToggleHelp={() => {
          setHelpOpen((v) => !v);
          setSettingsOpen(false);
        }}
        theme={theme}
        lineSpacing={lineSpacing}
        examTheme={examTheme}
        onDecFont={() => setFontScale((v) => Math.max(0.8, +(v - 0.1).toFixed(2)))}
        onIncFont={() => setFontScale((v) => Math.min(1.4, +(v + 0.1).toFixed(2)))}
        onResetFont={() => setFontScale(1)}
        onSetSpacingStd={() => setLineSpacing("std")}
        onSetSpacingWide={() => setLineSpacing("wide")}
        onSetThemeLight={() => setExamTheme("light")}
        onSetThemeDark={() => setExamTheme("dark")}
      />

      {helpOpen && <HelpModal theme={theme} onClose={() => setHelpOpen(false)} />}

      {selectionPopup.visible && (
        <SelectionPopup
          x={selectionPopup.x}
          y={selectionPopup.y}
          onHighlight={applyHighlight}
          onNote={applyNote}
          onClear={applyClear}
        />
      )}

      <div
        ref={containerRef}
        style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}
        onMouseUp={handleMouseUp}
      >
        <PassagePanel
          key={`passage-${currentPassageIndex}`}
          theme={theme}
          widthPercent={leftWidth}
          passageNumber={currentPassage.passage_number}
          passageTitle={currentPassage.title}
          questionRangeLabel={questionRangeLabel}
          paragraphs={paragraphs}
          fontSize={passageFontSize}
          lineHeight={lineHeightValue}
        />

        <div
          style={{
            width: 7,
            flex: "none",
            cursor: "col-resize",
            background: theme.border,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseDown={startDrag}
        >
          <div style={{ width: 3, height: 44, borderRadius: 2, background: "#B7C0C9" }}></div>
        </div>

        <QuestionPanel
          key={`questions-${currentPassageIndex}`}
          theme={theme}
          questionRangeLabel={questionRangeLabel}
          questions={questionCards}
          fontSize={questionFontSize}
          lineHeight={lineHeightValue}
        />
      </div>

      <BottomBar
        theme={theme}
        isDark={isDark}
        navButtons={navButtons}
        isLastPassage={isLastPassage}
        onNextOrSubmit={handleNextOrSubmit}
      />
    </div>
  );
}
