# Critical zone: useJjomSync incremental sync, Phase 2 (continuation of P-2026-10-21-0035)

Prompt-ID: P-2026-10-21-0155
Chat: C-2026-10-20-0839
Front: maintenance
Lane: full (critical zone: `useJjomSync.ts`, CLAUDE.md §3.1; continuation of a ceiling-stopped lane, RC-51)
Status: non completato 2026-10-21 · lane jjomsync-incremental · LIR aad47a12d; code and tests complete but uncommitted at the context ceiling · continued by P-2026-10-21-0335
Request: https://claude.ai/code/session_01EMpM7yBvFWpBXh3o1TJSRA
Depends: P-2026-10-21-0035
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Critical-zone go-ahead: Alfonso, 2026-10-21 00:13, «Ok» to the chat's question on fix 1. GO for Phase 2 given by
the chat on the report `docs/discovery/discovery_2026-10-21_jjomsync_incremental.md` (commit `d525d3ae8`): the root
cause is identified and reproduced (§3.1 to §3.3), the fix is scoped (§4). A Layer Impact Report is the first step
(RC-30).

Worktree: `~/jjodel-w-jjomsync`, branch `jjomsync-incremental` (the same as P-2026-10-21-0035). Model and tier:
heavy, as pinned (RC-16), effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-21-0155 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 90 minutes. A question carries one `Recommended:` line.
Every gate runs in the foreground (P16). No push, no merge. Watch the AM-8 ceiling (RC-51): write the handoff before
the soft one.

## COSA

Read first `~/.jjodel-lanes/P-2026-10-21-0035/handoff.md` and the report. Implement §4 of the report:

1. Remove `Date.now()` from the effect's deps (`useJjomSync.ts:1533-1534`) and the `prevModel = {}` override
   (`:1331-1334`), with their comments: the cause they worked around (#67, in-place write into the previous state)
   was fixed in the reducer by `ac64b213b`.
2. Move the per-vertex hash out of the selector into a new pure module
   `frontend/src/components/editor-v2/sync/vertexSnapshot.ts` (raw `idlookup` reads, no proxy, importable by vitest
   without the `joiner` barrel; grep the name first) and extend it with every transformer read listed in §3.5 of
   the report. Its JSDoc states that a node type or a transformer read added later must extend the hash.
3. Anti-bounce: when a run skips an id because of `isCanvasUpdated` (300 ms window), schedule one re-run after the
   window (a local tick), instead of relying on a run per render.

## DOVE

1. `docs/lir/lir_2026-10-21_jjomsync_incremental.md` (LIR, docs commit first).
2. `frontend/src/components/editor-v2/hooks/useJjomSync.ts` (only the three points above and the call to the new
   module).
3. `frontend/src/components/editor-v2/sync/vertexSnapshot.ts` and
   `frontend/src/components/editor-v2/sync/__tests__/vertexSnapshot.test.ts` (new).
4. `frontend/src/redux/reducer/__tests__/reducerCopyOnWrite.test.ts`: one regression row for the #67 shape (a
   composite `final` no-op then `isSingleton`), granted here; nothing else in the redux layer.
5. Closure: `docs/log-inbox/maintenance.md`, the Status lines of P-2026-10-21-0035 and of this prompt.

## COME

1. LIR (layers: sync and canvas v2-flow; no D-layer write, reducer code, L-layer, JjOM or persistence change).
2. Baseline gates: `npm run typecheck` (0, RC-48), the full vitest count, `npm run build`, through
   `node scripts/run-quiet.mjs` from `frontend/`.
3. Tests red first, executing code (P11): the hash changes for each dependency of §3.5 and stays equal for an
   unrelated write; the #67 reducer row. Mutation bench: drop each hash term (one test dies per term), put
   `Date.now()` back (the probe's run count per drag catches it: record it), drop the anti-bounce re-run (a test or
   the probe audit catches it: say which).
4. Probe acceptance on `~/jjodel-papers/2026-sosym-harness-models/jjodel/jjodel.harness.project.jjodel`, dev, three
   runs, medians: name reads per drag ≤ 2,100; drag long tasks ≤ 2.7 s (the report measured 2.58 s with the
   removals alone; the 2.3 s of the first prompt came from a single noisy run); click, open and viewpoint switch not
   worse than the report's baseline; the `audit` step with 0 stale nodes at rest and after the reference-target
   rename (with a wait long enough for the L-proxy writes to land). Open one viewpoint with graphVertex containers
   (the BPMN one of the fixture) and state that nesting and edges are unchanged (R-GV-18: 42 edges, 48 nodes).
5. One `fix(editor-v2):` commit (code and tests), measurements and mutation table in the body, `git add` by path,
   `Model:` trailer. Closure in one docs commit (RC-17). `Outcome: done`. The visual check is the chat's.

## Rollback

`pre-jjomsync-incremental-2026-10-21` on the trunk; `lane-run merge` tags again; undo with
`git revert -m 1 <merge sha>`.

## RIFERIMENTI

`docs/discovery/discovery_2026-10-21_jjomsync_incremental.md`; `~/.jjodel-lanes/P-2026-10-21-0035/handoff.md`;
GitHub issue #67; `ac64b213b`; CLAUDE.md §3.1, §3.2, §5.
