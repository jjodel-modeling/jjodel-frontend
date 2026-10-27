# Addendum: `node.[x]` read by IR views, the interpreter lane (R-SIM-108)

Prompt-ID: P-2026-10-03-0121 · prompt `docs/prompts/claude_2026-10-03_0121_prompt_sim_node_read.md` · chat
C-2026-10-02-2340 · session `2fe4ac5e-cfad-4b9d-8edc-ef53972b62fa` · tree `~/jjodel-w-simnoderead`, branch
`sim-node-read` · executor Claude Opus 5.5 (`claude-opus-5-5`). [M] measured in this lane.

Addendum to `docs/discovery/discovery_2026-10-02_sim_node_presentation.md` (P-2026-10-02-2345). That report sits
on `sim-node-disc` at `8bd04b0c4`, which is not merged into `alfonso-frontend-jjtl`, so it is not in this tree and
this lane could not append to it: the lane read it with `git show 8bd04b0c4:<path>`, and its addendum is this file.
Whoever merges `sim-node-disc` may fold it into the report.

## 0. Answer in brief

- **Built as §5 and §6 planned**, on four IR files (`pathExpr.ts`, `irCompile.ts`, `irReadCtx.ts`,
  `irReadCtxLproxy.ts`), LIR `b60775776`, code and tests `bf81fc979`. `netStep.ts` and `simRunState.ts` were read,
  not edited: Lane A's `presentationOf` and `getSimPresentation` are consumed as they landed.
- **Probe, scene C rewritten on `node.[x]`** (port 3070): on all four scenes C′ has the commits and the renders of
  C, and the label shows the stand-in value on every IR node [M] (§1).
- **Unchanged:** the four demo scenes on the default viewpoint (canvas, commits, run-editor renders identical to
  the report's A), and a view without `node.[x]` (compiled JSON with its `ir`, key order and `irHash`
  byte-identical before and after the lane, on four golden views) [M].
- **Mutation bench:** 12 of 13 killed; the survivor is a defensive check (§2).

## 1. The probe

`frontend/scripts/smoke/_tmp_simnoderead_probe.ts` (gitignored), the report's probe with two phases added after C:
C′ rewrites C's `{ when: { op: 'marked' } }` fill wrapper as `{ when: { op: 'exists', path: 'node.[heat]' } }`, the
same fill both ways; C″ adds to every node view a centre label `node.[heat]`. In C′ and C″ the stand-in run gives
every object `heat = 'heat-<i>'` at bump i. Two runs, `sm,petri` then `esm,flowB`, K=15,
`lane-run probe … --port 3070`, both EXIT=0, logs in `~/.jjodel-lanes/P-2026-10-03-0121/`.

| Scene | report A · B · C (run editor) | lane A · B · C · C′ · C″ (run editor) | commits A·B·C·C′·C″ | C″ label shows `heat-15` |
|---|---|---|---|---|
| SM | 987 · 532 · 640 | 987 · 532 · 640 · 640 · 640 | 8·8·9·9·9 | 6 of 6 IR nodes |
| Petri | 1000 · 665 · 801 | 1000 · 665 · 801 · 801 · 801 | 8·8·9·9·9 | 7 of 7 |
| ESM | 920 · 510 · 613 | 920 · 510 · 613 · 613 · 613 | 8·8·9·9·9 | 6 of 6 |
| Flow B | 1331 · 786 · 948 | 1331 · 786 · 948 · 948 · 948 | 8·8·9·9·9 | 8 of 8 |

- Canvas (nodes/edges/IR nodes) equal to the report in every phase: 11/15/0 and 6/5/6 (SM), 13/12/0 and 7/6/7
  (Petri), 10/12/0 and 6/4/6 (ESM), 17/18/0 and 8/9/8 (Flow B). The `'mark'` gate reads true in C, C′ and C″.
- The label holds the last bump's value and not the first (`heat-0` on 0 nodes): it re-rendered on each bump.
- Totals over all editors: the first run reproduces the report's (5889 in A; 4984, 5099 in SM; 5184, 5327 in
  Petri). The second run sits 180 lower in A, B and C alike, with the report's B→C deltas (+110 ESM, +169 Flow B):
  that run never derived the SM and Petri viewpoints, so its project holds fewer. The run editor's counts, above,
  do not depend on it.
- Times are not compared: dev build, medians 209–448 ms with no consistent direction between C and C′.
- The stand-in net of the report's probe predates Lane A: `rowsOf` (`simCanvasState.ts:147`) now reads
  `run.net.declared`, which the stand-in lacked, and the first run crashed the overlay as soon as a presentation
  value appeared (C′), degrading the later scenes. The stand-in now carries the empty `CompiledNet` fields; that
  first run is kept as `probe-_tmp_simnoderead_probe.run1-standin-incomplete.log`. A real run always has them.

## 2. Tests and the bench

- `pathExpr.test.ts`: the 18-input corpus of §2.1, input by input and against `parseExpressionStrict`; two
  strict-end inputs (`node.[heat] x`, `node.[heat] node.[cold]`), which the loose parse would accept.
- `irPresentation.test.ts` (new): a label, `exists`, `gt`, an edge template, a row segment; `channels` `['mark']`,
  `dependencySet` without the attribute, `crossPaths` empty; the four golden views; the endpoint refusal, through
  `validateIR` too; `marked.path` and `isKind.path` with today's message; `labelPathFeature` null; the consumer
  test: `useIRView`'s production memo with React stubbed (as `useContentSizeLoop.test.ts` does), the joiner replaced
  by a store over a hand-built lookup, the real run state. A Reset re-resolves the view that reads `node.[x]` and
  not the one that reads none, and the ReadCtx `makeReadCtx` builds reads the run's value, then `undefined` after
  Stop.
- Bench: channel not declared, endpoint accepted, `getPresentation` not injected, lproxy not forwarding it, a stray
  `featureNames` entry, a regex recognizer, root name unchecked, `isKind.path` accepting it, the presentation
  default flipped, the draw default answering a value, the draw not exposing the method, the loose parse: all
  killed. Survived: dropping `parsed.errors.length > 0`; no input was found where the parser returns an expression
  together with errors.

## 3. Notes for lane B and the ticket

- In authoring, `validateIR` reaches the endpoint refusal through its compile, since `isUsableEndpointExpr`
  accepts `node.[heat]`: the author reads `[ir] node.[heat] is a presentation value, not an edge endpoint`.
- The PathBuilder and the PredicateBuilder read through `singleHopOf`, which still answers `null` on `node.[x]`:
  a view holding one shows their neutral empty state until lane B.
- The report's ticket stands, unchanged by this lane: one `'mark'` bump re-renders every mounted `EditorV2`.
