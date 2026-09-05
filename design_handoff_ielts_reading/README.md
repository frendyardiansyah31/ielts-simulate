# Handoff: IELTS Academic Reading — Computer-Based Test Mockup

## Overview
A high-fidelity mockup of an IELTS IDP-style computer-based Reading test screen: split-pane passage (left) / questions (right), a countdown timer, per-question flag/review, text highlighting with notes, a bottom question navigator, and light/dark display settings.

## About the Design Files
The bundled file (`IELTS Reading Test.dc.html`) is a **design reference built in HTML** — a working prototype showing the intended look, layout, and interaction behavior. It is not production code to copy as-is. The task is to **recreate this design in the target codebase's existing environment** (React, Vue, native, etc.), following its established component patterns, state management, and styling conventions. If no environment exists yet, choose the framework best suited to the project.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and interaction states are final/representative — recreate pixel-close.

## Screens / Views
Single screen: **Reading Test — Passage 1**.

### Layout
- Full-viewport (`100vh`) column: top bar (56px) → content row (flex:1, split pane) → bottom bar (70px).
- Content row: left passage panel (default 50% width, draggable 25–75%), 7px drag handle, right question panel (flex:1).
- Both panels scroll independently (`overflow-y: auto`).

### Components

**Top bar** — background `#0B4F8A` (brand blue), white text, 56px tall, `box-shadow: 0 1px 3px rgba(0,0,0,0.15)`.
- Left: "IELTS" wordmark (20px/700) + divider + "Academic Reading · Passage 1" (13px/500, 85% opacity white).
- Center (absolutely centered): Time Remaining pill — clock icon, label, mono-spaced time `mm:ss`; text/icon turn `#FCA5A5` (red) when time remaining < 10 minutes.
- Right: Help button (bordered, opens modal), Settings gear button (bordered, opens dropdown).

**Settings dropdown** (230px, white/dark card, `border-radius:8px`, shadow `0 8px 24px rgba(0,0,0,0.2)`):
- Text Size: A- / A / A+ buttons, scales passage/question font 0.8×–1.4× in 0.1 steps.
- Line Spacing: Standard (1.75) / Relaxed (2.0) toggle.
- Appearance: Light / Dark theme toggle (see Design Tokens → Theme below).

**Help modal**: centered overlay dialog (max-width 420px) listing instructions plus the Answered / Unanswered / Flagged legend (color swatches), and a "Got it" primary button.

**Selection popup**: dark pill (`#1A2530`) with three buttons — Highlight (yellow text `#FDE68A`), Note (blue text `#93C5FD`), Clear (red text `#FCA5A5`) — appears above any text selection in the passage or question panel.

**Passage panel**: white/dark card. Header eyebrow "READING PASSAGE 1" (12px/700, blue, uppercase, letter-spacing 1px), serif title 22px/700, italic instructions line. Paragraphs render with a bold paragraph-letter gutter (A/B/C/D) + serif body text (`Source Serif 4`), font size driven by the Text Size setting, line-height driven by Line Spacing setting.

**Question panel**: header "QUESTIONS 1–13" + instructions. Each question is a card (`border-radius:8px`, 16–18px padding) containing:
- Numbered badge (26×26, rounded) — filled blue when answered, neutral when not.
- Question stem (highlightable).
- Flag/bookmark icon button (top-right of card) — toggles amber fill when flagged.
- 4 radio options (A–D), each a full-width clickable label; selected option gets a light-blue background (`#EAF2FA`) with forced dark text (`#1A2530`) for contrast in both themes; hover state forces black text via a CSS rule (`.answer-label:hover span/mark { color:#1A2530 !important }`) since the light hover background needs dark text regardless of theme.
- Current question card gets a blue 2px border + soft glow ring.

**Bottom bar** (70px, white/dark, top border): horizontally-scrolling row of 13 number buttons (36×36, rounded) — filled blue = answered, bordered = unanswered (border made stronger/higher-contrast in dark mode: `1.5px solid #5B6672` dark / `#B0BAC4` light), 2px blue ring = current, small amber dot badge (top-right corner) = flagged. Clicking a button sets it current and smooth-scrolls the question panel to that card. A small icon-only "Next Passage" button (right-chevron, 36×36, blue fill) sits at the far right of the bar.

## Interactions & Behavior
- **Timer**: counts down from 60:00 in real seconds; turns red under 10:00. (Prototype uses `setInterval`; production should likely sync against a server-issued end time.)
- **Divider drag**: mousedown on the 7px handle attaches window mousemove/mouseup listeners; clamps left-pane width to 25–75% of the content row.
- **Answer selection**: clicking a radio sets that question's answer, marks the number badge/nav button as answered, and sets it as "current".
- **Flag toggle**: per-question flag button toggles a boolean; reflected in bottom-bar badge and Help legend.
- **Highlighting**: `mouseup` in either panel captures the current text selection; the popup's Highlight/Note/Clear buttons store `{text, type, note}` entries; all matching substrings across passage paragraphs, question stems, and answer options are wrapped in a `<mark>` on every render (first-match only per block, non-overlapping). Note-type highlights show the note text as a native tooltip (`title` attr) and get a dotted underline. Mark text is always forced to `#1A1A1A` regardless of theme so it stays legible on the yellow/blue highlight backgrounds.
- **Nav jump**: bottom-bar number buttons set current question and scroll it into view within the question panel (not the whole page).
- **Settings**: font-scale and line-spacing apply live to both panels; theme toggle (see below) swaps the app's color tokens.
- **Next Passage**: placeholder action (shows a confirmation alert in the prototype) — wire to real multi-passage navigation in production.

## State Management
- `currentQ` (number): the active/focused question.
- `answers` (map qId → optionIndex).
- `flagged` (map qId → boolean).
- `highlights` (array of `{text, type: 'highlight'|'note', note?}`).
- `fontScale` (number, 0.8–1.4).
- `lineSpacing` ('std' | 'wide').
- `theme` ('light' | 'dark').
- `leftWidth` (percentage, 25–75).
- `timeLeft` (seconds remaining).
- `settingsOpen`, `helpOpen` (booleans).
- `selectionPopup` ({visible, x, y, text}) — transient, tied to current text selection.

## Design Tokens

### Brand
- Primary blue: `#0B4F8A`
- Amber (flag/warning): `#F59E0B`
- Danger/time-critical red: `#FCA5A5`
- Highlight yellow: `#FDE68A`
- Highlight/note blue: `#BFDBFE`, note underline `#1D4ED8`

### Theme — Light
- App background `#EEF1F4`, panel/card background `#fff`, question panel background `#F8FAFC`
- Border `#D8DEE4`
- Text primary `#1A2530`, secondary `#6B7684`, strong/emphasis `#3A4653`

### Theme — Dark
- App background `#10151B`, passage panel `#1B232C`, question panel `#141A21`, cards `#1F2830`
- Border `#2A343E`
- Text primary `#E7ECF1`, secondary `#93A1AF`, strong/emphasis (near-white, used for option letters, question numbers, Help modal copy) `#F5F7F9`

### Typography
- UI font: **Public Sans** (400/500/600/700)
- Passage/serif font: **Source Serif 4** (400/600)
- Base passage size 17px, question size 14.5px (both × fontScale)
- Line-height: 1.75 (standard) / 2.0 (relaxed)

### Spacing / Radius
- Card radius: 8px; buttons/pills: 6–7px
- Question card padding: 16–18px
- Nav/next-passage buttons: 36×36px, radius 7px

## Assets
No image assets — all icons are inline SVG (stroke-based, 13–18px). No external images used.

## Files
- `IELTS Reading Test.dc.html` — the full interactive prototype (single self-contained file; open directly in a browser).
