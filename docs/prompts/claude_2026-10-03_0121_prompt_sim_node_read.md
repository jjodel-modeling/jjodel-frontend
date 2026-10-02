# Prompt: Phase 2, lane `sim-node-read`: `node.[x]` read by IR views (R-SIM-108, interpreter side)

Prompt-ID: P-2026-10-03-0121
Chat: C-2026-10-02-2340
Lane: full (Phase 2, IR compiler and interpreter ReadCtx, critical zone by decision, tests first, mutation bench). Tier: heavy.
Status: da eseguire

Worktree: `~/jjodel-w-simnoderead`, branch `sim-node-read`, cut by the chat from `alfonso-frontend-jjtl` after the merge of `sim-state-model` (P-2026-10-03-0114), `frontend/node_modules` symlinked as P14 allows; a fresh session started by `lane-run` with `--critical-zone-goahead P-2026-10-03-0121`. Before anything else: `pwd`, branch, `git log -1` (the docs commit that added this prompt), and `grep -n 'export function getSimPresentation' frontend/src/components/editor-v2/sim/simRunState.ts` and `grep -n 'export function presentationOf' frontend/src/model/simulation/netStep.ts` both hit; if any check fails, stop with `Outcome: blocked`.

## COSA

R-SIM-108 (`docs/decisions.md`), the interpreter side, as planned in §5 and §6 of `docs/discovery/discovery_2026-10-02_sim_node_presentation.md` (P-2026-10-02-2345). The engine reader `presentationOf` and the run-state reader `getSimPresentation(objectId, attr)` landed with Lane A (`sim-state-model`, P-2026-10-03-0040): this lane consumes them and does not edit them.

Alfonso, 2026-10-03, «go» on the report's decision 2: `editor-v2/viewpoint/ir/` counts as a critical-zone edit, as R-MK-9 did. So the Layer Impact Report of §5 is copied into `docs/lir/` and committed before any code diff, and the lane runs with the RC-30 go-ahead. His veto on R-SIM-108 (it amends R-SIM-4) stays open; decision 3 of the report (no binding proposed by «Derive viewpoint») is adopted as recommended. Write this in the R-SIM-108 entry in the closure commit, one sentence.

1. `presentationAttrOf(expr): string | null` in `pathExpr.ts`, through `parseExpressionStrict` and `STATE_RESERVED.presentationRoot`, so the IR accepts exactly what the engine accepts.
2. In `compilePath` (`irCompile.ts`), a recognized expression compiles to `(ctx, id) => ctx.getPresentation?.(id, attr)`, `featureNames` `[]`, no cross path, `channelSink?.add('mark')`; endpoints refuse it with a message; `marked.path` and `isKind.path` keep today's error; `labelPathFeature` is `null`.
3. `ReadCtx.getPresentation?(elementId, attr): unknown`, optional (rule 11); `makeDrawReadCtx` takes it injected beside `isMarked`, default `undefined`; `makeReadCtx` (`irReadCtxLproxy.ts`) injects `getSimPresentation`. `irReadCtx.ts` gains no import (R-MK-4).
4. Must not change: the compiled shape of a view without `node.[x]` (`channels` absent, `irHash` and cache key unchanged); `STEP_RE`; any union member (R-J7, R-MK-1); the resolvers, `ObjectNode.tsx`, `SimNodeRunState.tsx`.

## DOVE

Code: `frontend/src/components/editor-v2/viewpoint/ir/pathExpr.ts`, `…/ir/irCompile.ts`, `…/ir/irReadCtx.ts`, `…/ir/irReadCtxLproxy.ts`. Tests: `…/ir/__tests__/pathExpr.test.ts`, `…/ir/__tests__/irPresentation.test.ts` (new). Docs: `docs/lir/` (the LIR, first commit), an addendum to the report, `docs/decisions.md` (one sentence in R-SIM-108), this prompt's Status, `docs/log-inbox/simulation.md`. Nothing else; in particular not `netStep.ts` or `simRunState.ts`.

## COME

1. Read `CLAUDE.md` (§3, critical zone, rule 11, rule 19), P16, RC-17, RC-21, RC-30, RC-33, R-SIM-4, R-SIM-6, R-SIM-18, R-SIM-108, R-MK-1..9, R-J7, and the report's §0, §2, §5, §6.
2. Commit the LIR in `docs/lir/` first. Then tests first: the tests §6 lists (the 18-input corpus of §2.1, the compile cases, byte-identical views without `node.[x]`, the refused endpoint, the consumer test that a resolver memo re-runs on a `'mark'` bump when the view reads `node.[x]`). Mutation bench (gitignored `_tmp_*`): channel not declared, endpoint accepted, `getPresentation` not injected, a stray `featureNames` entry; each must fail a test.
3. Gates in the foreground: `npm run typecheck` (no new errors over §17's baseline), the IR and sim test suites, `npm run build`, and the report's probe with scene C rewritten on `node.[x]` (`lane-run probe`, port 3070, never 3001): the same counts as C, a label showing the stand-in value. The four demo scenes unchanged.
4. Commits: LIR, then code and tests, then the closure docs commit. Stop with `Outcome: done`, the shas and the gates' results.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a file outside DOVE, any of the seven critical-zone files of §3.2.

## RIFERIMENTI

`docs/discovery/discovery_2026-10-02_sim_node_presentation.md` §5, §6; R-SIM-108; Lane A P-2026-10-03-0040. Ticket from the report (not this lane): one `'mark'` bump re-renders every mounted `EditorV2`.
