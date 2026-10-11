# Discovery 2026-10-12: release 3.1, L2, drag-loop hardening (Fix A)

- Start sha: **`5f25112c46c76e3e55f1bf2983bd3b99de7e7a11`** (`docs: add prompts P-2026-10-12-0010/0011/0012`).
- Prompt-ID: P-2026-10-12-0011 (`docs/prompts/claude_2026-10-12_0011_prompt_release_3_1_drag_hardening.md`). Chat
  C-2026-10-11-1812. Session `8944ae4d-8d13-4ba4-9e14-20234df55ec0`.
- Tree: `~/jjodel-w-rel31-drag`, branch `rel31-drag`, `frontend/node_modules` symlinked to `~/jjodel/frontend/node_modules`.
- Executor: Claude Opus 5.5 (`claude-opus-5-5`), unattended.
- Tags: **M** measured by a command run in this lane, **R** read in a file.

## 0. Answer in brief

**Fix A is in, and it is enough.** `useAutoAnchor` no longer subscribes to the React Flow nodes. It takes
`useStoreApi()` and reads `store.getState().nodes` inside `getOptimalAnchors` and `getOptimalAnchorsForAllEdges`
(`hooks/useAutoAnchor.ts:567-622`, +9 −5). Its callbacks depend on `[store]` only, so they keep their identity across
renders. Nothing else changes. Guard B was not implemented: Fix A alone leaves no crash (§3).

**The unit pins it (M).** `hooks/__tests__/useAutoAnchorSubscription.test.ts` runs the real hook inside a real
`ReactFlowProvider` and records the subscriptions it hands React. On the start sha it is red first: 2 of 3 red, the
control green. With the fix: 3 of 3. Mutation bench 4 of 4 killed (§2).

**Probe (M), on a dev server of this tree on port 3142:** **22 fresh pages, 66 drags, 0 crashes, depth max 3**, over
Petri net (classic) and Petri net: at rest, after Auto layout, with an edge click, and on the nearest node.
The control discriminates (P12). `164f846fc` in a `git archive` copy, same probe, same harness: **4 crashes in 16 drags
on 7 pages**, every one at depth 51, «occurred in the <StoreUpdater> component». **The same copy with this lane's diff
applied: 0 crashes in 21 drags on 7 pages**, depth max 3. That is the one measure where Fix A alone is seen to act. The
trunk already read 0 of 72 without it (1812 §5.1), so the probe on this tree shows no regression, not the fix.

**Gates (M):** typecheck 14, the §17 set; vitest 8714/8714 tests, the 9 known import reds; build exit 0; smoke GREEN on
3142 (12 passed, 0 failed, 3 skipped); check:scripts PASS (87 files); check:docs in §5.

**Decisions awaiting Alfonso:** D1, ship L2 in 3.1.0 (it is green before the cut).

**Questions**
1. Merge `rel31-drag` into the trunk for 3.1.0? Recommended: yes. One source file outside the critical zone, red-first
   unit, gates green, and the control shows that Fix A alone closes the loop on the code that crashed.

## 1. Hypotheses and verdicts

| # | Hypothesis | Verdict | Evidence |
|---|------------|---------|----------|
| H1 | Swapping `useNodes()` for a call-time store read changes no consumer behaviour | holds (R, M) | the two consumers call it inside event handlers only (§4); the existing `useAutoAnchor.test.ts` 10/10 and the full suite are green |
| H2 | The hook stops re-rendering its host on a node move | holds (M) | §2, test 2; red on the start sha |
| H3 | Fix A alone closes the loop on the code that crashed | holds (M) | §3.2: `164f846fc` 4 crashes in 16 drags; `164f846fc` + Fix A 0 in 21 |
| H4 | Fix A regresses the trunk's drag | falsified (M) | §3.1: 0 crashes in 66 drags, depth max 3 |

## 2. The change and its unit

### 2.1 Diff (`frontend/src/components/editor-v2/hooks/useAutoAnchor.ts`)
- `:2` `import { useNodes } from '@xyflow/react';` → `import { useStoreApi } from '@xyflow/react';`
- `:568-571` `const nodes = useNodes();` → a three-line comment citing the 2026-10-10 discovery, and `const store = useStoreApi();`
- `:580` `const nodes = store.getState().nodes;` at the head of `getOptimalAnchors`; `:616`
  `for (const node of store.getState().nodes) {` in `getOptimalAnchorsForAllEdges`; both dependency lists `[nodes]` → `[store]`.
- `useNodes` is `useStore(nodesSelector, shallow)` (`@xyflow/react` 12.10.2 `dist/esm/index.mjs:3795-3798`), so the array
  read at call time is the same array the subscription returned, only fresher.

### 2.2 The unit (`frontend/src/components/editor-v2/hooks/__tests__/useAutoAnchorSubscription.test.ts`, new)
The bench is described in the file header. React decides a re-render through `useSyncExternalStore`. xyflow reaches it
through zustand and the `use-sync-external-store` shim, which binds `React.useSyncExternalStore` when it loads, outside
vite's module graph. So `vi.hoisted` wraps it on React's CommonJS exports before any import loads the shim. The probe
component renders under `renderToStaticMarkup` inside a real `ReactFlowProvider`, and the wrapper records each
subscription handed over during that render. A node then moves through the store's own `setNodes` (the action
StoreUpdater calls). Each recorded subscription is asked what React would ask: was it notified, and did its snapshot move.

| test | start sha | Fix A |
|---|---|---|
| control: a host calling `useNodes()` reads as re-rendering (bench not blind, P12) | pass | pass |
| a node move does not re-render the host | **fail** | pass |
| both callbacks read the nodes at call time (B moved below A → bottom/top, not right/left) | **fail** | pass |

Mutation bench (M, each on Fix A, restored byte-identical with `cmp`):

| mutant | test 2 | test 3 |
|---|---|---|
| M1 `useNodes()` back (the start sha's file) | killed | killed |
| M2 `store.getState().nodes` read once in the render body | survives (no subscription: correct) | killed |
| M3 `useStore((st) => st.nodes)` as the source | killed | killed |
| M4 only `getOptimalAnchorsForAllEdges` on a render-time list | survives | killed |

4 of 4 killed. M2 and M4 surviving test 2 is right: they do not subscribe, so they do not re-render the host.

## 3. Probe

`frontend/scripts/probe/petri-drag-loop.ts`, carried from `petri-loop-disc` (`e902f159d`) unchanged except for a
`PDL_LANE_ID` output folder (default `petri-drag-loop`, it was hard-wired to `P-2026-10-10-1020`) and a header note
naming this lane and its gate command. The fixture `scripts/probe/fixtures/scene_2_DemoPetri.jjodel` was already on the
trunk, identical to the branch's (`git diff --stat HEAD petri-loop-disc -- <fixture>` empty), so it is not re-added. Run with
`~/.local/bin/node --experimental-strip-types`, `PROBE_URL` set, React's nested-update counter patched (`patched
{"react":3..8}`), headless Chromium 1600×1000, light, fresh page per row. Logs and JSON:
`~/.jjodel-lanes/P-2026-10-12-0011/` (`probe_*.log`, `pdl_*.json`, crops).

### 3.1 This tree with Fix A (dev server on 3142)

| batch | notation | runs (state/target/edge click) | pages | drags | crashed pages | depth max |
|---|---|---|---|---|---|---|
| `fixA_a` | petriClassic | rest/first/0 | 5 | 15 | 0 | 3 |
| `fixA_b` | petriClassic | rest/first/0 | 5 | 15 | 0 | 3 |
| `fixA_c` | petri | rest/first/0, layout/first/0, rest/any/0 | 6 | 18 | 0 | 3 |
| `fixA_d` | petriClassic | layout/first/0, rest/first/1, rest/any/0 | 6 | 18 | 0 | 3 |
| total | | | **22** | **66** | **0** | 3 |

Targets per page: p1, lock, t3 (first) or t1, p2, lock (any). No row reported another error.

### 3.2 Control (`git archive 164f846fc frontend` to `/tmp/r31drag-ctrl.WLZ2`, dev server on 3143)

| batch | code | pages | drags | crashes | where |
|---|---|---|---|---|---|
| `ctrl_164f846fc` | `164f846fc` | 3 | 8 | 1 | lock, second drag |
| `ctrl_164f846fc_b` | `164f846fc` | 4 | 8 | 3 | lock second ×2, p1 first ×1 |
| `ctrl_164f846fc_plus_fixA` | + this lane's diff, hot-updated | 7 | **0** | — | every page refused at set-up: «viewpoint not drawn» |
| `..._plus_fixA_cold` + `_b` | + this lane's diff, server restarted | 7 | 21 | **0** | — (depth max 3) |

- Every crash: depth 51, «The above error occurred in the <StoreUpdater> component», as on 2026-10-10.
- The rate is lower than the 1812 lane's (3 of 3 first drags there; 1 of 7 first drags here, 4 of 7 pages). It is a
  timing window (discovery 2026-10-10 §4.4).
- If Fix A did nothing, 0 crashed pages in 7 at the control's 4 in 7 has probability (3/7)^7 ≈ 0.003.
  Confounds: the control rows ran on a server up since 00:43, the Fix A rows on a cold restart, and crashes end pages,
  so the drags are not independent.
- The hot-updated row is environmental. After `patch` the server logged one `hmr update /src/components/editor-v2/EditorV2.tsx`
  and no error, and every fresh page then failed to draw the derived viewpoint. After a cold restart of the same files,
  7 pages in a row set up. Its 7 pages are excluded, and declared here.

## 4. Consumers and render path (R)
- `EditorV2.tsx:1205` `const { getOptimalAnchors } = useAutoAnchor();` in EditorV2Inner. Calls at `:1872` and `:2021`,
  both inside the pending-connection handlers (`useCallback`, deps at `:1986` and `:2081`). `getOptimalAnchorsForAllEdges`
  has no consumer outside the hook. The handlers now keep their identity across node pushes.
- EditorV2Inner no longer re-renders on a React Flow nodes push. That push carries the array EditorV2Inner itself handed
  to `<ReactFlow>` (StoreUpdater), so the removed render was its echo: the amplifier of 2026-10-10 §4.3. No other node
  subscription exists in `EditorV2.tsx` (`grep -n "useNodes()\|useStore(\|useNodesData\|useNodesInitialized"`: one
  `useStore`, for the zoom, `:3668`).
- Stale comment, not touched (out of scope): `EditorV2.tsx:1860-1862` says `getOptimalAnchors` «uses useNodes() (React
  state, potentially one render behind)». Since this lane it reads the store at call time.

## 5. Gates (M, foreground, this tree)

| gate | result |
|---|---|
| `npm run typecheck` | exit 2, 14 errors before and after, the §17 set (diffed by file and code) |
| `npx vitest run` | 360 files: 351 passed, 9 failed = the §17 import reds; **8714/8714 tests** |
| `npm run build` | exit 0; only the chunk-size and dynamic-import notices |
| `SMOKE_URL=http://localhost:3142 npm run smoke` | GREEN, 12 passed, 0 failed, 3 skipped |
| `npm run check:scripts` | PASS, 87 files (1 `_tmp_` scratch config) |
| `npm run typecheck:scripts` | exit 0, but `scripts/tsconfig.json` includes `smoke/` and `gates/` only: it does not see the probe |
| `npm run check:docs` | run after this report and the inbox entry; result in the log entry |

## 6. Files read
`CLAUDE.md`; `frontend/src/components/editor-v2/CLAUDE.md`; `docs/PROTOCOL.md` (P1-P12, P16); `docs/decisions.md` (Processo);
`docs/claude-code-log.md` (head); `docs/log-inbox/release-3-1.md`;
`petri-loop-disc:docs/discovery/discovery_2026-10-10_petri_classic_drag_loop.md` (whole);
`docs/discovery/discovery_2026-10-11_release_3_1_scope.md` (§0, §5.1, §8.3); `frontend/src/components/editor-v2/hooks/useAutoAnchor.ts`
(1-40, 520-624); `hooks/__tests__/useAutoAnchor.test.ts` (1-40); `EditorV2.tsx` (1198-1210, 1850-1880, 2010-2025);
`petri-loop-disc:frontend/scripts/probe/petri-drag-loop.ts` (whole); `frontend/scripts/lane-run.mjs` (96-115, 1236-1345);
`frontend/scripts/hooks/critical-zone.mjs` (30-50); `frontend/scripts/tsconfig.json`; `frontend/vitest.config.ts`;
`src/codegen/__tests__/setting.test.ts` (1-30, 110-175); `node_modules/@xyflow/react/dist/esm/index.mjs` (36-62, 3790-3800);
`node_modules/zustand/esm/traditional.mjs`; `node_modules/use-sync-external-store/cjs/use-sync-external-store-shim.development.js` (80-90).

## 7. Dependencies and risks
- The unit's bench relies on the shim reading `React.useSyncExternalStore` at load (`use-sync-external-store` 1.6.0,
  zustand 4.5.7). If an upgrade inlines or re-binds it, the control test turns red. It does not turn green: the bench
  fails loud.
- The window is timing-bound. A 0 on this tree is a rate, and the control's rate today is lower than on 2026-10-10.
- Not touched: guard B (`EditorV2.tsx` `setEdges` wrapper), the partial `replaySafe` of `38e7a6006`, and the ticket
  `docs/log-inbox/ir-graphvertex.md:69`, which this lane answers in part: the `useNodes()` amplifier is gone, while other
  updater re-runs under a rebase stay possible.
- Leftovers outside the index: `/tmp/r31drag-ctrl.WLZ2` (the control copy; the harness refused `rm -rf`) and
  `frontend/scripts/smoke/_tmp_lane_vite_3142.config.ts` (gitignored). Both servers (3142, 3143) are stopped.

## Decisions taken (unattended)
1. The unit is a new file, `useAutoAnchorSubscription.test.ts`, not an addition to `useAutoAnchor.test.ts`. The `vi.hoisted`
   wrap of React applies to a whole file, and the existing ten pure tests need not run under it.
2. The probe is carried unchanged except for `PDL_LANE_ID` and its header. The fixture was already on the trunk.
3. The probe ran against a dev server started by this session, not through `lane-run probe`, which starts its own vite
   and refuses a port in use, and the smoke needed the same server. The 1812 lane did the same.
4. The extra row, `164f846fc` + Fix A, was measured in `/tmp` only. It is the one measure that shows the fix acting.
5. Commit types `fix(editor-v2):` for the code and `docs:` for this report and the entry. The prompt names none (P6).
6. Guard B not implemented: Fix A alone left no crash, the prompt's condition for stopping with a question.

## Decisions awaiting Alfonso
- **D1** — Ship L2 in 3.1.0? Recommended: yes (§0, question 1).
