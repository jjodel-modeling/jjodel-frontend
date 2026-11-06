# Jjodie S3c: JjEL live on the canvas selection

Prompt-ID: P-2026-10-24-0241
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: full (implementation S3c, code, gates and probe)
Depends: P-2026-10-24-0136, P-2026-10-24-0155, P-2026-10-24-0211
Status: eseguito 2026-10-24 · lane jjodie-ui-s3c · 90dd4629a
Corregge: none
Request: Alfonso, 2026-10-24 00:40, in the project chat (unattended run)
Model: claude-opus-5-5

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (`docs/discovery/discovery_2026-10-24_jjodie_panel_jjel_live.md`).

Worktree: `~/jjodel-w-jjp-s3c`, branch `jjp-s3c`, cut from `jjodie-panel` at `4179671bc` (S1a, S1b, S3a, S3b, S4a
merged) plus the commit that adds this prompt. Before anything else: `pwd`, branch, `git log -1`,
`git status --short` (only the `frontend/node_modules` symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-24-0241 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list: Alfonso is asleep. Critical-zone files are not authorised. Time limit: 80
minutes. No subagents, no background tasks. Commit as soon as the gates are green. One probe run per tool call.
Context discipline (the first lane of this front stopped at the 200k ceiling): never `cat` a whole large file or log;
`Jodie.tsx` and `ChatInput.tsx` are read by line ranges found with grep; test, build and probe output through `tail`
or `grep` of the summary lines. If the context passes about 150k before the probe, commit what is green, write a
handoff and stop with `Outcome: hard-stop`. Dev server only on a free port in 3010..3019 (check with `lsof`), never
3000, 3001 or 3003; stop it at the end. Light theme only. Subject lines without `(P-...)` suffix, Prompt-ID in the
body, `Model:` trailer. Log entry in `docs/log-inbox/jjodie-ui-s3c.md`. Nothing merges anywhere: the chat merges.

## Read first, and only this

The report: Q5, Q4, Q7 (row S3c). Row R-JJD-3. The log entries of S3a (`JjelTimeoutError`) in
`docs/log-inbox/jjodie-ui.md` and of S3b (event `CANVAS_SELECTION_CHANGED`, payload `nodeIds` and `elementIds`), and
of S1b (`docs/log-inbox/jjodie-ui-s1b.md`, the composer mode selector). The S3 paragraph of
`docs/prompts/claude_2026-10-24_0020_prompt_jjodie_panel_jjel_live.md`, which is the spec: read it closely.

## COSA

Slice S3c, the spec's S3 in full:

1. In JjEL mode the expression stays in the input after evaluation and is re-evaluated when the canvas selection
   changes (listen to `CANVAS_SELECTION_CHANGED`; the current single selection is the initial target), debounced
   150 ms after the selection settles, bounded by the S3a deadline at 500 ms (`timed out` in the muted style).
2. Above the input a result block: `self <badge> <kind> <path>`, the mode text (`follows selection` or `pinned`) and a
   pin toggle (icon button, `aria-pressed`). Below it the value in mono 15 px, slate-900 (`#0f172a`), with the type in
   12 px slate-400 (`#94a3b8`). No tinted background, no large coloured value, hairlines only, no nested boxes, no
   uppercase section labels in this view. Pin freezes the target set until unpinned.
3. Multi-selection: a compact two-column list, one row per element (path, value).
4. Not applicable (a feature the element's metaclass does not have, the `property-not-found` warning): `not applicable
   to <Kind>` in slate-400 text, not an error style. Parse and runtime errors keep today's error style.
5. Above the result block, a muted history of previous evaluations (`<expr> on <path>   <value>`), last six, newest at
   the bottom.
6. A new `JjelLiveResult.tsx` with its stylesheet (grep names first); `eval.ts` may take an optional `self` parameter
   (additive). Use tokens from `styles/tokens/` where they exist.
7. Probe under `frontend/scripts/probe/`: select one node, then shift-select a second, pin, change selection, unpin,
   evaluate a not-applicable feature, force a timeout if a slow expression is at hand. DOM measures: value font-size 15
   and colour, type 12 and colour, computed background of the result block transparent, `aria-pressed` toggling, list
   rows count, history length capped at 6, debounce observed. Two crops under `~/.jjodel-lanes/P-2026-10-24-0241/`.

Gates: typecheck at the baseline of CLAUDE.md §17, vitest (summary lines), build. Commit
(`feat(jjodie): JjEL live on the canvas selection`).

## HARD STOP

`Outcome: hard-stop` after the closing docs commit (log entry and Status), with the crop paths and the measures table.

## NON FARE

No edit to `EditorV2.tsx`, `reducer.ts`, the JjEL evaluator, the dock code in `JodieWindow.tsx`, the notification
widget or any critical-zone file. No merge, no push.
