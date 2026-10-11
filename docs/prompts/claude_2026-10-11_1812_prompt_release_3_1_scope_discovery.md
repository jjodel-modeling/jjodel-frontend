# Release 3.1: scope and readiness discovery

Prompt-ID: P-2026-10-11-1812
Chat: C-2026-10-11-1812
Front: release-3-2
Lane: full (release scope across every front since 3.0, persistence and migrations in scope)
Depends: none
Request: none (given in the project chat on 2026-10-11; his words kept locally via lane-run --request)
Status: eseguito 2026-10-11 · lane release-3-1-disc · cc9e3e4df · hard-stop, D1-D9 ratified as recommended by Alfonso 2026-10-12 00:06

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-release31`, branch `release-3-1-disc`, created by the chat from `alfonso-frontend-jjtl` right after the docs commit that added this prompt, with `frontend/node_modules` symlinked to `/Users/alfonso/jjodel/frontend/node_modules` as P14 allows. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-release31`, branch `release-3-1-disc`, `git log -1` is the docs commit that added this prompt. If any differs, stop with `Outcome: blocked`. Record that sha in the first line of the report: every finding is about it.

## Lane discipline
Every reply of this session opens with `[P-2026-10-11-1812 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

## Context (do not redo the analysis)

3.1 is an intermediate release on the `release-3-2` front (3.2 for the MDE course: freeze 2026-10-23, live 2026-10-26). 3.1 ships now without the code generator; 3.2 adds it.

Jjodel 3.0 shipped on 2026-09-15: PR #144 merged into `staging` at `cb699ad58`, tag `3.0.0`, live on `app.jjodel.io`. Since then the trunk has accumulated many commits, most of them not pushed to origin.

Alfonso's scope decision for 3.1 (2026-10-11): **everything on the trunk ships, except the model-to-text code generator** (spec `docs/spec/claude_spec_2026-10-10_code_generation_pilot.md`, R-GEN-1..R-GEN-9). GraphVertex ships. The default-view parity work (R-IRN-29..36) is not optional and ships by construction.

The release is cut from the trunk, never by cherry-picking: excluded features are switched off, not removed. R-GEN already requires the generator behind a user-level experimental setting, off by default, with no generator module loaded when off.

Known items before the cut:
- The drag loop on object-as-edge views (report `docs/discovery/discovery_2026-10-10_petri_classic_drag_loop.md`) crashes 18 of 18 first drags on the tip with Petri classic. Fix A plus guard B are proposed and not launched. It is a release blocker.
- D-UI-15: Jjodel has no dark theme, but the Dark radio in `AppearanceSettings.tsx` may still be reachable.
- Branch `elk-handles-a3` is not merged and stays out unless Alfonso ratifies R-VP-60.
- R-SIM-145 is not ratified and stays out of 3.1.

## COSA

Phase 1 only, read-only. No source file changes. Produce one report.

1. **Inventory.** List the commits from `cb699ad58` (or the `3.0.0` tag, verify they agree) to the start sha, grouped by front (simulator, symbol editor, JjScript and Jjodie, IR and views, codegen, harness and docs, other). For each front, name the user-facing features in one line each with the main commit or merge. Count commits not on origin.
2. **Code generator gate.** Find every piece of codegen code on the trunk (start from `codegen-runner`, `codegen`, `generator`, R-GEN identifiers). State for each: is it behind the experimental setting; is that setting off by default; is any generator module imported statically on a path loaded when the setting is off (check the bundle, not just the source: `npm run build` and inspect the chunks); is any UI entry (menu, button, tab, command, Jjodie action) visible with the setting off. If the gate is incomplete, propose the smallest change that completes it, with files and line ranges. Do not implement it.
3. **Persistence and migrations since 3.0.** Every change to the saved project format between `cb699ad58` and the start sha: VersionFixer bumps, new annotation keys (`jjodel/<key>`), new persisted fields (simulator roles, STC keys, FormSpec, TextStyle, cornerRadius, scenarios). For each: does a project saved in 3.0 open in 3.1 unchanged or migrated, and is that migration covered by a test. Flag anything whose persistence would leak a codegen field into saved projects. Run, if feasible, a load of a 3.0-era project fixture from the repo and report the result.
4. **Dark theme reachability.** Where the user can still select or land on a dark theme (radio, saved preference, system preference). Propose the smallest hide, not the removal lane.
5. **Blockers.** Classify open user-facing defects as blocker or not for 3.1, with one-line rationale: the drag loop, plus the open items in `docs/TECH-DEBT.md`, open tickets in `docs/decisions.md`, and the medium-priority bugs listed in the trunk's session and context documents. Keep blockers to defects that crash, lose data or corrupt a saved project.
6. **Release mechanics.** How 3.0 actually reached `app.jjodel.io`: PR flow to `staging`, tag, GitHub Actions workflow, any manual step outside git. Where the version string lives (package.json, About dialog, any constant) and what must change for 3.1.0. Whether a changelog or release notes exist and where.
7. **Gates at the start sha.** Run typecheck (baseline 14, CLAUDE.md §17), vitest, build, `npm run smoke`, `npm run check:docs`. Report the numbers against baselines.
8. **Proposal.** The cut: the sha to release from (the start sha plus the drag loop fix and the codegen gate, if needed), the sequence of lanes to get there with file sets, which can run in parallel, and the visual checklist for RC-23 on the release build (default views, symbol editor, simulator run including a Petri drag, JjScript, Jjodie reserved names, no codegen entry, no dark theme).

Report: `docs/discovery/discovery_2026-10-11_release_3_1_scope.md` (P4). It closes with «Decisions taken (unattended)» and «Decisions awaiting Alfonso» (RC-26: push, deletions and anything that changes what ships go to the second list). Commit the report alone on `release-3-1-disc`, plus the `docs/claude-code-log.md` entry, then stop.

## HARD STOP

After the report commit. Phase 1 is a session boundary (RC-26), not a human gate: end with `Outcome: hard-stop`.

## NON FARE

No edits to source files, configuration or `docs/` other than the report and the log entry. No push. No merge into the trunk. No tag. No branch other than `release-3-1-disc`. No changes to `staging`. Do not launch or resume other lanes. Do not remove dark theme code.

## RIFERIMENTI

`CLAUDE.md` (§3 critical zone, §17 commands and baselines), `docs/PROTOCOL.md` (P4, P13, P16), `docs/decisions.md` (D-UI-15, R-GEN, RC-23, RC-26), `docs/spec/claude_spec_2026-10-10_code_generation_pilot.md`, `docs/discovery/discovery_2026-10-10_petri_classic_drag_loop.md`, `docs/TECH-DEBT.md`.
