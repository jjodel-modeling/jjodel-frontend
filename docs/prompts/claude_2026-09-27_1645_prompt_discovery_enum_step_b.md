# Prompt: discovery, enum step B (S23): load, undo/redo and replay against the setters it would guard

Prompt-ID: P-2026-09-27-1645
Chat: C-2026-09-27-1437
Lane: full (Phase 1 of a core change, read-only; hard stop at the report)
Status: eseguito 2026-09-27 · lane enum-step-b · the commit that carries this line (docs-only discovery; its sha is in the hard stop)

Worktree: `~/jjodel-gate`, branch `enum-step-b` (cut by the chat from `alfonso-frontend-jjtl` at `bbd9b7142`), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-gate`, branch `enum-step-b`, `git log -1` is the docs commit that added this prompt; if any of the three differs, stop with `Outcome: blocked` and say which.

## COSA

Wave 1, lane 1 of the backlog report (P-2026-09-27-1625). Its scope is item S23 and the wave-1 row `enum-step-b`: measure load, undo/redo and VersionFixer replay through `set_type` / `_canExtend` (the R-EDGE-2 precondition), so that step B (the model invariant plus the Ecore import) can be designed, and so that decision G of that report (the saved-states detector, S24, R-EDGE-3, due by 2026-10-04) has the measurements it needs. The report is on branch `simulation-engine`, not on the trunk: read it with `git show simulation-engine:docs/discovery/discovery_2026-09-27_sim_backlog_lanes.md` (§4.7 S23, §4.8, §5 wave 1, §8 G). Critical-zone files are read only.

## DOVE

Read-only: every file S23 and R-EDGE-1..3 name, `VersionFixer.tsx`, the enum edge guard of lane P-2026-09-27-0035 and its report. Write: `docs/discovery/discovery_2026-09-27_enum_step_b.md` (new), one entry in `docs/log-inbox/views.md`, this prompt's Status flip. Probes (gitignored `_tmp_enumb_*`) on port 3017 only.

## COME

1. Read `CLAUDE.md`, the backlog report sections above, R-EDGE-1..3 in `docs/decisions.md`, and the files.
2. Measure, with probes, what happens on load, undo/redo and VersionFixer replay of a model whose enum edges step B would forbid: which setter runs, with which arguments, and whether a guard at that point would reject a legitimate replay.
3. Report: objective, files read, the measurements, the design options for step B with their risks, the options for S24 (producer vs migration) with what each needs, «Decisions taken (unattended)», «Decisions awaiting Alfonso».
4. One docs commit with the report, the log entry and the Status flip: `docs(views): enum step B discovery (P-2026-09-27-1645)`.
5. `Outcome: hard-stop` with the sha.

Never: an edit under `frontend/src`, `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree, ports other than 3017.

## RIFERIMENTI

- Backlog report (above) §4.7, §5, §8; `docs/decisions.md` R-EDGE-1..3; lane P-2026-09-27-0035.
- `docs/PROTOCOL.md` P13, P16; RC-22, RC-25, RC-26, RC-30.
