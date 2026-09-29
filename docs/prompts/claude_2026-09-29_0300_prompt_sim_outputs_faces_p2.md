# Prompt: outputs faces Phase 2, the four presets in the selects, the M2 rows and the faces of Accepting, Moore and Mealy

Prompt-ID: P-2026-09-29-0300
Chat: C-2026-09-28-1936
Lane: full (Phase 2, simulation panel and roles dialog, tests first). Tier: heavy.
Status: da eseguire

Worktree: `~/jjodel-w-faces2`, branch `sim-outputs-faces` (cut by the chat from `sim-outputs-faces-disc` at `904bab148`, which is the trunk `c2560b69e` plus the discovery of P-2026-09-29-0239; `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-faces2`, branch `sim-outputs-faces`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked` and say which.

## COSA

Implement the plan of `docs/discovery/discovery_2026-09-29_sim_outputs_faces.md` (on this branch), all of it: DFA, NFA, Moore and Mealy in `PANEL_PROFILE_IDS` (the panel's Profile select and the dialog's header select, after Extended state machine; not the first-open picker); `UNREAD_ROLES` no longer hides Accepting, State output, Transition output in the profiles that read them; `simAccepting` in `ROLE_SPECS` for the Reset overlap check; the three faces exactly as §0 gives them (status row `Running · accepting`, `Output: <value>` under `Marking:` from Reset to Stop, `, output <value>` in «Last step» with its title), fixed slots, no layout shift.

The two decisions the discovery names are taken by the chat on Alfonso's delegation:

1. Presets before the freeze: Alfonso said on 2026-09-28 that nothing is deferred except the `.smv` generation. Add a row **R-SIM-95** to `docs/decisions.md`, in the section of R-SIM-94, amending R-SIM-93 on this point, header exactly in this form: `- **R-SIM-95** (2026-09-29, decided by the chat on Alfonso's delegation 2026-09-29, evidence: read, verified: none, reversible: branch).` Body: two or three lines, citing his words and the discovery.
2. No DFA or Moore scene in the demo: the script keeps «The outputs profiles» out. One line in the same row.

## DOVE

- The ten files of the discovery's `Recommended:` (six code, four test), exactly as it lists them; plus `docs/decisions.md` (the R-SIM-95 row, add-only).
- Closure: `docs/log-inbox/simulation.md` and this prompt's Status.

Not touched: `netCompile.ts`, `netStep.ts`, the first-open picker, the critical zone, `irTypes.ts`, the `.smv` generation. Exported interfaces: additive only.

## COME

1. Read `CLAUDE.md` (§6, Rule 11, §21.2, SCSS and naming rules), `docs/PROTOCOL.md` P16, RC-20..RC-22, RC-33, RC-34, R-SIM-86, R-SIM-90..94, and the discovery end to end. Grep every new identifier and class name before introducing it.
2. Baseline: typecheck count, vitest of `src/model/simulation` and `src/components/editor-v2/sim`.
3. Tests first (red before, green after): the eight presets in both selects, in order; the M2 rows of DFA/Moore/Mealy visible and bindable, `Missing: Accepting.` turning `checkable`; the three faces with exact texts, `Output: none`, absent when the net has no outputs; the four demo profiles unchanged (no key written, M1 lines identical). Mutation bench: drop the preset ids, the accepting span, the Mealy suffix.
4. Implement, one commit per layer, each green.
5. Gates: `npm run typecheck` (14, the known set), the two vitest folders green, the full vitest with its known reds unchanged (name them), `npm run build`, `check:docs` 4/4 (the R-SIM-95 header must parse in `docs:digest`), `check:addonly`.
6. A lane probe on port 3046 (`lane-run probe`, never 3001), light theme: a DFA metamodel from §7 of the discovery bound with the DFA preset, run to an accepting state (crop of the status row); a Moore and a Mealy run (crops of `Output:` and «Last step»); the dialog of the ESM scene with the fold count. Crops at `sips -Z 600` under `docs/discovery/harness/_tmp_faces_*.png` (gitignored). Measure that nothing in the panel changes height between Reset, a step and Stop.
7. Commits as above, then one docs commit with the log entry and this prompt's Status. Do not merge. Stop with `Outcome: hard-stop`, the shas, the diff stat, the counts, the probe readings and the crop paths.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree, a critical-zone file, dark-theme work, a new dependency.

## RIFERIMENTI

- The discovery of P-2026-09-29-0239 (§0, §3.7, §7, `Recommended:`); `docs/decisions.md` R-SIM-86, R-SIM-90..94; `docs/demo/models_2026_simulator_demo.md` §5.
