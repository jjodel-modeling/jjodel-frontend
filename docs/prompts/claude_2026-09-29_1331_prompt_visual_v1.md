# Prompt: visual lane V1, the derived control-flow views (state machine, ESM, activity) closer to the textbook, IR data only

Prompt-ID: P-2026-09-29-1331
Chat: C-2026-09-28-1936
Lane: full (Phase 2 of the visual concrete syntax discovery, lane V1; derivation only; tests first). Tier: heavy.
Status: da eseguire

Worktree: `~/jjodel-w-v1`, branch `visual-v1` (cut by the chat from `alfonso-frontend-jjtl` at `afa951c64`, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-v1`, branch `visual-v1`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked` and say which.

## COSA

Implement lane V1 of `docs/discovery/discovery_2026-09-29_visual_concrete_syntax.md` (branch `visual-syntax-disc`; read it with `git show visual-syntax-disc:docs/discovery/discovery_2026-09-29_visual_concrete_syntax.md`), §5, all of it, IR data only, in the viewpoint derivation. Alfonso, 2026-09-29, approved V1 before the freeze and ratified the report's recommendations for it, including (his answers):

- edge labels from the bound roles: the event (`simTrigger`) on transitions, the guard (`simGuard`) as raw text on flows; no `event [guard] / action` template (needs an IR change, later); first measure whether `$event.value` prints the event's name, and say what you used;
- dark line ink on the control-flow kinds, as Petri has (`var(--color-inode-name)`);
- centred names in boxes with no compartment;
- fork and join as the existing `bar` form;
- state machines keep the named box for Initial and Terminal (Alfonso: «Box with name»): Terminal with the existing `double` border (`irTypes.ts:174`); Initial unchanged in V1 (the dot badge needs an IR change, later); activity gets the nameless dot and bull's-eye with what the IR already allows (the bull's-eye in ink, `IRNodeContent.tsx:452`), and says what it could not reach.

Record a row **R-VP-17** in `docs/decisions.md` after R-VP-16, header exactly: `- **R-VP-17** (2026-09-29, ratified by Alfonso 2026-09-29, evidence: measured, verified: none, reversible: branch).` Body: the V1 list, the Initial/Terminal choice, what stays for V4.

No `viewpoint/ir/` or `viewpoint/authoring/` file (no §3.1), no critical zone, no default notation (that is V2, another lane running in parallel on the renderer and styles: do not touch its files). Petri views unchanged (R-VP-16).

## DOVE

- `frontend/src/components/editor-v2/viewpoint/derive/viewpointDerivation.ts` and its test; `docs/decisions.md` (the row, add-only).
- Closure: `docs/log-inbox/views.md` and this prompt's Status.

## COME

1. Read `CLAUDE.md` (§6, Rule 11, §21.2, critical zone), `docs/PROTOCOL.md` P16, RC-20..RC-22, RC-33, RC-34, R-VP-15, R-VP-16, and the discovery end to end (§2, §3, §5).
2. Baseline: typecheck count, vitest of the derive folder.
3. Tests first (red, then green): per kind (SM on DemoPEST, ESM on DemoESM, activity on DemoFlowB), the traits V1 claims; Petri documents byte-identical to today; without roles the documents unchanged; every document passes `validateIR`. Mutation bench.
4. Gates: `npm run typecheck` (14, the known set), the touched vitest folders green, full vitest with the 9 known reds only (a `laneRun.test.ts` 5 s timeout under load is known: re-run that file alone and report), `npm run build`, `check:docs` 4/4 (the row parses in `docs:digest`), `check:addonly`.
5. A lane probe on port 3054 (`lane-run probe`, never 3001), light theme, 1600×1000; setup per the trunk (Advanced, Properties → Semantic Type Class → Simulation on, the preset, Apply; use `~/.jjodel-lanes/probe-kit/simgate/` and adapt). For the three kinds: «Derive viewpoint», open its tab, crop at `sips -Z 600` under `docs/discovery/harness/_tmp_v1_*.png` (gitignored); re-score the discovery's trait tables, measured.
6. Commits one per layer, then one docs commit (row, log entry, Status). Do not merge. Stop with `Outcome: hard-stop`, the shas, the diff stat, the gates, the scores and the crop paths.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree, a critical-zone file, `viewpoint/ir/`, dark-theme work, a new dependency.

## RIFERIMENTI

- The visual concrete syntax discovery (§0, §5); R-VP-15, R-VP-16.
