# RC-46: no mod reaches a lane unless the harness names it

Prompt-ID: P-2026-10-11-1830
Chat: C-2026-10-11-1735
Front: harness
Request: none (asked in chat C-2026-10-11-1735, whose URL the chat cannot read; approved 2026-10-11 18:16)
Lane: full (lane-run.mjs and the hooks; security of the enforcement layer)
Corregge: —
Status: da eseguire

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P8 non si applica (motivo: no product UI is touched, no visual check is due).

Worktree: `~/jjodel-w-modsguard`, branch `mods-guard`, from `alfonso-frontend-jjtl` after the merge of `mods-disc`.
Before anything else: `pwd`, branch, `git log -1` and `git status` are as stated here, and
`docs/discovery/discovery_2026-10-11_claude_code_mods_harness.md` exists. Otherwise stop.

## Lane discipline
Every reply of this session opens with `[P-2026-10-11-1830 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

## Context (do not redo the analysis)

Read RC-46 in `docs/decisions.md`, the memo `docs/ratifiche/claude_ratifiche_2026-10-11_claude_code_mods.md`, and
the report above (§3.1, §3.3, §4 R1, §5 Q2). Measured there: a loaded mod overrides the deny list and both hooks;
`lane-run.mjs:320-322` builds the flags, `:474` passes `...process.env`, `:915` and `:990` launch; the fold is
visible in `engine.create`; an `ask` under `bypassPermissions` in `-p` is a refusal; `.claude/` is a protected path.

## COSA

**Phase 1** (read-only, then hard stop). Write `docs/discovery/discovery_2026-10-11_mods_guard_rc46.md` (P4) with:
1. How `lane-run` can learn the fold before launching (installed plugins with a hooks module, `enabledPlugins`,
   `CLAUDE_CODE_PLUGIN_DIRS`, the built-ins it must allow by name), with the command or file that tells it.
2. Where the write refusal for `~/.claude/settings.json`, `~/.claude/plugins/` and `.claude-plugin/` under a skills
   folder belongs: `critical-zone.mjs` (already on `Edit|Write`), `bash-guard.mjs` (Bash forms), a deny row, or
   more than one; which of them needs an edit to `.claude/settings.json`, which a lane session cannot make.
3. The test plan: unit tests for each refusal and a probe with a scratch mod under `/tmp` proving `start` refuses.
4. The file list for Phase 2 and the Layer Impact note if any §3.2 file appears (none expected).

**Phase 2** only after a GO by `lane-run resume`: tests first, implementation, gates, docs commit with the log entry.

## HARD STOP
After the Phase 1 report and its docs commit, exit with `Outcome: hard-stop`.
If Phase 2 needs `.claude/settings.json`, stop with `Outcome: question`: Alfonso edits it by hand.

## NON FARE
- No mod is loaded by `lane-run` in this lane (that is RC-47). No `sec-default`, no managed settings, no system file.
- Do not touch `~/.claude/` itself; probes only under `/tmp` and in `~/jjodel-w-modsguard`.
- No probe forces a command past a guard except the one under test. No `git push`.
- No absence claim without the search that supports it (R-RAIL-28); quote globs (R-RAIL-31).

## RIFERIMENTI
- `docs/discovery/discovery_2026-10-11_claude_code_mods_harness.md`, `docs/discovery/harness/mods/`
- `docs/decisions.md` RC-15, RC-19, RC-20, RC-46; `docs/HARNESS-DOCS.md` §6
- `frontend/scripts/lane-run.mjs`, `frontend/scripts/hooks/bash-guard.mjs`, `frontend/scripts/hooks/critical-zone.mjs`
