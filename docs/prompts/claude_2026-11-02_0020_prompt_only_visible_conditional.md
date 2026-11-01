# Canvas: onlyRenderVisibleElements only on viewpoints it cannot break

Prompt-ID: P-2026-11-02-0020
Chat: C-2026-11-01-1434
Front: maintenance
Lane: fast (one product file, `EditorV2.tsx`; no critical zone file)
Status: da eseguire
Request: https://claude.ai/code/session_01DQt9R32KVprpjZZCfe6Sbp

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 non si applica (motivo: the analysis is in five handoffs and the LIR on branch `only-visible-wip`; this lane
takes the conservative road decided by Alfonso on 2026-11-02 00:14).

Worktree: `~/jjodel-w-onlyviscond`, branch `only-visible-conditional`, cut from `alfonso-frontend-jjtl` at `4383c2572`,
HEAD at the commit that adds this prompt. Clean tree. Model and tier as pinned (RC-16), effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-11-02-0020 · session <id>]`; final message ends with `Outcome: done | hard-stop |
question | blocked`; one `Recommended:` line per question. Time limit 60 minutes. Gates through
`node scripts/run-quiet.mjs`. Context discipline: grep summary lines of every gate and probe, never cat a log; read only
the parts of the files named here. Load gate before each timing run: `uptime`, 1-minute load ≤ 16. No push, no merge.

## Contesto (non rifare l'analisi)

`onlyRenderVisibleElements` on `<ReactFlow>` makes Alfonso's large models without containers usable (measured by hand
2026-10-31; harness fixture with no viewpoint: open 17.5 s on trunk, 5.9 s with the prop). Five lanes
(P-2026-11-01-0040..2335, branch `only-visible-wip`, LIR `docs/discovery/lir_2026-11-01_only_visible_render_loop.md`
there) showed that the prop breaks nodes whose size is derived from content (`viewpoint/ir/useContentSize.ts`): a render
loop on graphVertex containers, and stale or missing boxes after a viewpoint switch for nodes off screen. That front is
parked. This lane turns the prop on only where none of that machinery is in play.

## COSA

1. In `frontend/src/components/editor-v2/EditorV2.tsx`, pass `onlyRenderVisibleElements={…}` to `<ReactFlow>` (after
   `connectionRadius={40}`), true only when the active viewpoint has no graphVertex containers and no node whose size is
   derived from content (the `useContentSize` policy: `heightFactor > 1 || minAspect > 0`, see `shapeRegistry.ts`), and
   with no viewpoint at all. Compute it from data EditorV2 already has (the containment and IR resolution it already
   builds); memoize it so it changes only when the viewpoint or the node set does. If deciding it needs a new export from
   another file or a change outside `EditorV2.tsx`: stop, `Recommended:` line.
2. Unit test where a seam exists (a small pure predicate is fine, colocated test file).
3. Gates: `npm run typecheck`, `npx vitest run` (baseline; the 4 `criticalZone.test.ts` failures under a go-ahead env
   are known, ticket #393; this lane runs without go-ahead), `npm run build`, `npm run smoke`, `bpmn-lanes` probe at
   trunk's 12/12 with no fixture change.
4. Timing with `frontend/scripts/probe/large-model-click-profile.ts`, `CLICK_PROD`, harness fixture
   (`~/jjodel-papers/2026-sosym-harness-models/jjodel/jjodel.harness.project.jjodel`), trunk against branch, median of
   three, load recorded: `CLICK_VP=-` (prop on: must be clearly faster, open and drag) and the BPMN viewpoint (prop off:
   no slower than trunk).
5. From the DOM: with no viewpoint, an edge with both endpoints out of view is drawn (read the longest `<path>` of each
   edge, `.react-flow__edge-path` does not exist), the minimap shows all nodes, no new console errors; under BPMN the
   node count equals trunk's.
6. Code commit with explicit pathspec; log entry in `docs/log-inbox/maintenance.md` (cite the parked branch
   `only-visible-wip` and the five prompts) and Status flip, uncommitted (RC-17). Stop every server you started. Exit
   `Outcome: hard-stop (visual check due)`.

## HARD STOP

A red gate, BPMN slower than trunk, no gain with no viewpoint, or a failed DOM check: stop before the commit with the
numbers and one `Recommended:` line.

## NON FARE

No change to `useContentSize.ts`, `ObjectNode.tsx`, the probes or `MiniMap` props. Do not cherry-pick from
`only-visible-wip`. No new dependencies.
