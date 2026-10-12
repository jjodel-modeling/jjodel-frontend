# Prompt: release 3.1, L4, version 3.1.0, changelog and release checklist crops

Prompt-ID: P-2026-10-12-0115
Chat: C-2026-10-11-1812
Front: release-3-2
Lane: full (release commit on the merged trunk; gates on the combined tree)
Depends: P-2026-10-12-0010, P-2026-10-12-0011, P-2026-10-12-0012
Request: none (Alfonso, 2026-10-12 00:06, "ok alle raccomandazioni, procedi in lane auto"; L4 and D4 of the 1812 report)
Status: eseguito 2026-10-12 · lane rel31-version · 4c681e535 · hard-stop, gates at baseline on the combined tree, 15 crops; merged 839f0d801 (visual GO pending: D-A1 differs from control, Petri p1 dots)

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply.

Worktree: `~/jjodel-w-rel31-version`, branch `rel31-version`, created by the chat from `alfonso-frontend-jjtl` at the docs commit that added this prompt (the trunk now holds L1, L2 and L3 merged), with `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-12-0115 · session <id>]` and ends with an `Outcome:` line (P16). Gates run in the foreground.

## COSA

Read first: §8.1 to §8.4 of `docs/discovery/discovery_2026-10-11_release_3_1_scope.md`, and the reports `docs/discovery/discovery_2026-10-12_rel31_staging_merge.md`, `..._rel31_drag_hardening.md`, `..._rel31_codegen_flag.md`.

1. **Gates on the combined tree first**, before any edit: typecheck (baseline 14), vitest (counts and the known reds), build without `VITE_CODEGEN`, smoke on a dev server of this tree on port 3144, check:docs, check:codegen-lazy both modes. Any regression caused by the combination of the three merges is a stop with `Outcome: question` and a diagnosis.
2. **Version 3.1.0**: `frontend/package.json` and `frontend/package-lock.json` (the root entry only), `frontend/src/pages/components/about/AboutDialog.tsx` (`v3.0.0` to `v3.1.0`). Find any other user-visible version string (footer, WelcomeModal, `scripts/smoke/states.ts:186` per §8.3) and change it only if it shows 3.0.0 to the user; list what you found.
3. **CHANGELOG.md**: a `## [3.1.0] - 2026-10-12` section built from what is in `## [Unreleased]` plus the inventory of §8.1 and the staging fixes brought by L1 (#157 A/B, #168, #171, #173, #174, #175, #176, #178, #179, #182), in user-facing terms, grouped Added / Changed / Fixed / Removed. Line 64 («dark theme not maintained») moves to `### Removed` (the dark theme is gone). Say that 3.1 saves projects in format 2.230 and opens 2.228, 2.229 and 2.230 saves. Say nothing about the code generator except that it is not part of this release. Keep `## [Unreleased]` as an empty heading above.
4. **Decision row (D4)** in `docs/decisions.md`, appended at the end in the file's row format: the 2026-10-11 scope decision, «3.1.0 ships now from the trunk with origin/staging absorbed and without the code generator (hidden behind the `VITE_CODEGEN` build flag); the generator ships in 3.2», amending R-GEN-1's «no separate 3.1 tag». Ratified by Alfonso 2026-10-12.
5. **Checklist crops for RC-23** on the release build (`npm run build` then `npx vite preview` on port 3144, no `VITE_CODEGEN`): one crop each, saved in the lane folder `~/.jjodel-lanes/P-2026-10-12-0115/crops/`: a new project with default class and object views; the Symbol Editor open on a symbol; a simulator run on Petri classic including one node drag; a JjScript run; Jodie refusing a reserved name; Settings → Advanced without the Experimental group; the editor without the Code pill; Appearance without a Dark option; About reading v3.1.0; D-A1 from the L1 report (a nested instance created with «Add» under a graphVertex container, before and after Auto layout). Describe each crop in one line in the report; do not judge them as passed: the visual GO is Alfonso's.

Report: `docs/discovery/discovery_2026-10-12_rel31_version.md` with the gate table, the files changed, the crop list, «Decisions taken (unattended)» and «Decisions awaiting Alfonso». Log entry in `docs/log-inbox/release-3-1-version.md`. Commit (`chore(release): 3.1.0` for the version and changelog, a separate docs commit for the decision row and the report), then stop with `Outcome: hard-stop`.

## NON FARE

No push, no tag, no PR, no merge into the trunk or `staging`. No source change other than the version strings. Do not touch `vite.config.ts` (the orphan `runner.worker` is a question for Alfonso), `redux/VersionFixer.tsx`, or the codegen files.

## RIFERIMENTI

CLAUDE.md §3, §17; PROTOCOL P4, P8, P9, P14, P16; RC-23; R-GEN-1 in docs/decisions.md.
