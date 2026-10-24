# Jjodie S1b: header, composer and code blocks

Prompt-ID: P-2026-10-24-0211
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: full (implementation S1b, code, gates and probe)
Depends: P-2026-10-24-0135
Status: da eseguire
Corregge: none
Request: Alfonso, 2026-10-24 00:40, in the project chat (unattended run)
Model: claude-opus-5-5

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (`docs/discovery/discovery_2026-10-24_jjodie_panel_jjel_live.md`).

Worktree: `~/jjodel-w-jjp-s1b`, branch `jjp-s1b`, cut from `jjodie-panel` at `8ab7500f1` (S1a merged) plus the commit
that adds this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the
`frontend/node_modules` symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-24-0211 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list: Alfonso is asleep. Critical-zone files are not authorised. Time limit: 75
minutes. No subagents, no background tasks. Commit as soon as the gates are green. One probe run per tool call.
Context discipline (the first lane of this front stopped at the 200k ceiling): never `cat` a whole large file or log;
`ChatInput.tsx` (871 lines) and `JodieHeader.tsx` are read by line ranges; test, build and probe output through `tail`
or `grep` of the summary lines. If the context passes about 150k before the probe, commit the code, write a handoff
and stop with `Outcome: hard-stop`: the probe becomes its own lane. Dev server only on a free port in 3010..3019
(check with `lsof`), never 3000, 3001 or 3003; stop it at the end. Light theme only. Subject lines without `(P-...)`
suffix, Prompt-ID in the body, `Model:` trailer. Log entry in `docs/log-inbox/jjodie-ui-s1b.md` (a file of its own).
Nothing merges anywhere: the chat merges `jjp-s1b` into `jjodie-panel`.

## Read first, and only this

The report: Q1 (header, composer, code blocks), Q7 (row S1b). Row R-JJD-1. The S1 paragraph of
`docs/prompts/claude_2026-10-24_0020_prompt_jjodie_panel_jjel_live.md`.

## COSA

Slice S1b:

1. Header: avatar, name, status dot, context chip, a new-conversation button (the existing Clear action, with a
   «New conversation» label and tooltip), an overflow menu (holding Reset and any header action that is not listed
   here), close. The Jjodie / JjScript / JjEL mode switch leaves the header. The fullscreen button is already gone.
2. Composer: the mode switch becomes a compact selector inside the input field, on its left side, keyboard reachable,
   same modes and same state as today. The model selector and the AI disclaimer move to one line of 11.5 px under the
   input. The JjEL scope hint stays visible in JjEL mode, in that same line or right above the input.
3. Code blocks in messages: no nested card padding; soft wrap with a hanging indent of 4ch on wrapped lines. The Run
   button and its behaviour are unchanged (S2 replaces them later).
4. Probe (a script under `frontend/scripts/probe/`): header contents and order, the mode selector inside the input
   (bounding box within the input's box), the 11.5 px line under the input, code block padding and wrap with a long
   line, console free of new errors. Two crops under `~/.jjodel-lanes/P-2026-10-24-0211/`.

Gates: typecheck at the baseline of CLAUDE.md §17, vitest (summary lines), build. Commit
(`feat(jjodie): header, composer selector and code block wrap`).

## HARD STOP

`Outcome: hard-stop` after the closing docs commit (log entry and Status), with the crop paths and the measures: the
chat runs RC-23.

## NON FARE

No edit to `Jodie.tsx` beyond what moving the mode switch strictly needs (say what in the log), no edit to
`JodieWindow.tsx` dock code, `EditorV2.tsx`, `reducer.ts` or any critical-zone file. No merge, no push.
