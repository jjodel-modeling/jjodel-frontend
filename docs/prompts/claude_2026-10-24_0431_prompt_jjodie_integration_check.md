# Jjodie panel front: integration check of the jjodie-panel branch

Prompt-ID: P-2026-10-24-0431
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: full (verification only, no product change)
Depends: P-2026-10-24-0350
Status: eseguito 2026-10-24 · lane jjp-fin · 781310074 · T1 closed by P-2026-10-24-0505 (99702d7ea)
Corregge: none
Request: Alfonso, 2026-10-24 00:40, in the project chat (unattended run)
Model: claude-opus-5-5

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-jjp-fin`, branch `jjp-fin`, cut from `jjodie-panel` at `3e7dfcfa8` (S1..S6b, the fixes and the
formatter merged) plus the commit that adds this prompt. Before anything else: `pwd`, branch, `git log -1`,
`git status --short` (only the `frontend/node_modules` symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-24-0431 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`. Unattended. Time limit: 90 minutes. No subagents, no background
tasks. One probe run per tool call. Context discipline: every command's output read through `tail` or `grep` of its
summary lines; never `cat` a log. Dev server only on a free port in 3010..3019 (check with `lsof`; another lane may
hold one), never 3000, 3001 or 3003; stop it at the end. Light theme only. Subject lines without `(P-...)` suffix,
Prompt-ID in the body, `Model:` trailer. Nothing merges anywhere.

## COSA

The branch `jjodie-panel` was assembled tonight from fourteen lane branches merged one by one; each lane ran its gates
on its own base, never on the merged tip. Verify the tip:

1. `npm run typecheck` (baseline of CLAUDE.md §17), `npx vitest run` (summary), `npm run build`, `npm run smoke`,
   `npm run check:scripts`, `npm run check:docs`.
2. Every probe of the front, one per tool call, in this order: `canvas-multi-selection.ts`, `jjodie-dock.ts`,
   `jjodie-s1b-header-composer.ts`, `jjodie-s3c-jjel-live.ts`, `jjodie-s4b-ghost-preview.ts`,
   `jjodie-s4c-apply-undo.ts`, `jjodie-s2-script-card.ts`, `jjodie-s5-script-editor.ts`, `jjodie-s6a-script-file.ts`,
   `jjodie-s6b-scripts-listing.ts` (run each as its own lane ran it; read its header for the invocation).
3. Fix nothing. Write the results as a table (command or probe, result, failing assertions with their message) in a
   report `docs/discovery/discovery_2026-10-24_jjodie_panel_integration_check.md`, with a ticket line for each failure
   that names the slice most likely responsible, and a log entry in `docs/log-inbox/jjodie-ui-fin.md`. Commit both
   docs-only.

## HARD STOP

`Outcome: done` after the commit, with the table in the final message.

## NON FARE

No edit under `frontend/src` or to the probes. No merge, no push.
