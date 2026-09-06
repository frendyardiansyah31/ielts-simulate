# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This is an early-stage MVP (see `PRD_IELTS_Reading_Simulator_MVP.md`), now past Week 2 of the timeline (§9) for the `multiple_choice` question type specifically — see `.claude/CHECKPOINT.md` for the full, actively-maintained status table. Short version:

- **Database:** full schema (`profiles`, `reading_tests`, `reading_passages`, `reading_questions`, `user_attempts`, `user_answers`, all enums/triggers/RLS) is applied live in Supabase. `schema.sql` at the repo root mirrors `supabase/migrations/20260905000000_create_remaining_schema.sql` — keep both in sync on any DB change.
- **Auth:** full signup/login/logout — `src/lib/supabase/{client,server,middleware}.ts`, `src/middleware.ts`, `src/app/(auth)/{login,register}/`.
- **Admin:** full CRUD API + UI for Test → Passage → Question, under `src/app/admin/`. Three question types are wired end-to-end (admin form + exam render + grading + results review): `multiple_choice`, `summary_completion`, `true_false_notgiven`.
- **User-facing:** full flow is built and deployed — home (`/`) → test list (`/tests`) → exam screen (`/tests/[testId]`, ported from `design_handoff_ielts_reading/`) → results (`/attempts/[attemptId]`).
- **Not yet built:** the other 3 question types (`matching_headings`, `matching_information`, `short_answer` — schema/validation/admin-form/render/grading all missing for each), attempt history list (PRD §5.3.D), and real IELTS-style test content (dummy content only — see `.claude/CHECKPOINT.md`).
- **Deployed:** live on Vercel as of this session — see `.claude/CHECKPOINT.md` for what has and hasn't been human-verified post-deploy.

## Coding principles

Apply SOLID, KISS, DRY, and YAGNI concretely, not as abstract slogans — tie them to this codebase's actual shape:

- **YAGNI first.** The PRD timeline (§9) builds one question type (`multiple_choice`) end-to-end before touching the other five. Don't build a generic "question type framework" (dynamic form builder, generic renderer registry, etc.) ahead of that — `question_data` is `jsonb` specifically so each type's shape can be added independently, without a shared abstraction forcing early generalization. Add the generic layer only once 2-3 types are implemented and the real shared shape is visible, not before.
- **DRY only after real duplication exists.** `matching_headings` and `matching_information` look structurally similar in the PRD (§4 note: "bisa share 1 component"), but don't merge them preemptively — wait until both are implemented and the duplication is concrete, then extract. Example of the right time to extract: `src/components/common/form-input-field.tsx` was pulled out of `login.tsx` only after the same `Controller`/`Field`/`Input`/`FieldError` block was written twice.
- **KISS in API routes.** Keep handlers thin: parse request → call a plain function → shape response. Business logic (grading, publish validation, "next question number") belongs in `lib/` (e.g. `lib/scoring.ts`), not inlined in the route handler — this is also what keeps handlers testable once a test setup exists.
- **SOLID, applied to a functional/Next.js codebase (not classes):**
  - *SRP:* one Zod schema per question type in `src/validations/`, not one mega switch-case schema. Route handlers do auth/validation/response; delegate the actual decision logic elsewhere.
  - *OCP:* adding question type #7 later should mean adding a new file/case, not editing the logic of the existing 6. The `type` column + per-type `question_data` shape already sets this up — don't erode it with an `if/else` chain keyed on assumptions about the other types.
  - *DIP:* route handlers and RPC calls should depend on `lib/scoring.ts` / Supabase client abstractions, not reimplement grading or query logic inline per route.
- When in doubt, prefer the smaller, more concrete change over the more "general" one — this project is pre-launch, single-admin, three-week-scoped (§9); premature generalization here is pure cost with no near-term payoff.

## Commands

Run all commands from `ielts-simulate/` (the Next.js app root — the repo has no root-level package.json).

```bash
npm run dev      # next dev --turbopack
npm run build    # next build (also runs TS type-checking)
npm run start    # serve production build
npm run lint     # next lint
```

There is no test suite configured (no test script/framework in `package.json`).

TypeScript is checked as part of `next build`, but for a fast standalone check use `npx tsc --noEmit`. Note: incremental compilation caches in `tsconfig.tsbuildinfo` can mask errors that only show up in the editor/language server — if `tsc` looks clean but the IDE reports something, trust the IDE (or delete `tsconfig.tsbuildinfo` and re-run).

## Architecture & key decisions

### Stack
- Next.js 15 (App Router) + React 19 + TypeScript, path alias `@/*` → `src/*`.
- Supabase (Postgres + Auth) via `@supabase/ssr`, in `src/lib/supabase/{client,server,middleware}.ts` — client/server/middleware split is the standard `@supabase/ssr` pattern (browser client, server component client, and session-refresh middleware are separate). Only `client.ts` is written so far.
- Env vars are read only through `src/config/environment.ts` (the `environment` object) — import that rather than touching `process.env` directly. Caveat: it currently reads `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`, but `.env.local` defines the key as `SUPABASE_SERVICE_ROLE_KEY` (unprefixed) — reconcile these when server-side Supabase is wired up, and keep the service-role key server-only (no `NEXT_PUBLIC_` prefix).
- Tailwind CSS v4 (CSS-first config, no `tailwind.config.js` — theme tokens live in `src/app/globals.css` under `@theme inline`).
- shadcn/ui, but configured with `"style": "base-nova"` in `components.json` — **components are built on Base UI (`@base-ui/react`), not Radix**. This matters when adding/editing shadcn components: Base UI primitives use a `render` prop instead of Radix's `asChild` (e.g. `<DropdownMenuTrigger render={<Button />}>`, not `<DropdownMenuTrigger asChild><Button /></DropdownMenuTrigger>`).
- `next-themes` for dark mode, wired through `src/providers/theme-provider.tsx` and consumed in `src/app/layout.tsx`.

### Data model (planned — see `schema.sql` and `PRD_IELTS_Reading_Simulator_MVP.md` §6)
Hierarchy: `reading_tests` → `reading_passages` → `reading_questions`, plus `user_attempts` → `user_answers`. `profiles` extends `auth.users` with a `role` (`admin`/`user`), auto-created via a Postgres trigger on signup.

The core design decision: `reading_questions.question_data` is `jsonb`, not fixed columns, because its shape varies per `type` (6 question types: `multiple_choice`, `true_false_notgiven`, `matching_headings`, `matching_information`, `summary_completion`, `short_answer`). Validation of `question_data` shape happens at the app layer (Zod — not yet a dependency, will need to be added), not in Postgres. See `api-spec.md` for the exact JSON shape per type and `PRD_IELTS_Reading_Simulator_MVP.md` §6/§4 for rationale. A question's `type` is immutable after creation (admin deletes+recreates to change it, to avoid migration edge cases).

`summary_completion` with multiple blanks stores **one row per blank** (not one row per summary block) — chosen so `user_answers` stays 1-row-per-question consistently.

Row Level Security (in `schema.sql`) is the authorization boundary: users can only read/write their own `user_attempts`/`user_answers`; only `profiles.role = 'admin'` can write `reading_tests`/`reading_passages`/`reading_questions`, enforced by an `is_admin()` SQL helper used across policies. API route handlers should double-check admin role rather than relying on RLS alone (per `api-spec.md` header note).

### API conventions (planned — see `api-spec.md` for full endpoint list)
- Response envelope: `{ "data": ... }` on success, `{ "error": { "message", "code" } }` on failure.
- Auth is session-cookie based via Supabase SSR — no custom `/api/auth/*` routes; the frontend calls the Supabase JS SDK directly, and `middleware.ts` (root-level, not yet created) handles session refresh + role-based redirects.
- `GET /api/tests/:testId` (the exam-taking payload) must strip `correct_answer`/`explanation`/`correct_index` etc. from `question_data` server-side so answers never reach the client before submission.
- Grading (`lib/scoring.ts`, not yet created) is server-side only, one comparison rule per question type — see `api-spec.md` "Submit" section for the exact per-type logic.

### Linting
`eslint.config.mjs` deliberately disables `react/jsx-key`, `@typescript-eslint/no-explicit-any`, and `@typescript-eslint/no-unused-vars` (and attempts to disable `react-hooks/exhaustive-deps`, though that rule name is misspelled as `exhautive-deps` so it's actually a no-op). Don't assume standard `next/core-web-vitals` strictness on these specific rules.
