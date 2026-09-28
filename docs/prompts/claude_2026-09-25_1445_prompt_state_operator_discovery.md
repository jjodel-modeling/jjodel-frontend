# Prompt: the `.[x]` state operator and the core types `Expression` and `Action` (discovery)

Prompt-ID: P-2026-09-25-1445
Chat: C-2026-09-25-1353
Lane: full (changed exported interface)
Status: eseguito 2026-09-25 · lane simulation · ec68ddb9b

Worktree: `~/jjodel-sim`, branch `simulation-engine`. Setup, in this order, each a hard stop if it fails: `pwd` is `/Users/alfonso/jjodel-sim`; `git branch --show-current` is `simulation-engine`; `git status` empty; `git merge --ff-only alfonso-frontend-jjtl` (the branch is at `7e06d5839`, an ancestor of the trunk, so this is a fast-forward; a refusal is a stop, never a non-ff merge; afterwards `git log -1` reads `docs: add prompts P-2026-09-25-1440 and P-2026-09-25-1445`, otherwise stop). Every commit of this lane goes on `simulation-engine`.

**Parallel lane.** `P-2026-09-25-1440` (hash change between two projects) runs at the same time in `~/jjodel-open` on port 3003. The perimeters are disjoint. Do not touch `~/jjodel-release`, `~/jjodel-open`, `~/jjodel-gate`, `~/jjodel`, `~/jjodel-harness`, nor any server you did not start.

**Environment (P14, amended in `d2eb241a7`).** `frontend/node_modules` here is a permanent symlink: never remove it. After the fast-forward the Vite cache of this tree is `frontend/.vite-cache`. If you need a dev server, use 3002 from this tree only, after checking the port is free.

Two-phase. **This prompt covers Phase 1 only**: read-only on the source, it ends with a saved and committed report and a hard stop. This is a core change (R-SIM-17 says so): the report carries a **Layer Impact Report draft** for every layer the Phase 2 proposal would touch, and for any critical-zone file (`CLAUDE.md` §3.2: `useJjomSync.ts`, `canvasToJjom.ts`, `jjomTransformers.ts`, `portDistribution.ts`, `handlePosition.ts`, `DV.tsx`, `VersionFixer.tsx`) it says whether it is touched and why.

## COSA

Step 3 of the simulator is on the trunk with the Petri core; guards are JjEL strings on an ad-hoc path and there are no actions. The next lane, fixed by the plan (`docs/decisions.md`, the paragraph before R-SIM-16: "R-SIM-17..19 al passo 3, dopo la corsia sui tipi `Expression` e `Action`"), brings in what R-SIM-17, R-SIM-18, R-SIM-19 and R-SIM-30 ratified. Read those four entries whole before anything else; they are the specification, and this discovery maps them onto the code without reopening them. Where the code makes a ratified choice impossible or costly, say so as a question, do not decide.

Three parts, possibly three waves:

- **A. Core types (R-SIM-17).** Two new primitive types: `Expression` (a JjEL string whose syntax the type checks) and `Action` (`<target> := <Expression>`). A malformed value is saved and is a conformance violation in the problems registry. Ecore export as `EString` with an `EAnnotation`, restored on import. The known lexer defect on `true`/`false`/`null` is inherited and must be covered by tests.
- **B. The `.[x]` operator (R-SIM-18, R-SIM-30).** Lexer: `.[` as a token, `?.[` rejected; parser: an AST node for state access whose last segment is the attribute; evaluator: reads through the engine's `SimStateAccess` (`SimStateReader` in `guardContext.ts` plus `tokens(id)`), never through `DObject`, `data.state` or `node.state`. Roots `self`, `event`, `model`, `node`; `x.[marked]` and `x.[tokens]` read-only. Reserved names in one list: `.[`, `node`, `model`, `marked`, `tokens`. Subset checker: `.[x]` exportable, a guard containing `node` is a defect. Verify, as R-SIM-18 asks, whether `node` already means something in the editor v2 IR rules; if it collides, the name falls back to `look`.
- **C. State attribute declarations (R-SIM-19).** Per metaclass in the STC: space (semantic or presentation), initial value, finite domain if semantic; derived attributes with a circularity check. Say whether C belongs in this lane or in the next, with the reason.

Out of scope: any source edit; wave 3c (candidates on the canvas); step 4 (snapshots); the `.smv` exporter; the extension of `.[x]` to the views (R-SIM-4's four files: map them, do not plan their edit); the tickets of 3b (`SimModelView`, `stcFromRoles.ts` rename, stale comments).

## DOVE

Phase 1 reads, at least:

- Primitive types: where `EString`, `EBoolean`, `EInt` and the other primitives are declared and registered (`frontend/src/joiner/classes.ts` and whatever it points to), how a feature's type drives its editor in the Properties panel, how JJOM and the editor v2 see a primitive (`frontend/src/components/editor-v2/utils/jjomTransformers.ts`, `frontend/src/components/editor-v2/types.ts`), Ecore import and export, the save format and whether `VersionFixer.tsx` would need a step, the problems registry and conformance checks.
- JjEL: `frontend/src/jjel/` (`lexer/lexer.ts`, `parser/parser.ts`, `evaluator/`, `types/`, `autocomplete/`, `SPEC.md`, `CLAUDE.md`, `AGENTS.md`), and every place where reserved names live (`evaluator/context.ts`, `autocomplete/providers/identifier.ts`).
- Simulator: `frontend/src/model/simulation/` (`guardContext.ts`, `guardEvaluator.ts`, `subsetChecker.ts`, `netCompile.ts`, `netTypes.ts`), `frontend/src/components/editor-v2/sim/simBridge.ts`, and where `simGuard` values are compiled today.
- IR rules of the editor v2: `pathExpr.ts`, `irReadCtx.ts`, `irCrossDeps.ts`, `IRNodeContent.tsx` (R-SIM-4), for the `node` collision.
- Spec: `docs/spec/claude_spec_2026-09-13_computational_model.md` §5 (guards, actions) and §9.

Read whole functions; follow the calls.

## COME

1. **Type map (A).** A table: layer (definition, registry, Properties editor, JJOM/editor v2, persistence and migration, Ecore import/export, validation, problems registry, JjScript `set`/`create`), file:line, what an existing primitive does there, what `Expression` and `Action` would need. Mark each row with the RC-3 trigger it fires, if any.
2. **Grammar map (B).** Lexer and parser today for `.`, `?.`, `[`: which tokens, which AST nodes, which precedence. The smallest grammar change for `.[x]` and for `<target> := <Expression>`, where `:=` is lexed and parsed today (if it is), and what the change does to the existing JjEL tests. Measure, do not assume: run the JjEL test files before and after nothing (the baseline), and write two or three probe inputs through the current lexer and parser from a scratch script (gitignored, or in the session scratchpad) to show what they produce today for `a.[b]`, `a?.[b]`, `x := 1`.
3. **Evaluator path (B).** How a guard reaches the evaluator today (`compileGuard`, `buildGuardContext`, the snapshot with `targetMetamodelId`), and where a `SimStateAccess` would enter. Whether actions can reuse the guard path or need their own.
4. **Reserved names and `node` (B).** Every list of reserved or built-in names in JjEL and in the IR rules; whether `node`, `model`, `marked`, `tokens` collide with anything, with file:line.
5. **Waves.** A proposal of waves (for example A, then B, then C), each with its files, its tests, its RC-3 triggers, its critical-zone files, the expected vitest delta, and at least six mutants per wave that its tests must kill. Say which wave needs a visual check and what Alfonso would look at.
6. **Report** in `docs/discovery/discovery_2026-09-25_state_operator_core_types.md` (the path `docs/discovery/` and the naming `discovery_<date>_<description>.md` are mandatory): objective, files read with full paths, the maps of items 1-4, the waves of item 5, the Layer Impact Report drafts, risks, open questions for Alfonso numbered Q1.., each with a recommended answer and the R-SIM entry it touches.
7. Commit the report alone: `git commit -- docs/discovery/discovery_2026-09-25_state_operator_core_types.md`, subject `docs: discovery of the state operator and the core types Expression and Action (P-2026-09-25-1445)`, `Model:` trailer. No log entry and no Status flip in Phase 1: both go in the Phase 2 closure commit (P13, RC-17). If you started a server, stop it. `git status` empty.
8. **Hard stop.** Closing message opening with `[P-2026-09-25-1445 · session <id>]`: report sha, the waves in one line each, the questions. Wait.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, a source edit, `rm` of the `node_modules` symlink, push.

## RIFERIMENTI

- `docs/decisions.md` R-SIM-4, R-SIM-11, R-SIM-13, R-SIM-14, R-SIM-16..19, R-SIM-24, R-SIM-30, R-SIM-33; RC-3, RC-13, RC-17.
- `docs/spec/claude_spec_2026-09-13_computational_model.md` §5, §9.
- `docs/PROTOCOL.md` P13, P14 (amended `d2eb241a7`).
- Step 3 reports: `docs/discovery/discovery_2026-09-25_sim_step3_petri_core.md`, `docs/discovery/discovery_2026-09-25_sim_step3b_panel.md`.
