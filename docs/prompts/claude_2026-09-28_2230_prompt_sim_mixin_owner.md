# Prompt: R-SIM-89, a feature on a sibling (mixin) owner is a warning in the roles dialog

Prompt-ID: P-2026-09-28-2230
Chat: C-2026-09-28-1936
Lane: fast (one verdict rule in `judge`, its tests, one engine test; no discovery). Tier: light.
Status: eseguito 2026-09-28 · lane sim-mixin-owner · 68dbbc1fb (fix), 18e63e184 (discovery) · verifica visiva non eseguita da questa sessione (il prompt vieta dev server/probe qui: le quattro scene demo restano da verificare alla chat prima del merge)

Worktree: `~/jjodel-w-mixin`, branch `sim-mixin-owner` (cut by the chat from `alfonso-frontend-jjtl` at `d3dbacb36`, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-mixin`, branch `sim-mixin-owner`, `git log -1` is the docs commit that added this prompt and the R-SIM-89 row; if any of the three differs, stop with `Outcome: blocked` and say which.

## COSA

A flowchart metamodel with an abstract mixin `ActionElement { action : Action }` and `ProcessNode` extending both the class bound to Node and `ActionElement`: `ActionElement.action` does not appear in the Entry select of the Simulation roles dialog. Cause: in `frontend/src/model/simulation/bindingCompat.ts`, `judge`, owner-context branch (about `:205-213`), a feature whose owner is neither an ancestor nor a descendant of the context class is `incompatible`, and `SimRolesModal.tsx` (S10, about `:503`) hides incompatible candidates. A mixin is always in that case.

Implement R-SIM-89 as written in `docs/decisions.md` (the row this branch adds): when the context class C and the feature's owner O are unrelated but have a common concrete subclass, the verdict is `warn` with exactly the text `<O.f> is declared on <O>: only <C> instances that are also <O> carry it` (names as `ix.name` prints them, `O.f` as the existing messages print a feature); it stays `incompatible` otherwise. An abstract common subclass without concrete descendants does not count. Applies to every role with an `OWNER` entry.

This is before the MODELS freeze: the four demo scenes must not change.

## DOVE

- `frontend/src/model/simulation/bindingCompat.ts` (`judge`, the owner-context branch only) and `__tests__/bindingCompat.test.ts`.
- One engine test in the existing test file that covers the subclass warning at run time (find it; `netCompile`/`netStep` tests), no engine code change.
- A read-only script under `frontend/scripts/smoke/_tmp_mixin_verdicts.ts` (gitignored `_tmp_*`, not committed) for the verdict table below.
- Closure: `docs/log-inbox/simulation.md` and this prompt's Status.

No other file. If the engine test shows that an instance lacking the bound feature is not treated as in the subclass case, stop with `Outcome: question` and a `Recommended:` line: do not change the engine.

## COME

1. Read `CLAUDE.md` (§6, Rule 11, §21.2), `docs/PROTOCOL.md` P16 and RC-20/RC-21, the R-SIM-89 row, `judge` from its start to the reference checks, and how `isKind` and the class index expose `abstract` and subclasses. Grep every new name before introducing it.
2. Before any change, write the verdict table: for each of the four demo metamodels in `/Users/alfonso/jjodel-demo-exports/` (`scene_1_DemoPEST.json`, `scene_2_DemoPetri.json`, `scene_3_DemoESM.json`, `scene_4_DemoFlowB.json`; read only, never write there), build the sketch the dialog builds and list, for every role and every candidate, the verdict and its text. If the exports cannot be turned into a sketch with existing code, use the preset fixtures of the existing tests for the same four presets and say so. Save the table to `docs/discovery/discovery_2026-09-28_sim_mixin_verdicts.md` (the discovery report of this lane, naming per `CLAUDE.md`: objective, files read, the table before, open questions).
3. Tests first (red before, green after), in `bindingCompat.test.ts`: Node, ActionElement (abstract, `action`), ProcessNode extends both: `ActionElement.action` is `warn` for Entry with the exact text; a feature of a class with no common subclass stays `incompatible`; a common subclass that is abstract with no concrete descendant leaves it `incompatible`; the existing subclass-warning and ok cases unchanged. Engine: a model where some Node instances are ProcessNode and some are not, Entry bound to `ActionElement.action`: the non-ProcessNode instances run with no entry assignments, the ProcessNode ones with theirs.
4. The change in `judge`, minimal. Then rerun the table of step 2 and append it to the discovery report as «after»: it must be identical to «before» on all four metamodels. If any line differs, stop with `Outcome: question`, the differing lines and a `Recommended:` line; do not merge anything.
5. Gates: `npm run typecheck` (baseline 14, the known set, before and after); the vitest of `src/model/simulation` and `src/components/editor-v2/sim` green, counts before and after; `check:docs`.
6. Commits: the discovery report (docs), then `fix(sim): a feature on a sibling owner with a common concrete subclass is a warning (R-SIM-89) (P-2026-09-28-2230)`, then one docs commit with the log entry in `docs/log-inbox/simulation.md` and this prompt's Status.
7. Do not merge, do not start a dev server or a probe: the chat runs the four scene probes. Stop with `Outcome: hard-stop`, the shas, the diff stat, the test counts, and the before/after table verdict (identical or not).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree (the demo exports included), a critical-zone file, dark-theme work.

## RIFERIMENTI

- `docs/decisions.md` R-SIM-89 (this branch), the S11a verdicts (`bindingCompat.ts` header comment), S10 in `SimRolesModal.tsx`.
- The proposal of the observer chat C-2026-09-25-1353, 2026-09-28 (quoted in the R-SIM-89 section).
