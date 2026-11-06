# Discovery 2026-11-04 — ELK auto-layout on open: the main-thread freeze

Prompt: P-2026-11-04-0902 · Chat: C-2026-11-03-2317 · Front: hw-notation · Lane: discovery, read-only.
Ticket: `docs/log-inbox/hw-notation.md:915`. Parent report: `docs/discovery/discovery_2026-11-04_jjtl_canvas_render.md` §5.

## 0. Answer in brief

- **What blocks** (measured): `computeElkLayout` runs elkjs's bundled build, in the main thread, with `NETWORK_SIMPLEX` node placement. On the b10_8 shape (2,559 nodes) it costs 153,513 ms with the 2,558 reference edges and 723 ms with none. Cost grows about n^2.3: 191 nodes 0.5 s, 639 nodes 4.1 s, 1,535 nodes 61.5 s. ELK is cheap on nodes alone. The edges make it slow.
- **What makes it intermittent** (read, not measured): two inputs are read at one instant, a `setTimeout(50)` scheduled from a `requestAnimationFrame` after the canvas init. The first is `justCreatedGraphRef`, which gates whether ELK runs at all. The second is the set of edges in React Flow state, which sets the cost: under 1 s without edges, minutes with them. Both are written by effects and hooks that run on their own triggers (`useJjomSync` populate, Step 4, `useM1ReferenceEdges`). Nothing orders them against the timer. So it depends on scheduling which branch a run takes and which graph ELK gets. A load of 36-38 widens the window.
- **The b11_9 freeze over 7 minutes** (extrapolated, not measured): about 5,119 nodes at n^2.3 is about 750 s. That fits the same path. Its cause was not captured in the parent lane, and it was not captured here either.
- **Reproduction**: not tried in the app (see §5). The scaling was measured in node with the exact option set.

## 1. Goal

Find why the open-time ELK pass is intermittent and which inputs it gets in the slow case. Then compare three fixes: a node-count cap, a worker, removing the race.

## 2. Files read (full paths)

- `/Users/alfonso/jjodel-w-elktrace/frontend/src/components/editor-v2/utils/autoLayoutOnOpen.ts` (1-52, whole file)
- `/Users/alfonso/jjodel-w-elktrace/frontend/src/components/editor-v2/EditorV2.tsx` (570-629, 3971-4010, 4090-4224; grep hits for `autoLayoutRef`, `armReLayoutRef`, `computeElkLayout`)
- `/Users/alfonso/jjodel-w-elktrace/frontend/src/components/editor-v2/hooks/useJjomSync.ts` (440-460, 680-712, 1098-1180; control-point listing 450-1068)
- `/Users/alfonso/jjodel-w-elktrace/frontend/src/components/editor-v2/utils/elkLayout.ts` (10-159)
- `/Users/alfonso/jjodel-w-elktrace/frontend/src/components/editor-v2/sync/canvasToJjom.ts` (55-80; grep hits for `writeLayoutDictionary`)
- `/Users/alfonso/jjodel-w-elktrace/frontend/src/components/editor-v2/viewpoint/layout/vertexLayout.ts` (grep hits 87-131)
- `/Users/alfonso/jjodel-w-elktrace/frontend/src/components/project/ProjectEditor.tsx` (1943-2017; grep hits for `DVertex.` and `openOutputTab(`)
- `/Users/alfonso/jjodel-w-elktrace/frontend/node_modules/elkjs/lib/` (listing: `elk.bundled.js` and `elk-worker.min.js` are both shipped)
- `/Users/alfonso/.jjodel-lanes/P-2026-11-03-2332/probe/wbtime.ts` (header 1-50, grep hits)

## 3. Findings

### F1 — Decision path (read)

1. `ProjectEditor.tsx:1991-2009` gives a `DVertex` only to the roots of the transformation (`pendingVertices`). The walk's nested objects get none there. `openOutputTab` runs when STEP 8 ends (`:2393`), no earlier than +2 s (`:1958`).
2. In the output tab, the populate effect of `useJjomSync` (`useJjomSync.ts:450-1068`, deps at `:1068`) creates the missing vertices (Step 2bis, `:741-766`) and edges (Steps 3 and 4), synchronously. On any creating run it raises `justCreatedGraphRef.current = true` (`:705`). Nothing in this hook lowers the flag.
3. The init effect (`:1099-1173`) pushes nodes and edges to React Flow once (`initializedRef`), then `requestAnimationFrame(onInitialized)` (`:1168`).
4. `onInitialized` (`EditorV2.tsx:594-622`) waits `setTimeout(50)`. It then reads the flag and lowers it (`:601-602`), and calls `shouldAutoLayoutOnOpen(createdOnOpen, graphId, idlookup)` (`:603`).
5. `shouldAutoLayoutOnOpen` (`autoLayoutOnOpen.ts:44-52`) returns false when the flag is down. With the flag up, it returns true unless some vertex carries a `layoutByViewpoint` record. Records are written only through `writeLayoutDictionary` (`canvasToJjom.ts:74-76`), and only under a non-null layout key (`vertexLayout.ts:124`). A fresh JjTL output has none. So in this flow the decision reduces to the flag alone.
6. If the call returns true, `handleAutoLayout()` without `full` (`EditorV2.tsx:3971`) calls `computeElkLayout(getNodes(), getEdges())` (`:4124`). It then arms the re-layout watcher (`:607`, `:4218`). If reference edges arrive within `RELAYOUT_WINDOW_MS = 3000` (`:4185`), the watcher reruns the same layout once (`:4206-4208`), this time with the edges.

### F2 — ELK runs in the main thread, and its cost is in the edges (measured)

- `elkLayout.ts:20,27`: `import ELK from 'elkjs/lib/elk.bundled.js'; const elk = new ELK();`. No `workerUrl`, so the bundled build runs its layout in the calling thread. This is consistent with the parent profile: 112,217 ms self time in `pkg:elkjs_lib_elk__bundled__js` inside a single 117 s long task.
- Probe `~/.jjodel-lanes/P-2026-11-04-0902/probe/elkscale.mjs`. It uses the option set of `elkLayout.ts:120-144`, nodes 180x120, reference priority 3, on `Add(a_i, a_j)` trees. Node 1 run per call. Logs: `.agent-logs/elkscale-edges-20261104-090256.log` and `.agent-logs/elkscale-noedges-20261104-090647.log`.

| shape | nodes | edges | ms | load (1-min, before) |
|---|---|---|---|---|
| b6_5 | 191 | 190 | 489 | 11.65 |
| b8_6 | 639 | 638 | 4,130 | 11.65 |
| b9_8 | 1,535 | 1,534 | 61,501 | 11.65 |
| b10_8 | 2,559 | 2,558 | 153,513 | 11.65 |
| b8_6 | 639 | 0 | 660 | 8.97 |
| b10_8 | 2,559 | 0 | 723 | 8.97 |

The browser's 117 s on b10_8 matches the node run's 153 s in order of magnitude, so ELK almost certainly had the edges in that run. That edges inference is read, not measured: the parent profile did not record the edge count passed to ELK.

### F3 — Why it is intermittent (read; the order is not measured)

The 50 ms timer reads two things that are written by independently scheduled work:

- **The flag**: whether a creating populate run has landed before the timer. Step 2bis must create the walk's vertices at mount, because ProjectEditor never does. On that reading the flag should be up in nearly every JjTL open. Yet only 1 of 9 runs showed a slow ELK.
- **The edges**: whether the reference edges are already in React Flow state when `getEdges()` is called. Step 4 or `useM1ReferenceEdges` (`EditorV2.tsx:623`) may deliver them before or after the timer. The comment at `EditorV2.tsx:4179-4181` records that the first layout usually sees "an edge-less graph".

The likeliest reading puts both together. ELK may well run on most opens, edge-less, in under 1 s, which the parent lane's longest-task metric (3-4 s) would not show. The slow run is then the one where the edges were already present at the timer, or where the watcher's rerun fired within its 3 s window. This hypothesis is not verified: none of the 9 runs counted `elk.layout` calls or the edges passed to them. It is the open question Q1.

### F4 — No size guard anywhere on the path (read)

The guards on the path are `autoLayoutOnOpen.ts:44-52`, `EditorV2.tsx:596-609` and `:3971-3974`, and `computeElkLayout` (`elkLayout.ts:53-58`, only `nodes.length === 0`). None of them caps nodes, edges or time. The toolbar's `full` path, through `computeElkAutoLayout`, shares the same `elk` instance and is equally unbounded. It is user-triggered, so it is not part of this ticket.

## 4. Fixes compared

| fix | effect on the freeze | cost / risk |
|---|---|---|
| **A. Cap** (skip the open-time layout above N nodes or E edges, keep the default placement, as the flag-down branch does) | Removes the freeze at any size. Measured: about 640 nodes with edges is about 4 s, about 1,500 is about 60 s, so a useful cap sits near 500 nodes. | Large outputs keep the ProjectEditor grid and the populate placement, which is the layout 8 of 9 runs already got. A few lines in `autoLayoutOnOpen.ts` and its test. It does not touch the sync layer. Smallest. |
| **B. Worker** (`new ELK({ workerUrl })` with `elk-worker.min.js`, shipped in node_modules) | The main thread stays free, but ELK still takes 2.5 minutes at b10_8 and about 12 minutes at b11_9. Nodes then jump long after the user started working, and the layout records written at the end overwrite whatever the user did meanwhile. | Vite worker asset wiring. The worker is shared by the toolbar path. Needs a cancel on unmount and on drag. Fixes responsiveness, not the result. |
| **C. Remove the race** (decide once, from D-state, after the populate run has settled: a `graphHasLayoutRecord` plus a "created by this mount" count, with the edge set fixed) | Makes the decision and ELK's input deterministic. Alone, it makes the slow case deterministic, not absent: with edges at b10_8 it would always be 150 s. | Touches `useJjomSync.ts` (critical zone, §3.2 Layer Impact Report) and the S4b watcher. Largest. |

A alone removes the hazard. A plus C would make the outcome reproducible as well. B is worth it only together with A, for the toolbar path.

## 5. Reproduction (not tried, by choice)

The app probe (`~/.jjodel-lanes/P-2026-11-03-2332/probe/wbtime.ts`) is wired to `~/jjodel-w-jjtlfreeze` on port 3236. It would need retargeting, its own dev server, and minutes per b10_8 run. At the measured 1-in-9 rate, 5 runs give about a 45 % chance of one hit, and a hit costs about 2 minutes of blocked thread each. With roughly 25 minutes and a load of 19 at the start, the node scaling probe answered more for the time. A hit would also have been uninformative, since the probe does not count `elk.layout` calls or edges. Q1 below names the instrument that would make a run informative.

## 6. Risks

- The edges inference in F2 rests on order of magnitude, not on a recorded edge count.
- The node runs are not the browser: they show the same n^2.3 shape, but absolute times differ. 153 s in node against 117 s in the browser under a heavier load.
- A cap changes what large opens show only if ELK in fact runs on them today, and F3 cannot confirm that it does.
- Fix C is in the critical zone: Step 4's deps must not change (`editor-v2/CLAUDE.md` §3.5).

## 7. Open questions

- **Q1.** Does ELK run on most opens, edge-less and fast, or rarely? An instrument from the probe answers it without a source patch: wrap `elk.layout` via the Vite module URL `/src/components/editor-v2/utils/elkLayout.ts`, or patch `ELK.prototype.layout` from the page, and record calls, nodes, edges and ms. Two b10_8 runs would settle it.
- **Q2.** Which cap? The table suggests about 500 nodes or 500 edges for about 3 s worst case at this load. Should the cap count edges, since the edges drive the cost?
- **Q3.** Should the S4b re-layout watcher keep its rerun above the cap, or be disarmed?
- **Q4.** Was the b11_9 7-minute freeze ELK? The extrapolation says yes. One instrumented b11_9 run would confirm it.

## Decisions taken (unattended)

- No app reproduction: a node scaling probe with the same ELK options instead (§5).
- No source change and no patch in the tree. The probe lives in `~/.jjodel-lanes/P-2026-11-04-0902/probe/`.

## Decisions awaiting Alfonso

- The fix direction: A (cap), B (worker), C (race), or A plus C.
- The cap value and its unit (nodes or edges).
- Whether to run the Q1 instrument before the fix lane opens.
