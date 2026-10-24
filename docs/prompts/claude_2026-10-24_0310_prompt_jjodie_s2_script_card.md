# Jjodie S2: collapsed script card

Prompt-ID: P-2026-10-24-0310
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: full (implementation S2, code, gates and probe)
Depends: P-2026-10-24-0211, P-2026-10-24-0137, P-2026-10-24-0225
Status: da eseguire
Corregge: none
Request: Alfonso, 2026-10-24 00:40, in the project chat (unattended run)
Model: claude-opus-5-5

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (`docs/discovery/discovery_2026-10-24_jjodie_panel_jjel_live.md`).

Worktree: `~/jjodel-w-jjp-s2`, branch `jjp-s2`, cut from `jjodie-panel` at `26cc36a8c` (S1a, S1b, S3a..S3c, S4a, S4b
merged) plus the commit that adds this prompt. Before anything else: `pwd`, branch, `git log -1`,
`git status --short` (only the `frontend/node_modules` symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-24-0310 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Critical-zone files are not authorised. Time limit: 80 minutes. No subagents, no
background tasks. Commit as soon as the gates are green. One probe run per tool call. Context discipline: never `cat`
a whole large file or log; `MarkdownRenderer.tsx`, `ChatMessages.tsx` and `Jodie.tsx` only by grep-found ranges; test,
build and probe output through `tail` or `grep`. If the context passes about 150k before the probe, commit what is
green, write a handoff and stop with `Outcome: hard-stop`. Dev server only on a free port in 3010..3019 (check with
`lsof`), never 3000, 3001 or 3003; run it as the existing probes do and stop it at the end. Light theme only. Subject
lines without `(P-...)` suffix, Prompt-ID in the body, `Model:` trailer. Log entry in `docs/log-inbox/jjodie-ui-s2.md`.
Nothing merges anywhere: the chat merges.

## Read first, and only this

The report: Q1 (code blocks with Run), Q7 (row S2). Rows R-JJD-2 and R-JJD-1. The log entries
`docs/log-inbox/jjodie-ui.md` (S4a: planner API), `docs/log-inbox/jjodie-ui-s4b.md` (preview store, the
`SCRIPT_PREVIEW_REQUEST` event, `buildPlanWorld`), `docs/log-inbox/jjodie-ui-s1b.md` (code block styling). The S2
paragraph of `docs/prompts/claude_2026-10-24_0020_prompt_jjodie_panel_jjel_live.md`, which is the spec.

## COSA

Slice S2:

1. A generated JjScript block in a Jjodie message is shown as a collapsed card (new `ScriptCard.tsx` and stylesheet;
   grep names first) instead of the open code block: a status line (planned, applied, or the first error with its
   line), the script name (first comment line or `script`) and the line count, effect chips from the planner
   (`+1 StateMachine`, `+4 State`, `+4 Transition`; references as `+N <feature>` when present), the warnings in one
   amber line (count and the first warning, truncated), and actions `Fix warnings`, `Edit script`, `Open as file`.
   The counts come only from the planner over `buildPlanWorld`, never from parsing the text in the card.
2. The card drives the ghost preview: on mount for the newest script card of the conversation, and on click for an
   older one, it fires `SCRIPT_PREVIEW_REQUEST` with the script and the model id. Apply stays on the canvas bar.
   A `Show script` disclosure inside the card reveals the code (S1b styling) for reading and copying.
3. `Fix warnings` sends Jjodie a follow-up message asking to fix the listed warnings (reuse the existing send path of
   the chat; do not touch the AI provider layer or the system prompts). `Edit script` and `Open as file` render
   disabled with a tooltip `Coming in this release` (S5 and S6 wire them).
4. The old Run button on jjscript blocks goes away for blocks that become cards; other code languages are unchanged.
5. Probe under `frontend/scripts/probe/`: inject a Jjodie message with a jjscript block (as the S1b probe injects
   messages), check the card's chips match the planner on the open model, the amber line, the disabled actions, the
   preview bar appearing with the same N, `Show script` revealing the code, and no console errors. Two crops under
   `~/.jjodel-lanes/P-2026-10-24-0310/`.

Gates: typecheck at the baseline of CLAUDE.md §17, vitest (summary lines), build. Commit
(`feat(jjodie): collapsed script card with planned effects`).

## HARD STOP

`Outcome: hard-stop` after the closing docs commit (log entry and Status), with the crop paths and the measures table.

## NON FARE

No edit to the preview bar or `reducer.ts` (another lane is editing them), `EditorV2.tsx`, the AI provider layer,
the system prompts, or any critical-zone file. No merge, no push.
