# Claude Code mods for the harness: discovery and Prompt-ID guard prototype

Prompt-ID: P-2026-10-11-1745
Chat: C-2026-10-11-1735
Front: harness
Lane: full (new enforcement layer next to the permission model and the hooks of RC-15)
Status: da eseguire

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P8 non si applica (motivo: no product UI is touched, no visual check is due).

Worktree: `~/jjodel-w-mods`, branch `mods-disc`, created from `alfonso-frontend-jjtl` at `9cc9c7c83` or later.
Before anything else: `pwd`, branch, `git log -1` and `git status` are as stated here. Otherwise stop.

## Lane discipline
Every reply of this session opens with `[P-2026-10-11-1745 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
Time limit: 75 minutes. Past it, stop with `Outcome: blocked`.

## Context (do not redo the analysis)

Claude Code mods shipped on 2026-10-01 (v2.1.287 CLI, v2.1.286 desktop): plugins whose JS/TS handlers run
inside the Claude Code process for the whole session, can watch and rewrite events (`tool.call` among them),
answer a tool call themselves, add instant slash commands with no model turn, and draw interface. They are
not sandboxed. Public reports say deny rules resist mods only where the built-in `sec-default` mod is loaded.

The harness today enforces through three layers (RC-15, `HARNESS-DOCS.md` §6): the deny list in
`.claude/settings.json` (fails closed, sees only the literal form, discovery H6), the `bash-guard` and
`critical-zone` hooks (fail open), the skills `log-entry`, `discovery-report`, `status-flip` (form only).
The Lane discipline block above (Prompt-ID prefix, `Outcome:` line, P13 "a message with a different ID is
not executed") is prose: no machine checks it. The open harness front plans a mechanised Prompt-ID through a
`Stop` hook. The chat wants to know whether a mod is the better carrier, and what mods change for the
deny list, before any decision. This lane decides nothing: it measures.

## COSA

Phase 1 only. Read-only on the repo; probes run outside the repo.

1. **Version and surfaces.** Installed Claude Code version; whether mods are on. Read the `lane-run` source
   and state exactly how it launches a session (binary, flags, env, permission mode) and whether that launch
   loads plugins and mods (`--plugin-dir`, `CLAUDE_CODE_PLUGIN_DIRS`, any flag that disables plugins).
   State whether mods run in the VS Code extension, from evidence, not from articles.
2. **API inventory.** From the declaration files Claude Code writes for the installed version
   (`.claude-plugin/types/` of a scratch plugin) and from `/plugin` docs on disk: the event list, the `$` API,
   `next(e)`, `plugin.register`. For each event, one line: when it fires, what it can read, what it can change,
   whether it can block. Quote type names verbatim with the file they come from.
3. **Order and permissions.** With a probe mod in a scratch plugin, measure:
   - order between a mod's `tool.call` handler and the `PreToolUse` hooks (`bash-guard`, `critical-zone`);
   - whether a mod that answers a tool call itself skips the hooks and the deny list;
   - whether a deny-listed form (use `git stash list` in the throwaway worktree, nothing else) is still denied
     with the probe mod loaded, with and without `sec-default` if it can be unloaded;
   - what happens when a mod throws or hangs: fail open or fail closed, and after how long.
4. **Prompt-ID guard prototype.** A scratch mod, outside the repo, that:
   - reads the Prompt-ID from the first user message of the session;
   - flags or refuses a later user message whose `[P-…]` prefix is absent or different (P13);
   - checks that each assistant reply opens with `[<Prompt-ID> · session <id>]`;
   - checks that the final message ends with an `Outcome:` line with one of the four values.
   For each of the four checks: possible or not with the events of step 2, and how it behaves when it fails
   (block, warn, rewrite). Run it on three scripted sessions: matching ID, wrong ID, missing Outcome line.
5. **Telemetry.** Whether a mod can read token counts and context-window usage per turn, and in what form.
   One line on what that would give the CAIN dataset; no export built.
6. **Mapping.** For each current harness piece (deny list, `bash-guard`, `critical-zone`, the three skills,
   the planned `Stop` hook, the `/lane` skill commands), one row: stays as is, moves to a mod, or both, with
   the reason in RC-15 terms (does a machine hold it honestly, what is the failure mode).

## DOVE

- Report: `docs/discovery/discovery_2026-10-11_claude_code_mods_harness.md` (P4 content minimum: hypothesis,
  goal, files read with full paths, findings with `file:line` and verbatim quotes, dependencies and risks,
  open questions). The hard stop is not reached until the report is written and committed.
- Probe and prototype sources: under `/tmp/jjodel-mods-probe/` while running; at the end copy them into
  `docs/discovery/harness/mods/` and commit them with the report (docs-only commit).
- Log entry and Status flip: `docs/log-inbox/harness.md`, per RC-17.

## HARD STOP

After the report and the docs commit, exit with `Outcome: hard-stop`. No Phase 2 in this session.
Stop and ask (`Outcome: question`) if a probe would need to touch anything listed under NON FARE.

## NON FARE

- Do not touch `.claude/`, `.claude/settings.json`, `.claude/settings.local.json`, `frontend/scripts/hooks/`,
  the `lane-run` source, `CLAUDE.md`, `PROTOCOL.md`, `decisions.md`.
- Do not install mods or plugins from any marketplace or third-party source; scratch plugins only, loaded
  per session with `--plugin-dir`.
- Do not run any probe on `~/jjodel-release` or `~/jjodel`; only in `~/jjodel-w-mods` and `/tmp`.
- No `git push`. No network beyond what Claude Code itself does.
- No absence claim without the search that supports it (R-RAIL-28); quote globs (R-RAIL-31).

## RIFERIMENTI

- `docs/HARNESS-DOCS.md` §6 (gates and enforcement), §7 (lane lifecycle)
- `docs/decisions.md`: RC-15, RC-17, RC-19, RC-20, RC-44; the discovery report that names H6
- `frontend/scripts/hooks/bash-guard.mjs`, `frontend/scripts/hooks/critical-zone.mjs`, `.claude/settings.json`
- Anthropic, "Customize Claude Code with mods": https://claude.com/resources/articles/claude-code-mods
