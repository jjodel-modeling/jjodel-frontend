# Discovery: the null hole after a reorder on apply (T8f)

- **Prompt-ID**: P-2026-11-08-1718 (chat C-2026-11-03-1037)
- **Prompt file**: `docs/prompts/claude_2026-11-08_1718_prompt_textual_t8f_reorder_hole.md`
- **Session**: ff9c059f-4a56-4a3a-a45b-335bd6a9d0c9
- **Tree**: `~/jjodel-w-textt8e`, branch `textual-t8e-match`, HEAD `d556aae9c`, no source file changed
- **Model**: Anthropic Claude Opus 5.5
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it rereads the real files.

## Objective

Find why confirming a reorder sometimes leaves a hole in a multi-valued containment (`[48, 53, 63]` becomes `[53, 48, <hole>, 63]`, observed by P-2026-11-08-1705 in 2 of 8 runs), reproduce it, name the cause with `file:line`, say whether it predates T8e, and list the fixes.

## Verdict

The cause is a race in the JjScript executor, not in `frontend/src/codegen/textual/`. `settlePendingWrites` waits for the dispatch it schedules itself, but not for a dispatch that the 300 ms buffer interval has already scheduled. When the interval flushes a `-=` just before the next line settles, that line reads the old list, plans a write at the old length, and the `-=` then lands first. The reducer deliberately writes past the end, which makes the hole.

By the prompt's rule the lane stops here: no fix, no gates, no log entry, no Status flip.

## Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | The last `+=` writes at index 3, the length before its `-=` landed (1705's guess) | **Holds** | F1: the logged write is `values.3` |
| H2 | The read is stale in the L-proxy only, and the store is already current | **Falsified** | F1: `current` and the store agree on the old list at the read |
| H3 | The intermittence comes from the buffer interval's phase against the line pacing | **Holds** | F1, F2: `pending` is 0 at the failing settle, and that dispatch is still in flight |
| H4 | T8e's pairing causes it | **Falsified** | F4: the loop never reaches `textMatch` |
| H5 | The fix can live in `frontend/src/codegen/textual/` | **Falsified, for a fix of the cause** | Options below; only a repair after the fact fits there |
| H6 | Waiting for in-flight dispatches in the settle removes it | **Holds, as a served candidate** | F3: 0 of 80 against 6 of 80 |

## Files read

Read in the windows needed, not whole, unless marked whole:

- `frontend/src/codegen/textual/textApply.ts` (whole)
- `frontend/src/codegen/textual/textDiff.ts` (lines found by search; 390, 626)
- `frontend/src/codegen/textual/__tests__/textDiff.test.ts` (1049-1053, 1060-1088)
- `frontend/src/components/editor-v2/preview/PreviewBar.tsx` (36, 40-98)
- `frontend/src/jjscript/executor/commands/instance.ts` (400-444, 1222-1251, 1312-1371)
- `frontend/src/jjscript/executor/commands/set.ts` (85-154, the M2 path, not the one that fails)
- `frontend/src/jjscript/executor/referenceWrite.ts` (whole)
- `frontend/src/redux/action/action.ts` (90-189, 322-371)
- `frontend/src/redux/reducer/reducer.ts` (113-362, 1540-1558)
- `frontend/src/model/logicWrapper/LModelElement.tsx` (7925-8099)
- `~/.jjodel-lanes/P-2026-11-08-1705/`: the result line of `log.jsonl`, `probe.mjs` (1-15, 58-105), `common.mjs` (whole), `t8e-rate2-*.log` (first 30 lines)

## Reproduction, and how to rerun it

All measured on this tree at `d556aae9c`, on the fixture `frontend/scripts/probe/fixtures/scene_3_DemoESM.jjodel`, in headless Chromium 151 with the canvas and the Text tab mounted.

The probe is `~/.jjodel-lanes/P-2026-11-08-1718/timeline.mjs`, with `common.mjs` beside it. It runs the reorder lines of `Initial.transitions` through the real `applyTextEdit`, then the real `applyAsOneStep`, N times in one page. The logging is injected by route interception into the `instance.ts` and `action.ts` that Vite serves to that browser, so no file on disk changes.

```
cd frontend && npx vite --port 3868 --strictPort
PROBE_TIMELINE=1 PROBE_URL=http://localhost:3868 N=80 node scripts/run-quiet.mjs LABEL -- node ~/.jjodel-lanes/P-2026-11-08-1718/timeline.mjs
```

Add `PROBE_FORCE=last` or `PROBE_FORCE=all` to force the ordering, and `PROBE_FIX=1` to serve the candidate settle. Logs: `.agent-logs/t8f-*`.

| Run (log label) | Env | Runs | Holes | Hole index |
|---|---|---|---|---|
| `t8f-timeline2` | natural | 40 | 4 | not recorded (detector bug: `reduce` skips empty slots), length 4 each |
| `t8f-timeline3` | natural | 40 | 5 | 2 in all 5 |
| `t8f-control` | natural, same injection as the candidate | 80 | 6 | 2 in 5, 1 in 1 |
| `t8f-fix-candidate` | `PROBE_FIX=1` | 80 | **0** | none |
| `t8f-force-last2` | dispatch of the last `-=` held until its `+=` has read | 20 | 18 | 2 in 17, 1 in 1 |
| `t8f-force-all` | the same, on every pair | 10 | 8 | 0 in 7, 2 in 1 |

Natural rate: 15 holes in 160 runs. In every failing run the script reported `applied: 6, failed: 0`, so the failure is silent.

`t8f-force-last` (a 30 ms dispatch delay, 5 of 20) is a discarded attempt: the delay did not reliably fall between the read and the next write, so it is not evidence.

**Node cannot reproduce it.** The T7 tests replace the whole run path (`textDiff.test.ts:1049`, `vi.mock('../../../components/editor-v2/preview/PreviewBar', ...)`, and `:1053` mocks `joiner`), so they never reach the executor or the store. A red test in `frontend/src/codegen/textual/` would pin a mock. The deterministic reproduction is the held-dispatch run, 18 of 20. The 2 runs that did not fail were not diagnosed; their timeline is not kept. A natural interval tick emptying the buffer before the forced one would explain them, but that is a guess.

## Findings

### F1, measured: the timeline of a hole

`t8f-timeline3`, run 6, the last pair, times in ms from the `-=` read:

```
0.0   read -= 63  cur [63,53,48]  store [63,53,48]
96.8  fire id=66  byInterval=true  w=[values, -=, 63]
97.9  settle-begin pending=0
98.3  settle-end
98.4  read += 63  cur [63,53,48]  store [63,53,48]     <- stale: the -= is flushed, not dispatched
101.7 dispatch id=66, values [63,53,48]
102.1 dispatched id=66, values [53,48]
164.4 fire id=67  w=[values.3, "", 63]                 <- planned against length 3
175.5 dispatched id=67, values [53,48,_,63]
```

Runs 1 and 30 have the same order. `byInterval` is assigned by exclusion: a fire outside the settle's own `COMMIT`. The periodic source read is `reducer.ts:1549`; the other non-deep `COMMIT` callers (`PreviewBar.tsx`, `openTextualTab.tsx`, `ProjectEditor.tsx`) were listed by search and not traced mid-run.

### F2, read and measured: the chain

1. The settle flushes only what is still buffered, and awaits one timer. `instance.ts:411-413` (read):
   ```
   const { COMMIT } = await import('../../../redux/action/action');
   COMMIT(undefined, false);
   await new Promise<void>((resolve) => setTimeout(resolve, 0));
   ```
2. The interval flushes on its own, on the same global buffer. `reducer.ts:1549` (read): `documentEventsIntervalId = setInterval(()=>{ COMMIT(undefined, false) }, windoww.U.UpdatingTimer);`
3. A flush does not reach the store at once. `action.ts:352` (read): `setTimeout(()=>storee.dispatch({...this}), 0); // force action execution to be async, so i can add callbacks like AFTER_TRANSACTION`
4. So a composite the interval flushed is out of the buffer and not yet in the store. The settle finds `pending=0`, and its own timer fires first. Measured fire-to-dispatch gap, in ms:

   | Run | Fired outside the settle: n, median, max, over 3 ms | Fired by the settle: n, median, max, over 3 ms |
   |---|---|---|
   | `t8f-timeline3` | 207, 12.7, 117.4, 202 | 159, 0.5, 18.4, 1 |
   | `t8f-control` | 484, 37.9, 179.7, 466 | 244, 0.6, 124.7, 5 |

   The three hole timelines show 4.5 to 4.9 ms. That fits Chromium's 4 ms clamp on nested timers, but the clamp was not isolated. The cause of the asymmetry is an open question; the asymmetry itself is measured.
5. The `+=` reads the stale list. `instance.ts:1314` (read): `const current = linkedIds(refProxy.__raw?.values);`, then `referenceWrite.ts:88` (read): `return { write: [...current, targetId] };`
6. The proxy skips the unchanged positions and writes only the new index. `LModelElement.tsx:7932` (read): `if (oldval === val) return { success: false, reason: "identical assignment" };`, and `:8011` (read): `SetFieldAction.new(c.data, 'values.' + index as any, val, '', isPtr)`
7. The reducer writes past the end on purpose. `reducer.ts:285` and `:289` (read): `// splice with excessive index does append, but i'm trying to allow empty array slots and add at specific index with an empty jump` and `current[key][index] = newVal;`

The printed text stays equal to the file because the readers drop holes: `referenceWrite.ts:41-44` (read) filters `null`, `undefined` and `''`. Whether the printer goes through that same filter was not traced; 1705 measured the equal text.

### F3, measured: waiting for in-flight dispatches removes it

The candidate counts the composites between fire and dispatch, and after its own timer the settle loops until the count is 0. Served only to the probe's browser. Result: 0 holes in 80, against 6 in 80 for the same injection without the wait, and against 15 in 160 for all natural runs. A candidate served to a probe is evidence for the option, not a reviewed fix: it has no timeout, and it was only run on this scenario.

### F4, measured and read: it predates T8e and is not about homonyms

The loop passes hand-written lines to `applyTextEdit` and never parses or pairs anything. `textApply.ts` imports only `events/registry`, `handleRegistry` and types at the top, plus `PreviewBar`, `planWorld` and `joiner` when the run starts (read, lines 14-17 and 77-81). So `textMatch.ts` is not on this path, and the hole appears anyway.

Any reorder of a multi-valued slot can hit it since T7, through `textDiff.ts:626` (read): ``lines.push(`set ${handle(op.target)}.${op.feature} -= ${handle(op.to)}`, `set ${handle(op.target)}.${op.feature} += ${handle(op.to)}`);``. T8e only made homonym reorders reachable, as 1705 said. Measured on a containment only (`containment: true` in the probe's summary). A plain reference goes through the same code in `applyCollectionUpdate` (read), but was not run.

The same settle guards the `=` reference write (`instance.ts:1225`, `:1252`) and two earlier reads (`:828`, `:1149`). So the exposure is any M1 script line that reads a slot written by the line before, not only reorders. Read, not measured.

## Why almost always the last pair

Of the 11 natural holes with a recorded index, 10 are at index 2, the last pair, and 1 is at index 1. `t8f-force-all` shows the earlier pairs fail just as well when the ordering is forced (index 0 in 7 of 10). So the last pair is not special in the mechanism. Why natural timing favours it was not established.

## Options

| | Fix | Where | Cost and risk |
|---|---|---|---|
| A | The settle also waits for dispatches already in flight, with a bounded wait | `redux/action/action.ts` (a counter, or a promise of the last dispatch) and `jjscript/executor/commands/instance.ts` | About 10 lines. Fixes every caller of the settle. Touches core, so it needs approval (rule 5). A run slows only when a dispatch is in flight. |
| B | The flush dispatches synchronously | `redux/action/action.ts:352` | One line, high risk: the comment there says the async dispatch exists for the `AT_TRANSACTION` callbacks, and it affects every write in the app. |
| C | `+=` appends through the reducer (`'+='`) instead of writing an index | `jjscript/executor/commands/instance.ts` | Small. Removes the hole only: the stale read still feeds the multiplicity check, and `=` keeps the problem. The containment side effects of the proxy write would need redoing. |
| D | After the run, `textApply.ts` compacts holes in the slots it reordered | `frontend/src/codegen/textual/` | The only option in this lane's scope. Masks the race, needs a write outside or at the edge of the undo step, and leaves JjScript exposed. |

Not available: one line that writes the whole order, because `=` on a multi-valued reference appends (`referenceWrite.ts:5`, read).

**Recommended: A**, in a lane authorised for `action.ts` and `instance.ts`, with the T8e merge held until it lands, and the probe above as acceptance (0 holes in at least 80 natural runs, plus 0 in the forced shape adapted to the new wait).

## Not measured

- Whether a hole survives save and reopen, and what the L-layer and the canvas show while it exists.
- The T8d bench and the repository gates: no source changed, so step 3 and step 4 of the prompt were not reached.
- A plain, non-containment reference slot.

## Questions

1. Is the fix authorised outside `codegen/textual/`, in `redux/action/action.ts` and `jjscript/executor/commands/instance.ts` (option A)?
2. Is T8e held until that fix lands, or merged first with a ticket for the race?
