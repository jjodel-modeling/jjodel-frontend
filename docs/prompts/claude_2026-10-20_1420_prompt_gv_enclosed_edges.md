# graphVertex: a hidden channel also hides the edges a container encloses (R-GV-18)

Prompt-ID: P-2026-10-20-1420
Chat: C-2026-10-20-0839
Front: graphvertex
Lane: full (critical zone: `frontend/src/components/editor-v2/viewpoint/ir/`, CLAUDE.md §3.1); Phase 1 waived by Alfonso
Status: da eseguire
Request: https://claude.ai/code/session_01EMpM7yBvFWpBXh3o1TJSRA
Depends: none
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Critical-zone go-ahead: Alfonso, 2026-10-20 14:13, in chat C-2026-10-20-0839: «ti autorizzo a procedere senza
discovery in maniera del tutto automatica, predisponi il tutto per un eventuale rollback da git». It covers this lane
only, the two files of the DOVE, and waives Phase 1: there is no discovery report and no Phase 1 hard stop. The Layer
Impact Report stays mandatory and is the first step (RC-30).

Worktree: `~/jjodel-w-gvedges`, branch `gv-enclosed-edges`, cut from `alfonso-frontend-jjtl` at the commit that adds
this prompt. Model and tier: heavy, as pinned (RC-16), effort `xhigh` (critical zone, CLAUDE.md §0).

## Lane discipline

Every reply opens with `[P-2026-10-20-1420 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 90 minutes. A question carries one `Recommended:` line.
Every gate runs in the foreground (P16). No push, no merge: the chat merges after `done`.

## COSA

In a graphVertex view with `containment.edges: 'hide'` (R-GV-4) only the edge of the channel itself is hidden today.
Every other reference or composition edge between the container and the objects it encloses is still drawn, although
the nesting already shows that relation. Measured by the chat on 2026-10-20 in the project «Jjodel harness» (metamodel
`harness`, viewpoint «Harness / Lane process (BPMN)»): the root `Harness` is a pool whose channel is `$roles.values`,
each `Role` is a lane whose channel is `$performs.values`; besides the 42 flows the canvas draws 65 edges that the
nesting already expresses:

- 24 `Activity -> Role [performer]`: from a node to the lane that encloses it (the inverse direction of the channel);
- 41 `Harness -> Activity|DecisionNode|FinalNode|InitialNode [activities|controlNodes]`: from the pool to nodes its
  lanes claim (a composition edge to a grandchild in the claim tree).

Rule to implement, **R-GV-18** (amends R-GV-4, recorded by the chat in `docs/decisions.md` after the merge): with
`containment.edges: 'hide'`, a reference or composition edge (`instanceRef` or `composition`) is hidden when one end
is a container whose view declares `edges: 'hide'` and the other end is an object that container encloses, its own
claim or a deeper one through `parentOf`, in either direction. Hidden, never removed, as the channel edges (the
comment on `suppressChannelEdges` explains why). Edges between two objects of which neither encloses the other are
untouched, and so is every edge when no container declares `hide`.

## DOVE

1. `frontend/src/components/editor-v2/viewpoint/ir/irContainment.ts`: `suppressChannelEdges` only. Keep its signature
   and its current behaviour for channel edges, the S3 drop of stale channel edges included; add the enclosure rule
   after it. Extend the JSDoc in English with the rule and R-GV-18.
2. `frontend/src/components/editor-v2/viewpoint/ir/__tests__/irContainerLayout.test.ts`: the `describe` block of
   `suppressChannelEdges (R-GV-4)` only, new cases beside the existing ones.
3. `docs/lir/lir_2026-10-20_gv_enclosed_edges.md`: the Layer Impact Report (CLAUDE.md §3.2 template), committed
   before the first code edit.
4. `docs/log-inbox/graphvertex.md` (create it if missing) and the Status line of this prompt, in the closure commit.

Nothing else. `useIRContainment.ts` already calls `suppressChannelEdges` on the decorated edges: do not touch it.

## COME

1. Write and commit the LIR (docs-only commit). Layers: Canvas v2-flow only (the `hidden` flag of edges); no D-layer,
   L-layer, JjOM, sync or persistence change.
2. Baseline gates first, numbers stated: `npm run typecheck` (zero errors expected, RC-48), vitest on
   `irContainerLayout.test.ts`, `npm run build`, through `node scripts/run-quiet.mjs` from `frontend/`.
3. Tests first, red on the feature, executing the function (P11): (a) the BPMN shape of the COSA, a pool with
   `edges: 'hide'` and channel `roles`, a lane with `edges: 'hide'` and channel `performs`, a node claimed by the lane:
   the node-to-lane `performer` edge and the pool-to-node `activities` composition edge are hidden; (b) an edge between
   two nodes of the same lane, and an edge from a node to an object outside the container, stay visible; (c) with
   `edges: 'show'` on both containers nothing changes, the function returns `edges` itself; (d) the existing R-GV-4
   cases still pass unchanged.
4. Implement with the minimal diff. Walk ancestors with `model.parentOf` (bounded, no cycle: R-GV-2 already refuses
   claim cycles), and the containers' `edges` from `model.containers`.
5. Mutation bench (CLAUDE.md §5): at least (m1) drop the reverse direction, (m2) stop the walk at the direct parent,
   (m3) ignore `edges` and hide for every container; each must be killed by a named test; the table goes in the commit
   body.
6. Gates on the commit, then commit the code and the tests (one `fix(editor-v2):` commit, `git add` by path, `Model:`
   trailer, P6).
7. Closure: the log entry in `docs/log-inbox/graphvertex.md` (skill `log-entry`), the Status flip of this prompt
   (`eseguito <date> · lane gv-enclosed-edges · <sha>`), one docs commit (RC-17). The visual check is the chat's
   (RC-23), after the merge, on the project «Jjodel harness»: `Outcome: done` without waiting for it.

## Rollback (prepared by the chat)

- `pre-gv-enclosed-edges-2026-10-20`: tag on the trunk tip before this prompt was committed.
- `pre-gv-enclosed-edges`: tag `lane-run merge` writes on the trunk before the merge (RC-31).
- To undo after the merge: `git revert -m 1 <merge sha>` on `alfonso-frontend-jjtl` (never a reset of the shared
  trunk); the branch `gv-enclosed-edges` stays until Alfonso retires it.

## RIFERIMENTI

R-GV-1, R-GV-2, R-GV-4 and R-GV-10 in `docs/decisions.md`; spec addendum
`docs/spec/claude_spec_2026-10-10_ir_graphvertex_containment_addendum.md` §5 (not edited here);
`frontend/scripts/probe/bpmn-lanes-fixture.ts` for the BPMN views.
